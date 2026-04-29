import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { BookModule } from '../book/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([Review]), BookModule],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
