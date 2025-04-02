import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ProcessPixDto {
  @IsString()
  @IsNotEmpty()
  from_account: string;

  @IsString()
  @IsNotEmpty()
  to_account: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  @IsNotEmpty()
  description: string;
} 