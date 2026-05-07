import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Book } from './book.entity';

@Entity('tb_review')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'decimal', precision: 2, scale: 1 })
  rating: number;

  @OneToOne(() => Book, (book) => book.review)
  book: Book;
}
