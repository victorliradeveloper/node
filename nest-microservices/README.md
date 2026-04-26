# NestJS Microservices

Event-driven microservices architecture with NestJS, PostgreSQL, and RabbitMQ.

## Architecture

```
Client → API Gateway (3000) → todo-service (3001)
                                      ↓
                                 PostgreSQL
                                      ↓
                              RabbitMQ (todo.exchange)
                                      ↓
                          notification-service (3002)
```

## Services

| Service | Port | Responsibility |
|---|---|---|
| api-gateway | 3000 | Reverse proxy to todo-service |
| todo-service | 3001 | CRUD todos + publishes RabbitMQ events |
| notification-service | 3002 | Consumes RabbitMQ events and logs them |
| PostgreSQL | 5432 | Persistence for todos |
| RabbitMQ | 5672 / 15672 | Message broker |

## Running

```bash
docker compose up --build
```

To stop:

```bash
docker compose down
```

To stop and remove volumes (clears the database):

```bash
docker compose down -v
```

## Endpoints

All requests go through the API Gateway on port **3000**, or directly to todo-service on port **3001**.

### Create a todo
```bash
POST /todos

curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Estudar NestJS", "description": "Microserviços com Node"}'
```

### List all todos
```bash
GET /todos

curl http://localhost:3000/todos
```

### Get todo by ID
```bash
GET /todos/:id

curl http://localhost:3000/todos/<uuid>
```

### Update a todo
```bash
PUT /todos/:id

curl -X PUT http://localhost:3000/todos/<uuid> \
  -H "Content-Type: application/json" \
  -d '{"title": "Atualizado", "completed": true}'
```

### Delete a todo
```bash
DELETE /todos/:id

curl -X DELETE http://localhost:3000/todos/<uuid>
```

## RabbitMQ

### Management UI

Access at: **http://localhost:15672**

| Field | Value |
|---|---|
| Username | guest |
| Password | guest |

### Exchange and Queues

| Exchange | Type |
|---|---|
| `todo.exchange` | topic |

| Queue | Routing Key | Triggered by |
|---|---|---|
| `todo.created.queue` | `todo.created` | POST /todos |
| `todo.updated.queue` | `todo.updated` | PUT /todos/:id |
| `todo.deleted.queue` | `todo.deleted` | DELETE /todos/:id |

### Event payload

```json
{
  "todoId": "uuid",
  "title": "Estudar NestJS",
  "action": "CREATED",
  "occurredAt": "2026-04-26T13:00:00.000Z"
}
```

Notifications are logged by `notification-service`. To watch them in real time:

```bash
docker logs -f nest-microservices-notification-service
```

## Containers

| Container | Description |
|---|---|
| `nest-microservices-api-gateway` | API Gateway |
| `nest-microservices-todo-service` | Todo Service |
| `nest-microservices-notification-service` | Notification Service |
| `nest-microservices-postgres` | PostgreSQL database |
| `nest-microservices-rabbitmq` | RabbitMQ broker |
