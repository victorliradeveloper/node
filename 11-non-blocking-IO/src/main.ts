import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser: false — req chega como Readable puro, sem buffer na memória
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  await app.listen(3000);
  console.log('http://localhost:3000');
}

bootstrap();
