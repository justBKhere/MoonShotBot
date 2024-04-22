import { error } from "console";
import { config } from "../configurations/solanaConfig";
import { Cluster, Connection, LAMPORTS_PER_SOL, ParsedAccountData, PublicKey } from "@solana/web3.js";

let solanaEndpoint = config.mainnetEndpoint;
export const connection = new Connection(solanaEndpoint);
export function setSolanaCluster(cluster: string) {
    if (isCluster(cluster)) {
        switch (cluster) {
            case 'mainnet-beta':
                solanaEndpoint = config.mainnetEndpoint;
                break;
            case 'testnet':
                solanaEndpoint = config.testnetEndpoint;
                break;
            case 'devnet':
                solanaEndpoint = config.devnetEndpoint;
                break;
            default:
                throw new Error('Invalid cluster specified');
        }
    }
}
function isCluster(cluster: string): boolean {
    return ['mainnet-beta', 'testnet', 'devnet'].includes(cluster);
}
export const getSolBalance = async (walletAddress: string): Promise<number> => {
    try {
        let network = process.env.NETWORK || 'mainnet-beta'; // Default to mainnet-beta
        if (solanaEndpoint.includes('devnet')) {
            network = 'devnet';
        } else if (solanaEndpoint.includes('testnet')) {
            network = 'testnet';
        }
        console.log("network", network);
        const response = await GetSolBalance(walletAddress, network);
        return response;
    } catch (error) {
        Error(`Failed to fetch SOL balance: ${error}`);
        throw new Error('Failed to fetch SOL balance');
    }
}

async function GetSolBalance(walletAddress: string, network: string) {
  
  const balance = await connection.getBalance(new PublicKey(walletAddress));
  console.log(`Balance of ${walletAddress} on ${network}: ${balance / LAMPORTS_PER_SOL} SOL`);
  return balance / LAMPORTS_PER_SOL;
}


export async function getNumberDecimals(connection:Connection ,mintAddress: PublicKey):Promise<number> {
    const info = await connection.getParsedAccountInfo(mintAddress);
    const result = (info.value?.data as ParsedAccountData).parsed.info.decimals as number;
    return result;
  }