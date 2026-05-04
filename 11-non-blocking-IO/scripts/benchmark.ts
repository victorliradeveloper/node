/**
 * Envia N uploads simultâneos e mede quanto tempo cada um leva para obter resposta.
 * Se o servidor estiver bloqueando o event loop, as requisições vão enfileirar.
 * Se for non-blocking, todas respondem quase ao mesmo tempo.
 *
 * Uso: ts-node scripts/benchmark.ts [concorrentes] [arquivo]
 * Exemplo: ts-node scripts/benchmark.ts 5 test-files/large.csv
 */
import * as http from 'http';
import * as fs from 'fs';

const CONCURRENT = parseInt(process.argv[2] ?? '3');
const FILE = process.argv[3] ?? 'test-files/large.csv';

function upload(filePath: string): Promise<{ jobId: string; ms: number }> {
  return new Promise((resolve, reject) => {
    const fileData = fs.readFileSync(filePath);
    const boundary = `----Boundary${Math.random().toString(36).slice(2)}`;

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="file.csv"\r\nContent-Type: text/csv\r\n\r\n`,
      ),
      fileData,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const start = Date.now();

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/upload',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const { jobId } = JSON.parse(data);
            resolve({ jobId, ms: Date.now() - start });
          } catch {
            reject(new Error(`Resposta inválida: ${data}`));
          }
        });
      },
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function pollResult(jobId: string): Promise<unknown> {
  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:3000/result/${jobId}`);
      const data = await res.json();
      if (data.status === 'done' || data.status === 'error') {
        clearInterval(interval);
        resolve(data);
      }
    }, 500);
  });
}

async function main() {
  console.log(`\nEnviando ${CONCURRENT} uploads simultâneos de "${FILE}"...`);
  const globalStart = Date.now();

  const uploads = await Promise.all(
    Array.from({ length: CONCURRENT }, () => upload(FILE)),
  );

  const uploadElapsed = Date.now() - globalStart;
  console.log(`\nTodos os ${CONCURRENT} uploads responderam em ${uploadElapsed}ms`);
  uploads.forEach(({ jobId, ms }, i) => {
    console.log(`  Upload ${i + 1}: jobId=${jobId}  resposta em ${ms}ms`);
  });

  console.log('\nAguardando processamento...');
  const results = await Promise.all(uploads.map(({ jobId }) => pollResult(jobId)));

  console.log(`\nTodos os jobs concluídos em ${Date.now() - globalStart}ms total`);
  results.forEach((r: any, i) => {
    console.log(`  Job ${i + 1}: ${r.status} — ${r.processed} linhas em ${r.elapsedMs}ms`);
  });
}

main().catch(console.error);
