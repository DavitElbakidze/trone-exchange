import { 
    Controller, 
    Post, 
    Body, 
    Get, 
    Param, 
    HttpException, 
    HttpStatus,
    UseGuards,
    Query
  } from '@nestjs/common';
  import { TransactionService } from './transaction.service';
  
  export class TransferTRXDto {
    fromAddress: string;
    toAddress: string;
    amount: number;
    privateKey: string;
    fromWalletId: string;
  }
  
  export class TransferTRC20Dto {
    contractAddress: string;
    fromAddress: string;
    toAddress: string;
    amount: string;
    privateKey: string;
  }
  
  @Controller('transaction')
  export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}
  
    @Post('transfer/trx')
    async transferTRX(@Body() transferDto: TransferTRXDto) {
      return this.transactionService.transferTRX(
        transferDto.fromAddress,
        transferDto.toAddress,
        transferDto.amount,
        transferDto.privateKey,
        transferDto.fromWalletId,
      );
    }
  
    @Post('transfer/trc20')
    async transferTRC20(@Body() transferDto: TransferTRC20Dto) {
      try {
        const result = await this.transactionService.transferTRC20(
          transferDto.contractAddress,
          transferDto.fromAddress,
          transferDto.toAddress,
          transferDto.amount,
          transferDto.privateKey
        );
        return result;
      } catch (error) {
        throw new HttpException(
          `TRC20 transfer failed: ${error.message}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
  
    @Get(':txId')
    async getTransactionInfo(@Param('txId') txId: string) {
      try {
        const info = await this.transactionService.getTransactionInfo(txId);
        if (!info) {
          throw new HttpException(
            'Transaction not found',
            HttpStatus.NOT_FOUND
          );
        }
        return info;
      } catch (error) {
        throw new HttpException(
          `Failed to get transaction info: ${error.message}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }
  
    @Get()
    async getTransactions(
      @Query('address') address?: string,
      @Query('status') status?: string,
      @Query('type') type?: string,
      @Query('page') page: number = 1,
      @Query('limit') limit: number = 10
    ) {
      try {
        // Implement pagination and filtering logic here
        // This would require adding a method to TransactionService
        return {
          items: [],
          total: 0,
          page,
          limit,
          // Implementation needed based on your requirements
        };
      } catch (error) {
        throw new HttpException(
          'Failed to fetch transactions',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }