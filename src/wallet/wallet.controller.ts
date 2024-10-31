import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TronService } from '../tron/tron.service';

interface TokenTransferDto {
  tokenAddress: string;
  toAddress: string;
  amount: string;
}

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
  ) {}

  @Post('create')
  async createWallet(@Body() body: { userId: string }) {
    return await this.walletService.createWallet(body.userId);
  }

  @Get(':id')
  async getWallet(@Param('id') id: string) {
    
    return await this.walletService.getWallet(id);
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
      const result = await this.tronService.deployContract(
        deployDto.abi,
        deployDto.bytecode,
        deployDto.parameters,
        process.env.TRON_PRIVATE_KEY, // In production, use secure key management
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
      const result = await this.tronService.deployTestToken(
        body.name,
        body.symbol,
        body.decimals,
        body.totalSupply,
        process.env.TRON_PRIVATE_KEY, // In production, use secure key management
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
  async getBalance(@Param('address') address: string) {
      return {
        balance: await this.tronService.getBalance(address)
      };
  }
}
