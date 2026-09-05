import cron from 'node-cron';
import { Appointment } from '../models/appointment.model.js';
import { Patient } from '../models/patient.model.js';
import { User } from '../models/user.model.js';
import { sendTextMessage } from './metaWhatsapp.js';
import { WhatsAppMessage } from '../models/whatsappMessage.model.js';

/**
 * Sends evening pre-visit confirmation and prep reminder for all appointments happening tomorrow.
 */
export async function sendEveningAppointmentReminders() {
  console.log('🔄 Checking for tomorrow\'s confirmed appointments for pre-visit reminders...');

  const tomorrowStart = new Date();
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  tomorrowStart.setHours(0, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setHours(23, 59, 59, 999);

  try {
    const upcomingAppointments = await Appointment.find({
      status: 'confirmed',
      'proposedSlot.date': {
        $gte: tomorrowStart,
        $lte: tomorrowEnd,
      },
      reminderSent: { $ne: true },
    }).populate('patientId doctorId');

    console.log(`🔍 Found ${upcomingAppointments.length} confirmed appointments for tomorrow.`);

    for (const appt of upcomingAppointments) {
      try {
        const patient = appt.patientId;
        const doctor = appt.doctorId;

        if (!patient) continue;
        const phone = patient.whatsappNumber || patient.contactInfo?.phone;
        if (!phone) {
          console.warn(`⚠️ Patient ${patient._id} has no phone number. Skipping reminder.`);
          continue;
        }

        const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
        const docName = doctor?.profile?.name || 'Dr. Specialist';
        const timeSlot = appt.proposedSlot.startTime
          ? `${appt.proposedSlot.startTime} - ${appt.proposedSlot.endTime}`
          : 'your scheduled time';
        const location = appt.proposedSlot.location || 'Clinic';

        const reminderMsg =
          `*Appointment Reminder & Quick Check-in*\n` +
          `------------------------------------\n` +
          `Hello *${patientName}*,\n\n` +
          `This is a friendly reminder of your upcoming consultation with *Dr. ${docName}* tomorrow.\n\n` +
          `📍 *Location:* ${location}\n` +
          `🕒 *Time:* ${timeSlot}\n\n` +
          `*To help Dr. ${docName} prepare, please reply with:* \n` +
          `1. How are you feeling today compared to when you scheduled?\n` +
          `2. Any new symptoms or concerns?\n` +
          `3. If you have any recent X-ray, MRI or blood reports, feel free to send a photo here now.\n\n` +
          `_You can simply type your answer or send photos directly to this chat._`;

        await sendTextMessage(phone, reminderMsg);

        // Record message in thread
        await WhatsAppMessage.create({
          patientId: patient._id,
          doctorId: doctor?._id || null,
          direction: 'outbound',
          body: reminderMsg,
          messageType: 'text',
          status: 'sent',
          metadata: { appointmentId: appt._id, type: 'pre_visit_reminder' },
        });

        appt.reminderSent = true;
        appt.reminderSentAt = new Date();
        await appt.save();

        console.log(`✅ Pre-visit reminder sent to ${patientName} (${phone})`);
      } catch (err) {
        console.error(`❌ Failed to send pre-visit reminder for appointment ${appt._id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in sendEveningAppointmentReminders:', error.message);
  }
}

/**
 * Initializes the Pre-Visit reminder cron: runs at 7:00 PM (19:00) every day
 */
export function initAppointmentReminderCron() {
  // '0 19 * * *' = 7:00 PM daily
  cron.schedule('0 19 * * *', async () => {
    console.log('⏰ Cron triggered: Evening pre-visit reminder check.');
    await sendEveningAppointmentReminders();
  });
  console.log('📅 Pre-visit reminder cron scheduled for 07:00 PM daily.');
}
