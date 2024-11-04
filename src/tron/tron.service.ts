import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const TronWeb = require('tronweb');
@Injectable()
export class TronService {
  readonly tronWebInstance;
  private readonly USDT_CONTRACT_ADDRESS = 'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs';

  constructor(private configService: ConfigService) {
    const fullNode = this.configService.get('TRON_FULL_NODE');
    const solidityNode = this.configService.get('TRON_SOLIDITY_NODE');
    const eventServer = this.configService.get('TRON_EVENT_SERVER');
    const privateKey = this.configService.get('TRON_PRIVATE_KEY');

    if (!fullNode || !solidityNode || !eventServer) {
      throw new Error('Missing TRON network configuration');
    }

    this.tronWebInstance = new TronWeb({
      fullHost: 'https://api.shasta.trongrid.io/',
      privateKey: privateKey,
    });
  }

  async transferUSDT(
    fromAddress: string,
    toAddress: string,
    amount: number,
    privateKey: string,
  ): Promise<any> {
    try {
      // Create a new TronWeb instance for this specific transfer
      const tronWeb = new TronWeb({
        fullHost: 'https://api.shasta.trongrid.io',
        privateKey: privateKey,
      });

      // Validate recipient address
      const isValidAddress = tronWeb.isAddress(toAddress);
      if (!isValidAddress) {
        throw new Error('Invalid recipient address');
      }

      // Additional address validation and activation check
      try {
        const account = await tronWeb.trx.getAccount(toAddress);
        // If account is not activated, you might want to activate it
        if (Object.keys(account).length === 0) {
          // Optional: Send minimal TRX to activate the account
          const activationTx = await tronWeb.trx.sendTransaction(
            toAddress,
            1000000, // 1 TRX
          );
          console.log('Address activated:', activationTx);
        }
      } catch (accountCheckError) {
        console.error('Account check error:', accountCheckError);
        // Decide how to handle this - you might want to throw or log
      }

      // Get USDT contract
      const usdtContract = await tronWeb
        .contract()
        .at(this.USDT_CONTRACT_ADDRESS);

      // Get token decimals
      const decimals = await usdtContract.decimals().call();

      // Convert amount to smallest unit
      const amountInSmallestUnit = BigInt(amount * 10 ** Number(decimals));

      // Check balance before transfer
      const balance = await usdtContract.balanceOf(fromAddress).call();
      if (BigInt(balance) < amountInSmallestUnit) {
        throw new Error('Insufficient USDT balance');
      }

      // Perform transfer
      const transaction = await usdtContract
        .transfer(toAddress, amountInSmallestUnit.toString())
        .send({
          from: fromAddress,
          feeLimit: 500_000_000, // Increased fee limit
        });

      // Get transaction info
      const txInfo = await tronWeb.trx.getTransaction(transaction);

      return {
        success: true,
        transaction: transaction,
        transactionId: txInfo.txID, // Adding transaction ID
        message: 'USDT transferred successfully',
        amount,
      };
    } catch (error) {
      console.error('Transfer error:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  async sendTransaction(
    fromAddress: string,
    toAddress: string,
    amount: number,
  ): Promise<any> {
    try {
      // Convert amount to sun (1 TRX = 1,000,000 sun)
      const amountInSun = this.tronWebInstance.toSun(amount);

      // Create unsigned transaction
      const transaction = await this.tronWebInstance.transactionBuilder.sendTrx(
        toAddress,
        amountInSun,
        fromAddress,
      );

      // Sign the transaction
      const signedTransaction = await this.tronWebInstance.trx.sign(
        transaction,
        // Use the private key corresponding to fromAddress
        'E9847A97229B85F6791D2E03C2B00DB7CFFC859AF344438E96A5A11759CD412B',
      );

      // Broadcast the transaction
      const result =
        await this.tronWebInstance.trx.sendRawTransaction(signedTransaction);

      return result;
    } catch (error) {
      console.error('Detailed Transaction Error:', error);
      throw new Error(`TRX Transfer failed: ${error.message}`);
    }
  }

  async getBalance(contractAddress: string, address: string) {
    const balanceWei = await this.tronWebInstance.trx.getBalance(address);
    const balance = balanceWei / 1e6;

    return balance;
  }

  private async verifyInitialization() {
    try {
      const nodeInfo = await this.tronWebInstance.trx.getNodeInfo();
      console.log('TronWeb initialized successfully on Shasta testnet');
    } catch (error) {
      console.error('TronWeb initialization verification failed:', error);
    }
  }

  async createAccount(): Promise<any> {
    const account = await this.tronWebInstance.createAccount();
    console.log('Base58 Address:', account.address.base58);
    return account;
  }

  //   async getBalance(address: string): Promise<string> {
  //     const balance = await this.tronWebInstance.trx.getBalance(address);
  //     return this.tronWebInstance.fromSun(balance);
  //   }

  async getUSDTBalance(address: string): Promise<object> {
    try {
      const contract = await this.tronWebInstance
        .contract()
        .at(this.USDT_CONTRACT_ADDRESS);

      const balance = await contract.balanceOf(address).call();
      console.log('Raw balance:', balance.toString());

      // Convert BigInt to string, then to number, then divide
      const balanceStr = balance.toString();
      const balanceNum = balanceStr;
      const formattedBalance = { USDT: balanceNum / 1e6 };

      return formattedBalance; // Ensure 6 decimal places
    } catch (error) {
      console.error('Get USDT balance error:', error);
      throw new Error(`Failed to get USDT balance: ${error.message}`);
    }
  }

  async getTRXBalance(address: string): Promise<string> {
    try {
      const balance = await this.tronWebInstance.trx.getBalance(address);
      return this.tronWebInstance.fromSun(balance).toString();
    } catch (error) {
      console.error('Get TRX balance error:', error);
      throw new Error(`Failed to get TRX balance: ${error.message}`);
    }
  }

  async getTrc20Balance(
    contractAddress: string,
    address: string,
  ): Promise<string> {
    const contract = await this.tronWebInstance.contract().at(contractAddress);
    const balance = await contract.balanceOf(address).call();
    return balance.toString();
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
    privateKey: string,
  ): Promise<any> {
    const duration = 3; // 3 days minimum freeze duration
    return this.tronWebInstance.trx.freezeBalance(
      amount,
      duration,
      resource,
      address,
    );
  }

  async deployContract(
    abi: any,
    bytecode: string,
    params: any[],
    privateKey: string,
  ): Promise<any> {
    const options = {
      feeLimit: 1000000000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10000000,
    };

    const contract = await this.tronWebInstance.contract().new(
      {
        abi,
        bytecode,
        parameters: params,
        ...options,
      },
      privateKey,
    );

    return contract;
  }

  async deployTestToken(
    name: string,
    symbol: string,
    decimals: number = 18,
    totalSupply: string = '1000000000000000000000000',
    privateKey: string,
  ): Promise<any> {
    const options = {
      feeLimit: 1000000000,
      callValue: 0,
      userFeePercentage: 100,
      originEnergyLimit: 10000000,
    };

    // TRC20 standard token contract
    const contract = await this.tronWebInstance.contract().new(
      {
        abi: [
          /* Standard TRC20 ABI */
        ],
        bytecode: '/* Standard TRC20 bytecode */',
        parameters: [name, symbol, decimals, totalSupply],
        ...options,
      },
      privateKey,
    );

    return contract;
  }

  async verifyAddress(address: string) {
    try {
      const accountInfo = await this.tronWebInstance.trx.getAccount(address);
      console.log('Recipient Account Info:', accountInfo);
      return !!accountInfo.address;
    } catch (error) {
      console.error('Address verification error:', error);
      return false;
    }
  }

  async ensureAddressActivated(address: string) {
    try {
      // Send a minimal amount to activate the account
      await this.tronWebInstance.trx.sendTransaction(address, 1);
      console.log('Account activated:', address);
    } catch (error) {
      console.error('Account activation error:', error);
      throw new Error(`Failed to activate account: ${error.message}`);
    }
  }
}
