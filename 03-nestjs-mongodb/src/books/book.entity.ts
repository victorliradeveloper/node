import { ObjectId } from 'mongodb';
import { Column, Entity, ObjectIdColumn } from 'typeorm';

export class PublisherRef {
  id: string;
  name: string;
}

export class AuthorRef {
  id: string;
  name: string;
}

export class Review {
  comment: string;
}

// publisher e authors são resolvidos e embutidos no documento — equivalente ao @DBRef do Spring Data MongoDB.
// A review é embutida diretamente, sem collection separada.
@Entity('books')
export class Book {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ unique: true })
  title: string;

  @Column()
  publisher: PublisherRef;

  @Column()
  authors: AuthorRef[];

  @Column()
  review: Review;
}
