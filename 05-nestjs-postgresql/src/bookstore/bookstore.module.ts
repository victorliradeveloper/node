import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Author } from './entity/author.entity';
import { Book } from './entity/book.entity';
import { Publisher } from './entity/publisher.entity';
import { Review } from './entity/review.entity';

import { AuthorService } from './service/author.service';
import { BookService } from './service/book.service';
import { PublisherService } from './service/publisher.service';
import { ReviewService } from './service/review.service';

import { AuthorController } from './controller/author.controller';
import { BookController } from './controller/book.controller';
import { PublisherController } from './controller/publisher.controller';
import { ReviewController } from './controller/review.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Author, Book, Publisher, Review])],
  controllers: [AuthorController, BookController, PublisherController, ReviewController],
  providers: [AuthorService, BookService, PublisherService, ReviewService],
})
export class BookstoreModule {}
