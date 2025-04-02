import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  // Criar a aplicação HTTP
  const app = await NestFactory.create(AppModule);
  
  // Habilitar CORS
  app.enableCors({
    origin: 'http://localhost:3001', // URL do frontend
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

  // Iniciar todos os microserviços
  await app.startAllMicroservices();
  
  // Iniciar o servidor HTTP
  await app.listen(3000);
}
bootstrap();