// src/api/controllers/webhookListener.ts

import { Request, Response } from 'express';
import logger from '../../utils/logger';

export const logWebhookData = (req: Request, res: Response) => {
    try {
        
        logger.info('Received webhook data: %o', req.body);
        res.status(200).send('Webhook data logged successfully');
    } catch (error) {
        logger.error('Error processing webhook data: %o', error);

        res.status(500).send('An error occurred while processing the webhook data');
    }
};
