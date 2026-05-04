import { Writable } from 'stream';
import { CsvRow } from './csv-parse.transform';

export interface PartialStats {
  rows: number;
  columns: Record<string, number[]>;
}

export class StatsAggregatorWritable extends Writable {
  private rows = 0;
  private columns: Record<string, number[]> = {};
  private readonly onProgress: (rows: number) => void;

  constructor(onProgress: (rows: number) => void) {
    super({ objectMode: true });
    this.onProgress = onProgress;
  }

  _write(row: CsvRow, _encoding: string, callback: () => void): void {
    this.rows++;

    for (const [key, value] of Object.entries(row)) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (!this.columns[key]) this.columns[key] = [];
        this.columns[key].push(num);
      }
    }

    this.onProgress(this.rows);

    // callback() é o sinal de backpressure: só agora o upstream empurra o próximo row
    callback();
  }

  getPartialStats(): PartialStats {
    return { rows: this.rows, columns: this.columns };
  }
}
