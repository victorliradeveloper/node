# Projeto: Pipeline de Processamento de Arquivos em Tempo Real

## Ideia

Um servidor HTTP que recebe uploads de arquivos grandes (CSV, JSON, logs) e os processa
em tempo real usando Streams e operações non-blocking, devolvendo o progresso e resultado
ao cliente via Server-Sent Events (SSE).

## Por que esse projeto?

Ele força você a lidar com todos os principais conceitos de Non-blocking IO do Node.js
em um contexto realista — sem inventar problema artificial.

---

## Conceitos cobertos

| Conceito | Onde aparece no projeto |
|---|---|
| Event Loop | Entender por que o servidor continua respondendo enquanto processa |
| Streams (Readable/Writable/Transform) | Pipeline de leitura, transformação e escrita do arquivo |
| Backpressure | Controlar a velocidade de leitura conforme o consumidor processa |
| `fs` non-blocking (`fs.createReadStream`) | Ler o arquivo sem bloquear o event loop |
| `worker_threads` | Offload de CPU-bound (ex: parse pesado) para fora do event loop |
| `EventEmitter` | Emitir eventos de progresso durante o processamento |
| `pipe` / `pipeline` | Encadear streams com tratamento de erro correto |
| SSE (Server-Sent Events) | Enviar progresso em tempo real sem polling |

---

## Funcionalidades

1. `POST /upload` — recebe um arquivo via multipart
2. Processa linha a linha usando Transform Stream (ex: filtra, conta, agrega)
3. `GET /progress/:id` — SSE que emite `{ processed: N, total: N, percent: N }` em tempo real
4. `GET /result/:id` — retorna o resultado final quando concluído

---

## Fases de desenvolvimento

### Fase 1 — base blocking (ponto de partida)
Implementar ingenuamente: ler o arquivo inteiro com `fs.readFileSync`, processar tudo
em memória. Medir: o servidor trava durante o processamento?

### Fase 2 — non-blocking com Streams
Trocar para `fs.createReadStream` + Transform Stream. O servidor continua respondendo
a outras requisições enquanto processa? Confirmar com requisições paralelas.

### Fase 3 — backpressure
Introduzir um Writable lento (simular banco de dados). Observar o que acontece
sem backpressure e corrigir usando `pipeline` do `stream/promises`.

### Fase 4 — CPU-bound em worker_threads
Adicionar uma etapa de processamento pesado (ex: calcular hash MD5 linha a linha).
Comparar: event loop bloqueado vs. delegado para worker_thread.

### Fase 5 — progresso em tempo real
Adicionar SSE para o cliente acompanhar o progresso sem polling.

---

## Estrutura sugerida

```
11-non-blocking-IO/
  src/
    server.js           # HTTP server principal
    upload-handler.js   # Recebe e inicia o processamento
    pipeline.js         # Stream pipeline (Transform, Writable)
    worker.js           # worker_thread para CPU-bound
    progress-store.js   # Map em memória com estado de cada job
  test-files/
    small.csv           # ~1MB para testes rápidos
    large.csv           # ~100MB para testar backpressure
  benchmark.js          # Envia N uploads simultâneos e mede latência
```

---

## Experimentos para fazer

- Abrir duas abas no browser: uma fazendo upload, outra fazendo ping no servidor.
  Na Fase 1 o ping vai travar; na Fase 2 não.
- Logar `process.hrtime()` antes e depois do pipeline para medir throughput real.
- Usar `--inspect` e o Chrome DevTools para ver o Event Loop em ação.
- Medir memória com `process.memoryUsage()` — streaming mantém constante,
  `readFileSync` explode com arquivos grandes.

---

## Variações possíveis

- Trocar SSE por WebSocket para aprender bidirecionalidade
- Adicionar fila (ex: array simples ou `p-limit`) para limitar processamentos simultâneos
- Salvar resultado em arquivo com `fs.createWriteStream` em vez de memória
