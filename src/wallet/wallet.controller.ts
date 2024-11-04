import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TronService } from '../tron/tron.service';
import { ConfigService } from '@nestjs/config';

interface ContractDeployDto {
  abi: any;
  bytecode: string;
  parameters: any[];
}

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly tronService: TronService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create')
  async createWallet(@Body() body: { userId: string }) {
    return await this.walletService.createWallet(body.userId);
  }

  @Get(':id')
  async getWallet(@Param('id') id: string) {
    return await this.walletService.getWallet(id);
  }

  @Get('usdt-balance/:address')
  async getUSDTBalance(@Param('address') address: string) {
    return await this.tronService.getUSDTBalance(address);
  }

  @Post(':id/update-balances')
  async updateBalances(@Param('id') id: string) {
    try {
      await this.walletService.updateBalances(id);
      return { success: true };
    } catch (error) {
      throw new HttpException(
        'Failed to update balances',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('deploy-contract')
  async deployContract(@Body() deployDto: ContractDeployDto) {
    try {
      const privateKey =
        this.configService.getOrThrow<string>('TRON_PRIVATE_KEY');
      const result = await this.tronService.deployContract(
        deployDto.abi,
        deployDto.bytecode,
        deployDto.parameters,
        privateKey, // In production, use secure key management
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Contract deployment failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('deploy-token')
  async deployToken(
    @Body()
    body: {
      name: string;
      symbol: string;
      decimals: number;
      totalSupply: string;
    },
  ) {
    try {
      const privateKey =
        this.configService.getOrThrow<string>('TRON_PRIVATE_KEY');
      const result = await this.tronService.deployTestToken(
        body.name,
        body.symbol,
        body.decimals,
        body.totalSupply,
        privateKey, // In production, use secure key management
      );
      return result;
    } catch (error) {
      throw new HttpException(
        'Token deployment failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':address/balance')
  async getTRXBalance(@Param('address') address: string) {
    return {
      balance: await this.tronService.getBalance(
        'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
        address,
      ),
    };
  }
}
