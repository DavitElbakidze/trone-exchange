import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
}

@Schema({ timestamps: true })
export class Transaction extends Document {
  @Prop({ required: true })
  hash: string;

  @Prop({ required: true })
  fromAddress: string;

  @Prop({ required: true })
  toAddress: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  status: TransactionStatus;

  @Prop({ default: 0 })
  retryCount: number;

  @Prop()
  blockNumber?: number;

  @Prop()
  confirmations?: number;

  @Prop()
  energy_usage?: number;

  @Prop()
  energy_fee?: number;

  @Prop()
  net_fee?: number;

  @Prop()
  error?: string;

  @Prop()
  reorgDetected?: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
