// src/api/controllers/webhookListener.ts

import { Request, Response } from 'express';
import logger from '../../utils/logger';
import { completeTransactionSequence } from './jupController';
import { web3 } from '@project-serum/anchor';
import { connection, getNumberDecimals, getSolBalance,  } from './solanaController';
import { Connection, PublicKey } from '@solana/web3.js';




export const  logWebhookData = async (req: Request, res: Response) => {
    try {
        logger.info('Received webhook data: %o', req.body);

        const trigger = req.body;
        let inputMint, outputMint, amount, slippageBps;
        slippageBps = 100;
        if (trigger.side === "buy") {
            inputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // usdc
            outputMint = "So11111111111111111111111111111111111111112"; // sol
            const tokenDecimals = await getNumberDecimals(connection, new PublicKey(inputMint));
            amount =  10;
            const transferValue = BigInt(amount * Math.pow(10, tokenDecimals))
            await completeTransactionSequence(inputMint, outputMint, transferValue.toString(), slippageBps);
        } else {
            inputMint = "So11111111111111111111111111111111111111112"; // sol
            outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // usdc
            const solBalance = await getSolBalance("E7uCNsxrmCPypNkqhvLM43MRAyip4yrv8nqedjPs5LYB");
            amount = solBalance - 0.01;
            const solLamports = amount * web3.LAMPORTS_PER_SOL;
            await completeTransactionSequence(inputMint, outputMint, solLamports.toString(), slippageBps);
     
        }
       

        res.status(200).send('Webhook data logged successfully');
    } catch (error) {
        logger.error('Error processing webhook data: %o', error);

        res.status(500).send('An error occurred while processing the webhook data');
    }
};


