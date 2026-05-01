import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.todo.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.create({
    data: {
      name: 'Alice',
      email: 'alice@example.com',
      password,
      todos: {
        create: [
          { title: 'Buy groceries', description: 'Milk, eggs, bread' },
          { title: 'Read a book', completed: true },
          { title: 'Go for a run' },
        ],
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob',
      email: 'bob@example.com',
      password,
      todos: {
        create: [
          { title: 'Fix the bug', description: 'Null pointer in auth service' },
          { title: 'Write tests', completed: false },
        ],
      },
    },
  });

  console.log(`Seeded users: ${alice.email}, ${bob.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
