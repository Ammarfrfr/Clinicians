import axios from 'axios';
import { uploadToCloudinary } from './cloudinary.js';

const getBaseUrl = () => {
  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return `https://graph.facebook.com/${version}/${phoneId}/messages`;
};

const getHeaders = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Format phone number to international format without + or spaces (e.g. 919876543210)
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.length === 10) {
    clean = '91' + clean; // Default to India country code if 10 digits
  }
  return clean;
}

/**
 * Send Plain Text WhatsApp Message
 */
export async function sendTextMessage(to, bodyText) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.warn('⚠️ WhatsApp credentials missing (WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID). Message logged only:');
    console.log(`[TO: ${to}]: ${bodyText}`);
    return { mock: true, body: bodyText };
  }

  const formattedTo = formatPhoneNumber(to);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedTo,
    type: 'text',
    text: {
      preview_url: false,
      body: bodyText,
    },
  };

  try {
    const response = await axios.post(getBaseUrl(), payload, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Meta WhatsApp sendTextMessage error:', JSON.stringify(errData, null, 2));
    throw new Error(error.response?.data?.error?.message || error.message);
  }
}

/**
 * Send Interactive Quick Reply Buttons (Max 3 buttons, button titles max 20 chars)
 */
export async function sendInteractiveButtons(to, bodyText, buttons = []) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[Interactive Buttons to ${to}]: ${bodyText} [${buttons.map((b) => b.title).join(' | ')}]`);
    return { mock: true };
  }

  const formattedTo = formatPhoneNumber(to);

  // If more than 3 options, fallback to List message automatically
  if (buttons.length > 3) {
    return sendInteractiveList(to, bodyText, 'Options', [
      {
        title: 'Choose an option',
        rows: buttons.map((b, idx) => ({
          id: b.id || `btn_${idx}`,
          title: b.title.slice(0, 24),
          description: b.description ? b.description.slice(0, 72) : undefined,
        })),
      },
    ]);
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedTo,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText,
      },
      action: {
        buttons: buttons.map((b, idx) => ({
          type: 'reply',
          reply: {
            id: String(b.id || `btn_${idx}`),
            title: String(b.title).slice(0, 20),
          },
        })),
      },
    },
  };

  try {
    const response = await axios.post(getBaseUrl(), payload, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Meta WhatsApp sendInteractiveButtons error:', JSON.stringify(errData, null, 2));
    // Fallback to text message with numbered options if buttons fail
    const fallbackText = `${bodyText}\n\n` + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
    return sendTextMessage(to, fallbackText);
  }
}

/**
 * Send Interactive List Message (Up to 10 items)
 */
export async function sendInteractiveList(to, bodyText, buttonText = 'Select Option', sections = []) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[Interactive List to ${to}]: ${bodyText}`);
    return { mock: true };
  }

  const formattedTo = formatPhoneNumber(to);
  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedTo,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: {
        text: bodyText,
      },
      action: {
        button: buttonText.slice(0, 20),
        sections: sections.map((sec) => ({
          title: (sec.title || 'Options').slice(0, 24),
          rows: sec.rows.map((r, idx) => ({
            id: String(r.id || `row_${idx}`).slice(0, 200),
            title: String(r.title).slice(0, 24),
            description: r.description ? String(r.description).slice(0, 72) : undefined,
          })),
        })),
      },
    },
  };

  try {
    const response = await axios.post(getBaseUrl(), payload, { headers: getHeaders() });
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error('❌ Meta WhatsApp sendInteractiveList error:', JSON.stringify(errData, null, 2));
    // Fallback to plain text list
    let listText = `${bodyText}\n\n`;
    sections.forEach((sec) => {
      if (sec.title) listText += `*${sec.title}*\n`;
      sec.rows.forEach((r, i) => {
        listText += `${i + 1}. ${r.title}${r.description ? ` (${r.description})` : ''}\n`;
      });
    });
    return sendTextMessage(to, listText);
  }
}

/**
 * Download Media (e.g. image/document sent by patient) and upload to Cloudinary
 */
export async function downloadAndSaveMedia(mediaId, folder = 'whatsapp_patient_files') {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN missing');

  const version = process.env.WHATSAPP_API_VERSION || 'v21.0';

  // 1. Get media URL
  const metaMediaUrl = `https://graph.facebook.com/${version}/${mediaId}`;
  const metaRes = await axios.get(metaMediaUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const downloadUrl = metaRes.data?.url;
  if (!downloadUrl) throw new Error('Failed to retrieve media download URL from Meta');

  // 2. Download raw file buffer
  const fileRes = await axios.get(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
    responseType: 'arraybuffer',
  });

  const buffer = Buffer.from(fileRes.data);

  // 3. Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(buffer, folder);
  return uploadResult;
}
