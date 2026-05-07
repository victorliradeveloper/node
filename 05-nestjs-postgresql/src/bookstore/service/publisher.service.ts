import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Publisher } from '../entity/publisher.entity';
import { CreatePublisherDto } from '../dto/create-publisher.dto';
import { UpdatePublisherDto } from '../dto/update-publisher.dto';

@Injectable()
export class PublisherService {
  constructor(
    @InjectRepository(Publisher)
    private readonly repo: Repository<Publisher>,
  ) {}

  create(dto: CreatePublisherDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ relations: ['books'] });
  }

  async findOne(id: number) {
    const publisher = await this.repo.findOne({ where: { id }, relations: ['books'] });
    if (!publisher) throw new NotFoundException(`Publisher #${id} not found`);
    return publisher;
  }

  async update(id: number, dto: UpdatePublisherDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const publisher = await this.findOne(id);
    return this.repo.remove(publisher);
  }
}
