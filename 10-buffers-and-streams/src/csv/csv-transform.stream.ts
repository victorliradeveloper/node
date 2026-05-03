import { Transform, TransformCallback } from 'stream';

export class CsvToJsonTransform extends Transform {
  private headers: string[] = [];
  private leftover = '';
  private first = true;

  constructor() {
    super({ readableObjectMode: true });
  }

  // chamado para cada chunk (Buffer) que chega da stream de entrada
  _transform(chunk: Buffer, _encoding: string, callback: TransformCallback): void {
    // chunk é bytes brutos — toString converte pra texto processável
    const text = this.leftover + chunk.toString('utf-8');
    const lines = text.split('\n');

    // última linha pode estar incompleta (chunk cortou no meio) — guarda pro próximo chunk
    this.leftover = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;

      if (this.first) {
        this.headers = line.split(',').map((h) => h.trim());
        this.first = false;
        continue;
      }

      const values = line.split(',').map((v) => v.trim());
      const obj = Object.fromEntries(this.headers.map((h, i) => [h, values[i]]));

      // this.push emite o dado pro próximo estágio da pipeline
      this.push(JSON.stringify(obj) + '\n');
    }

    callback();
  }

  // chamado quando a entrada fecha — processa o que sobrou no leftover
  _flush(callback: TransformCallback): void {
    if (this.leftover.trim()) {
      const values = this.leftover.split(',').map((v) => v.trim());
      const obj = Object.fromEntries(this.headers.map((h, i) => [h, values[i]]));
      this.push(JSON.stringify(obj) + '\n');
    }
    callback();
  }
}
