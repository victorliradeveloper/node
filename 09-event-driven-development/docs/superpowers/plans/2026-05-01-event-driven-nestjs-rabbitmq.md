# Event-Driven NestJS + RabbitMQ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build dois serviços NestJS (user-service + email-service) comunicando via RabbitMQ topic exchange dentro de `09-event-driven-development/`.

**Architecture:** user-service expõe REST API com JWT, publica eventos no exchange `user.exchange` (topic). email-service consome 4 filas durable com ack manual e envia e-mails via Mailtrap. Ambos rodam em Docker com health checks.

**Tech Stack:** NestJS 10, TypeORM 0.3, PostgreSQL 15, RabbitMQ 3, amqplib, @nestjs/jwt, passport-jwt, bcrypt, nodemailer, class-validator, @nestjs/swagger

---

## File Map

```
09-event-driven-development/
├── docker-compose.yml
├── user-service/
│   ├── Dockerfile
│   ├── .env
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── database/
│       │   ├── data-source.ts
│       │   └── migrations/
│       │       ├── 1700000001-CreateUsers.ts
│       │       └── 1700000002-CreateOrders.ts
│       ├── jwt/
│       │   ├── jwt.module.ts
│       │   ├── jwt.service.ts
│       │   └── jwt.strategy.ts
│       ├── auth/
│       │   ├── guards/jwt-auth.guard.ts
│       │   ├── dto/register.dto.ts
│       │   ├── dto/login.dto.ts
│       │   ├── dto/auth-response.dto.ts
│       │   ├── auth.service.ts
│       │   ├── auth.service.spec.ts
│       │   ├── auth.controller.ts
│       │   └── auth.module.ts
│       ├── users/
│       │   ├── entities/user.entity.ts
│       │   ├── users.service.ts
│       │   ├── users.module.ts
│       │   └── users.controller.ts
│       ├── orders/
│       │   ├── entities/order.entity.ts
│       │   ├── dto/create-order.dto.ts
│       │   ├── dto/order-response.dto.ts
│       │   ├── orders.service.ts
│       │   ├── orders.controller.ts
│       │   └── orders.module.ts
│       └── messaging/
│           ├── dto/user-event.dto.ts
│           ├── dto/order-event.dto.ts
│           ├── event-publisher.service.ts
│           └── messaging.module.ts
└── email-service/
    ├── Dockerfile
    ├── .env
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.build.json
    ├── nest-cli.json
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── email/
        │   ├── templates/email-template.factory.ts
        │   ├── templates/email-template.factory.spec.ts
        │   ├── email.service.ts
        │   └── email.module.ts
        └── messaging/
            ├── dto/user-event.dto.ts
            ├── dto/order-event.dto.ts
            ├── email.consumer.ts
            └── messaging.module.ts
```

---

## Task 1: Infrastructure

**Files:**
- Create: `docker-compose.yml`
- Create: `user-service/Dockerfile`
- Create: `email-service/Dockerfile`
- Create: `user-service/.env`
- Create: `email-service/.env`

- [ ] **Step 1: Create docker-compose.yml**

```yaml
# docker-compose.yml
version: '3.8'

name: event-driven-nestjs

services:
  postgres:
    image: postgres:15-alpine
    container_name: event-driven-postgres
    environment:
      POSTGRES_DB: userdb
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    networks:
      - event-driven-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d userdb"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: event-driven-rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    networks:
      - event-driven-net
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s

  user-service:
    build: ./user-service
    container_name: event-driven-user-service
    env_file: ./user-service/.env
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - event-driven-net

  email-service:
    build: ./email-service
    container_name: event-driven-email-service
    env_file: ./email-service/.env
    ports:
      - "3001:3001"
    depends_on:
      rabbitmq:
        condition: service_healthy
    networks:
      - event-driven-net

networks:
  event-driven-net:
    driver: bridge
```

- [ ] **Step 2: Create user-service/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

- [ ] **Step 3: Create email-service/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

- [ ] **Step 4: Create user-service/.env**

```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=userdb
DB_USER=postgres
DB_PASSWORD=postgres
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
JWT_SECRET=minha-chave-secreta-super-segura-para-desenvolvimento
PORT=3000
```

- [ ] **Step 5: Create email-service/.env**

```
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=94a4464c859e50
MAILTRAP_PASS=43b0495b90aa4c
PORT=3001
```

