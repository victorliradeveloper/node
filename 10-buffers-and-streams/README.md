# Buffers & Streams com NestJS

Projeto para entender na prática como **Buffers** e **Streams** funcionam no Node.js, usando NestJS e TypeScript.

## O problema que streams resolvem

Sem stream, o arquivo inteiro vai pra memória antes de qualquer coisa acontecer:

```ts
const file = fs.readFileSync('video.mp4'); // 2GB na RAM
res.send(file);                            // manda tudo de uma vez
```

Com stream, o arquivo é processado em pedaços enquanto é lido:

```ts
fs.createReadStream('video.mp4').pipe(res); // chunk por chunk
```

Cada pedaço que passa pelo `pipe` é um **Buffer** — um bloco de bytes brutos, por padrão com 64KB.

---

## Como o projeto está organizado

Um único serviço NestJS com três rotas, cada uma demonstrando um cenário diferente de streams:

```
src/
├── upload/     POST /upload    — recebe arquivo, salva comprimido
├── download/   GET  /download  — serve arquivo descomprimindo on-the-fly
└── csv/        POST /csv       — recebe CSV, responde JSON linha por linha
```

---

## Cenário 1 — Upload com compressão

`POST /upload?filename=foto.jpg`

O arquivo chega como uma `ReadableStream` (o `req` do HTTP). Em vez de acumular tudo na memória, cada chunk passa direto por um `Transform` de compressão (`createGzip`) e vai sendo gravado no disco.

```
req (Readable) → createGzip (Transform) → fs.createWriteStream (Writable)
```

O arquivo é salvo em `./uploads/foto.jpg.gz`.

`pipeline()` é usado no lugar de `.pipe()` porque propaga erros e fecha todas as streams corretamente quando algo falha.

---

## Cenário 2 — Download com descompressão on-the-fly

`GET /download/foto.jpg`

Lê o arquivo `.gz` do disco e descomprime durante o envio. O cliente recebe os bytes originais sem o servidor ter o arquivo inteiro na memória em nenhum momento.

```
fs.createReadStream (Readable) → createGunzip (Transform) → res (Writable)
```

---

## Cenário 3 — Transform stream customizado: CSV → JSON

`POST /csv`

Este é o cenário mais didático. O CSV chega como stream e cada chunk é um `Buffer` com bytes brutos. O `CsvToJsonTransform` converte linha por linha e emite um objeto JSON para cada uma, sem esperar o arquivo terminar.

```
req (Readable) → CsvToJsonTransform (Transform) → res (Writable)
```

O detalhe importante está no `leftover`: um chunk de 64KB pode cortar no meio de uma linha. A parte incompleta é guardada e concatenada com o início do próximo chunk.

```ts
_transform(chunk: Buffer, _encoding, callback) {
  const text = this.leftover + chunk.toString('utf-8');
  const lines = text.split('\n');

  this.leftover = lines.pop(); // linha incompleta — espera o próximo chunk

  for (const line of lines) {
    // processa linha completa e emite JSON
  }

  callback();
}
```

A resposta usa o formato **NDJSON** (um JSON por linha), que permite o cliente começar a processar antes do arquivo terminar.

---

## Como rodar

```bash
npm install
npm run start:dev
```

Servidor disponível em `http://localhost:3000`.

---

## Como testar

Importe o arquivo `buffers-and-streams.postman_collection.json` no Postman, ou use curl:

```bash
# upload de qualquer arquivo
curl -X POST "http://localhost:3000/upload?filename=foto.jpg" \
  --data-binary @foto.jpg

# download (recebe o arquivo original descomprimido)
curl -O "http://localhost:3000/download/foto.jpg"

# CSV para JSON
curl -X POST http://localhost:3000/csv \
  -H "Content-Type: text/csv" \
  --data-binary @dados.csv

# CSV direto no terminal (sem arquivo)
printf "name,age\nAlice,30\nBob,25" | \
  curl -X POST http://localhost:3000/csv --data-binary @-
```
