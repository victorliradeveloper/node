import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { CreateAuthorDto } from './create-author.dto';
import { Author } from './author.entity';

@Controller('bookstore/authors')
export class AuthorsController {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepo: MongoRepository<Author>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.authorRepo.find();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateAuthorDto) {
    return this.authorRepo.save(this.authorRepo.create(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.authorRepo.deleteOne({ _id: new ObjectId(id) });
    return 'Author deleted successfully.';
  }
}
