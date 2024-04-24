// src/api/controllers/webhookListener.ts

import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { completeTransactionSequence } from './jupController';
import { web3 } from '@project-serum/anchor';
import { connection, getNumberDecimals, getSolBalance,  } from './solanaController';
import { Connection, PublicKey } from '@solana/web3.js';




const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const SOL_MINT = "So11111111111111111111111111111111111111112";
const SLIPPAGE_BPS = 100;

export const executeWebhook = async (req: Request, res: Response) => {
try {
logger.info('Received webhook data: %o', req.body);
const trigger = req.body;

if (trigger.side === "buy") {
await handleBuyTransaction(trigger);
} else if (trigger.side === "sell") {
await handleSellTransaction(trigger);
}

res.status(200).send('Webhook data logged successfully');
} catch (error: any) {
handleError(error, res);
}
};

/**
 * Handles a buy transaction.
 * @param trigger - The trigger object containing information about the transaction.
 */
const handleBuyTransaction = async (trigger:any) => {
  // Retrieve the number of decimals for the token
  const tokenDecimals = await getNumberDecimals(connection, new PublicKey(USDC_MINT));

  const amount = 20;
  const transferValue = BigInt(amount * 10 ** tokenDecimals);

  // Complete the transaction sequence
  await completeTransactionSequence(USDC_MINT, SOL_MINT, transferValue.toString(), SLIPPAGE_BPS);
};

/**
 * Initiates a sell transaction.
 * Retrieves the SOL balance of a specific wallet address, calculates the amount to sell,
 * and calls the `completeTransactionSequence` function to execute the transaction.
 * 
 * @param trigger - An object containing information about the transaction trigger.
 */
const handleSellTransaction = async (trigger: any) => {
  console.log("Sell transaction");

  // Retrieve the SOL balance of a specific wallet address
  const solBalance = await getSolBalance("E7uCNsxrmCPypNkqhvLM43MRAyip4yrv8nqedjPs5LYB");

  // Calculate the amount to sell
  const amount = solBalance * web3.LAMPORTS_PER_SOL;
  const solLamports = amount - (0.01 * web3.LAMPORTS_PER_SOL);

  console.log("Initiating sell transaction for ", solLamports / web3.LAMPORTS_PER_SOL, "SOL");

  // Execute the sell transaction
  await completeTransactionSequence(SOL_MINT, USDC_MINT, solLamports.toString(), SLIPPAGE_BPS);
};

const handleError = (error: Error, res: Response) => {
logger.error('Error processing webhook data: %o', error);
res.status(500).send('An error occurred while processing the webhook data');
};


