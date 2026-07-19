import cron from 'node-cron';
import { Recording } from '../models/recording.model.js';
import { Patient } from '../models/patient.model.js';
import { User } from '../models/user.model.js';
import { sendWhatsAppMessage } from './twilio.js';

/**
 * Parses and sends scheduled follow-up reminders.
 */
export async function sendScheduledReminders() {
  console.log('🔄 Checking for scheduled follow-up reminders...');

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  try {
    // Find recordings scheduled for today where reminder was not yet sent
    const pendingReminders = await Recording.find({
      scheduledFollowUp: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
      followUpReminderSent: { $ne: true },
      patientId: { $exists: true, $ne: null },
    });

    console.log(`🔍 Found ${pendingReminders.length} pending follow-up reminders for today.`);

    for (const recording of pendingReminders) {
      try {
        // Fetch patient
        const patient = await Patient.findById(recording.patientId);
        if (!patient || !patient.contactInfo?.phone) {
          console.warn(`⚠️ Patient not found or has no phone number for recording ${recording._id}. Skipping.`);
          continue;
        }

        // Fetch doctor
        let docName = 'Your Doctor';
        if (recording.userId && recording.userId !== 'anonymous') {
          const doctor = await User.findById(recording.userId);
          if (doctor && doctor.profile?.name) {
            docName = doctor.profile.name;
          }
        }

        const patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
        const dateStr = new Date(recording.scheduledFollowUp).toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        });

        // Construct message
        let msg = `*Scribologist Appointment Reminder*\n`;
        msg += `------------------------------------\n`;
        msg += `Dear *${patientName}*,\n\n`;
        msg += `This is a friendly reminder for your upcoming follow-up appointment with *Dr. ${docName}*.\n\n`;
        msg += `*Date:* ${dateStr}\n`;
        if (recording.clinicalNote?.followup) {
          msg += `*Instructions:* ${recording.clinicalNote.followup}\n`;
        }
        msg += `------------------------------------\n`;
        msg += `Looking forward to seeing you. Please let us know if you need to reschedule.`;

        // Send via Twilio
        await sendWhatsAppMessage(patient.contactInfo.phone, msg);

        // Update recording state
        recording.followUpReminderSent = true;
        await recording.save();

      } catch (err) {
        console.error(`❌ Failed to process reminder for recording ${recording._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('❌ Error executing scheduled reminders check:', err.message);
  }
}

// Start the daily cron job: runs at 9:00 AM every day
export function initReminderCron() {
  // '0 9 * * *' = at 09:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Cron triggered: executing daily follow-up reminders.');
    await sendScheduledReminders();
  });
  console.log('📅 Reminder cron job scheduled for 09:00 AM daily.');
}
