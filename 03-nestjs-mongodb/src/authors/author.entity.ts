import { ObjectId } from 'mongodb';
import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('authors')
export class Author {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ unique: true })
  @Index({ unique: true })
  name: string;
}
