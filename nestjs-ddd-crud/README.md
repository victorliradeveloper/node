# CRUD API com NestJS e TypeORM

Uma API REST moderna para operações CRUD de usuários usando NestJS, TypeORM e TypeScript.

## 🚀 Como executar

### Instalar dependências
```bash
npm install
```

### Executar em desenvolvimento
```bash
npm run start:dev
```

### Executar em produção
```bash
npm run build
npm run start:prod
```

## 📋 Endpoints da API

### Usuários

#### Criar usuário
- **POST** `/api/users`
- **Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "age": 25
}
```

#### Listar todos os usuários
- **GET** `/api/users`

#### Buscar usuário por ID
- **GET** `/api/users/:id`

#### Atualizar usuário
- **PATCH** `/api/users/:id`
- **Body:**
```json
{
  "name": "João Silva Atualizado",
  "email": "joao.novo@email.com",
  "age": 26
}
```

#### Deletar usuário
- **DELETE** `/api/users/:id`

### Outros endpoints

#### Health Check
- **GET** `/api/health`

#### Informações da API
- **GET** `/api`

## 🛠️ Tecnologias utilizadas

- **NestJS** - Framework Node.js estruturado
- **TypeORM** - ORM para TypeScript
- **TypeScript** - Linguagem tipada
- **SQLite** - Banco de dados em memória (para desenvolvimento)
- **Class Validator** - Validação de dados
- **Class Transformer** - Transformação de objetos

## 📁 Estrutura do projeto

```
src/
├── entities/
│   └── user.entity.ts      # Entidade TypeORM
├── dto/
│   ├── create-user.dto.ts  # DTO para criação
│   └── update-user.dto.ts  # DTO para atualização
├── users/
│   ├── users.controller.ts # Controller REST
│   ├── users.service.ts    # Lógica de negócio
│   └── users.module.ts     # Módulo de usuários
├── app.controller.ts       # Controller principal
├── app.module.ts          # Módulo principal
└── main.ts                # Arquivo de inicialização
```

## 🔧 Scripts disponíveis

- `npm run start:dev` - Executa com hot reload (desenvolvimento)
- `npm run start` - Executa em modo normal
- `npm run start:prod` - Executa em produção
- `npm run build` - Compila TypeScript
- `npm run test` - Executa testes
- `npm run lint` - Executa linter

## 🎯 Características do NestJS

### **Decorators e Metadados**
- `@Controller()` - Define controllers
- `@Injectable()` - Define serviços
- `@Module()` - Define módulos
- `@Entity()` - Define entidades TypeORM

### **Validação Automática**
- Validação de DTOs com class-validator
- Transformação automática de tipos
- Tratamento de erros global

### **Injeção de Dependência**
- Sistema de DI nativo do NestJS
- Repositórios TypeORM injetados automaticamente

## 📝 Exemplos de uso

### Criar um usuário
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "email": "maria@email.com",
    "age": 30
  }'
```

### Listar usuários
```bash
curl http://localhost:3001/api/users
```

### Atualizar usuário
```bash
curl -X PATCH http://localhost:3001/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos Silva",
    "age": 31
  }'
```

### Deletar usuário
```bash
curl -X DELETE http://localhost:3001/api/users/1
```

## 🔍 Validações Implementadas

- **Nome**: String obrigatório
- **Email**: Formato de email válido e único
- **Idade**: Número entre 0 e 150
- **Tratamento de erros**: 400, 404, 409 para conflitos

## 🚀 Vantagens do NestJS

1. **Arquitetura Modular** - Organização clara e escalável
2. **Decorators** - Sintaxe limpa e expressiva
3. **Injeção de Dependência** - Desacoplamento natural
4. **Validação Integrada** - Menos código boilerplate
5. **TypeScript First** - Tipagem forte nativa
6. **Documentação Automática** - Swagger integrado (opcional)