- [ ] **Step 6: Commit**

```bash
git add docker-compose.yml user-service/Dockerfile user-service/.env email-service/Dockerfile email-service/.env
git commit -m "feat: add infrastructure files"
```

---

## Task 2: user-service Scaffold

**Files:**
- Create: `user-service/package.json`
- Create: `user-service/tsconfig.json`
- Create: `user-service/tsconfig.build.json`
- Create: `user-service/nest-cli.json`

- [ ] **Step 1: Create user-service/package.json**

```json
{
  "name": "user-service",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/config": "^3.0.0",
    "typeorm": "^0.3.17",
    "pg": "^8.11.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "bcrypt": "^5.1.0",
    "amqplib": "^0.10.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/amqplib": "^0.10.1",
    "@types/node": "^20.0.0",
    "typescript": "^5.1.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.2"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create user-service/tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
```

- [ ] **Step 3: Create user-service/tsconfig.build.json**

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

- [ ] **Step 4: Create user-service/nest-cli.json**

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 5: Create user-service/src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('User Service API')
    .setDescription('Event-Driven NestJS - User Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api-docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT || 3000);
  console.log(`User Service running on port ${process.env.PORT || 3000}`);
}
bootstrap();
```

- [ ] **Step 6: Create user-service/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Order } from './orders/entities/order.entity';
import { JwtModule } from './jwt/jwt.module';
import { MessagingModule } from './messaging/messaging.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Order],
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: true,
      synchronize: false,
    }),
    JwtModule,
    MessagingModule,
    AuthModule,
    UsersModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 7: Commit**

```bash
git add user-service/
git commit -m "feat: add user-service scaffold"
```

---

## Task 3: user-service Entities & Migrations

**Files:**
- Create: `user-service/src/users/entities/user.entity.ts`
- Create: `user-service/src/orders/entities/order.entity.ts`
- Create: `user-service/src/database/data-source.ts`
- Create: `user-service/src/database/migrations/1700000001-CreateUsers.ts`
- Create: `user-service/src/database/migrations/1700000002-CreateOrders.ts`

- [ ] **Step 1: Create user.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Index('idx_users_email')
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: Create order.entity.ts**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_orders_user_id')
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 500 })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 3: Create data-source.ts**

```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'userdb',
  entities: [User, Order],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
```

- [ ] **Step 4: Create migration CreateUsers**

```typescript
// src/database/migrations/1700000001-CreateUsers.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(100) NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users" ("email")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_users_email"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

- [ ] **Step 5: Create migration CreateOrders**

```typescript
// src/database/migrations/1700000002-CreateOrders.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders1700000002 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "description" character varying(500) NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_orders_users" FOREIGN KEY ("user_id") REFERENCES "users"("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_orders_user_id" ON "orders" ("user_id")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_orders_user_id"`);
    await queryRunner.query(`DROP TABLE "orders"`);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add user-service/src/
git commit -m "feat: add user-service entities and migrations"
```

---

## Task 4: user-service JWT Module

**Files:**
- Create: `user-service/src/jwt/jwt.module.ts`
- Create: `user-service/src/jwt/jwt.service.ts`
- Create: `user-service/src/jwt/jwt.strategy.ts`
- Create: `user-service/src/auth/guards/jwt-auth.guard.ts`

- [ ] **Step 1: Create jwt.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: string;
  userId: string;
  name: string;
}

@Injectable()
export class JwtService {
  constructor(private readonly nestJwtService: NestJwtService) {}

  generateToken(payload: { userId: string; name: string; email: string }): string {
    return this.nestJwtService.sign(
      { userId: payload.userId, name: payload.name },
      { subject: payload.email },
    );
  }
}
```

- [ ] **Step 2: Create jwt.strategy.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret',
    });
  }

  async validate(payload: any) {
    return { userId: payload.userId, name: payload.name, sub: payload.sub };
  }
}
```

- [ ] **Step 3: Create jwt.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtService } from './jwt.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    NestJwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '2h', issuer: 'user-service' },
    }),
  ],
  providers: [JwtService, JwtStrategy],
  exports: [JwtService, NestJwtModule],
})
export class JwtModule {}
```

- [ ] **Step 4: Create jwt-auth.guard.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 5: Commit**

```bash
git add user-service/src/jwt/ user-service/src/auth/guards/
git commit -m "feat: add JWT module and guard"
```

