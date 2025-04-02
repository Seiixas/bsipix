import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  private generateAccountNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  }

  private validateCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  async createAccount(accountData: Partial<Account>): Promise<Account> {
    if (!accountData.cpf) {
      throw new BadRequestException('CPF é obrigatório');
    }

    if (!this.validateCPF(accountData.cpf)) {
      throw new BadRequestException('CPF inválido');
    }

    // Verifica se já existe uma conta com este CPF
    const existingAccount = await this.accountsRepository.findOne({
      where: { cpf: accountData.cpf },
    });

    if (existingAccount) {
      throw new BadRequestException('Já existe uma conta com este CPF');
    }

    const accountNumber = this.generateAccountNumber();
    const account = this.accountsRepository.create({
      ...accountData,
      accountNumber,
    });
    return this.accountsRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find();
  }

  async findOne(accountNumber: string): Promise<Account | null> {
    return this.accountsRepository.findOne({ where: { accountNumber } });
  }

  async updateBalance(accountNumber: string, newBalance: number): Promise<void> {
    await this.accountsRepository.update({ accountNumber }, { balance: newBalance });
  }

  async getAccount(accountNumber: string): Promise<Account> {
    return this.accountsRepository.findOne({ where: { accountNumber } });
  }

  async transferMoney(data: {
    from_account: string;
    to_account: string;
    amount: number;
  }): Promise<{ success: boolean; message: string }> {
    const fromAccount = await this.getAccount(data.from_account);
    const toAccount = await this.getAccount(data.to_account);

    if (!fromAccount || !toAccount) {
      throw new Error('Conta não encontrada');
    }

    if (fromAccount.balance < data.amount) {
      throw new Error('Saldo insuficiente');
    }

    // Iniciar transação
    await this.accountsRepository.manager.transaction(async (transactionalEntityManager) => {
      // Deduzir da conta de origem
      fromAccount.balance -= data.amount;
      await transactionalEntityManager.save(fromAccount);

      // Adicionar na conta de destino
      toAccount.balance += data.amount;
      await transactionalEntityManager.save(toAccount);
    });

    return {
      success: true,
      message: 'Transferência realizada com sucesso',
    };
  }
}