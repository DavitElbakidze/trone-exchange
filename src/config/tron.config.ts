import { registerAs } from "@nestjs/config";
export default registerAs('tron', () => ({
network: process.env.TRON_NETWORK || 'shasta', // testnet
privateKey: process.env.TRON_PRIVATE_KEY,
fullNode: process.env.TRON_FULL_NODE || 'https://api.shasta.trongrid.io',
solidityNode: process.env.TRON_SOLIDITY_NODE || 'https://api.shasta.trongrid.io',
eventServer: process.env.TRON_EVENT_SERVER || 'https://api.shasta.trongrid.io',
apiKey: process.env.TRON_API_KEY
}));


export const TRON_CONFIG = {
    TESTNET: {
      fullHost: 'https://api.nileex.io', // Nile testnet
      network: 'nile',
      faucet: 'https://nileex.io/join/getJoinPage' // Testnet faucet URL
    }
  };