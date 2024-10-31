import { IsString, IsNumber, IsOptional } from 'class-validator';


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
  privateKey:string
}