---

## Task 5: user-service Messaging Module

**Files:**
- Create: `user-service/src/messaging/dto/user-event.dto.ts`
- Create: `user-service/src/messaging/dto/order-event.dto.ts`
- Create: `user-service/src/messaging/event-publisher.service.ts`
- Create: `user-service/src/messaging/messaging.module.ts`

- [ ] **Step 1: Create user-event.dto.ts**

```typescript
export type UserEventType = 'USER_REGISTERED' | 'USER_LOGIN' | 'USER_PASSWORD_RESET';

export interface UserEventPayload {
  userId: string;
  name: string;
  email: string;
}

export interface UserEventDto {
  eventType: UserEventType;
  timestamp: string;
  payload: UserEventPayload;
}
```

- [ ] **Step 2: Create order-event.dto.ts**

```typescript
export interface OrderEventPayload {
  orderId: string;
  userId: string;
  name: string;
  email: string;
  description: string;
  amount: number;
}

export interface OrderEventDto {
  eventType: 'ORDER_CREATED';
  timestamp: string;
  payload: OrderEventPayload;
}
```

- [ ] **Step 3: Create event-publisher.service.ts**

```typescript
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { UserEventPayload, UserEventDto } from './dto/user-event.dto';
import { OrderEventPayload, OrderEventDto } from './dto/order-event.dto';

const EXCHANGE = 'user.exchange';
const QUEUES = [
  { queue: 'email.registered.queue', routingKey: 'user.registered' },
  { queue: 'email.login.queue', routingKey: 'user.login' },
  { queue: 'email.order.queue', routingKey: 'order.created' },
  { queue: 'email.password.queue', routingKey: 'user.password' },
];

@Injectable()
export class EventPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisherService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5): Promise<void> {
    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    for (let i = retries; i > 0; i--) {
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
        for (const { queue, routingKey } of QUEUES) {
          await this.channel.assertQueue(queue, { durable: true });
          await this.channel.bindQueue(queue, EXCHANGE, routingKey);
        }
        this.logger.log('Connected to RabbitMQ');
        return;
      } catch (err) {
        if (i === 1) throw err;
        this.logger.warn(`RabbitMQ not ready, retrying in 3s... (${i - 1} left)`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  private publish(routingKey: string, data: UserEventDto | OrderEventDto) {
    const content = Buffer.from(JSON.stringify(data));
    this.channel.publish(EXCHANGE, routingKey, content, { persistent: true });
    this.logger.log(`Published: ${routingKey}`);
  }

  async publishUserRegistered(payload: UserEventPayload) {
    this.publish('user.registered', { eventType: 'USER_REGISTERED', timestamp: new Date().toISOString(), payload });
  }

  async publishUserLogin(payload: UserEventPayload) {
    this.publish('user.login', { eventType: 'USER_LOGIN', timestamp: new Date().toISOString(), payload });
  }

  async publishUserPasswordReset(payload: UserEventPayload) {
    this.publish('user.password', { eventType: 'USER_PASSWORD_RESET', timestamp: new Date().toISOString(), payload });
  }

  async publishOrderCreated(payload: OrderEventPayload) {
    this.publish('order.created', { eventType: 'ORDER_CREATED', timestamp: new Date().toISOString(), payload });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

- [ ] **Step 4: Create messaging.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { EventPublisherService } from './event-publisher.service';

@Module({
  providers: [EventPublisherService],
  exports: [EventPublisherService],
})
export class MessagingModule {}
```

- [ ] **Step 5: Commit**

```bash
git add user-service/src/messaging/
git commit -m "feat: add messaging module with RabbitMQ publisher"
```

---

## Task 6: user-service Users Module

**Files:**
- Create: `user-service/src/users/users.service.ts`
- Create: `user-service/src/users/users.module.ts`
- Create: `user-service/src/users/users.controller.ts`

- [ ] **Step 1: Create users.service.ts**

```typescript
import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(name: string, email: string, password: string): Promise<User> {
    const existing = await this.repo.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');
    const hashed = await bcrypt.hash(password, 10);
    return this.repo.save(this.repo.create({ name, email, password: hashed }));
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async validatePassword(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
```

- [ ] **Step 2: Create users.controller.ts**

