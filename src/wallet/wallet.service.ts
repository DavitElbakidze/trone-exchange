import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TronService } from '../tron/tron.service';
import * as crypto from 'crypto';
import { Wallet } from './wallet.schema';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';

@Injectable()
export class WalletService {
  private readonly encryptionKey: Buffer;
  private readonly encryptionIv: Buffer;

  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<Wallet>,
    private readonly tronService: TronService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    // Initialize encryption key and IV in constructor
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    const iv = this.configService.get<string>('ENCRYPTION_IV');

    if (!key || !iv) {
      throw new Error('Encryption key or IV not configured');
    }

    // Validate hex strings before conversion
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      throw new Error(
        'Encryption key must be a 64-character hex string (32 bytes)',
      );
    }
    if (!/^[0-9a-fA-F]{32}$/.test(iv)) {
      throw new Error(
        'Encryption IV must be a 32-character hex string (16 bytes)',
      );
    }

    // Convert hex strings to buffers
    this.encryptionKey = Buffer.from(key, 'hex');
    this.encryptionIv = Buffer.from(iv, 'hex');
  }

  private encryptPrivateKey(privateKey: string): string {
    try {
      // Generate a new IV for each encryption
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        iv,
      );

      const encrypted = Buffer.concat([
        cipher.update(privateKey, 'utf8'),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      // Combine IV, encrypted data, and auth tag
      return Buffer.concat([iv, encrypted, tag]).toString('hex');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  private decryptPrivateKey(encryptedData: string): string {
    try {
      const buffer = Buffer.from(encryptedData, 'hex');

      // Extract IV, encrypted data, and auth tag
      const iv = buffer.slice(0, 16);
      const tag = buffer.slice(-16);
      const encrypted = buffer.slice(16, -16);

      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        iv,
      );

      decipher.setAuthTag(tag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  async createWallet(userId: string): Promise<Wallet> {
    if (!userId) {
      throw new BadRequestException('UserId is required');
    }

    const user = await this.userService.findById(userId);

    try {
      // Check if user already has a wallet
      const existingWallet = await this.walletModel.findOne({ userId });
      console.log(existingWallet);

      if (existingWallet) {
        throw new BadRequestException('User already has a wallet');
      }

      const account = await this.tronService.createAccount();
      if (!account || !account.address || !account.privateKey) {
        throw new Error('Failed to create Tron account');
      }

      const wallet = new this.walletModel({
        userId,
        address: account.address.base58,
        hexAddress: account.address.hex,
        encryptedPrivateKey: this.encryptPrivateKey(account.privateKey),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await wallet.save();
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  async getWallet(walletId: string): Promise<Wallet> {
    const wallet = await this.walletModel.findById(walletId);
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  async updateBalances(walletId: string): Promise<void> {
    const wallet = await this.getWallet(walletId);
    const trxBalance = await this.tronService.getBalance(
      'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
      wallet.address,
    );
    const usdtBalance = await this.tronService.getUSDTBalance(wallet.address);
    for (const [key, value] of Object.entries(usdtBalance)) {
      wallet.tokenBalances.set(key, value);
    }
    wallet.trxBalance = String(trxBalance);
    await wallet.save();
  }
}
