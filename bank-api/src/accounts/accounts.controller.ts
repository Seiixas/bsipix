import { Controller, Get, Post, Body } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { Account } from './account.entity';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() accountData: Partial<Account>) {
    return this.accountsService.createAccount(accountData);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }
}