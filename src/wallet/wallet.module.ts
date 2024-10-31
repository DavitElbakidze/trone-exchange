import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallet, WalletSchema } from './wallet.schema';
import { WalletService } from './wallet.service';
import { TronService } from 'src/tron/tron.service';
import { ConfigService } from '@nestjs/config';
import { WalletController } from './wallet.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Wallet.name, schema: WalletSchema }])],
  providers: [WalletService, TronService, ConfigService],
  controllers: [WalletController],
  exports: [WalletService],
})
export class WalletModule {}