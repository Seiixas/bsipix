import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'PIX_PACKAGE_NAME',
        transport: Transport.GRPC,
        options: {
          package: 'pix',
          protoPath: join(__dirname, '../../proto/pix.proto'),
          url: '0.0.0.0:50051',
        },
      },
    ]),
  ],
  controllers: [PixController],
  providers: [PixService],
})
export class PixModule {}