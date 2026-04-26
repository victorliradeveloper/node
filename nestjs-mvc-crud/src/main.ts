import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Configurar CORS
  app.enableCors();

  // Configurar prefixo global
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Servidor NestJS rodando na porta ${port}`);
  console.log(`📖 Documentação da API: http://localhost:${port}/api`);
  console.log(`👥 Endpoints de usuários: http://localhost:${port}/api/users`);
}

bootstrap();
