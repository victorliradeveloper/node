import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Book } from '../entity/book.entity';
import { Publisher } from '../entity/publisher.entity';
import { Author } from '../entity/author.entity';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
    @InjectRepository(Publisher)
    private readonly publisherRepo: Repository<Publisher>,
    @InjectRepository(Author)
    private readonly authorRepo: Repository<Author>,
  ) {}

  async create(dto: CreateBookDto) {
    const book = this.bookRepo.create({ title: dto.title, isbn: dto.isbn, year: dto.year });

    if (dto.publisherId) {
      const publisher = await this.publisherRepo.findOneBy({ id: dto.publisherId });
      if (!publisher) throw new NotFoundException(`Publisher #${dto.publisherId} not found`);
      book.publisher = publisher;
    }

    if (dto.authorIds?.length) {
      book.authors = await this.authorRepo.findBy({ id: In(dto.authorIds) });
    }

    return this.bookRepo.save(book);
  }

  findAll() {
    return this.bookRepo.find({ relations: ['publisher', 'authors', 'review'] });
  }

  async findOne(id: number) {
    const book = await this.bookRepo.findOne({
      where: { id },
      relations: ['publisher', 'authors', 'review'],
    });
    if (!book) throw new NotFoundException(`Book #${id} not found`);
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    const book = await this.findOne(id);

    if (dto.title !== undefined) book.title = dto.title;
    if (dto.isbn !== undefined) book.isbn = dto.isbn;
    if (dto.year !== undefined) book.year = dto.year;

    if (dto.publisherId !== undefined) {
      const publisher = await this.publisherRepo.findOneBy({ id: dto.publisherId });
      if (!publisher) throw new NotFoundException(`Publisher #${dto.publisherId} not found`);
      book.publisher = publisher;
    }

    if (dto.authorIds !== undefined) {
      book.authors = await this.authorRepo.findBy({ id: In(dto.authorIds) });
    }

    return this.bookRepo.save(book);
  }

  async remove(id: number) {
    const book = await this.findOne(id);
    return this.bookRepo.remove(book);
  }
}
