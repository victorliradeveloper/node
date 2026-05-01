# Plano: Event-Driven Development com NestJS + RabbitMQ

Equivalente ao projeto Java/Spring, usando NestJS, TypeORM, RabbitMQ e Mailtrap.

---

## Visão Geral

Dois microsserviços comunicando-se de forma assíncrona via RabbitMQ:

- **user-service** — REST API, autenticação JWT, publica eventos
- **email-service** — Consumidor de filas, envia e-mails via Mailtrap

---

## Arquitetura

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/orders           (JWT)
POST /api/v1/users/password-reset  (JWT)
        │
        ▼
  user-service (NestJS) ─── PostgreSQL
        │
        │ Topic Exchange "user.exchange"
        │
   ┌────┴────┬──────────┬────────────┐
   ▼         ▼          ▼            ▼
registered  login    order       password
  queue     queue    queue        queue
   └────────┴──────────┴────────────┘
                  │
                  ▼
        email-service (NestJS)
                  │
                  ▼
           Mailtrap SMTP
```

---

## Estrutura de Diretórios

```
10-event-driven-development-nest/
├── docker-compose.yml
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/
│       │   ├── auth.module.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── dto/
│       │   │   ├── register.dto.ts
│       │   │   ├── login.dto.ts
│       │   │   └── auth-response.dto.ts
│       │   └── guards/
│       │       └── jwt-auth.guard.ts
│       ├── orders/
│       │   ├── orders.module.ts
│       │   ├── orders.controller.ts
│       │   ├── orders.service.ts
│       │   ├── entities/
│       │   │   └── order.entity.ts
│       │   └── dto/
│       │       ├── create-order.dto.ts
│       │       └── order-response.dto.ts
│       ├── users/
│       │   ├── users.module.ts
│       │   ├── users.controller.ts
│       │   ├── users.service.ts
│       │   └── entities/
│       │       └── user.entity.ts
│       ├── messaging/
│       │   ├── messaging.module.ts
│       │   ├── event-publisher.service.ts
│       │   └── dto/
│       │       ├── user-event.dto.ts
│       │       └── order-event.dto.ts
│       ├── jwt/
│       │   ├── jwt.module.ts
│       │   ├── jwt.service.ts
│       │   └── jwt.strategy.ts
│       └── database/
│           └── migrations/
│               ├── 1700000001-CreateUsers.ts
│               └── 1700000002-CreateOrders.ts
└── email-service/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── messaging/
        │   ├── messaging.module.ts
        │   ├── email.consumer.ts
        │   └── dto/
        │       ├── user-event.dto.ts
        │       └── order-event.dto.ts
        └── email/
            ├── email.module.ts
            ├── email.service.ts
            └── templates/
                └── email-template.factory.ts