```typescript
import { Controller, Post, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventPublisherService } from '../messaging/event-publisher.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly eventPublisher: EventPublisherService) {}

  @Post('password-reset')
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request password reset' })
  async passwordReset(@Request() req) {
    await this.eventPublisher.publishUserPasswordReset({
      userId: req.user.userId,
      name: req.user.name,
      email: req.user.sub,
    });
    return { message: 'Password reset email sent' };
  }
}
```

- [ ] **Step 3: Create users.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MessagingModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
```

- [ ] **Step 4: Commit**

```bash
git add user-service/src/users/
git commit -m "feat: add users module"
```

---

## Task 7: user-service Auth Module (TDD)

**Files:**
- Create: `user-service/src/auth/dto/register.dto.ts`
- Create: `user-service/src/auth/dto/login.dto.ts`
- Create: `user-service/src/auth/dto/auth-response.dto.ts`
- Create: `user-service/src/auth/auth.service.spec.ts`
- Create: `user-service/src/auth/auth.service.ts`
- Create: `user-service/src/auth/auth.controller.ts`
- Create: `user-service/src/auth/auth.module.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// src/auth/dto/register.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Victor' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'victor@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
```

```typescript
// src/auth/dto/login.dto.ts
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'victor@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  password: string;
}
```

```typescript
// src/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  token: string;
}
```

- [ ] **Step 2: Write failing test for AuthService**

```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwt.service';
import { EventPublisherService } from '../messaging/event-publisher.service';

const mockUser = {
  id: 'uuid-1',
  name: 'Victor',
  email: 'victor@email.com',
  password: 'hashed',
  createdAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let eventPublisher: jest.Mocked<EventPublisherService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            validatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { generateToken: jest.fn().mockReturnValue('jwt-token') },
        },
        {
          provide: EventPublisherService,
          useValue: {
            publishUserRegistered: jest.fn(),
            publishUserLogin: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    eventPublisher = module.get(EventPublisherService);
  });

  describe('register', () => {
    it('returns name and token, publishes registered event', async () => {
      usersService.create.mockResolvedValue(mockUser as any);
      const result = await service.register('Victor', 'victor@email.com', '123456');
      expect(result).toEqual({ name: 'Victor', token: 'jwt-token' });
      expect(eventPublisher.publishUserRegistered).toHaveBeenCalledWith({
        userId: 'uuid-1', name: 'Victor', email: 'victor@email.com',
      });
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login('x@x.com', '123')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.validatePassword.mockResolvedValue(false);
      await expect(service.login('victor@email.com', 'wrong')).rejects.toThrow(UnauthorizedException);
    });

    it('returns name and token, publishes login event', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.validatePassword.mockResolvedValue(true);
      const result = await service.login('victor@email.com', '123456');
      expect(result).toEqual({ name: 'Victor', token: 'jwt-token' });
      expect(eventPublisher.publishUserLogin).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 3: Run test — expect FAIL (AuthService not found)**

```bash
cd user-service && npm install && npx jest auth.service.spec.ts
```
Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 4: Create auth.service.ts**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '../jwt/jwt.service';
import { EventPublisherService } from '../messaging/event-publisher.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async register(name: string, email: string, password: string) {
    const user = await this.usersService.create(name, email, password);
    const token = this.jwtService.generateToken({ userId: user.id, name: user.name, email: user.email });
    await this.eventPublisher.publishUserRegistered({ userId: user.id, name: user.name, email: user.email });
    return { name: user.name, token };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.usersService.validatePassword(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = this.jwtService.generateToken({ userId: user.id, name: user.name, email: user.email });
    await this.eventPublisher.publishUserLogin({ userId: user.id, name: user.name, email: user.email });
    return { name: user.name, token };
  }
}
```

- [ ] **Step 5: Run test — expect PASS**

```bash
npx jest auth.service.spec.ts
```
Expected: PASS (3 tests)

- [ ] **Step 6: Create auth.controller.ts**

```typescript
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto.name, dto.email, dto.password);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Authenticate user' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto.email, dto.password);
  }
}
```

- [ ] **Step 7: Create auth.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '../jwt/jwt.module';
import { MessagingModule } from '../messaging/messaging.module';

@Module({
  imports: [UsersModule, JwtModule, MessagingModule],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
```

- [ ] **Step 8: Commit**

```bash
cd .. && git add user-service/src/auth/
git commit -m "feat: add auth module with TDD"
```

