import { Module } from '@nestjs/common';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PIX_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'pix',
            protoPath: 'proto/pix.proto',
            url: configService.get('PIX_SERVICE_URL'),
            loader: {
              keepCase: true,
              longs: String,
              enums: String,
              defaults: true,
              oneofs: true,
              arrays: true,
              objects: true,
            },
            maxReceiveLength: 100 * 1024 * 1024, // 100MB
            maxSendLength: 100 * 1024 * 1024, // 100MB
            keepalive: {
              keepaliveTimeMs: 10000,
              keepaliveTimeoutMs: 5000,
              keepalivePermitWithoutCalls: 1,
              http2MinTimeBetweenPingsMs: 10000,
              http2MaxPingsWithoutData: 0,
            },
            deadline: 30000, // 30 segundos
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PixController],
  providers: [PixService],
  exports: [PixService],
})
export class PixModule {}