import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    '/todos',
    createProxyMiddleware({
      target: process.env.TODO_SERVICE_URL || 'http://localhost:3001',
      changeOrigin: true,
    }),
  );

  await app.listen(3000);
}
bootstrap();
