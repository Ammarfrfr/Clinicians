import twilio from 'twilio';

// Initialize the Twilio client using env variables (noting spelling "TWILLO" in .env)
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILLO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default sandbox number

let client = null;

if (accountSid && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error.message);
  }
} else {
  console.warn('Twilio credentials missing in environment. WhatsApp messages will not be sent.');
}

/**
 * Send WhatsApp Message
 * @param {string} to - Recipient phone number (e.g. "+919876543210" or "919876543210")
 * @param {string} body - Message body content
 * @returns {Promise<object>} - Message delivery payload or throws error
 */
export async function sendWhatsAppMessage(to, body) {
  if (!client) {
    throw new Error('Twilio client is not configured.');
  }

  // Format recipient number for WhatsApp API: must have "whatsapp:" prefix
  let formattedTo = to;
  if (!formattedTo.startsWith('whatsapp:')) {
    let cleanTo = to.replace(/[^\d+]/g, '');
    if (!cleanTo.startsWith('+')) {
      if (cleanTo.length === 10) {
        cleanTo = '+91' + cleanTo;
      } else {
        cleanTo = '+' + cleanTo;
      }
    }
    formattedTo = `whatsapp:${cleanTo}`;
  }

  const from = whatsappNumber.startsWith('whatsapp:') ? whatsappNumber : `whatsapp:${whatsappNumber}`;

  try {
    const message = await client.messages.create({
      from,
      to: formattedTo,
      body,
    });
    console.log(`WhatsApp reminder sent to ${formattedTo} (SID: ${message.sid})`);
    return message;
  } catch (error) {
    console.error(`Failed to send WhatsApp message to ${formattedTo}:`, error.message);
    throw error;
  }
}
