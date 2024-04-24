import { Connection, Keypair, Signer, Transaction, VersionedTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';

// It is rec    ommended that you use your own RPC endpoint.
// This RPC endpoint is only for demonstration purposes so that this example will run.
const connection = new Connection('https://rpc.shyft.to?api_key=czbyQ5tp0t4lPp3B');

const inputMint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const amount = 1;
const slippageBps = 100;
function createWalletFromPrivateKey(privateKey: string): Wallet {
    return new Wallet(Keypair.fromSecretKey(bs58.decode(privateKey)));
}

export async function getQuote(inputMint: string, outputMint: string, amount: string, slippageBps: number) {
    console.log
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
                feeAccount,
                prioritizationFeeLamports: 'auto'
            })
        })
    ).json();

    console.log(swapTransaction);
    return swapTransaction;
}


// deserialize the transaction
async function processSwapTransaction(swapTransaction: string, wallet: Wallet) {
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(transaction);

    transaction.sign([wallet.payer]);
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            // Fetch a new blockhash for each attempt
            const recentBlockhash = await connection.getRecentBlockhash();
            transaction.message.recentBlockhash = recentBlockhash.blockhash;
            console.log("Sending transaction");
           const signature = await signAndSendTransactionRaw(connection, transaction, [wallet.payer]);
           console.log("signature", signature);
           return signature;
   /* const simulation = await connection.simulateTransaction(transaction);
    console.log("simulation", simulation);
         return simulation; // Transaction was successful*/
    } catch (error: any) {
        console.error(`Attempt ${attempt}: Transaction failed`, error);
        if (error.message === 'BlockhashNotFound' && attempt < 3) {
            console.log(`Retrying transaction...`);
            continue; // Retry if blockhash was not found
        } else {
            throw error; // Throw if a different error or retries exceeded
        }
    }
    // const signature = await connection.sendRawTransaction(
    //     transaction
    //   );

    // const signature = await signAndSendTransactionRaw(connection, transaction, [wallet.payer]);
    // console.log("signature", slippageBps);
    }
}
async function sendTransactionWithRetry(transaction: Transaction, senderWallet: Keypair, connection: Connection) {
    // Try to send the transaction with up to 3 retries
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            // Fetch a new blockhash for each attempt
            const recentBlockhash = await connection.getRecentBlockhash();
            transaction.recentBlockhash = recentBlockhash.blockhash;

            // Sign the transaction with the sender's wallet
            const signedTransaction = await sendAndConfirmTransaction(
                connection,
                transaction,
                [senderWallet]
            );

            return signedTransaction; // Transaction was successful
        } catch (error: any) {
            console.error(`Attempt ${attempt}: Transaction failed`, error);
            if (error.message === 'BlockhashNotFound' && attempt < 3) {
                console.log(`Retrying transaction...`);
                continue; // Retry if blockhash was not found
            } else {
                throw error; // Throw if a different error or retries exceeded
            }
        }
    }
}
export async function signAndSendTransactionRaw(
    connection: Connection,
    transaction: Transaction | VersionedTransaction,
    signers: Array<Signer>
): Promise<string> {
    try {
        let signature: string;
        if (transaction instanceof VersionedTransaction) {
            transaction.sign(signers);
            signature = await connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: true,
                preflightCommitment: 'finalized',
                maxRetries: 3
            });
        } else {
            transaction.partialSign(...signers);
            signature = await connection.sendRawTransaction(
                transaction.serialize({ requireAllSignatures: false })
            );
        }
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');

        if (!confirmation.value.err) {
          // Transaction was confirmed, return signature
          return signature; 
        } else {
          // Transaction failed, throw error
          throw new Error("Transaction failed: " + signature); 
        }
    } catch (error) {
        console.error("Error signing and sending transaction:", error);
        throw error;
    }
}
  
export function getRawTransaction(encodedTransaction: string): Transaction | VersionedTransaction|null {
    try {
      // Try to deserialize the transaction as a regular Transaction
      return Transaction.from(Buffer.from(encodedTransaction, "base64"));
    } catch (error) {
      
        console.log("this is a versioned txn");
        // If that fails, try to deserialize it as a VersionedTransaction
        return VersionedTransaction.deserialize(Buffer.from(encodedTransaction, "base64"));
      
    }
}

/**
 * Executes a complete transaction sequence.
 * @param inputMint - The input mint for the transaction.
 * @param outputMint - The output mint for the transaction.
 * @param amount - The amount to be swapped.
 * @param slippageBps - The slippage basis points for the transaction.
 * @returns The signature of the processed swap transaction.
 */
export async function completeTransactionSequence(
inputMint: string,
outputMint: string,
amount: string,
slippageBps: number
): Promise<string> {
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
throw new Error('PRIVATE_KEY not set');
}

const wallet = createWalletFromPrivateKey(privateKey);
const quoteResponse = await getQuote(inputMint, outputMint, amount, slippageBps);
const swapTransactionResponse = await getSwapTransaction(quoteResponse, wallet.publicKey.toBase58(), true);

try {
const signature = await processSwapTransaction(swapTransactionResponse.swapTransaction, wallet);
return signature!;
} catch (error) {
console.error("Error processing swap transaction:", error);
throw error;
}
}



//completeTransactionSequence(inputMint, outputMint, amount, slippageBps);

