# Cluster — Processamento de CSV com Node.js Cluster

Variação do projeto `11-non-blocking-IO` demonstrando o módulo `cluster` do Node.js. O mesmo servidor de upload e processamento de CSV, agora distribuído em múltiplos processos filhos — um por núcleo de CPU.

---

## O que é o módulo `cluster`?

O Node.js é single-threaded por natureza: um único processo roda um único event loop. O módulo `cluster` permite criar múltiplos processos filhos (workers) que **compartilham a mesma porta TCP**. O sistema operacional distribui as conexões entre eles, aproveitando todos os núcleos da máquina.

```
                        porta 3000
                            │
              ┌─────────────┴─────────────┐
              │        MASTER PROCESS      │
              │   (não atende HTTP)        │
              │   Job Store Central        │
              └──────┬────────┬────────────┘
                     │  IPC   │  IPC
              ┌──────┴──┐  ┌──┴──────┐  ...
              │Worker 1 │  │Worker 2 │  Worker N
              │ NestJS  │  │ NestJS  │  (1 por core)
              └─────────┘  └─────────┘
```

---

## Como funciona este projeto

### 1. Bootstrap bifurcado (`main.ts`)

O mesmo arquivo `main.ts` é executado por todos os processos, mas o comportamento muda conforme `cluster.isPrimary`:

```typescript
if (cluster.isPrimary) {
  startMaster(); // faz fork dos workers, gerencia o job store
} else {
  bootstrap();   // sobe o NestJS normalmente
}
```

### 2. Master Process (`cluster.ts`)

O master **não atende requisições HTTP**. Sua única responsabilidade é:

- Fazer `cluster.fork()` uma vez por núcleo de CPU
- Manter o **job store central** (`Map<jobId, JobState>`)
- Rotear mensagens IPC entre workers
- Reiniciar automaticamente workers que caem

```
Worker A → master: { type: 'job:create', jobId, workerId }
Master   → todos:  { type: 'job:sync', state }          ← broadcast

Worker B → master: { type: 'job:update', jobId, patch }
Master   → todos:  { type: 'job:sync', state }          ← broadcast

Worker C → master: { type: 'job:get', jobId, correlationId }
Master   → Worker C: { type: 'job:get:reply', state }   ← resposta direta
```

### 3. Por que o estado precisa ficar no master?

Um cliente pode fazer upload no **Worker A** e consultar o progresso no **Worker B** (o OS distribui as conexões). Se cada worker tivesse seu próprio job store, o Worker B não saberia nada sobre o job criado no Worker A.

A solução: o master é a fonte autoritativa. Toda mudança de estado é enviada ao master via IPC, e o master faz **broadcast para todos os workers**. Cada worker mantém um cache local atualizado automaticamente.

### 4. IpcBridgeService

Serviço NestJS injetável que abstrai toda a comunicação IPC nos workers:

| Método | O que faz |
|---|---|
| `send(msg)` | Envia mensagem ao master via `process.send()` |
| `onAnyJobSync(handler)` | Escuta broadcasts do master (atualiza cache) |
| `onJobSync(jobId, handler)` | Escuta broadcasts de um job específico (SSE) |
| `requestJobState(jobId)` | Request-reply: pede estado ao master e aguarda resposta |

### 5. Pipeline de processamento (igual ao projeto 11)

Cada worker processa o arquivo CSV com o mesmo pipeline de streams:

```
HTTP Request (Readable)
    ↓
busboy — parseia multipart sem bufferizar na memória
    ↓
CsvParseTransform — bytes → objetos { id, age, score, salary }
    ↓  (backpressure com highWaterMark: 16)
StatsAggregatorWritable — acumula valores por coluna
    ↓
computeStats() — calcula sum, mean, median, stdDev, min, max
```

A cada 1.000 linhas processadas, o worker envia um `job:update` ao master, que faz broadcast para todos. Isso alimenta o SSE de progresso.

### 6. SSE de progresso cross-worker

O cliente pode abrir o SSE (`GET /progress/:id`) em **qualquer worker**, mesmo que o upload esteja sendo processado em outro. O `ProgressController` assina o `IpcBridgeService` e recebe os broadcasts do master:

```
Worker A processa CSV → envia job:update ao master
Master faz broadcast → Worker B recebe job:sync
Worker B estava com SSE aberto → envia evento ao cliente
```

### 7. Sem `worker_threads`

No projeto 11, o cálculo pesado de estatísticas era delegado a uma `worker_thread` para não bloquear o event loop. Aqui isso não é necessário: **cada cluster worker já é um processo isolado**. O cálculo bloqueia apenas o event loop daquele worker, sem afetar os outros.

---

## Diferenças vs projeto `11-non-blocking-IO`

