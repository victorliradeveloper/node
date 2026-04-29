import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { BookRecordDto } from './book-record.dto';
import { BooksService } from './books.service';

@Controller('bookstore/books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.booksService.getAllBooks();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: BookRecordDto) {
    return this.booksService.saveBook(dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.booksService.deleteBook(id);
    return 'Book deleted successfully.';
  }
}
