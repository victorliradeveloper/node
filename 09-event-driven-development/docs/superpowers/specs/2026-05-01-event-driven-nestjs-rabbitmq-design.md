# Design: Event-Driven Development com NestJS + RabbitMQ

**Data:** 2026-05-01  
**Objetivo:** Aprender event-driven architecture usando NestJS, RabbitMQ, TypeORM e Mailtrap — equivalente ao projeto Java/Spring.

---

## Arquitetura

Dois NestJS apps independentes dentro de `09-event-driven-development/`:

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
09-event-driven-development/
├── docker-compose.yml
├── user-service/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── auth/
│       ├── orders/
│       ├── users/
│       ├── messaging/
│       ├── jwt/
│       └── database/migrations/
└── email-service/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── main.ts
        ├── app.module.ts
        ├── messaging/
        └── email/
```

---

## Mensageria RabbitMQ

| Fila | Routing Key | Evento |
|---|---|---|
| `email.registered.queue` | `user.registered` | Usuário criado |
| `email.login.queue` | `user.login` | Login realizado |
| `email.order.queue` | `order.created` | Pedido criado |
| `email.password.queue` | `user.password` | Reset de senha solicitado |

- Exchange: `user.exchange` (topic)
- Todas as filas: durable, ack manual
- Publisher: `@nestjs/microservices` ClientProxy (AMQP)
- Consumer: `@MessagePattern` com microservice híbrido (HTTP + AMQP)

---

## Autenticação JWT

- Algoritmo: HS256
- Expiração: 2 horas
- Subject: `user.email`, Claims: `{ userId, name }`
- Estratégia: `passport-jwt`
- Rotas públicas: `/api/v1/auth/register`, `/api/v1/auth/login`, `/api-docs`

---

## Endpoints

### user-service (porta 3000)

| Método | Rota | Auth | Status |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | 201 |
| POST | `/api/v1/auth/login` | — | 200 |
| POST | `/api/v1/orders` | JWT | 201 |
| POST | `/api/v1/users/password-reset` | JWT | 202 |

---

## Entidades

**User:** `id (uuid)`, `name`, `email (unique, indexed)`, `password (bcrypt)`, `createdAt`  
**Order:** `id (uuid)`, `user (ManyToOne)`, `description`, `amount (decimal 10,2)`, `createdAt`, `user_id (indexed)`

---

## Variáveis de Ambiente

### user-service
```
DB_HOST=postgres | DB_PORT=5432 | DB_NAME=userdb
DB_USER=postgres | DB_PASSWORD=postgres
RABBITMQ_HOST=rabbitmq | RABBITMQ_PORT=5672
RABBITMQ_USER=guest | RABBITMQ_PASSWORD=guest
JWT_SECRET=minha-chave-secreta-super-segura-para-desenvolvimento
PORT=3000
```

### email-service
```
RABBITMQ_HOST=rabbitmq | RABBITMQ_PORT=5672
RABBITMQ_USER=guest | RABBITMQ_PASSWORD=guest
MAILTRAP_HOST=sandbox.smtp.mailtrap.io | MAILTRAP_PORT=2525
MAILTRAP_USER=94a4464c859e50 | MAILTRAP_PASS=43b0495b90aa4c
PORT=3001
```

---

## Tech Stack

| Tecnologia | Uso |
|---|---|
| NestJS 10.x | Framework |
| TypeORM 0.3.x | ORM (PostgreSQL 15) |
| @nestjs/jwt + passport-jwt | Autenticação JWT |
| @nestjs/microservices + amqplib | RabbitMQ AMQP |
| bcrypt | Hash de senha |
| class-validator | Validação de DTOs |
| nodemailer | Envio de e-mail (Mailtrap) |
| @nestjs/swagger | Documentação OpenAPI |

---

## Infraestrutura Docker

`docker-compose.yml` com:
- PostgreSQL 15 + health check (`pg_isready`)
- RabbitMQ 3-management + health check (`rabbitmq-diagnostics ping`)
- user-service com `depends_on: [postgres, rabbitmq]` (condition: service_healthy)
- email-service com `depends_on: [rabbitmq]` (condition: service_healthy)
- Dockerfiles multi-stage para cada serviço
