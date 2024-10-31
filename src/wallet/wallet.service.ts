import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TronService } from '../tron/tron.service';
import * as crypto from 'crypto';
import { Wallet } from './wallet.schema';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletService {
  private readonly encryptionKey: Buffer;
  private readonly encryptionIv: Buffer;

  constructor(
    @InjectModel(Wallet.name) private readonly walletModel: Model<Wallet>,
    private readonly tronService: TronService,
    private readonly configService: ConfigService,
  ) {
    // Initialize encryption key and IV in constructor
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    const iv = this.configService.get<string>('ENCRYPTION_IV');

    if (!key || !iv) {
      throw new Error('Encryption key or IV not configured');
    }

    // Convert hex strings to buffers
    this.encryptionKey = Buffer.from(key, 'hex');
    this.encryptionIv = Buffer.from(iv, 'hex');

    // Validate key and IV lengths
    if (this.encryptionKey.length !== 32) { // 256 bits
      throw new Error('Encryption key must be 32 bytes (256 bits)');
    }
    if (this.encryptionIv.length !== 16) { // 128 bits
      throw new Error('Encryption IV must be 16 bytes (128 bits)');
    }
  }

  private encryptPrivateKey(privateKey: string): string {
    try {
      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        this.encryptionIv
      );
      
      const encrypted = Buffer.concat([
        cipher.update(privateKey, 'utf8'),
        cipher.final(),
      ]);
      
      const tag = cipher.getAuthTag();
      return Buffer.concat([encrypted, tag]).toString('hex');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  private decryptPrivateKey(encryptedKey: string): string {
    try {
      const encryptedBuffer = Buffer.from(encryptedKey, 'hex');
      const tag = encryptedBuffer.slice(-16);
      const encrypted = encryptedBuffer.slice(0, -16);
      
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        this.encryptionIv
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

    try {
      // Check if user already has a wallet
      const existingWallet = await this.walletModel.findOne({ userId });
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
    const trxBalance = await this.tronService.getBalance(wallet.address);
    wallet.trxBalance = trxBalance;
    await wallet.save();
  }
}