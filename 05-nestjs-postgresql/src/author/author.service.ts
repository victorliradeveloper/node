import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author } from './author.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

@Injectable()
export class AuthorService {
  constructor(
    @InjectRepository(Author)
    private readonly repo: Repository<Author>,
  ) {}

  create(dto: CreateAuthorDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ relations: ['books'] });
  }

  async findOne(id: number) {
    const author = await this.repo.findOne({
      where: { id },
      relations: ['books'],
    });
    if (!author) throw new NotFoundException(`Author #${id} not found`);
    return author;
  }

  async update(id: number, dto: UpdateAuthorDto) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const author = await this.findOne(id);
    return this.repo.remove(author);
  }
}
