import { Inject, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, from, timeout } from 'rxjs';
import { PixServiceClient, ProcessPixRequest, ProcessPixResponse } from '../proto/pix';

@Injectable()
export class PixService implements OnModuleInit {
  private readonly logger = new Logger(PixService.name);
  private pixService: PixServiceClient;

  constructor(@Inject('PIX_PACKAGE_NAME') private client: ClientGrpc) {}

  onModuleInit() {
    this.logger.log('Inicializando serviço PIX...');
    try {
      this.pixService = this.client.getService<PixServiceClient>('PixService');
      this.logger.log('Serviço PIX inicializado com sucesso');
    } catch (error) {
      this.logger.error(`Erro ao inicializar serviço PIX: ${error.message}`);
      throw error;
    }
  }

  processPix(request: ProcessPixRequest): Observable<ProcessPixResponse> {
    this.logger.log(`Iniciando processamento PIX: ${JSON.stringify(request)}`);
    
    return from(new Promise<ProcessPixResponse>((resolve, reject) => {
      this.logger.log('Tentando conectar ao serviço PIX...');
      this.pixService.processPix(request, (error, response) => {
        if (error) {
          this.logger.error(`Erro no processamento PIX: ${error.message}`);
          this.logger.error(`Detalhes do erro: ${JSON.stringify(error)}`);
          reject(error);
        } else {
          this.logger.log(`PIX processado com sucesso: ${JSON.stringify(response)}`);
          resolve(response);
        }
      });
    })).pipe(
      timeout(10000) // 10 segundos de timeout
    );
  }
}