| Aspecto | 11 — Non-blocking IO | 12 — Cluster |
|---|---|---|
| Paralelismo | 1 processo + worker_threads | N processos (1 por core) |
| Job store | Map local + EventEmitter | Master central + IPC |
| Progresso SSE | EventEmitter local | Broadcast IPC do master |
| Cálculo pesado | worker_thread dedicada | Inline no worker process |
| Tolerância a falhas | — | Worker reinicia automaticamente |
| Escala | Vertical (threads) | Horizontal (processos) |

---

## Fluxo completo de uma requisição

```
1. POST /upload → cai em algum Worker (ex: Worker 2)
   └─ cria jobId localmente
   └─ envia job:create ao master
   └─ responde { jobId, workerId } ao cliente imediatamente

2. Master recebe job:create
   └─ registra no job store central
   └─ broadcast job:sync para todos os workers

3. Worker 2 processa o CSV em background
   └─ a cada 1.000 linhas: envia job:update ao master
   └─ master faz broadcast job:sync para todos
   └─ ao terminar: envia job:update com status "done"

4. GET /progress/:id → pode cair em qualquer Worker
   └─ verifica cache local (ou pede ao master via request-reply)
   └─ abre SSE e escuta broadcasts IPC
   └─ envia evento ao cliente a cada job:sync recebido

5. GET /result/:id → pode cair em qualquer Worker
   └─ verifica cache local
   └─ se não encontrar: request-reply ao master
   └─ retorna { id, status, processed, result, workerId, elapsedMs }
```

---

## Como rodar

**Instalar dependências:**
```bash
npm install
```

**Gerar CSV de teste:**
```bash
npm run gen:csv           # 100.000 linhas (padrão)
npm run gen:csv 50000     # quantidade customizada
```

**Subir o servidor:**
```bash
npm run start:dev         # desenvolvimento (watch mode)
npm run build && npm start # produção
```

O terminal mostrará o master e cada worker iniciando:
```
Master 1234 iniciando 16 workers (16 cores)...
Worker 1235 → http://localhost:3000
Worker 1236 → http://localhost:3000
...
```

---

## Testando os endpoints

**Upload de arquivo:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@test-files/large.csv"

# { "jobId": "abc-123", "workerId": 1235 }
```

**Acompanhar progresso em tempo real (SSE):**
```bash
curl -N http://localhost:3000/progress/<jobId>

# event: progress
# data: {"processed":1000}
# event: progress
# data: {"processed":2000}
# ...
# event: done
# data: {"totalRows":50000,"columns":{...}}
```

**Consultar resultado:**
```bash
curl http://localhost:3000/result/<jobId>

# {
#   "id": "abc-123",
#   "status": "done",
#   "processed": 50000,
#   "workerId": 1235,
#   "elapsedMs": 1842,
#   "result": { "totalRows": 50000, "columns": { ... } }
# }
```

**Benchmark com uploads simultâneos:**
```bash
npm run benchmark          # 3 uploads simultâneos (padrão)
npx ts-node scripts/benchmark.ts 8  # 8 uploads simultâneos
```

O benchmark mostra o PID do worker que atendeu cada requisição, demonstrando a distribuição de carga:

```
Todos os 6 uploads responderam em 830ms
  Upload 1: jobId=882035f1  worker=1088  resposta em 63ms
  Upload 2: jobId=b5ef3043  worker=1088  resposta em 311ms
  Upload 3: jobId=c301ae60  worker=30168 resposta em 68ms
  ...

Distribuição por worker process:
  PID 1088:  4 upload(s)
  PID 30168: 2 upload(s)

Todos os jobs concluídos em 1409ms total
```

---

## Conceitos demonstrados

| Conceito | Onde |
|---|---|
| `cluster.isPrimary` | `main.ts` — bifurcação master/worker |
| `cluster.fork()` | `cluster.ts` — spawn de N processos |
| `process.send()` | `ipc-bridge.service.ts` — worker → master |
| `worker.send()` | `cluster.ts` — master → worker (broadcast) |
| `cluster.on('exit')` | `cluster.ts` — restart automático |
| Request-Reply sobre IPC | `ipc-bridge.service.ts` — padrão síncrono sobre IPC assíncrono |
| Cache local por worker | `job-store.service.ts` — atualizado via broadcasts |
| SSE cross-worker | `progress.controller.ts` — SSE via IPC, não EventEmitter local |
| Streams + backpressure | `csv-parse.transform.ts`, `stats-aggregator.writable.ts` |

---

## Observação sobre Windows

No Linux, o Node.js usa um scheduler **round-robin** para distribuir conexões entre workers de forma equilibrada. No Windows, a distribuição é feita pelo próprio OS e tende a concentrar conexões em poucos workers. O comportamento do cluster é correto em ambos os sistemas — a diferença é apenas na visibilidade da distribuição no benchmark.
