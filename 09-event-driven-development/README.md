# Event-Driven Development — NestJS + RabbitMQ

Dois microsserviços comunicando-se de forma assíncrona via RabbitMQ.

## Arquitetura

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/orders           (JWT)
POST /api/v1/users/password-reset  (JWT)
        │
        ▼
  user-service (NestJS) ── PostgreSQL
        │
        │  Topic Exchange "user.exchange"
        │
   ┌────┴────┬──────────┬────────────┐
   ▼         ▼          ▼            ▼
registered  login    order       password
  queue     queue    queue        queue
        │
        ▼
  email-service (NestJS)
        │
        ▼
   Mailtrap SMTP
```

## Pré-requisitos

- [Docker](https://www.docker.com/) e Docker Compose

## Como rodar

```bash
docker compose up --build
```

Os serviços sobem na seguinte ordem (com health checks):
1. PostgreSQL
2. RabbitMQ
3. user-service + email-service

---

## Serviços e portas

| Serviço | URL |
|---|---|
| user-service API | http://localhost:3000 |
| Swagger (user-service) | http://localhost:3000/api-docs |
| RabbitMQ Management UI | http://localhost:15672 |
| PostgreSQL | localhost:5432 |

**RabbitMQ login:** `guest` / `guest`

---

## Rotas da API

### Auth — `POST /api/v1/auth`

#### Registrar usuário
```
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "name": "Victor",
  "email": "victor@email.com",
  "password": "123456"
}
```
Resposta `201`:
```json
{ "name": "Victor", "token": "eyJ..." }
```
Publica evento `user.registered` → envia e-mail de boas-vindas.

---

#### Login
```
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "victor@email.com",
  "password": "123456"
}
```
Resposta `200`:
```json
{ "name": "Victor", "token": "eyJ..." }
```
Publica evento `user.login` → envia e-mail de novo acesso.

---

### Orders — `POST /api/v1/orders` (requer JWT)

```
POST http://localhost:3000/api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Notebook Dell XPS",
  "amount": 8500.00
}
```
Resposta `201`:
```json
{
  "id": "uuid",
  "description": "Notebook Dell XPS",
  "amount": 8500,
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```
Publica evento `order.created` → envia e-mail de confirmação de pedido.

---

### Users — `POST /api/v1/users` (requer JWT)

#### Solicitar reset de senha
```
POST http://localhost:3000/api/v1/users/password-reset
Authorization: Bearer <token>
```
Resposta `202`:
```json
{ "message": "Password reset email will be sent" }
```
Publica evento `user.password` → envia e-mail de redefinição de senha.

---

## Filas RabbitMQ

| Fila | Routing Key | Evento |
|---|---|---|
| `email.registered.queue` | `user.registered` | Usuário registrado |
| `email.login.queue` | `user.login` | Usuário fez login |
| `email.order.queue` | `order.created` | Pedido criado |
| `email.password.queue` | `user.password` | Reset de senha |

Exchange: `user.exchange` (topic) — acesse em http://localhost:15672 para visualizar.

---

## Variáveis de ambiente

### user-service `.env`
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

### email-service `.env`
```env
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
MAILTRAP_HOST=sandbox.smtp.mailtrap.io
MAILTRAP_PORT=2525
MAILTRAP_USER=<seu_usuario>
MAILTRAP_PASS=<sua_senha>
PORT=3001
```
