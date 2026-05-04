# Plano: CSV Processing com Node.js Cluster

## Objetivo

Criar uma variação do projeto `11-non-blocking-IO` demonstrando o módulo `cluster` do Node.js. O mesmo servidor de upload/processamento de CSV, agora distribuído em múltiplos processos filhos (workers), cada um rodando em um núcleo de CPU diferente — paralelismo real de processos, não threads.

---

## Por que Cluster em vez de Worker Threads?

| Aspecto | `worker_threads` (projeto 11) | `cluster` (este projeto) |
|---|---|---|
| Isolamento | Threads compartilham memória | Processos com memória isolada |
| Crash | Thread derruba o processo | Worker cai, master reinicia |
| Modelo | 1 processo, N threads | N processos independentes |
| IPC | `SharedArrayBuffer`, `postMessage` | `process.send()` / `process.on('message')` |
| Uso ideal | CPU-bound em 1 job | HTTP load balancing entre jobs |

No projeto 11, `worker_threads` foi usado para isolar o cálculo pesado de 1 job. Aqui, `cluster` distribui múltiplos uploads concorrentes em múltiplos cores — cada worker process é capaz de processar 1 upload inteiro de forma independente.

---

## Conceito Central: Estado Centralizado no Master

O maior desafio do cluster para este caso de uso é o estado compartilhado. Se o cliente sobe o arquivo no Worker A e depois faz GET `/progress/:id`, pode cair no Worker B — que não sabe nada sobre aquele job.

**Solução educacional escolhida: Master como Store Central**

```
                  ┌─────────────────────────────────────┐
                  │           MASTER PROCESS             │
                  │                                      │
                  │  ┌─────────────────────────────┐    │
                  │  │      Central Job Store       │    │
                  │  │  Map<jobId, JobState>        │    │
                  │  │  (updated via IPC messages)  │    │
                  │  └─────────────────────────────┘    │
                  │                                      │
                  │  cluster.fork() × numCPUs            │
                  └───────┬──────────┬──────────┬────────┘
                          │  IPC     │  IPC     │  IPC
                  ┌───────┴─┐  ┌────┴────┐  ┌──┴──────┐
                  │Worker 1 │  │Worker 2 │  │Worker N │
                  │:3000    │  │:3000    │  │:3000    │
                  │(NestJS) │  │(NestJS) │  │(NestJS) │
                  └─────────┘  └─────────┘  └─────────┘
```

**Fluxo de mensagens IPC:**
- Worker → Master: `{ type: 'job:created', jobId, workerId }`
- Worker → Master: `{ type: 'job:progress', jobId, processed }`
- Worker → Master: `{ type: 'job:done', jobId, result }`
- Worker → Master: `{ type: 'job:error', jobId, error }`
- Master → Worker: `{ type: 'job:state', jobId, state }` (para GET /result)
- Master → Worker (broadcast): `{ type: 'job:update', jobId, state }` (para SSE)

---

## Arquitetura de Arquivos

```
src/
├── main.ts                        Bootstrap: detecta master vs worker
├── cluster.ts                     Lógica do master process (fork + IPC store)
├── app.module.ts                  NestJS app (só nos workers)
│
├── ipc/
│   ├── ipc-message.interface.ts   Tipos de todas as mensagens IPC
│   └── ipc-bridge.service.ts      Abstrai process.send() / process.on()
│
├── jobs/
│   ├── job.interface.ts           JobStatus, Job (sem EventEmitter — state via IPC)
│   ├── job-store.service.ts       Worker-side: envia mutations para master via IPC
│   └── jobs.module.ts
│
├── upload/                        (igual ao projeto 11)
│   ├── upload.controller.ts
│   ├── upload.service.ts
│   └── upload.module.ts
│
├── processing/                    (igual ao projeto 11, sem worker_threads)
│   ├── processing.service.ts      Usa IPC em vez de EventEmitter local
│   ├── processing.module.ts
│   └── streams/
│       ├── csv-parse.transform.ts
│       └── stats-aggregator.writable.ts
│
├── progress/
│   ├── progress.controller.ts     SSE: escuta IPC broadcasts do master
│   └── progress.module.ts
│
└── result/
    ├── result.controller.ts       Pede estado ao master via IPC request-reply
    └── result.module.ts

scripts/
├── generate-csv.ts                (mesmo do projeto 11)
└── benchmark.ts                   Atualizado: mede distribuição entre workers
```

---

## Diferenças Chave vs Projeto 11

### 1. `main.ts` — Bootstrap condicional

```typescript
// Projeto 11
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  await app.listen(3000);
}

// Projeto 12
import { startMaster } from './cluster';

if (cluster.isPrimary) {
  startMaster();          // fork workers, inicializa job store central
} else {
  bootstrap();            // sobe NestJS normalmente
}
```

### 2. `cluster.ts` — Master Process

```typescript
// Responsabilidades do master:
// 1. Fazer fork de um worker por CPU core
// 2. Manter Map<jobId, JobState> centralizado
// 3. Roteamento de mensagens IPC
// 4. Restart automático de workers que caem

export function startMaster() {
  const numWorkers = os.cpus().length;
  const jobs = new Map<string, JobState>();

  for (let i = 0; i < numWorkers; i++) {
    const worker = cluster.fork();
    attachIpcHandlers(worker, jobs);
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} morreu. Reiniciando...`);
    const newWorker = cluster.fork();
    attachIpcHandlers(newWorker, jobs);
  });
}
```

### 3. `JobStoreService` — State via IPC em vez de Map local

```typescript
// Projeto 11: estado local
this.jobs.set(jobId, job);

