import { Controller, Post, Body } from '@nestjs/common';
import { PixService } from './pix.service';
import { ProcessPixRequest } from '../proto/pix';

@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post()
  async processPix(@Body() request: ProcessPixRequest) {
    return this.pixService.processPix(request);
  }
}