export interface TronTransaction {
  txID: string; // This is the transaction ID
  raw_data: {
    contract: Array<{
      parameter: {
        value: {
          amount: number;
          owner_address: string;
          to_address: string;
        };
      };
      type: string;
    }>;
    timestamp: number;
  };
  raw_data_hex: string;
  ret: Array<{
    contractRet: 'SUCCESS' | 'FAILED';
    fee: number;
    energyUsage: number;
    energyFee: number;
  }>;
}

export interface TronBlock {
  blockID: string;
  block_header: {
    raw_data: {
      number: number;
      timestamp: number;
    };
  };
  transactions: TronTransaction[];
}

export interface TronSocketError {
  message: string;
  code: string;
  key?: string | number;
}
