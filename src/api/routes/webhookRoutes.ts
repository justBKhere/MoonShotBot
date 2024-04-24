import { Router } from 'express';
import { executeWebhook } from '../controllers/webHookListener';

const router = Router();

router.post('/', executeWebhook);

export default router;
