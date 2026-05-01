# API Good Practices — NestJS + Prisma

Reescrita do projeto [09-api-good-practices (Java/Spring Boot)](https://github.com/victorliradeveloper/java/tree/main/09-api-good-practices) usando o ecossistema Node.js com NestJS e Prisma.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | NestJS |
| ORM | Prisma |
| Banco de dados | PostgreSQL 16 |
| Autenticação | JWT (`@nestjs/jwt` + `passport-jwt`) |
| Validação | `class-validator` + `class-transformer` |
| Hash de senha | `bcrypt` |
| Containers | Docker + Docker Compose |
| Testes | Jest (unit) + Supertest (e2e) |

---

## Domínio

### Entidades

#### User
```
id          UUID (PK)
name        String
email       String (unique)
password    String (hash)
createdAt   DateTime
updatedAt   DateTime
```

#### Todo
```
id          UUID (PK)
title       String
description String?
completed   Boolean (default: false)
userId      UUID (FK → User)
createdAt   DateTime
updatedAt   DateTime
```

---

## Endpoints

### Auth — `/api/v1/auth`
| Método | Rota | Descrição |
|---|---|---|
| POST | `/register` | Cadastro de usuário |
| POST | `/login` | Login → retorna JWT |

### Todos — `/api/v1/todos` _(requer JWT)_
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Listar todos (filtros + paginação + ordenação) |
| GET | `/:id` | Buscar por ID |
| POST | `/` | Criar |
| PATCH | `/:id` | Atualizar |
| DELETE | `/:id` | Deletar |
| PATCH | `/:id/complete` | Marcar como concluído |

#### Query params de listagem
- `title` — filtrar por título (contains, case-insensitive)
- `completed` — filtrar por status (`true` / `false`)
- `startDate` / `endDate` — filtrar por intervalo de `createdAt`
- `page` + `limit` — paginação offset (padrão: page=1, limit=20, máx: 100)
- `cursor` — paginação cursor-based (alternativa)
- `sortBy` + `order` — ordenação (`asc` / `desc`)

---

## Boas práticas demonstradas

1. **Versionamento de API** — prefixo `/api/v1`
2. **DTOs com validação** — `class-validator` em todos os inputs
3. **Paginação dupla** — offset-based e cursor-based
4. **Filtragem e ordenação** — query params tipados
5. **Autenticação JWT** — guard global com rotas públicas decoradas
6. **Tratamento de erros padronizado** — `HttpException` + filtro global
7. **Separação de responsabilidades** — Controller → Service → Repository (Prisma)
8. **Variáveis de ambiente** — `.env` + `@nestjs/config`
9. **Containerização** — `Dockerfile` multi-stage + `docker-compose.yml`
10. **Seed de banco** — script `seed.ts` com dados iniciais

---

## Estrutura de pastas

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── todos/
│   ├── todos.controller.ts
│   ├── todos.service.ts
│   ├── todos.module.ts
│   └── dto/
│       ├── create-todo.dto.ts
│       ├── update-todo.dto.ts
│       └── query-todo.dto.ts
├── users/
│   ├── users.service.ts
│   └── users.module.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── interceptors/
│       └── transform.interceptor.ts
└── main.ts
prisma/
├── schema.prisma
└── seed.ts
```

---

## Respostas de erro padronizadas

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": ["title should not be empty"],
  "timestamp": "2026-04-30T12:00:00.000Z",
  "path": "/api/v1/todos"
}
```

---

## Códigos HTTP usados

| Código | Situação |
|---|---|
| 200 | OK |
| 201 | Criado |
| 400 | Validação falhou |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (e-mail já cadastrado) |
| 500 | Erro interno |

---

## Como executar

```bash
# Subir banco de dados
docker compose up -d db

# Instalar dependências
npm install

# Rodar migrations
npx prisma migrate dev

# Popular banco
npx prisma db seed

# Iniciar em desenvolvimento
npm run start:dev
```

Ou tudo junto via Docker:
```bash
docker compose up --build
```

---

## Próximos passos

- [x] Scaffolding com `nest new`
- [x] Configurar Prisma + schema
- [x] Módulo Auth (register + login + JWT)
- [x] Módulo Todos (CRUD + filtros + paginação)
- [x] Filtro global de exceções
- [x] Interceptor de resposta
- [x] Docker + docker-compose
- [x] Seed
- [ ] Testes e2e básicos