// Projeto 12: delega ao master
process.send({ type: 'job:created', jobId, workerId: process.pid });

// Para ler estado, usa request-reply IPC:
async getJob(jobId: string): Promise<JobState> {
  return new Promise(resolve => {
    const replyChannel = `job:state:reply:${jobId}`;
    process.once(replyChannel, resolve);
    process.send({ type: 'job:get', jobId, replyChannel });
  });
}
```

### 4. `ProcessingService` — Sem worker_threads

No projeto 11, após o pipeline de streams, o trabalho pesado era delegado a um `worker_thread`. No projeto 12, **cada cluster worker já é um processo separado**, então o cálculo pesado pode rodar diretamente (sem bloquear outros workers, pois cada um tem seu próprio event loop).

```typescript
// Projeto 11
const result = await runInWorker(data);  // delega para thread

// Projeto 12
const result = computeStats(data);       // roda direto no worker process
```

### 5. SSE no `ProgressController` — Broadcast via IPC

```typescript
// Projeto 11: escuta EventEmitter local do job
job.emitter.on('progress', handler);

// Projeto 12: master faz broadcast para todos os workers
// Worker registra listener temporário no IPC bridge
this.ipcBridge.onJobUpdate(jobId, (update) => {
  observer.next({ data: update });
});
```

---

## Conceitos Novos Demonstrados

| Conceito | Onde | Como |
|---|---|---|
| `cluster.isPrimary` | main.ts | Bifurcação master/worker |
| `cluster.fork()` | cluster.ts | Spawn de N worker processes |
| `process.send()` | ipc-bridge.service.ts | Worker → Master mutations |
| `worker.send()` | cluster.ts | Master → Worker broadcasts |
| `cluster.on('exit')` | cluster.ts | Restart automático de worker morto |
| Request-Reply IPC | job-store.service.ts | Padrão síncrono sobre IPC async |
| Isolamento de processos | processing.service.ts | CPU-bound sem bloquear outros workers |
| Load balancing nativo | SO (round-robin) | `cluster` distribui conexões automaticamente |

---

## Fluxo Completo de uma Requisição

```
CLIENTE faz POST /upload (cai no Worker 2 via round-robin)
    ↓
Worker 2: UploadService.startJob()
    → gera jobId
    → process.send({ type: 'job:created', jobId, workerId: 2 })
    → responde { jobId } ao cliente
    ↓
Master: recebe 'job:created'
    → jobs.set(jobId, { status: 'processing', workerId: 2, processed: 0 })
    ↓
Worker 2: ProcessingService.process() [BACKGROUND]
    → pipeline de streams (igual ao projeto 11)
    → a cada row: process.send({ type: 'job:progress', jobId, processed: N })
    → ao final:   process.send({ type: 'job:done', jobId, result })
    ↓
Master: recebe 'job:progress'
    → atualiza jobs.get(jobId).processed = N
    → broadcast para TODOS os workers: worker.send({ type: 'job:update', jobId, ... })
    ↓
Worker 3 (pode ser diferente): GET /progress/:jobId (SSE)
    → IpcBridgeService escuta mensagens do master
    → ao receber 'job:update' para este jobId, envia SSE ao cliente
    ↓
Worker 1 (pode ser diferente): GET /result/:jobId
    → process.send({ type: 'job:get', jobId })
    → master responde com estado atual
    → retorna ao cliente
```

---

## Stack Técnica

Manter a mesma stack do projeto 11:
- **NestJS** (framework HTTP)
- **busboy** (multipart sem buffer)
- **TypeScript** (sem mudanças)
- **Módulo `cluster`** do Node.js core (sem dependências externas)
- **Módulo `os`** do Node.js core (para `os.cpus().length`)

Sem dependências novas — cluster é nativo do Node.js.

---

## Scripts

```bash
npm run start:dev    # Sobe master + workers (mesmo comando)
npm run gen:csv      # Gera CSV de teste (igual ao projeto 11)
npm run benchmark    # Mede distribuição entre workers (atualizado)
```

O benchmark atualizado mostrará o PID do worker que processou cada job, demonstrando visualmente a distribuição de carga.

---

## O que NÃO muda vs Projeto 11

- Lógica de parsing de CSV (`CsvParseTransform`)
- Lógica de agregação (`StatsAggregatorWritable`)
- Uso de `pipeline()` com backpressure
- Script `generate-csv.ts`
- Endpoints HTTP (mesmas rotas)
- Cálculo de estatísticas (agora inline, sem thread)
- Formato das respostas ao cliente

---

## Ordem de Implementação

1. Criar `ipc/ipc-message.interface.ts` — todos os tipos de mensagem IPC
2. Criar `cluster.ts` — master process com job store central
3. Adaptar `main.ts` — bootstrap condicional master/worker
4. Criar `ipc/ipc-bridge.service.ts` — abstração de IPC para injeção nos workers
5. Adaptar `jobs/job-store.service.ts` — delegar mutations para master via IPC
6. Adaptar `processing/processing.service.ts` — remover `runInWorker`, usar IPC para progresso
7. Adaptar `progress/progress.controller.ts` — SSE via IPC broadcast
8. Adaptar `result/result.controller.ts` — request-reply IPC
9. Atualizar `scripts/benchmark.ts` — mostrar distribuição por worker PID
