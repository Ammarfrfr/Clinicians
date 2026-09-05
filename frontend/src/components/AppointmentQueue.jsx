import { useState, useEffect } from 'react';
import { apiClient } from '../config';

export function AppointmentQueue({ onSelectPatient }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('proposed');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [quickMsg, setQuickMsg] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/appointments', {
        params: statusFilter !== 'all' ? { status: statusFilter } : {},
      });
      setAppointments(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [statusFilter]);

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      await apiClient.patch(`/api/appointments/${appointmentId}/status`, {
        status: newStatus,
      });
      setActionSuccess(`Appointment marked as ${newStatus}! Patient notified via WhatsApp.`);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchAppointments();
      if (selectedAppointment?._id === appointmentId) {
        setSelectedAppointment((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleOpenTimeline = async (appt) => {
    setSelectedAppointment(appt);
    const patientId = appt.patientId?._id;
    if (!patientId) return;

    setTimelineLoading(true);
    try {
      const res = await apiClient.get(`/api/appointments/timeline/${patientId}`);
      setTimelineData(res.data?.data || null);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleSendQuickWhatsApp = async (e) => {
    e.preventDefault();
    if (!quickMsg.trim() || !selectedAppointment?.patientId?._id) return;
    setSendingMsg(true);
    try {
      await apiClient.post('/api/whatsapp/send', {
        patientId: selectedAppointment.patientId._id,
        message: quickMsg.trim(),
      });
      setQuickMsg('');
      setActionSuccess('WhatsApp message sent directly to patient!');
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert('Failed to send WhatsApp message: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F6F1] overflow-hidden text-[#0A2947]">
      {/* Header */}
      <div className="px-8 py-6 border-b border-[#D3D4C0] bg-white/70 backdrop-blur-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-serif tracking-tight text-[#0A2947]">
              WhatsApp Pre-Consult & Appointment Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8B5E3C]/10 text-[#8B5E3C] border border-[#8B5E3C]/20">
              Pilot Orthopedics
            </span>
          </div>
          <p className="text-sm text-[#0A2947]/70 mt-1">
            Review patient intake briefs submitted via WhatsApp, confirm appointment slots, and inspect longitudinal histories.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-[#F3E4C9]/40 p-1.5 rounded-xl border border-[#D3D4C0]">
          {['proposed', 'confirmed', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none ${
                statusFilter === tab
                  ? 'bg-[#8B5E3C] text-white shadow-xs'
                  : 'bg-transparent text-[#0A2947]/70 hover:text-[#0A2947]'
              }`}
            >
              {tab === 'proposed' ? `Proposed (${appointments.filter((a) => a.status === 'proposed').length || 0})` : tab}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="mx-8 mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <span>✨</span>
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden p-8 gap-6">
        {/* Left: Appointment Cards List */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[#0A2947]/50 text-sm">
              Loading WhatsApp appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-dashed border-[#D3D4C0] p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F3E4C9] flex items-center justify-center text-xl mb-3">📋</div>
              <div className="font-semibold text-base">No appointments in this queue</div>
              <div className="text-xs text-[#0A2947]/60 mt-1 max-w-sm">
                When patients chat with your Meta WhatsApp number and complete the orthopedic intake, their proposed slots will appear here.
              </div>
            </div>
          ) : (
            appointments.map((appt) => {
              const patient = appt.patientId || {};
              const intake = appt.intakeId || {};
              const extract = intake.structuredExtract || {};
              const slotDate = new Date(appt.proposedSlot?.date).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });

              const isSelected = selectedAppointment?._id === appt._id;
              const hasRedFlags = (intake.urgencyFlags || []).length > 0;

              return (
                <div
                  key={appt._id}
                  onClick={() => handleOpenTimeline(appt)}
                  className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                    isSelected
                      ? 'border-[#8B5E3C] ring-2 ring-[#8B5E3C]/20'
                      : hasRedFlags
                      ? 'border-red-300 bg-red-50/20'
                      : 'border-[#D3D4C0] hover:border-[#8B5E3C]/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-base text-[#0A2947]">
                          {patient.firstName} {patient.lastName || ''}
                        </span>
                        <span className="text-xs font-mono text-[#0A2947]/60">
                          {patient.whatsappNumber || patient.contactInfo?.phone || 'No phone'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            appt.status === 'proposed'
                              ? 'bg-amber-100 text-amber-800'
                              : appt.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      {/* Location & Slot Pill */}
                      <div className="flex items-center gap-2 mt-2 text-xs text-[#0A2947]/80">
                        <span className="font-semibold text-[#8B5E3C]">📅 {slotDate}</span>
                        <span>•</span>
                        <span>🕒 {appt.proposedSlot?.startTime || '10:00 AM'}</span>
                        <span>•</span>
                        <span className="bg-[#F9F6F1] px-2 py-0.5 rounded border border-[#D3D4C0]">
                          📍 {appt.proposedSlot?.location || 'Main Clinic'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Confirm/Cancel Buttons */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {appt.status === 'proposed' && (
                        <button
                          onClick={() => handleStatusChange(appt._id, 'confirmed')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer border-none shadow-xs transition-all hover:scale-105"
                          title="Call patient, confirm time, and dispatch WhatsApp confirmation"
                        >
                          ✓ Confirm Slot
                        </button>
                      )}
                      {appt.status === 'confirmed' && (
                        <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                          ✓ Confirmed by Staff
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pre-Consult Intake Summary Snippet */}
                  {extract.chiefComplaint || extract.affectedBodyPart ? (
                    <div className="mt-4 pt-3 border-t border-[#D3D4C0]/40 bg-[#F9F6F1]/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-1">
                        AI Pre-Consult Brief
                      </div>
                      <div className="text-xs text-[#0A2947] font-medium leading-relaxed">
                        {extract.summary ||
                          `Affected: ${extract.affectedBodyPart || 'Joint'} (${extract.onsetType || 'Gradual'}) · Pain: ${
                            extract.painLevel || 'Moderate'
                          } · Mobility: ${extract.mobilityStatus || 'Normal'}`}
                      </div>

                      {hasRedFlags && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-bold">
                          <span>🚨 Urgent Flag:</span>
                          <span>{intake.urgencyFlags.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Patient Record & Intake Drawer */}
        <div className="w-[440px] bg-white rounded-3xl border border-[#D3D4C0] shadow-sm flex flex-col overflow-hidden">
          {selectedAppointment ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#D3D4C0] bg-[#F9F6F1]/80">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#0A2947]">
                      {selectedAppointment.patientId?.firstName} {selectedAppointment.patientId?.lastName || ''}
                    </h2>
                    <div className="text-xs text-[#0A2947]/70 font-mono mt-0.5">
                      {selectedAppointment.patientId?.whatsappNumber || selectedAppointment.patientId?.contactInfo?.phone}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="w-7 h-7 rounded-full bg-white border border-[#D3D4C0] text-[#0A2947]/60 hover:text-[#0A2947] flex items-center justify-center cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Action Bar */}
                <div className="flex items-center gap-2 mt-4">
                  {selectedAppointment.status === 'proposed' && (
                    <button
                      onClick={() => handleStatusChange(selectedAppointment._id, 'confirmed')}
                      className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer border-none shadow-xs"
                    >
                      ✓ Mark Confirmed
                    </button>
                  )}
                  <button
                    onClick={() => handleStatusChange(selectedAppointment._id, 'cancelled')}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  {onSelectPatient && selectedAppointment.patientId && (
                    <button
                      onClick={() => onSelectPatient(selectedAppointment.patientId)}
                      className="px-3 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#6e482d] text-white text-xs font-semibold cursor-pointer border-none shadow-xs"
                      title="Open in Scribe Workspace"
                    >
                      Open Scribe
                    </button>
                  )}
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {timelineLoading ? (
                  <div className="text-center py-8 text-xs text-[#0A2947]/50">Loading patient timeline...</div>
                ) : (
                  <>
                    {/* 1. Intake Responses Section */}
                    {selectedAppointment.intakeId && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C] mb-3 flex items-center justify-between">
                          <span>WhatsApp Intake Responses</span>
                          <span className="text-[10px] bg-[#F3E4C9] text-[#8B5E3C] px-2 py-0.5 rounded">
                            {selectedAppointment.intakeId.visitType || 'New'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2.5 bg-[#F9F6F1] p-4 rounded-2xl border border-[#D3D4C0]">
                          {selectedAppointment.intakeId.responses?.map((r, i) => (
                            <div key={i} className="text-xs border-b border-[#D3D4C0]/40 pb-2 last:border-none last:pb-0">
                              <div className="text-[#0A2947]/60 font-medium">{r.question}</div>
                              <div className="text-[#0A2947] font-semibold mt-0.5">{r.answer || '—'}</div>
                              {r.mediaUrl && (
                                <a
                                  href={r.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-600 underline font-medium"
                                >
                                  📷 View Attached Photo/Report
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 2. Patient Files / X-rays repository */}
                    {selectedAppointment.patientId?.files?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C] mb-3">
                          Patient Uploads ({selectedAppointment.patientId.files.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedAppointment.patientId.files.map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2.5 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs hover:border-[#8B5E3C] transition-all flex flex-col"
                            >
                              <span className="font-semibold text-[#0A2947] truncate">
                                📎 {file.category || 'WhatsApp Upload'}
                              </span>
                              <span className="text-[10px] text-[#0A2947]/60 mt-1">
                                {new Date(file.uploadedAt).toLocaleDateString('en-IN')}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Past Consultations / SOAP Notes */}
                    {timelineData?.recordings?.length > 0 && (
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-[#8B5E3C] mb-3">
                          Past Encounters & SOAP Notes ({timelineData.recordings.length})
                        </div>
                        <div className="flex flex-col gap-3">
                          {timelineData.recordings.map((rec) => (
                            <div
                              key={rec._id}
                              className="p-4 bg-white border border-[#D3D4C0] rounded-2xl shadow-2xs text-xs flex flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between text-[#0A2947]/60 font-mono text-[10px]">
                                <span>{new Date(rec.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">Finalized Note</span>
                              </div>
                              <div className="font-bold text-[#0A2947]">
                                {rec.clinicalNote?.assessment || 'Orthopedic Consultation'}
                              </div>
                              {rec.clinicalNote?.plan && (
                                <div className="text-[#0A2947]/80 text-[11px] line-clamp-2">
                                  <strong>Plan:</strong> {rec.clinicalNote.plan}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Drawer Footer: Quick WhatsApp Responder */}
              <form onSubmit={handleSendQuickWhatsApp} className="p-4 border-t border-[#D3D4C0] bg-white flex gap-2">
                <input
                  type="text"
                  value={quickMsg}
                  onChange={(e) => setQuickMsg(e.target.value)}
                  placeholder="Type WhatsApp message to patient..."
                  className="flex-1 px-3 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] focus:outline-none focus:border-[#8B5E3C]"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !quickMsg.trim()}
                  className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-xl text-xs font-semibold cursor-pointer border-none disabled:opacity-50"
                >
                  {sendingMsg ? '...' : 'Send WA'}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#0A2947]/40 text-xs">
              <div className="text-3xl mb-2">👈</div>
              Select any appointment from the queue to inspect their WhatsApp intake brief and medical history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
