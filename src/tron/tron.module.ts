import { Module } from '@nestjs/common';
import { TronService } from './tron.service';
import { TronController } from './tron.controller';
import { ConfigService } from '@nestjs/config';
import { TransactionService } from 'src/transaction/transaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Transaction, TransactionSchema } from 'src/transaction/transaction.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Transaction.name, schema: TransactionSchema }])],
  providers: [ TronService, ConfigService, TransactionService],
  controllers: [TronController]
})
export class TronModule {}
