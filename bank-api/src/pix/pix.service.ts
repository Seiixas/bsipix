import { Injectable, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface IPixService {
  ProcessPix(data: {
    fromAccount: string;
    toAccount: string;
    amount: number;
    description: string;
  }): Observable<{
    transaction_id: string;
    status: string;
    error: string;
  }>;
  GetTransactionStatus(data: { transaction_id: string }): Observable<{
    transaction_id: string;
    from_account: string;
    to_account: string;
    amount: number;
    description: string;
    status: string;
    error: string;
    created_at: string;
  }>;
}

@Injectable()
export class PixService {
  private pixService: IPixService;

  constructor(@Inject('PIX_SERVICE') private client: ClientGrpc) {
    this.pixService = this.client.getService<IPixService>('PixService');
  }

  async processPix(data: {
    from_account: string;
    to_account: string;
    amount: number;
    description: string;
  }) {
    try {
      console.log('Enviando requisição PIX para o serviço gRPC:', data);
      const result = await firstValueFrom(this.pixService.ProcessPix({
        fromAccount: data.from_account,
        toAccount: data.to_account,
        amount: data.amount,
        description: data.description,
      }));
      console.log('Resposta do serviço gRPC:', result);
      
      if (!result.transaction_id) {
        throw new Error('ID da transação não recebido do serviço PIX');
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao processar PIX:', error);
      throw error;
    }
  }

  async getTransactionStatus(transaction_id: string) {
    try {
      return await firstValueFrom(this.pixService.GetTransactionStatus({ transaction_id }));
    } catch (error) {
      console.error('Erro ao consultar status da transação:', error);
      throw error;
    }
  }
}