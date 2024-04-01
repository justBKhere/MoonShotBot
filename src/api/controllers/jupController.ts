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
    const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`);
    const quoteResponse = await response.json();
    return quoteResponse;
}

// get serialized transactions for the swap
async function getSwapTransaction(quoteResponse: any, userPublicKey: string, wrapAndUnwrapSol: boolean, feeAccount?: string) {
    
    
    const swapTransaction = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol,
                feeAccount
            })
        })
    ).json();
    return swapTransaction;
}


// deserialize the transaction
function processSwapTransaction(swapTransaction: string, wallet: Wallet) {
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(transaction);

    // sign the transaction
    transaction.sign([wallet.payer]);
}

// Execute the transaction
async function executeTransaction(transaction: any, connection: Connection) {
    const rawTransaction = transaction.serialize();
    console.log(rawTransaction);
   /* const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2
    });
    await connection.confirmTransaction(txid);
    console.log(`https://solscan.io/tx/${txid}`);*/
}



async function completeTransactionSequence( inputMint: string, outputMint: string, amount: number, slippageBps: number) {
    const wallet = createWalletFromPrivateKey(process.env.PRIVATE_KEY || '');
    const quote = await getQuote(inputMint, outputMint, amount, slippageBps);
    console.log("quote", quote);
    console.log("routePlan", quote);
    const swapTransaction = await getSwapTransaction(quote, wallet.publicKey.toBase58(), true);
    console.log("swapTransaction", swapTransaction);

    processSwapTransaction(swapTransaction.swapTransaction, wallet);
    const connection = new Connection('https://neat-hidden-sanctuary.solana-mainnet.discover.quiknode.pro/2af5315d336f9ae920028bbb90a73b724dc1bbed/');
    await executeTransaction(swapTransaction, connection);
}


const inputMint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const amount = 1;
const slippageBps = 10;

completeTransactionSequence(inputMint, outputMint, amount, slippageBps);

