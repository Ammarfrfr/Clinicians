import { sendTextMessage } from './metaWhatsapp.js';

/**
 * Backwards-compatible sendWhatsAppMessage redirecting to Meta Cloud API client
 */
export async function sendWhatsAppMessage(to, body) {
  return await sendTextMessage(to, body);
}
