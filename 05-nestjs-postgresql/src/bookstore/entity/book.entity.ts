import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Publisher } from './publisher.entity';
import { Author } from './author.entity';
import { Review } from './review.entity';

@Entity('tb_book')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  isbn: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @ManyToOne(() => Publisher, (publisher) => publisher.books, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'publisher_id' })
  publisher: Publisher;

  @ManyToMany(() => Author, (author) => author.books, { cascade: true })
  @JoinTable({ name: 'tb_book_author' })
  authors: Author[];

  @OneToOne(() => Review, (review) => review.book, {
    cascade: true,
    nullable: true,
  })
  @JoinColumn({ name: 'review_id' })
  review: Review;
}
