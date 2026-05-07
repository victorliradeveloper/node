import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { PublisherService } from '../service/publisher.service';
import { CreatePublisherDto } from '../dto/create-publisher.dto';
import { UpdatePublisherDto } from '../dto/update-publisher.dto';

@Controller('publishers')
export class PublisherController {
  constructor(private readonly service: PublisherService) {}

  @Post()
  create(@Body() dto: CreatePublisherDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePublisherDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
