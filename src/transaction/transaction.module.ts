import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from './transaction.schema';
import { TronService } from 'src/tron/tron.service';
import { ConfigService } from '@nestjs/config';
import { TransactionStatusChecker } from './transaction-status-checker';
import { TronModule } from 'src/tron/tron.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    TronModule,
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TronService,
    ConfigService,
    TransactionStatusChecker,
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
