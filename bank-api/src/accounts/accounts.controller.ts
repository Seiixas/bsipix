import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account } from './account.entity';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  async createAccount(@Body() accountData: CreateAccountDto) {
    return this.accountsService.createAccount(accountData);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':accountNumber')
  async getAccount(@Param('accountNumber') accountNumber: string) {
    return this.accountsService.getAccount(accountNumber);
  }

  @Post('transfer')
  async transferMoney(@Body() data: {
    from_account: string;
    to_account: string;
    amount: number;
  }) {
    return this.accountsService.transferMoney(data);
  }
}