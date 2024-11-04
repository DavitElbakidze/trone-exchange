import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import TronWeb from 'tronweb';
import { EnvironmentVariables } from 'src/config/tron.config';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from 'src/transaction/transaction.schema';
import { Model } from 'mongoose';

interface TransactionStatusData {
  txId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  blockNumber?: number;
  energy_used?: number;
  energy_penalty?: number;
  net_used?: number;
  net_fee?: number;
  result?: string;
  fee?: number;
  error?: string;
  contractResult?: string[];
  receipt?: {
    energy_usage: number;
    energy_fee: number;
    origin_energy_usage: number;
    energy_usage_total: number;
    net_usage: number;
    net_fee: number;
    result: string;
  };
}

interface ProcessedTransaction {
  txId: string;
  timestamp: number;
  blockNumber?: number;
  from: string;
  to?: string;
  amount?: number;
  type: string;
  status?: TransactionStatusData | null;
  contractAddress?: string;
  raw?: any;
}

@Injectable()
export class TronMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TronMonitorService.name);
  private readonly watchedAddresses: Set<string> = new Set();
  private lastProcessedBlock = 0;
  private isMonitoring = false;
  private readonly BLOCK_TIME = 3000;
  private tronWeb: any;
  private checkBlocksInterval: ReturnType<typeof setInterval> | null = null;
  private pendingTransactions: Map<string, ProcessedTransaction> = new Map();

  constructor(
    private configService: ConfigService<EnvironmentVariables>,
    private eventEmitter: EventEmitter2,
    @InjectModel(Transaction.name) private transactionModel: Model<Transaction>,
  ) {
    this.initializeTronWeb();
    this.initializeWatchedAddresses();
  }

  private initializeTronWeb() {
    try {
      this.tronWeb = new TronWeb({
        fullHost: 'https://api.shasta.trongrid.io',
        headers: { 'TRON-PRO-API-KEY': this.configService.get('TRON_API_KEY') },
      });
      this.logger.log('🚀 TronWeb initialized on Shasta testnet');
    } catch (error) {
      this.logger.error('❌ Failed to initialize TronWeb:', error);
      throw error;
    }
  }

  private initializeWatchedAddresses() {
    try {
      const addresses = this.configService
        .get<string>('TRON_MONITORED_ADDRESSES', '')
        .split(',')
        .map((addr) => addr.trim())
        .filter((addr) => addr && this.tronWeb.isAddress(addr));

      addresses.forEach((addr) => this.watchedAddresses.add(addr));
      this.logger.log(
        `👀 Monitoring ${this.watchedAddresses.size} addresses: ${Array.from(this.watchedAddresses).join(', ')}`,
      );
    } catch (error) {
      this.logger.error('❌ Error initializing watched addresses:', error);
    }
  }

  async onModuleInit() {
    await this.startMonitoring();
  }

  onModuleDestroy() {
    this.stopMonitoring();
  }

  private async startMonitoring() {
    if (this.isMonitoring) return;

    try {
      this.isMonitoring = true;
      const currentBlock = await this.getLatestBlockNumber();
      this.lastProcessedBlock = currentBlock;
      this.logger.log(`📦 Starting monitoring from block ${currentBlock}`);

      this.checkBlocksInterval = setInterval(
        () => this.checkNewBlocks(),
        this.BLOCK_TIME,
      );
    } catch (error) {
      this.logger.error('❌ Failed to start monitoring:', error);
      this.isMonitoring = false;
    }
  }

  private stopMonitoring() {
    if (this.checkBlocksInterval) {
      clearInterval(this.checkBlocksInterval);
      this.checkBlocksInterval = null;
    }
    this.isMonitoring = false;
    this.logger.log('🛑 Monitoring stopped');
  }

  private async checkNewBlocks() {
    try {
      const currentBlock = await this.getLatestBlockNumber();

      if (currentBlock > this.lastProcessedBlock) {
        this.logger.debug(
          `📡 Checking blocks ${this.lastProcessedBlock + 1} to ${currentBlock}`,
        );

        for (
          let blockNum = this.lastProcessedBlock + 1;
          blockNum <= currentBlock;
          blockNum++
        ) {
          await this.processBlock(blockNum);
        }

        this.lastProcessedBlock = currentBlock;
      }

      // Check pending transactions
      await this.checkPendingTransactions();
    } catch (error) {
      this.logger.error('❌ Error checking new blocks:', error);
    }
  }

  private async getLatestBlockNumber(): Promise<number> {
    try {
      const block = await this.tronWeb.trx.getCurrentBlock();
      return block.block_header.raw_data.number;
    } catch (error) {
      this.logger.error('❌ Error getting latest block:', error);
      throw error;
    }
  }

  private async processBlock(blockNum: number) {
    try {
      const block = await this.tronWeb.trx.getBlock(blockNum);
      if (block?.transactions) {
        this.logger.debug(
          `📦 Processing block ${blockNum} with ${block.transactions.length} transactions`,
        );
        for (const tx of block.transactions) {
          await this.processTransaction(tx);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error processing block ${blockNum}:`, error);
    }
  }

  private async checkPendingTransactions() {
    for (const [txId, tx] of this.pendingTransactions.entries()) {
      try {
        const status = await this.getTransactionStatus(txId);
        if (status) {
          tx.status = status;

          if (status.status === 'SUCCESS' || status.status === 'FAILED') {
            this.pendingTransactions.delete(txId);
            this.emitTransactionUpdate(tx);
          }
        }
      } catch (error) {
        this.logger.warn(
          `⚠️ Error checking pending transaction ${txId}:`,
          error,
        );
      }
    }
  }

  private async getTransactionStatus(
    txId: string,
  ): Promise<TransactionStatusData | null> {
    try {
      const txInfo = await this.tronWeb.trx.getTransactionInfo(txId);

      if (!txInfo || Object.keys(txInfo).length === 0) {
        return {
          txId,
          status: 'PENDING',
        };
      }

      const status: TransactionStatusData = {
        txId,
        status: txInfo.receipt?.result === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
        blockNumber: txInfo.blockNumber,
        energy_used: txInfo.receipt?.energy_usage_total,
        net_used: txInfo.receipt?.net_usage,
        contractResult: txInfo.contractResult,
        receipt: txInfo.receipt,
        error: txInfo.result || undefined,
      };

      return status;
    } catch (error) {
      this.logger.error(
        `❌ Error getting transaction status for ${txId}:`,
        error,
      );
      return null;
    }
  }

  private decodeTransferData(
    data: string,
  ): { to: string; amount: string } | null {
    try {
      // Remove '0xa9059cbb' (transfer method signature) and any leading '0x'
      const cleanData = data.replace('0x', '').replace('a9059cbb', '');

      // Extract address and amount
      const to = '41' + cleanData.slice(24, 64); // Convert to Tron address format
      const amountHex = cleanData.slice(64, 128);

      // Convert amount from hex to decimal
      const amount = BigInt('0x' + amountHex).toString();

      return {
        to: this.tronWeb.address.fromHex('0x' + to),
        amount: amount,
      };
    } catch (error) {
      this.logger.error('Error decoding transfer data:', error);
      return null;
    }
  }

  private async processTransaction(tx: any) {
    try {
      for (const contract of tx.raw_data.contract) {
        const { owner_address, contract_address, data } =
          contract.parameter.value;

        const fromAddress = this.tronWeb.address.fromHex(owner_address);
        const contractAddr = contract_address
          ? this.tronWeb.address.fromHex(contract_address)
          : undefined;

        // Initialize basic transaction info
        let toAddress: string | undefined;
        let amount: number | undefined;

        // Handle different transaction types
        if (
          contract.type === 'TriggerSmartContract' &&
          data?.startsWith('a9059cbb')
        ) {
          // This is a TRC20 transfer
          const decoded = this.decodeTransferData(data);
          if (decoded) {
            toAddress = decoded.to;
            // Convert from raw amount to token amount (assuming 6 decimals for USDT)
            amount = Number(decoded.amount) / 1_000_000;
          }
        } else {
          // Handle regular TRX transfer
          toAddress = contract.parameter.value.to_address
            ? this.tronWeb.address.fromHex(contract.parameter.value.to_address)
            : undefined;
          amount = contract.parameter.value.amount
            ? contract.parameter.value.amount / 1_000_000
            : undefined;
        }

        // Check if transaction involves watched addresses
        if (
          !this.watchedAddresses.has(fromAddress) &&
          !this.watchedAddresses.has(toAddress || '')
        ) {
          continue;
        }

        this.logger.log(`🔍 Found relevant transaction: ${tx.txID}`);
        this.logger.log(`📝 Type: ${contract.type}`);
        this.logger.log(`🔄 From: ${fromAddress} -> To: ${toAddress || 'N/A'}`);
        if (amount)
          this.logger.log(
            `💰 Amount: ${amount} ${contractAddr ? 'USDT' : 'TRX'}`,
          );
        if (contractAddr) this.logger.log(`📄 Contract: ${contractAddr}`);

        const processedTx: ProcessedTransaction = {
          txId: tx.txID,
          timestamp: tx.raw_data.timestamp,
          from: fromAddress,
          to: toAddress,
          amount: amount,
          type: contract.type,
          contractAddress: contractAddr,
          raw: tx,
          status: undefined,
        };

        const status = await this.getTransactionStatus(tx.txID);
        processedTx.status = status;

        if (!status || status.status === 'PENDING') {
          this.pendingTransactions.set(tx.txID, processedTx);
          this.logger.log(`⏳ Transaction ${tx.txID} is pending`);
        }

        this.emitTransactionUpdate(processedTx);
      }
    } catch (error) {
      this.logger.error('❌ Error processing transaction:', error);
    }
  }

  private emitTransactionUpdate(tx: ProcessedTransaction) {
    try {
      this.eventEmitter.emit('tron.transaction', tx);

      const statusEmoji =
        tx.status?.status === 'SUCCESS'
          ? '✅'
          : tx.status?.status === 'FAILED'
            ? '❌'
            : '⏳';

      this.logger.log(
        `${statusEmoji} Transaction ${tx.txId} status: ${tx.status?.status || 'UNKNOWN'}`,
      );

      if (tx.status?.receipt) {
        this.logger.log('📊 Transaction details:');
        this.logger.log(
          `   Energy used: ${tx.status.receipt.energy_usage_total}`,
        );
        this.logger.log(`   Net usage: ${tx.status.receipt.net_usage}`);
      }

      if (tx.status?.error) {
        this.logger.error(`❌ Transaction error: ${tx.status.error}`);
      }
    } catch (error) {
      this.logger.error('❌ Error emitting transaction:', error);
    }
  }

  public addWatchAddress(address: string): boolean {
    if (!this.tronWeb.isAddress(address)) {
      this.logger.warn(`❌ Invalid Tron address: ${address}`);
      return false;
    }

    this.watchedAddresses.add(address);
    this.logger.log(`✅ Added watch address: ${address}`);
    return true;
  }

  public removeWatchAddress(address: string): boolean {
    const removed = this.watchedAddresses.delete(address);
    if (removed) {
      this.logger.log(`🗑️ Removed watch address: ${address}`);
    }
    return removed;
  }

  public getWatchedAddresses(): string[] {
    return Array.from(this.watchedAddresses);
  }
}
