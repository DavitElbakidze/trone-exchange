import { registerAs } from '@nestjs/config';

export default registerAs('tron', () => ({
  fullNode: process.env.TRON_FULL_NODE || 'https://api.trongrid.io',
  solidityNode: process.env.TRON_SOLIDITY_NODE || 'https://api.trongrid.io',
  eventServer: process.env.TRON_EVENT_SERVER || 'https://api.trongrid.io',
  networkType: process.env.TRON_NETWORK || 'mainnet',
  apiKey: process.env.TRON_API_KEY,
}));