```

---

## Tech Stack

| Tecnologia | Versão | Uso |
|---|---|---|
| **NestJS** | 10.x | Framework principal |
| **TypeScript** | 5.x | Linguagem |
| **TypeORM** | 0.3.x | ORM (PostgreSQL) |
| **@nestjs/jwt** | — | JWT (HMAC-256) |
| **@nestjs/passport** | — | Estratégia de autenticação |
| **passport-jwt** | — | JWT Strategy |
| **@nestjs/microservices** | — | Integração RabbitMQ (AMQP) |
| **amqplib** | — | Client RabbitMQ |
| **bcrypt** | — | Hash de senha |
| **class-validator** | — | Validação de DTOs |
| **class-transformer** | — | Transformação de objetos |
| **nodemailer** | — | Envio de e-mails (Mailtrap) |
| **@nestjs/swagger** | — | Documentação OpenAPI |
| **PostgreSQL** | 15 | Banco de dados |
| **RabbitMQ** | 3-management | Message broker |

---

## Entidades

### User
```typescript
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ length: 100 }) name: string
  @Column({ unique: true }) email: string
  @Column() password: string          // BCrypt hash
  @CreateDateColumn() createdAt: Date
  @Index('idx_users_email') // email indexado
}
```

### Order
```typescript
@Entity('orders')
class Order {
  @PrimaryGeneratedColumn('uuid') id: string
  @ManyToOne(() => User) user: User
  @Column({ length: 500 }) description: string
  @Column('decimal', { precision: 10, scale: 2 }) amount: number
  @CreateDateColumn() createdAt: Date
  @Index('idx_orders_user_id') // user_id indexado
}
```

---

## Eventos RabbitMQ

### Configuração

| Propriedade | Valor |
|---|---|
| Exchange | `user.exchange` (topic) |
| Fila 1 | `email.registered.queue` — routing key `user.registered` |
| Fila 2 | `email.login.queue` — routing key `user.login` |
| Fila 3 | `email.order.queue` — routing key `order.created` |
| Fila 4 | `email.password.queue` — routing key `user.password` |

Todas as filas: durable, ack manual.

### Payloads

**UserEventDTO**
```typescript
{
  eventType: 'USER_REGISTERED' | 'USER_LOGIN' | 'USER_PASSWORD_RESET'
  timestamp: string   // ISO 8601
  payload: {
    userId: string
    name: string
    email: string
  }
}
```

**OrderEventDTO**
```typescript
{
  eventType: 'ORDER_CREATED'
  timestamp: string
  payload: {
    orderId: string
    userId: string
    name: string
    email: string
    description: string
    amount: number
  }
}
```

---

## Endpoints da API

### user-service (porta 3000)

#### Auth — `/api/v1/auth`

| Método | Rota | Auth | Descrição | Status |
|---|---|---|---|---|
| POST | `/register` | — | Registra usuário, emite JWT, publica `user.registered` | 201 |
| POST | `/login` | — | Autentica usuário, emite JWT, publica `user.login` | 200 |

**POST /register**
```json
// Request
{ "name": "Victor", "email": "victor@email.com", "password": "123456" }

// Response 201
{ "name": "Victor", "token": "eyJ..." }
```

**POST /login**
```json
// Request
{ "email": "victor@email.com", "password": "123456" }

// Response 200
{ "name": "Victor", "token": "eyJ..." }
```

#### Orders — `/api/v1/orders`

| Método | Rota | Auth | Descrição | Status |
|---|---|---|---|---|
| POST | `/` | JWT Bearer | Cria pedido, publica `order.created` | 201 |

```json
// Request
{ "description": "Notebook Dell XPS", "amount": 8500.00 }

// Response 201
{ "id": "uuid", "description": "Notebook Dell XPS", "amount": 8500.00, "createdAt": "..." }
```

#### Users — `/api/v1/users`

| Método | Rota | Auth | Descrição | Status |
|---|---|---|---|---|
| POST | `/password-reset` | JWT Bearer | Solicita reset de senha, publica `user.password` | 202 |

---

## Autenticação JWT

```
Algoritmo: HS256
Issuer: "user-service"
Subject: user.email
Claims: { userId, name }
Expiração: 2 horas
Secret: JWT_SECRET (env var)
```

- Rotas públicas: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api-docs`
- Demais rotas protegidas via `JwtAuthGuard`
- Estratégia implementada com `passport-jwt`

---

## Email Templates

| Evento | Assunto |
|---|---|
| USER_REGISTERED | `Bem-vindo ao sistema, {name}!` |
| USER_LOGIN | `Novo acesso detectado na sua conta` |
| ORDER_CREATED | `Pedido confirmado! #{orderId_8chars}` |
| USER_PASSWORD_RESET | `Redefinição de senha solicitada` |

Envio via Mailtrap SMTP:
- Host: `sandbox.smtp.mailtrap.io`
- Port: `2525`
- From: `noreply@userservice.com`

---

## Passos de Implementação

### Etapa 1 — Infraestrutura

- [ ] Criar `docker-compose.yml` com PostgreSQL, RabbitMQ, user-service e email-service
  - Health checks para PostgreSQL (`pg_isready`) e RabbitMQ (`rabbitmq-diagnostics ping`)
  - `depends_on` com `condition: service_healthy`
- [ ] Criar `Dockerfile` para cada serviço (multi-stage build)
- [ ] Configurar variáveis de ambiente via `.env`

### Etapa 2 — user-service

