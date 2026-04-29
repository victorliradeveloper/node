import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublisherModule } from './publisher/publisher.module';
import { AuthorModule } from './author/author.module';
import { BookModule } from './book/book.module';
import { ReviewModule } from './review/review.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'banco123'),
        database: config.get('DB_NAME', 'bookstore-jpa'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    PublisherModule,
    AuthorModule,
    BookModule,
    ReviewModule,
  ],
})
export class AppModule {}
