export interface TronAccount {
    privateKey: string;
    publicKey: string;
    address: {
      base58: string;
      hex: string;
    };
  }
  
  export interface TronTransaction {
    txID: string;
    raw_data: any;
    raw_data_hex: string;
  }
  
  export type ResourceType = 'BANDWIDTH' | 'ENERGY';