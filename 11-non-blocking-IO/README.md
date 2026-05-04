# Non-blocking IO — Pipeline de Processamento de CSV

Servidor HTTP que recebe uploads de arquivos CSV grandes e os processa em tempo real
usando Streams, backpressure, EventEmitter, worker_threads e Server-Sent Events (SSE).

O objetivo é cobrir na prática todos os principais conceitos de Non-blocking IO do Node.js.

---

## Como funciona

### Fluxo de uma requisição

```
POST /upload
      │
      ▼
  busboy parseia o multipart sem bufferizar o arquivo
      │
      ├──► responde { jobId } imediatamente ao cliente
      │
      ▼
  CsvParseTransform          (Transform Stream)
  lê chunks de bytes → emite um objeto por linha
  highWaterMark: 16 rows — pausa o upstream se o downstream não acompanhar
      │
      ▼
  StatsAggregatorWritable    (Writable Stream)
  acumula valores numéricos → emite evento de progresso a cada row
  callback() ao final de _write() = sinal de backpressure
      │
      ▼
  pipeline() fecha tudo em caso de erro e garante sem vazamento de recursos
      │
      ▼
  runHeavyCompute()          (worker_thread)
  sort + média + mediana + desvio padrão em thread separada
  event loop principal permanece livre durante o cálculo
      │
      ▼
  job.emitter.emit('done')   (EventEmitter)
      │
      ▼
GET /progress/:id            (SSE)
  escuta os eventos e envia ao cliente em tempo real
```

### Conceitos cobertos

| Conceito | Arquivo | O que observar |
|---|---|---|
| `bodyParser: false` | `src/main.ts` | req chega como Readable puro |
| busboy (multipart sem buffer) | `src/upload/upload.service.ts` | arquivo nunca ocupa RAM completo |
| Transform Stream | `src/processing/streams/csv-parse.transform.ts` | `_transform`, `_flush`, `leftover` |
| `highWaterMark` | `csv-parse.transform.ts` linha 12 | controla tamanho da fila interna |
| Backpressure explícito | `src/processing/streams/stats-aggregator.writable.ts` | `callback()` no `_write` |
| `pipeline()` | `src/processing/processing.service.ts` | substitui `.pipe()` manual com tratamento de erro |
| EventEmitter | `src/jobs/job-store.service.ts` + `processing.service.ts` | desacopla produtor e consumidor |
| `worker_threads` | `src/processing/workers/` | CPU-bound sem bloquear o event loop |
| SSE | `src/progress/progress.controller.ts` | push do servidor sem polling |

---

## Estrutura

```
src/
  main.ts                              bootstrap (bodyParser: false)
  app.module.ts
  jobs/
    job.interface.ts                   tipo Job + JobStatus
    job-store.service.ts               Map em memória + EventEmitter por job
    jobs.module.ts
  upload/
    upload.controller.ts               POST /upload
    upload.service.ts                  busboy → stream → jobId
    upload.module.ts
  progress/
    progress.controller.ts             GET /progress/:id  (SSE)
    progress.module.ts
  result/
    result.controller.ts               GET /result/:id
    result.module.ts
  processing/
    processing.service.ts              orquestra o pipeline completo
    processing.module.ts
    streams/
      csv-parse.transform.ts           Transform: bytes → objetos CSV
      stats-aggregator.writable.ts     Writable: acumula + emite progresso
    workers/
      heavy-compute.worker.ts          worker_thread: estatísticas CPU-bound
      run-in-worker.ts                 spawner (funciona em ts-node e dist/)
scripts/
  generate-csv.ts                      gera arquivo CSV de teste
  benchmark.ts                         N uploads simultâneos para medir latência
```

---

## Como rodar

### 1. Instalar dependências

```bash
npm install
```

### 2. Gerar um arquivo CSV de teste

```bash
npm run gen:csv              # gera test-files/large.csv com 100.000 linhas
npm run gen:csv 500000       # 500k linhas (~25MB)
npm run gen:csv 50000 test-files/small.csv
```

O CSV gerado tem 4 colunas numéricas: `id`, `age`, `score`, `salary`.

### 3. Subir o servidor

```bash
npm run start:dev
```

Servidor disponível em `http://localhost:3000`.

### 4. Fazer upload e acompanhar o progresso

**Terminal 1 — upload:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@test-files/large.csv"
# resposta: { "jobId": "uuid-aqui" }
```

**Terminal 2 — progresso em tempo real (SSE):**
```bash
curl -N http://localhost:3000/progress/<jobId>
```

Você verá eventos chegando linha a linha:
```
event: progress
data: {"processed":1000}

event: progress
data: {"processed":2000}

...

event: done
data: {"totalRows":100000,"columns":{"age":{"sum":...,"mean":...},...}}
```

**Resultado final:**
```bash
curl http://localhost:3000/result/<jobId>
```

---

## Experimentos para fazer

### Confirmar que o servidor não trava

Com o servidor rodando, abra dois terminais ao mesmo tempo:

```bash
# Terminal 1 — upload pesado
curl -X POST http://localhost:3000/upload -F "file=@test-files/large.csv"

# Terminal 2 — ping enquanto o upload processa
curl http://localhost:3000/result/qualquer-id
```

O Terminal 2 responde imediatamente mesmo com o upload em andamento.
Isso só é possível porque o processamento é non-blocking.

### Benchmark com uploads simultâneos

```bash
npm run benchmark            # 3 uploads simultâneos
npm run benchmark 10         # 10 uploads simultâneos
```

Saída esperada:
```
Enviando 3 uploads simultâneos de "test-files/large.csv"...

Todos os 3 uploads responderam em 312ms
  Upload 1: jobId=abc...  resposta em 301ms
  Upload 2: jobId=def...  resposta em 308ms
  Upload 3: jobId=ghi...  resposta em 312ms

Aguardando processamento...

Todos os jobs concluídos em 4821ms total
  Job 1: done — 100000 linhas em 4201ms
  Job 2: done — 100000 linhas em 4534ms
  Job 3: done — 100000 linhas em 4821ms
```

Todos os uploads respondem quase no mesmo instante porque o servidor
não bloqueia enquanto processa — cada job corre em background.

### Observar o backpressure

Adicione um `await new Promise(r => setTimeout(r, 1))` no `_write` do
`StatsAggregatorWritable` para simular um consumidor lento. O `highWaterMark`
do `CsvParseTransform` vai fazer o upstream pausar automaticamente em vez de
acumular rows infinitamente na memória.

### Medir uso de memória

```bash
node --max-old-space-size=128 dist/main   # limite de 128MB
```

Mesmo com um CSV de 500MB, o uso de memória deve permanecer constante
porque os dados são processados em chunks, nunca carregados por completo.

---

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/upload` | Recebe CSV via multipart, retorna `{ jobId }` |
| `GET` | `/progress/:id` | SSE com eventos `progress` e `done` |
| `GET` | `/result/:id` | Status e resultado final do job |

### Formato do resultado (`GET /result/:id`)

```json
{
  "id": "550e8400-...",
  "status": "done",
  "processed": 100000,
  "elapsedMs": 4201,
  "result": {
    "totalRows": 100000,
    "columns": {
      "age":    { "sum": 3124500, "mean": 31.24, "median": 31, "stdDev": 12.97, "min": 20, "max": 64 },
      "score":  { "sum": 4998234, "mean": 49.98, "median": 50.1, "stdDev": 28.86, "min": 0.01, "max": 99.99 },
      "salary": { "sum": 7499123456, "mean": 74991.23, "median": 74980, "stdDev": 34638.12, "min": 30000, "max": 149999 }
    }
  }
}
```
