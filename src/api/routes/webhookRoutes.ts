import { Router } from 'express';
import { logWebhookData } from '../controllers/webHookListener';

const router = Router();

router.post('/webhook', logWebhookData);

export default router;