---

## Task 8: user-service Orders Module

**Files:**
- Create: `user-service/src/orders/dto/create-order.dto.ts`
- Create: `user-service/src/orders/dto/order-response.dto.ts`
- Create: `user-service/src/orders/orders.service.ts`
- Create: `user-service/src/orders/orders.controller.ts`
- Create: `user-service/src/orders/orders.module.ts`

- [ ] **Step 1: Create DTOs**

```typescript
// src/orders/dto/create-order.dto.ts
import { IsString, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({ example: 'Notebook Dell XPS' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 8500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}
```

```typescript
// src/orders/dto/order-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() description: string;
  @ApiProperty() amount: number;
  @ApiProperty() createdAt: Date;
}
```

- [ ] **Step 2: Create orders.service.ts**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { User } from '../users/entities/user.entity';
import { EventPublisherService } from '../messaging/event-publisher.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async create(user: User, description: string, amount: number): Promise<Order> {
    const order = await this.repo.save(this.repo.create({ user, description, amount }));
    await this.eventPublisher.publishOrderCreated({
      orderId: order.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      description: order.description,
      amount: Number(order.amount),
    });
    return order;
  }
}
```

- [ ] **Step 3: Create orders.controller.ts**

```typescript
import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { UsersService } from '../users/users.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an order' })
  @ApiResponse({ status: 201, type: OrderResponseDto })
  async create(@Body() dto: CreateOrderDto, @Request() req): Promise<OrderResponseDto> {
    const user = await this.usersService.findByEmail(req.user.sub);
    const order = await this.ordersService.create(user, dto.description, dto.amount);
    return { id: order.id, description: order.description, amount: Number(order.amount), createdAt: order.createdAt };
  }
}
```

- [ ] **Step 4: Create orders.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MessagingModule } from '../messaging/messaging.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order]), MessagingModule, UsersModule],
  providers: [OrdersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
```

- [ ] **Step 5: Commit**

```bash
git add user-service/src/orders/
git commit -m "feat: add orders module"
```

---

## Task 9: email-service Scaffold

**Files:**
- Create: `email-service/package.json`
- Create: `email-service/tsconfig.json`
- Create: `email-service/tsconfig.build.json`
- Create: `email-service/nest-cli.json`
- Create: `email-service/src/main.ts`
- Create: `email-service/src/app.module.ts`

- [ ] **Step 1: Create email-service/package.json**

```json
{
  "name": "email-service",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "amqplib": "^0.10.3",
    "nodemailer": "^6.9.7",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/nodemailer": "^6.4.14",
    "@types/amqplib": "^0.10.1",
    "@types/node": "^20.0.0",
    "typescript": "^5.1.3",
    "ts-node": "^10.9.1",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "@types/jest": "^29.5.2"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": { "^.+\\.(t|j)s$": "ts-jest" },
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create tsconfig files (same structure as user-service)**

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false
  }
}
```

```json
// tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

```json
// nest-cli.json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
```

- [ ] **Step 3: Create email-service/src/main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3001);
  console.log(`Email Service running on port ${process.env.PORT || 3001}`);
}
bootstrap();
```

- [ ] **Step 4: Create email-service/src/app.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    MessagingModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 5: Commit**

```bash
git add email-service/
git commit -m "feat: add email-service scaffold"
```

---

## Task 10: email-service Email Module (TDD)

**Files:**
- Create: `email-service/src/email/templates/email-template.factory.ts`
- Create: `email-service/src/email/templates/email-template.factory.spec.ts`
- Create: `email-service/src/email/email.service.ts`
- Create: `email-service/src/email/email.module.ts`

- [ ] **Step 1: Write failing test for EmailTemplateFactory**

```typescript
// src/email/templates/email-template.factory.spec.ts
import { EmailTemplateFactory } from './email-template.factory';

describe('EmailTemplateFactory', () => {
  it('generates welcome subject with user name', () => {
    const t = EmailTemplateFactory.userRegistered('Victor');
    expect(t.subject).toBe('Bem-vindo ao sistema, Victor!');
    expect(t.html).toContain('Victor');
  });

  it('generates login subject', () => {
    const t = EmailTemplateFactory.userLogin('Victor');
    expect(t.subject).toBe('Novo acesso detectado na sua conta');
  });

  it('uses first 8 chars of orderId in order subject', () => {
    const t = EmailTemplateFactory.orderCreated('Victor', 'abcd1234-rest', 'Notebook', 8500);
    expect(t.subject).toBe('Pedido confirmado! #abcd1234');
  });

  it('generates password reset subject', () => {
    const t = EmailTemplateFactory.passwordReset('Victor');
    expect(t.subject).toBe('Redefinição de senha solicitada');
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
cd email-service && npm install && npx jest email-template.factory.spec.ts
```
Expected: FAIL — `Cannot find module './email-template.factory'`

