import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction, TransactionStatus } from './transaction.schema';
import { TronService } from '../tron/tron.service';

@Injectable()
export class TransactionStatusChecker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TransactionStatusChecker.name);
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly tronService: TronService,
  ) {}

  onModuleInit() {
    this.checkInterval = setInterval(() => {
      this.checkPendingTransactions();
    }, 10000);
  }

  private async checkPendingTransactions() {
    try {
      const pendingTxs = await this.transactionModel.find({
        status: TransactionStatus.PENDING,
      });

      for (const tx of pendingTxs) {
        try {
          // Using tronService instead of direct tronWeb instance
          const txInfo = await this.tronService.getTransactionInfo(tx.hash);

          if (txInfo && txInfo.receipt) {
            const status =
              txInfo.receipt.result === 'SUCCESS'
                ? TransactionStatus.COMPLETED
                : TransactionStatus.FAILED;

            await this.transactionModel.findOneAndUpdate(
              { hash: tx.hash },
              { status },
            );
          }
        } catch (error) {
          console.error(`Error checking tx ${tx.hash}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking transactions:', error);
    }
  }

  onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
