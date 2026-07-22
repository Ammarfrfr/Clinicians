import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { apiClient } from '../config.js';
import { shareOnWhatsApp, normalizePhone } from '../utils/whatsappHelper.js';

export function ReminderDashboard({ patients, doctor }) {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  useEffect(() => {
    fetchUpcomingReminders();
  }, [patients]);

  const fetchUpcomingReminders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/recordings/followups');
      if (response.data.success && response.data.data) {
        setReminders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p._id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient';
  };

  const getPatientPhone = (patientId) => {
    const patient = patients.find((p) => p._id === patientId);
    return patient?.contactInfo?.phone || '';
  };

  const handleSendReminder = async (reminder) => {
    const phone = getPatientPhone(reminder.patientId);
    if (!phone) {
      alert('Patient does not have a registered phone number.');
      return;
    }

    const patientName = getPatientName(reminder.patientId);
    const docName = doctor?.profile?.name || 'Your Doctor';
    const dateStr = new Date(reminder.scheduledFollowUp).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });

    let msg = `*Scribologist Appointment Reminder*\n`;
    msg += `------------------------------------\n`;
    msg += `Dear *${patientName}*,\n\n`;
    msg += `This is a friendly reminder for your upcoming follow-up appointment with *Dr. ${docName}*.\n\n`;
    msg += `*Date:* ${dateStr}\n`;
    if (reminder.clinicalNote?.followup) {
      msg += `*Instructions:* ${reminder.clinicalNote.followup}\n`;
    }
    msg += `------------------------------------\n`;
    msg += `Looking forward to seeing you. Please let us know if you need to reschedule.`;

    setSendingReminderId(reminder._id);
    try {
      const response = await apiClient.post('/api/whatsapp/send', { to: phone, message: msg });
      if (response.data.success) {
        alert('✅ WhatsApp reminder sent via Twilio!');
      } else {
        throw new Error(response.data.error || 'Failed to send');
      }
    } catch (err) {
      console.warn('Twilio send failed, falling back to Web WhatsApp share:', err.message);
      shareOnWhatsApp(phone, msg);
    } finally {
      setSendingReminderId(null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-5 text-left select-none">
      <div className="border-b border-slate-100 pb-3 flex flex-col gap-1">
        <h3
          className="text-2xl font-normal text-[#22252a] tracking-tight mb-1"
          style={{ fontFamily: "'Kalice', 'Kalice-Trial', 'Kalice-Regular', 'Instrument Serif', Georgia, serif" }}
        >
          Follow-Up & Rehab Dispatch
        </h3>
        <p className="text-xs text-slate-500 font-sans">Dispatch WhatsApp reminders and rehab exercises scheduled for the next 7 days.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-500 py-8 text-center text-sm font-medium">
          <span className="animate-spin border-2 border-teal border-t-transparent rounded-full w-6 h-6"></span>
          Loading reminders...
        </div>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400 py-8 text-center text-sm font-medium border border-dashed border-gray-200 rounded-xl">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
          </svg>
          <p>No follow-up appointments scheduled for the next 7 days.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-2">
          {reminders.map((reminder) => {
            const patientPhone = getPatientPhone(reminder.patientId);
            const formattedDate = new Date(reminder.scheduledFollowUp).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div key={reminder._id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:border-teal/30 transition-all gap-4">
                <div className="flex flex-col gap-1 text-left flex-1">
                  <div className="text-sm font-semibold text-navy">{getPatientName(reminder.patientId)}</div>
                  <div className="text-xs text-gray-500">Scheduled: <strong>{formattedDate}</strong></div>
                  {reminder.clinicalNote?.followup && (
                    <div className="text-xs text-gray-600 mt-1">
                      <span className="font-bold text-gray-500">Advice:</span> {reminder.clinicalNote.followup}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {patientPhone ? (
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-semibold rounded-lg transition-colors border-none cursor-pointer shadow-xs disabled:opacity-55 disabled:cursor-not-allowed"
                      onClick={() => handleSendReminder(reminder)}
                      disabled={sendingReminderId === reminder._id}
                    >
                      {sendingReminderId === reminder._id ? (
                        <span className="animate-spin border border-white border-t-transparent rounded-full w-3 h-3"></span>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.031 2C6.446 2 1.92 6.509 1.916 12.067c-.002 1.777.466 3.511 1.355 5.038L2 22l5.068-1.32c1.478.801 3.136 1.222 4.829 1.229h.004c5.584 0 10.113-4.509 10.117-10.07A10.007 10.007 0 0 0 12.031 2zm5.726 13.882c-.314.876-1.572 1.606-2.177 1.706-.554.092-1.282.164-3.79-.824-3.21-1.264-5.263-4.526-5.424-4.739-.161-.212-1.3-1.722-1.3-3.284 0-1.562.822-2.327 1.118-2.628.298-.3.65-.375.867-.375h.619c.198 0 .463-.075.725.556.262.631.897 2.18.974 2.332.078.152.13.328.026.531-.102.203-.153.328-.306.506-.153.178-.323.398-.461.534-.153.152-.314.318-.135.62.18.3.8 1.309 1.714 2.115 1.173 1.039 2.16 1.361 2.463 1.512.302.152.48.127.66-.076.18-.203.774-.897.98-1.201.206-.304.412-.253.695-.152.284.101 1.796.837 2.106.988.31.152.516.228.593.354.077.127.077.734-.237 1.61z"/>
                        </svg>
                      )}
                      {sendingReminderId === reminder._id ? 'Sending...' : 'Remind WhatsApp'}
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium italic">No Phone</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
