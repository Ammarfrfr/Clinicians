import { Router } from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import {
  verifyWebhook,
  handleWebhookEvent,
  sendDirectMessage,
  getPatientMessages,
} from '../controller/whatsapp.controller.js';

const router = Router();

// Meta WhatsApp Webhook endpoints (Public for Meta Graph API)
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhookEvent);

// Authenticated Doctor/Staff endpoints
router.post('/send', verifyJwt, sendDirectMessage);
router.get('/messages/:patientId', verifyJwt, getPatientMessages);

export default router;
