import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PixService } from './pix.service';
import { ProcessPixDto } from './dto/process-pix.dto';

@Controller('pix')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Post('process')
  async processPix(@Body() data: ProcessPixDto) {
    return this.pixService.processPix(data);
  }

  @Get('status/:transactionId')
  async getTransactionStatus(@Param('transactionId') transactionId: string) {
    return this.pixService.getTransactionStatus(transactionId);
  }
}