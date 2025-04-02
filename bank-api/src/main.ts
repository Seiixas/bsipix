import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  
  // Habilitar CORS
  app.enableCors({
    origin: '*', // URL do frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Habilitar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Adicionar o microserviço gRPC
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'pix',
      protoPath: join(__dirname, '../proto/pix.proto'),
      url: '0.0.0.0:50052',
    },
  });

  // Adicionar endpoint de health check
  server.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Iniciar todos os microserviços
  await app.startAllMicroservices();
  
  // Iniciar o servidor HTTP
  await app.listen(3000);
}
bootstrap();