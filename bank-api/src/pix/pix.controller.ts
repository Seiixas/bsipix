import { Body, Controller, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PixService } from './pix.service';
import { ProcessPixRequest, ProcessPixResponse } from '../proto/pix';

@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post()
  async processPixHttp(@Body() data: ProcessPixRequest): Promise<ProcessPixResponse> {
    return this.pixService.processPix(data).toPromise();
  }

  @GrpcMethod('PixService', 'ProcessPix')
  async processPix(data: ProcessPixRequest): Promise<ProcessPixResponse> {
    return this.pixService.processPix(data).toPromise();
  }
}