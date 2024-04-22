import { Router } from 'express';
import { logWebhookData } from '../controllers/webHookListener';

const router = Router();

router.post('/', logWebhookData);

export default router;
