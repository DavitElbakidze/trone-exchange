import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TronMonitorController } from './tron-monitor.controller';
import { TronMonitorService } from './tron-monitor.service';
import { TronMonitorTest } from './tron-monitor-test.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Transaction,
  TransactionSchema,
} from 'src/transaction/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
    EventEmitterModule.forRoot({
      // Global event emitter configuration
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: true,
    }),
  ],
  controllers: [TronMonitorController],
  providers: [TronMonitorService, TronMonitorTest],
  exports: [TronMonitorService],
})
export class TronMonitorModule {}
