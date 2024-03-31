import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';

// It is recommended that you use your own RPC endpoint.
// This RPC endpoint is only for demonstration purposes so that this example will run.
const connection = new Connection('https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/');

function createWalletFromPrivateKey(privateKey: string): Wallet {
    return new Wallet(Keypair.fromSecretKey(bs58.decode(privateKey)));
}

export async function getQuote(inputMint: string, outputMint: string, amount: number, slippageBps: number) {
    const quoteResponse = await (
        await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`)
    ).json();
    return quoteResponse;
}

const sampleBody = {
  "inputMint": "inputMintValue",
  "outputMint": "outputMintValue",
  "amount": 100,
  "slippageBps": 50
};
