import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true })
  fromAddress: string;

  @Prop({ required: true })
  toAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  fromWalletId: string;

  @Prop({ 
    required: true,
    enum: TransactionStatus,
    default: TransactionStatus.PENDING 
  })
  status: TransactionStatus;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);