- [ ] Inicializar projeto NestJS: `nest new user-service`
- [ ] Instalar dependências: TypeORM, pg, @nestjs/jwt, passport-jwt, bcrypt, amqplib, @nestjs/microservices, class-validator, @nestjs/swagger
- [ ] Configurar TypeORM com PostgreSQL e migrations
- [ ] Criar entidades `User` e `Order`
- [ ] Criar migrations via TypeORM CLI
- [ ] Implementar `JwtModule` e `JwtStrategy` (HS256, 2h)
- [ ] Implementar `JwtAuthGuard`
- [ ] Implementar `AuthModule`:
  - `POST /register` → hash senha, salvar user, emitir token, publicar evento
  - `POST /login` → verificar senha, emitir token, publicar evento
- [ ] Implementar `OrdersModule`:
  - `POST /orders` (protegido) → salvar pedido, publicar evento
- [ ] Implementar `UsersModule`:
  - `POST /password-reset` (protegido) → publicar evento
- [ ] Implementar `MessagingModule` (RabbitMQ publisher):
  - Configurar Topic Exchange `user.exchange`
  - Declarar 4 filas durable
  - `EventPublisherService` com métodos para cada tipo de evento
- [ ] Configurar Swagger (`@nestjs/swagger`)
- [ ] Implementar `GlobalExceptionFilter` para respostas de erro padronizadas

### Etapa 3 — email-service

- [ ] Inicializar projeto NestJS: `nest new email-service`
- [ ] Instalar dependências: amqplib, @nestjs/microservices, nodemailer
- [ ] Configurar `main.ts` com microservice AMQP híbrido (HTTP + AMQP)
- [ ] Implementar `EmailConsumer` com listeners para 4 filas:
  - `@MessagePattern('email.registered.queue')` → `sendUserRegistered()`
  - `@MessagePattern('email.login.queue')` → `sendUserLogin()`
  - `@MessagePattern('email.order.queue')` → `sendOrderCreated()`
  - `@MessagePattern('email.password.queue')` → `sendPasswordReset()`
- [ ] Implementar `EmailTemplateFactory` com os 4 templates
- [ ] Implementar `EmailService` com `nodemailer` (Mailtrap SMTP)

### Etapa 4 — Testes e Validação

- [ ] Subir serviços com `docker-compose up`
- [ ] Acessar Swagger em `http://localhost:3000/api-docs`
- [ ] `POST /api/v1/auth/register` → verificar e-mail de boas-vindas no Mailtrap
- [ ] `POST /api/v1/auth/login` → verificar e-mail de novo acesso no Mailtrap
- [ ] Autorizar com JWT no Swagger
- [ ] `POST /api/v1/orders` → verificar e-mail de confirmação no Mailtrap
- [ ] `POST /api/v1/users/password-reset` → verificar e-mail de reset no Mailtrap
- [ ] Acessar RabbitMQ Management UI em `http://localhost:15672` (guest/guest)
  - Verificar 4 filas criadas e mensagens roteadas corretamente
- [ ] Testar endpoint protegido sem JWT → deve retornar 401

---

## Variáveis de Ambiente

### user-service
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=userdb
DB_USER=postgres
DB_PASSWORD=postgres
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
JWT_SECRET=supersecret
PORT=3000
```

### email-service
```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=seu_usuario
MAILTRAP_PASS=sua_senha
PORT=3001
```

---

## Diferenças em Relação ao Projeto Java

| Aspecto | Java/Spring | NestJS |
|---|---|---|
| Framework | Spring Boot | NestJS |
| ORM | Spring Data JPA / Hibernate | TypeORM |
| Migrations | Flyway | TypeORM CLI |
| JWT | Auth0 java-jwt | @nestjs/jwt + passport-jwt |
| Segurança | Spring Security | Guards + Passport |
| AMQP | Spring AMQP | @nestjs/microservices + amqplib |
| Validação | Bean Validation (@Valid) | class-validator (@IsEmail, etc.) |
| Docs | Springdoc OpenAPI | @nestjs/swagger |
| Email | JavaMailSender | nodemailer |
| Build | Maven | npm / pnpm |
| Porta | 8080 / 8081 | 3000 / 3001 |
