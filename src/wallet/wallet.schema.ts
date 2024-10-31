import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  hexAddress: string;

  @Prop({ required: true })
  encryptedPrivateKey: string;

  @Prop({ default: '0' })
  trxBalance: string;

  @Prop({ type: Map, of: String, default: new Map() })
  tokenBalances: Map<string, string>;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);