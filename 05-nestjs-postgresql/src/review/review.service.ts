import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Book } from '../book/book.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Book)
    private readonly bookRepo: Repository<Book>,
  ) {}

  async create(dto: CreateReviewDto) {
    const book = await this.bookRepo.findOneBy({ id: dto.bookId });
    if (!book) throw new NotFoundException(`Book #${dto.bookId} not found`);

    const review = this.reviewRepo.create({
      content: dto.content,
      rating: dto.rating,
      book,
    });
    return this.reviewRepo.save(review);
  }

  findAll() {
    return this.reviewRepo.find({ relations: ['book'] });
  }

  async findOne(id: number) {
    const review = await this.reviewRepo.findOne({
      where: { id },
      relations: ['book'],
    });
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }

  async update(id: number, dto: UpdateReviewDto) {
    const review = await this.findOne(id);

    if (dto.content !== undefined) review.content = dto.content;
    if (dto.rating !== undefined) review.rating = dto.rating;

    if (dto.bookId !== undefined) {
      const book = await this.bookRepo.findOneBy({ id: dto.bookId });
      if (!book) throw new NotFoundException(`Book #${dto.bookId} not found`);
      review.book = book;
    }

    return this.reviewRepo.save(review);
  }

  async remove(id: number) {
    const review = await this.findOne(id);
    return this.reviewRepo.remove(review);
  }
}
