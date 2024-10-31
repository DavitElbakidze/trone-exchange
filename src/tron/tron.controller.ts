import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';
import { TransferTRC20Dto, TransferTRXDto } from 'src/transaction/transfer.dto';

@Controller('tron')
export class TronController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post('transfer/trx')
  async transferTRX(@Body() transferDto: TransferTRXDto) {
    return this.transactionService.transferTRX(
      transferDto.fromAddress,
      transferDto.toAddress,
      transferDto.amount,
      transferDto.privateKey,
      transferDto.fromWalletId
      // Note: In production, you should get the private key securely
    );
  }

  @Post('transfer/trc20')
  async transferTRC20(@Body() transferDto: TransferTRC20Dto) {
    return this.transactionService.transferTRC20(
      transferDto.contractAddress,
      transferDto.fromAddress,
      transferDto.toAddress,
      transferDto.amount,
      transferDto.privateKey
      // Note: In production, you should get the private key securely
    );
  }

  @Get('transaction/:txId')
  async getTransactionInfo(@Param('txId') txId: string) {
    return this.transactionService.getTransactionInfo(txId);
  }
}