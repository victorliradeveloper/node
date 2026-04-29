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
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { CreatePublisherDto } from './create-publisher.dto';
import { Publisher } from './publisher.entity';

@Controller('bookstore/publishers')
export class PublishersController {
  constructor(
    @InjectRepository(Publisher)
    private readonly publisherRepo: MongoRepository<Publisher>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.publisherRepo.find();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePublisherDto) {
    return this.publisherRepo.save(this.publisherRepo.create(dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.publisherRepo.deleteOne({ _id: new ObjectId(id) });
    return 'Publisher deleted successfully.';
  }
}