- [ ] **Step 3: Create email-template.factory.ts**

```typescript
export interface EmailTemplate {
  subject: string;
  html: string;
}

export class EmailTemplateFactory {
  static userRegistered(name: string): EmailTemplate {
    return {
      subject: `Bem-vindo ao sistema, ${name}!`,
      html: `<h1>Olá, ${name}!</h1><p>Sua conta foi criada com sucesso.</p>`,
    };
  }

  static userLogin(name: string): EmailTemplate {
    return {
      subject: 'Novo acesso detectado na sua conta',
      html: `<h1>Olá, ${name}!</h1><p>Um novo acesso foi detectado na sua conta.</p>`,
    };
  }

  static orderCreated(name: string, orderId: string, description: string, amount: number): EmailTemplate {
    return {
      subject: `Pedido confirmado! #${orderId.substring(0, 8)}`,
      html: `<h1>Pedido confirmado, ${name}!</h1><p>${description}</p><p>Valor: R$ ${amount.toFixed(2)}</p>`,
    };
  }

  static passwordReset(name: string): EmailTemplate {
    return {
      subject: 'Redefinição de senha solicitada',
      html: `<h1>Olá, ${name}!</h1><p>Uma redefinição de senha foi solicitada.</p>`,
    };
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest email-template.factory.spec.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Create email.service.ts**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailTemplateFactory } from './templates/email-template.factory';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: parseInt(process.env.MAILTRAP_PORT || '2525'),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });
  }

  async sendUserRegistered(name: string, email: string) {
    const t = EmailTemplateFactory.userRegistered(name);
    await this.send(email, t.subject, t.html);
  }

  async sendUserLogin(name: string, email: string) {
    const t = EmailTemplateFactory.userLogin(name);
    await this.send(email, t.subject, t.html);
  }

  async sendOrderCreated(name: string, email: string, orderId: string, description: string, amount: number) {
    const t = EmailTemplateFactory.orderCreated(name, orderId, description, amount);
    await this.send(email, t.subject, t.html);
  }

  async sendPasswordReset(name: string, email: string) {
    const t = EmailTemplateFactory.passwordReset(name);
    await this.send(email, t.subject, t.html);
  }

  private async send(to: string, subject: string, html: string) {
    await this.transporter.sendMail({ from: 'noreply@userservice.com', to, subject, html });
    this.logger.log(`Email sent to ${to}: ${subject}`);
  }
}
```

- [ ] **Step 6: Create email.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

- [ ] **Step 7: Commit**

```bash
cd .. && git add email-service/src/email/
git commit -m "feat: add email module with TDD"
```

---

## Task 11: email-service Messaging Consumer

**Files:**
- Create: `email-service/src/messaging/dto/user-event.dto.ts`
- Create: `email-service/src/messaging/dto/order-event.dto.ts`
- Create: `email-service/src/messaging/email.consumer.ts`
- Create: `email-service/src/messaging/messaging.module.ts`

- [ ] **Step 1: Create DTOs (same shape as user-service)**

```typescript
// src/messaging/dto/user-event.dto.ts
export type UserEventType = 'USER_REGISTERED' | 'USER_LOGIN' | 'USER_PASSWORD_RESET';

export interface UserEventPayload {
  userId: string;
  name: string;
  email: string;
}

export interface UserEventDto {
  eventType: UserEventType;
  timestamp: string;
  payload: UserEventPayload;
}
```

```typescript
// src/messaging/dto/order-event.dto.ts
export interface OrderEventPayload {
  orderId: string;
  userId: string;
  name: string;
  email: string;
  description: string;
  amount: number;
}

export interface OrderEventDto {
  eventType: 'ORDER_CREATED';
  timestamp: string;
  payload: OrderEventPayload;
}
```

- [ ] **Step 2: Create email.consumer.ts**

```typescript
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { EmailService } from '../email/email.service';
import { UserEventDto } from './dto/user-event.dto';
import { OrderEventDto } from './dto/order-event.dto';

