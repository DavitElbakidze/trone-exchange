import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TronService } from '../tron/tron.service';
import { Transaction, TransactionStatus } from './transaction.schema';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
    private readonly tronService: TronService,
    
  ) {}

  async transferTRX(
    fromAddress: string,
    toAddress: string,
    amount: number,
    privateKey: string,
    fromWalletId: string,
  ): Promise<any> {
    try {
      const transaction = await this.tronService.sendTransaction(
        toAddress,
        amount,
        privateKey,
      );

      const newTransaction = new this.transactionModel({
        fromAddress,
        toAddress,
        amount,
        type: 'TRX',
        hash: transaction.txid,
        status: TransactionStatus.PENDING,
        currency: 'TRX',
        fromWalletId,
      });

      await newTransaction.save();
      return transaction;
    } catch (error) {
      throw new Error(`Failed to transfer TRX: ${error.message}`);
    }
  }

  async transferTRC20(
    contractAddress: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    privateKey: string,
  ): Promise<any> {
    try {
      const contract = await this.tronService.getContract(contractAddress);
      
      const transaction = await contract.transfer(
        toAddress,
        amount,
      ).send({
        from: fromAddress,
        privateKey: privateKey,
      });

      const newTransaction = new this.transactionModel({
        fromAddress,
        toAddress,
        amount,
        contractAddress,
        type: 'TRC20',
        hash: transaction.txid,
        status: 'PENDING',
      });

      await newTransaction.save();
      return transaction;
    } catch (error) {
      throw new Error(`Failed to transfer TRC20 token: ${error.message}`);
    }
  }

  async getTransactionInfo(txId: string): Promise<any> {
    return this.tronService.getTransactionInfo(txId);
  }
}