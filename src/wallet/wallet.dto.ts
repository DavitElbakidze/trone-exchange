import { IsString, IsOptional } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsOptional()
  label?: string;
}