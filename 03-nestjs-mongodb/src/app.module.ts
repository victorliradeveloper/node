import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorsModule } from './authors/authors.module';
import { PublishersModule } from './publishers/publishers.module';
import { BooksModule } from './books/books.module';
import { Author } from './authors/author.entity';
import { Publisher } from './publishers/publisher.entity';
import { Book } from './books/book.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: process.env.MONGODB_URI || 'mongodb://root:mongo123@localhost:27017/bookstore-mongo?authSource=admin',
      entities: [Author, Publisher, Book],
      synchronize: true,
      logging: true,
    }),
    AuthorsModule,
    PublishersModule,
    BooksModule,
  ],
})
export class AppModule {}
