import { Transform, TransformCallback } from 'stream';

export interface CsvRow {
  [key: string]: string;
}

export class CsvParseTransform extends Transform {
  private leftover = '';
  private headers: string[] | null = null;

  constructor() {
    super({
      readableObjectMode: true, // downstream recebe objetos, não buffers
      highWaterMark: 16,        // backpressure: pausa o upstream após 16 rows bufferizados
    });
  }

  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    this.leftover += chunk.toString('utf8');
    const lines = this.leftover.split('\n');

    // Guarda a última linha incompleta para o próximo chunk
    this.leftover = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (!this.headers) {
        this.headers = trimmed.split(',').map((h) => h.trim());
        continue;
      }

      const values = trimmed.split(',');
      const row: CsvRow = {};
      this.headers.forEach((h, i) => (row[h] = (values[i] ?? '').trim()));
      this.push(row);
    }

    // Sinaliza ao upstream que está pronto para o próximo chunk (backpressure)
    callback();
  }

  _flush(callback: TransformCallback): void {
    const trimmed = this.leftover.trim();
    if (trimmed && this.headers) {
      const values = trimmed.split(',');
      const row: CsvRow = {};
      this.headers.forEach((h, i) => (row[h] = (values[i] ?? '').trim()));
      this.push(row);
    }
    callback();
  }
}
