import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, ClientGrpc } from '@nestjs/microservices';
import { AccountsService } from '../accounts/accounts.service';
import { pixGrpcOptions } from '../config/grpc.config';
import { 
  PIX_SERVICE_NAME, 
  PixServiceClient,
  ProcessPixRequest, 
  ProcessPixResponse 
} from '../proto/pix';

@Injectable()
export class PixService implements OnModuleInit {
  @Client(pixGrpcOptions)
  private readonly client: ClientGrpc;
  private pixService: PixServiceClient;

  constructor(private readonly accountsService: AccountsService) {}

  onModuleInit() {
    this.pixService = this.client.getService<PixServiceClient>(PIX_SERVICE_NAME);
  }

  async processPix(request: ProcessPixRequest): Promise<ProcessPixResponse> {
    // Validate accounts
    const fromAccount = await this.accountsService.findOne(request.fromAccount);
    const toAccount = await this.accountsService.findOne(request.toAccount);

    if (!fromAccount || !toAccount) {
      throw new Error('Conta inválida');
    }

    if (fromAccount.balance < request.amount) {
      throw new Error('Saldo insuficiente');
    }

    // Chamada correta para o serviço gRPC
    return new Promise((resolve, reject) => {
      this.pixService.processPix(
        request,
        (error: any, response: ProcessPixResponse) => {
          if (error) {
            reject(error);
          } else {
            // Atualiza saldos se bem-sucedido
            this.accountsService.updateBalance(
              request.fromAccount,
              fromAccount.balance - request.amount
            );
            this.accountsService.updateBalance(
              request.toAccount,
              toAccount.balance + request.amount
            );
            resolve(response);
          }
        }
      );
    });
  }
}