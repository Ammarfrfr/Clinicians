import { Router } from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import { sendWhatsAppMessage } from '../Utils/twilio.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

const router = Router();

router.post(
  '/send',
  verifyJwt,
  asyncHandler(async (req, res) => {
    const { to, message } = req.body;

    if (!to || !message) {
      throw new ApiError(400, 'Phone number (to) and message body (message) are required.');
    }

    try {
      await sendWhatsAppMessage(to, message);
      return res.status(200).json(
        new ApiResponse(200, null, 'WhatsApp message sent successfully')
      );
    } catch (err) {
      throw new ApiError(500, err.message || 'Failed to send WhatsApp message via Twilio.');
    }
  })
);

export default router;
