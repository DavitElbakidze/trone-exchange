import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class TransferTRXDto {
  @IsString()
  fromAddress: string;

  @IsString()
  toAddress: string;

  @IsNumber()
  amount: number;

  @IsString()
  privateKey: string;

  @IsString()
  fromWalletId: string;
}

export class TransferTRC20Dto {
  @IsString()
  contractAddress: string;

  @IsString()
  fromAddress: string;

  @IsString()
  toAddress: string;

  @IsString()
  amount: string;

  @IsString()
  privateKey: string;
}

export class TransferUSDTDto {
  @IsNotEmpty()
  @IsString()
  fromAddress: string;

  @IsNotEmpty()
  @IsString()
  toAddress: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  privateKey: string;

  @IsString()
  fromWalletId: string;
}
