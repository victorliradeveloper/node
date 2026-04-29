import { ObjectId } from 'mongodb';
import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('publishers')
export class Publisher {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ unique: true })
  @Index({ unique: true })
  name: string;
}
