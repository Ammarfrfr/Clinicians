/**
 * Normalize raw phone numbers to standard format without spaces/special chars.
 * If 10 digits, prepends Indian country code '91' by default.
 * Handles foreign country codes as well.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  // Strip all non-numeric characters except +
  let cleaned = rawPhone.replace(/[^\d+]/g, '');
  
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it's a standard 10-digit Indian number without country code
  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    cleaned = '91' + cleaned;
  }
  
  return cleaned;
}

/**
 * Generates the WhatsApp text message body for prescriptions
 */
export function generatePrescriptionMessage(patient, doctor, note) {
  const patientName = `${patient.firstName || 'Patient'} ${patient.lastName || ''}`.trim();
  const doctorName = doctor?.profile?.name || 'Your Doctor';
  const hospitalName = doctor?.profile?.hospital || '';
  
  let msg = `*Scribologist Treatment Plan*\n`;
  msg += `------------------------------------\n`;
  msg += `*Patient Name:* ${patientName}\n`;
  msg += `*Doctor:* ${doctorName}\n`;
  if (hospitalName) msg += `*Clinic/Hospital:* ${hospitalName}\n`;
  msg += `------------------------------------\n\n`;
  
  // Parse prescription
  const prescription = note?.prescription;
  const rxArray = Array.isArray(prescription)
    ? prescription
    : typeof prescription === 'string'
    ? [{ drug: prescription, dose: '', frequency: '' }]
    : [];
    
  if (rxArray.length > 0) {
    msg += `*💊 Prescriptions:*\n`;
    rxArray.forEach((med) => {
      const drug = med.drug || 'Medication';
      const dose = med.dose ? ` (${med.dose})` : '';
      const freq = med.frequency ? ` - ${med.frequency}` : '';
      msg += `• ${drug}${dose}${freq}\n`;
    });
    msg += `\n`;
  }
  
  if (note?.followup) {
    msg += `*📅 Follow-up Advice:*\n`;
    msg += `${note.followup}\n\n`;
  }
  
  msg += `*Please note:* This is an AI-assisted documentation summary. Check your physical prescription copy for final instructions.`;
  return msg;
}

/**
 * Open WhatsApp Web/App window with normalized number and message
 */
export function shareOnWhatsApp(phone, message) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    alert('Invalid phone number provided for WhatsApp sharing.');
    return;
  }
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${normalized}?text=${encoded}`;
  window.open(url, '_blank');
}
