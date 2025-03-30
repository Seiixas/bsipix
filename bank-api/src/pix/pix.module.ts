import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { PixController } from './pix.controller';
import { PixService } from './pix.service';
import { pixGrpcOptions } from '../config/grpc.config';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    ClientsModule.register([{
      name: 'PIX_SERVICE',
      ...pixGrpcOptions,
    }]),
    AccountsModule,
  ],
  controllers: [PixController],
  providers: [PixService],
})
export class PixModule {}