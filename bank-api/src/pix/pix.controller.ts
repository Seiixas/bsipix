import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PixService } from './pix.service';

@Controller()
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @GrpcMethod('PixService', 'ProcessPix')
  async processPix(data: any): Promise<any> {
    return this.pixService.processPix(data);
  }
}