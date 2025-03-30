import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async createAccount(accountData: Partial<Account>): Promise<Account> {
    const account = this.accountsRepository.create(accountData);
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
}