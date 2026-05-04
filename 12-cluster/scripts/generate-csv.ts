import { createWriteStream } from 'fs';
import { mkdirSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const ROWS = parseInt(process.argv[2] ?? '100000');
const OUTPUT = process.argv[3] ?? 'test-files/large.csv';

async function* generateRows(count: number): AsyncGenerator<string> {
  yield 'id,age,score,salary\n';
  for (let i = 1; i <= count; i++) {
    const age = Math.floor(20 + Math.random() * 45);
    const score = (Math.random() * 100).toFixed(2);
    const salary = (30000 + Math.random() * 120000).toFixed(2);
    yield `${i},${age},${score},${salary}\n`;
  }
}

async function main() {
  if (!existsSync('test-files')) mkdirSync('test-files');

  const writer = createWriteStream(OUTPUT);
  await pipeline(Readable.from(generateRows(ROWS)), writer);
  console.log(`Gerado: ${ROWS} linhas → ${OUTPUT}`);
}

main().catch(console.error);
