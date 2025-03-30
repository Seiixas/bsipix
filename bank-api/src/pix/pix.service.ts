import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, from } from 'rxjs';
import { PixServiceClient, ProcessPixRequest, ProcessPixResponse } from '../proto/pix';

@Injectable()
export class PixService implements OnModuleInit {
  private pixService: PixServiceClient;

  constructor(@Inject('PIX_PACKAGE_NAME') private client: ClientGrpc) {}

  onModuleInit() {
    this.pixService = this.client.getService<PixServiceClient>('PixService');
  }

  processPix(request: ProcessPixRequest): Observable<ProcessPixResponse> {
    return from(new Promise<ProcessPixResponse>((resolve, reject) => {
      this.pixService.processPix(request, (error, response) => {
        if (error) reject(error);
        else resolve(response);
      });
    }));
  }
}