import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TronWeb } from 'tronweb';

@Injectable()
export class TronService {
  private readonly tronWebInstance: any;

  constructor(private configService: ConfigService) {
    const fullNode = this.configService.get('TRON_FULL_NODE');
    const solidityNode = this.configService.get('TRON_SOLIDITY_NODE');
    const eventServer = this.configService.get('TRON_EVENT_SERVER');
    const privateKey = this.configService.get('TRON_PRIVATE_KEY');

    this.tronWebInstance = new TronWeb(
      fullNode,
      solidityNode,
      eventServer,
      privateKey,
    );
  }

  async createAccount(): Promise<any> {
    const account = this.tronWebInstance.createAccount();
    console.log(account);
    
    return account
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.tronWebInstance.trx.getBalance(address);
    return this.tronWebInstance.fromSun(balance);
  }

  async getTrc20Balance(contractAddress: string, address: string): Promise<string> {
    const contract = await this.tronWebInstance.contract().at(contractAddress);
    const balance = await contract.balanceOf(address).call();
    return balance.toString();
  }

  async sendTransaction(toAddress: string, amount: number, privateKey: string): Promise<any> {
    return this.tronWebInstance.trx.sendTransaction(toAddress, amount, privateKey);
  }

  async getContract(contractAddress: string): Promise<any> {
    return this.tronWebInstance.contract().at(contractAddress);
  }

  async getTransactionById(txId: string): Promise<any> {
    return this.tronWebInstance.trx.getTransaction(txId);
  }

  async getTransactionInfo(txId: string): Promise<any> {
    return this.tronWebInstance.trx.getTransactionInfo(txId);
  }

  async freezeBalance(
    address: string, 
    amount: number, 
    resource: 'BANDWIDTH' | 'ENERGY', 
    privateKey: string
  ): Promise<any> {
    const duration = 3; // 3 days minimum freeze duration
    return this.tronWebInstance.trx.freezeBalance(amount, duration, resource, address, privateKey);
  }

  async deployContract(
    abi: any,
    bytecode: string,
    params: any[],
    privateKey: string
  ): Promise<any> {
    const options = {
      feeLimit: 1000000000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10000000
    };

    const contract = await this.tronWebInstance.contract().new({
      abi,
      bytecode,
      parameters: params,
      ...options
    }, privateKey);

    return contract;
  }

  async deployTestToken(
    name: string,
    symbol: string,
    decimals: number = 18,
    totalSupply: string = '1000000000000000000000000',
    privateKey: string
  ): Promise<any> {
    const options = {
      feeLimit: 1000000000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10000000
    };

    // TRC20 standard token contract
    const contract = await this.tronWebInstance.contract().new({
      abi: [/* Standard TRC20 ABI */],
      bytecode: '/* Standard TRC20 bytecode */',
      parameters: [name, symbol, decimals, totalSupply],
      ...options
    }, privateKey);

    return contract;
  }
}