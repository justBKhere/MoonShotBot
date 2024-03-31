import { Router, Request, Response } from 'express';
import { getQuote } from '../controllers/jupController';

const router = Router();

router.get('/get-quote', async (req: Request, res: Response) => {
  const { inputMint, outputMint, amount, slippageBps } = req.body;
  const quoteResponse = await getQuote(inputMint, outputMint, Number(amount), Number(slippageBps));
  res.status(200).json(quoteResponse);
});

export default router;
