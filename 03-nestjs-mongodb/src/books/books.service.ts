import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { Author } from '../authors/author.entity';
import { Publisher } from '../publishers/publisher.entity';
import { BookRecordDto } from './book-record.dto';
import { Book } from './book.entity';

// Equivalente ao BookService do projeto Spring. Sem transação explícita —
// cada operação é atômica em nível de documento no MongoDB.
@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: MongoRepository<Book>,
    @InjectRepository(Author)
    private readonly authorRepo: MongoRepository<Author>,
    @InjectRepository(Publisher)
    private readonly publisherRepo: MongoRepository<Publisher>,
  ) {}

  getAllBooks(): Promise<Book[]> {
    return this.bookRepo.find();
  }

  async saveBook(dto: BookRecordDto): Promise<Book> {
    // Busca o Publisher pelo ID — equivalente ao publisherRepository.findById().orElseThrow() do Spring.
    const publisher = await this.publisherRepo.findOne({
      where: { _id: new ObjectId(dto.publisherId) } as any,
    });
    if (!publisher) throw new NotFoundException('Publisher not found');

    // Busca todos os Authors pelos IDs — substitui a tabela de join do JPA.
    const authors = await this.authorRepo.find({
      where: { _id: { $in: dto.authorIds.map((id) => new ObjectId(id)) } } as any,
    });
    if (authors.length !== dto.authorIds.length) {
      throw new NotFoundException('One or more authors not found');
    }

    const book = this.bookRepo.create({
      title: dto.title,
      publisher: { id: publisher.id.toHexString(), name: publisher.name },
      authors: authors.map((a) => ({ id: a.id.toHexString(), name: a.name })),
      review: { comment: dto.reviewComment },
    });

    return this.bookRepo.save(book);
  }

  async deleteBook(id: string): Promise<void> {
    await this.bookRepo.deleteOne({ _id: new ObjectId(id) });
  }
}
