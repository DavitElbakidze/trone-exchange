import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TransactionService } from '../transaction/transaction.service';
import {
  TransferTRC20Dto,
  TransferTRXDto,
  TransferUSDTDto,
} from 'src/transaction/transfer.dto';
import { TronService } from './tron.service';

@Controller('tron')
export class TronController {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly tronService: TronService,
  ) {}

  @Post('transfer/trx')
  async transferTRX(@Body() transferDto: TransferTRXDto) {
    return this.transactionService.transferTRX(
      transferDto.fromAddress,
      transferDto.toAddress,
      transferDto.amount,
      transferDto.fromWalletId,
    );
  }

  @Post('transfer/trc20')
  async transferTRC20(@Body() transferDto: TransferTRC20Dto) {
    return this.transactionService.transferTRC20(
      transferDto.contractAddress,
      transferDto.fromAddress,
      transferDto.toAddress,
      transferDto.amount,
      transferDto.privateKey,
    );
  }

  @Get('transaction/:txId')
  async getTransactionInfo(@Param('txId') txId: string) {
    return this.transactionService.getTransactionInfo(txId);
  }
}