const EXCHANGE = 'user.exchange';

@Injectable()
export class EmailConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailConsumer.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(private readonly emailService: EmailService) {}

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(retries = 5): Promise<void> {
    const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;
    for (let i = retries; i > 0; i--) {
      try {
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
        await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });
        await this.channel.prefetch(1);
        await this.bindQueues();
        this.logger.log('Email consumer connected to RabbitMQ');
        return;
      } catch (err) {
        if (i === 1) throw err;
        this.logger.warn(`RabbitMQ not ready, retrying in 3s... (${i - 1} left)`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  }

  private async bindQueues() {
    await this.setupQueue('email.registered.queue', 'user.registered', (e: UserEventDto) =>
      this.emailService.sendUserRegistered(e.payload.name, e.payload.email),
    );
    await this.setupQueue('email.login.queue', 'user.login', (e: UserEventDto) =>
      this.emailService.sendUserLogin(e.payload.name, e.payload.email),
    );
    await this.setupQueue('email.order.queue', 'order.created', (e: OrderEventDto) =>
      this.emailService.sendOrderCreated(
        e.payload.name, e.payload.email, e.payload.orderId, e.payload.description, e.payload.amount,
      ),
    );
    await this.setupQueue('email.password.queue', 'user.password', (e: UserEventDto) =>
      this.emailService.sendPasswordReset(e.payload.name, e.payload.email),
    );
  }

  private async setupQueue(queue: string, routingKey: string, handler: (data: any) => Promise<void>) {
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, EXCHANGE, routingKey);
    this.channel.consume(queue, async (msg) => {
      if (!msg) return;
      try {
        await handler(JSON.parse(msg.content.toString()));
        this.channel.ack(msg);
      } catch (err) {
        this.logger.error(`Error in ${queue}:`, err);
        this.channel.nack(msg, false, false);
      }
    });
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
```

- [ ] **Step 3: Create messaging.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { EmailConsumer } from './email.consumer';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  providers: [EmailConsumer],
})
export class MessagingModule {}
```

- [ ] **Step 4: Commit**

```bash
git add email-service/src/messaging/
git commit -m "feat: add email consumer for RabbitMQ queues"
```

---

## Task 12: Integration Validation

- [ ] **Step 1: Build and start all services**

```bash
cd 09-event-driven-development
docker-compose up --build
```
Expected: all 4 containers start healthy. Look for:
- `User Service running on port 3000`
- `Email Service running on port 3001`
- `Connected to RabbitMQ` (both services)

- [ ] **Step 2: Test POST /register — verify welcome email**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Victor","email":"victor@test.com","password":"123456"}'
```
Expected response:
```json
{ "name": "Victor", "token": "eyJ..." }
```
Expected in Mailtrap: email "Bem-vindo ao sistema, Victor!"

- [ ] **Step 3: Test POST /login — verify login email**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"victor@test.com","password":"123456"}'
```
Expected: same `{ name, token }` response.
Expected in Mailtrap: email "Novo acesso detectado na sua conta"

- [ ] **Step 4: Test POST /orders (with JWT) — verify order email**

```bash
# Use token from previous step
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"description":"Notebook Dell XPS","amount":8500.00}'
```
Expected: `{ id, description, amount, createdAt }`
Expected in Mailtrap: email "Pedido confirmado! #<orderId_8chars>"

- [ ] **Step 5: Test POST /users/password-reset — verify reset email**

```bash
curl -X POST http://localhost:3000/api/v1/users/password-reset \
  -H "Authorization: Bearer <TOKEN>"
```
Expected: `{ "message": "Password reset email sent" }`
Expected in Mailtrap: email "Redefinição de senha solicitada"

- [ ] **Step 6: Test protected route without JWT — expect 401**

```bash
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{"description":"test","amount":10}'
```
Expected: `{ "statusCode": 401 }`

- [ ] **Step 7: Verify RabbitMQ UI**

Open http://localhost:15672 (guest/guest).
Check Queues tab — all 4 queues should be visible with 0 messages (all processed).

- [ ] **Step 8: Final commit**

```bash
git add .
git commit -m "feat: complete event-driven NestJS + RabbitMQ project"
```
