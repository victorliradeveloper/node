import cluster from 'cluster';
import { startMaster } from './cluster';

// Ponto de bifurcação: master faz fork dos workers, workers sobem o NestJS
if (cluster.isPrimary) {
  startMaster();
} else {
  async function bootstrap() {
    const { NestFactory } = await import('@nestjs/core');
    const { AppModule } = await import('./app.module');

    // bodyParser: false — req chega como Readable puro, sem buffer na memória
    const app = await NestFactory.create(AppModule, { bodyParser: false });
    await app.listen(3000);
    console.log(`Worker ${process.pid} → http://localhost:3000`);
  }

  bootstrap();
}
