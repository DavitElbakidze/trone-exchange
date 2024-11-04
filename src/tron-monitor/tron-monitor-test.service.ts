import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class TronMonitorTest implements OnModuleInit {
  private readonly logger = new Logger(TronMonitorTest.name);

  constructor(private eventEmitter: EventEmitter2) {}

  onModuleInit() {
    // Listen for transactions
    this.eventEmitter.on('tron.transaction', (transaction) => {
      this.logger.log('New transaction detected:', transaction);
    });
  }
}
