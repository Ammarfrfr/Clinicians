import { useState, useEffect, useRef } from 'react';
import { Calendar, CheckCircle2, Clock, AlertCircle, Plus, Trash2, Send } from 'lucide-react';
import { apiClient } from '../config.js';
import { shareOnWhatsApp, normalizePhone } from '../utils/whatsappHelper.js';

const NOTE_COLORS = [
  { name: 'Warm Cream', bg: '#F3E4C9', border: '#8B5E3C' },
  { name: 'Sage Green', bg: '#D3D4C0', border: '#6e482d' },
  { name: 'Soft Blue', bg: '#e2edfd', border: '#0A2947' },
  { name: 'Rose', bg: '#fce4ec', border: '#e91e63' },
  { name: 'Amber', bg: '#fff3e0', border: '#ff9800' },
];

export function ReminderDashboard({ patients = [], doctor }) {
  // Tab state: 'notes', 'tasks', 'followups'
  const [activeTab, setActiveTab] = useState('tasks');

  // ─── Keep-style Notes state ───
  const [stickyNotes, setStickyNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('scribologist_keep_notes');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteColor, setNewNoteColor] = useState(0);

  useEffect(() => {
    localStorage.setItem('scribologist_keep_notes', JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  const addStickyNote = (text, colorIdx) => {
    if (!text.trim()) return;
    setStickyNotes(prev => [{
      id: Date.now(),
      text: text.trim(),
      color: colorIdx ?? newNoteColor,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    setNewNoteText('');
  };

  const deleteStickyNote = (id) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
  };

  // ─── TODO state ───
  const [todos, setTodos] = useState(() => {
    try {
      const saved = localStorage.getItem('scribologist_keep_todos');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('medium'); // 'high' | 'medium' | 'low'
  const [newTodoPatientId, setNewTodoPatientId] = useState('');

  useEffect(() => {
    localStorage.setItem('scribologist_keep_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = (text) => {
    if (!text.trim()) return;
    setTodos(prev => [...prev, {
      id: Date.now(),
      text: text.trim(),
      done: false,
      priority: newTodoPriority,
      patientId: newTodoPatientId || null,
      createdAt: new Date().toISOString(),
    }]);
    setNewTodoText('');
    setNewTodoPatientId('');
  };

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  // ─── Voice Dictation for Tasks/Notes ───
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const startVoiceDictation = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processVoiceRecording(blob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('Microphone permission is required for voice dictation.');
    }
  };

  const stopVoiceDictation = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const processVoiceRecording = async (blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'voice_note.webm');

      const response = await apiClient.post('/api/transcribe', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const transcript = response.data?.data?.transcript || response.data?.transcript || '';
      if (!transcript.trim()) {
        setIsTranscribing(false);
        return;
      }

      parseVoiceTranscript(transcript);
    } catch (err) {
      console.error('Voice transcription failed:', err);
      addStickyNote('(Voice dictation failed)', 0);
    } finally {
      setIsTranscribing(false);
    }
  };

  const parseVoiceTranscript = (text) => {
    const lines = text.split(/[.!?\n]+/).map(l => l.trim()).filter(Boolean);
    let noteText = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (
        lower.startsWith('todo') ||
        lower.startsWith('to do') ||
        lower.startsWith('task') ||
        lower.startsWith('remind') ||
        lower.startsWith('remember') ||
        lower.startsWith('checklist') ||
        lower.includes('add task') ||
        lower.includes('need to')
      ) {
        const cleaned = line.replace(/^(todo|to do|task|remind|remember|checklist|add task|need to)[:\s-]*/i, '').trim();
        addTodo(cleaned || line);
      } else {
        noteText.push(line);
      }
    }

    if (noteText.length > 0) {
      addStickyNote(noteText.join('. '), 0);
    }
  };

  // ─── Follow-up Reminders ───
  const [reminders, setReminders] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  useEffect(() => {
    fetchUpcomingReminders();
  }, [patients]);

  const fetchUpcomingReminders = async () => {
    try {
      setReminderLoading(true);
      const response = await apiClient.get('/api/recordings/followups');
      if (response.data.success && response.data.data) {
        setReminders(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching followups:', err);
    } finally {
      setReminderLoading(false);
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
        alert('✅ WhatsApp reminder sent!');
      } else {
        throw new Error(response.data.error || 'Failed to send');
      }
    } catch (err) {
      shareOnWhatsApp(phone, msg);
    } finally {
      setSendingReminderId(null);
    }
  };

  const completedTodos = todos.filter(t => t.done);
  const activeTodos = todos.filter(t => !t.done);

  return (
    <div className="flex flex-col h-full w-full bg-[#F3E4C9] font-sans select-none overflow-y-auto p-6 text-left">
      {/* Header Banner */}
      <div className="bg-white border border-[#D3D4C0] rounded-3xl p-6 shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0A2947] tracking-tight font-serif" style={{ fontFamily: "'Kalice', serif" }}>
            Command Center & Tasks
          </h1>
          <p className="text-xs text-[#0A2947]/70 font-sans mt-0.5">
            Manage your daily tasks, clinic notes, and patient follow-up dispatches.
          </p>
        </div>

        {/* Action Controls & Voice Dictate */}
        <div className="flex items-center gap-2">
          {isTranscribing && (
            <span className="text-[10px] font-mono text-[#8B5E3C] animate-pulse font-bold">Transcribing...</span>
          )}
          <button
            onClick={isRecording ? stopVoiceDictation : startVoiceDictation}
            disabled={isTranscribing}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-none cursor-pointer transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-[#8B5E3C] text-white hover:bg-[#6e482d]'
            } disabled:opacity-40 shadow-xs`}
            title={isRecording ? 'Stop dictation' : 'Dictate tasks & notes'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {isRecording ? <rect x="4" y="4" width="16" height="16" rx="2" /> : <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8" />}
            </svg>
            {isRecording ? 'Stop Dictation' : 'Voice Dictate'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#D3D4C0] pb-2 mb-6">
        {[
          { id: 'tasks', label: 'Tasks & Checklist', count: activeTodos.length },
          { id: 'notes', label: 'Sticky Notes', count: stickyNotes.length },
          { id: 'followups', label: 'Follow-Up Dispatches', count: reminders.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-[#0A2947] text-white border-[#0A2947] shadow-xs'
                : 'bg-white text-[#0A2947] border-[#D3D4C0] hover:bg-[#F3E4C9]/50'
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="ml-1 opacity-75 font-mono">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: Tasks & Checklist ─── */}
      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-6">
          {/* Add Task Card */}
          <div className="bg-white border border-[#D3D4C0] rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-[#0A2947]/70 font-mono">Add New Task</div>
            <div className="flex flex-col md:flex-row gap-2">
              <input
                className="flex-1 px-3 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#8B5E3C] font-sans"
                placeholder="Task description (e.g., Call lab for Mr. Sharma's MRI)..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTodo(newTodoText);
                  }
                }}
              />
              
              {/* Priority Select */}
              <select
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value)}
                className="px-2.5 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs font-bold text-[#0A2947] focus:outline-none"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Patient Link Select */}
              <select
                value={newTodoPatientId}
                onChange={(e) => setNewTodoPatientId(e.target.value)}
                className="px-2.5 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] focus:outline-none max-w-[180px]"
              >
                <option value="">No Linked Patient</option>
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>

              <button
                onClick={() => addTodo(newTodoText)}
                className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#6e482d] text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors shadow-xs shrink-0"
              >
                + Add Task
              </button>
            </div>
          </div>

          {/* Active Tasks */}
          <div className="bg-white border border-[#D3D4C0] rounded-2xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-[#D3D4C0]/40 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0A2947] font-mono">Pending Tasks ({activeTodos.length})</span>
            </div>

            {activeTodos.length === 0 ? (
              <p className="text-xs text-[#0A2947]/50 italic py-4 text-center">No pending tasks! Add one above or dictate via voice.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activeTodos.map((todo) => {
                  const linkedPatient = patients.find((p) => p._id === todo.patientId);
                  return (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-3 bg-[#F9F6F1] border border-[#D3D4C0]/70 rounded-xl hover:border-[#8B5E3C]/40 transition-all group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={todo.done}
                          onChange={() => toggleTodo(todo.id)}
                          className="w-4 h-4 rounded cursor-pointer accent-[#8B5E3C]"
                        />
                        <span className="text-xs font-semibold text-[#0A2947] font-sans truncate">{todo.text}</span>
                        
                        {linkedPatient && (
                          <span className="text-[10px] font-bold text-[#8B5E3C] bg-[#F3E4C9] px-2 py-0.5 rounded-md font-mono shrink-0">
                            👤 {linkedPatient.firstName} {linkedPatient.lastName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full font-mono ${
                          todo.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                          todo.priority === 'low' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {todo.priority || 'medium'}
                        </span>
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Tasks */}
          {completedTodos.length > 0 && (
            <div className="bg-white/60 border border-[#D3D4C0] rounded-2xl p-5 shadow-xs flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#0A2947]/50 font-mono mb-1">
                Completed ({completedTodos.length})
              </div>
              {completedTodos.map((todo) => (
                <div key={todo.id} className="flex items-center justify-between p-2.5 bg-white/40 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={true} onChange={() => toggleTodo(todo.id)} className="w-4 h-4 cursor-pointer accent-[#8B5E3C]" />
                    <span className="text-xs text-[#0A2947]/50 line-through font-sans">{todo.text}</span>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="text-slate-400 hover:text-rose-600 border-none bg-transparent cursor-pointer text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: Sticky Notes ─── */}
      {activeTab === 'notes' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white border border-[#D3D4C0] rounded-2xl p-4 shadow-xs flex flex-col gap-3">
            <textarea
              className="w-full px-3 py-2.5 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#8B5E3C] resize-none font-sans"
              placeholder="Take a quick clinic note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              rows={2}
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                {NOTE_COLORS.map((c, idx) => (
                  <button
                    key={c.name}
                    onClick={() => setNewNoteColor(idx)}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${
                      newNoteColor === idx ? 'scale-125 border-[#0A2947]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.bg }}
                  />
                ))}
              </div>
              <button
                onClick={() => addStickyNote(newNoteText, newNoteColor)}
                className="px-4 py-1.5 bg-[#8B5E3C] text-white text-xs font-bold rounded-xl border-none cursor-pointer hover:bg-[#6e482d]"
              >
                + Save Note
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stickyNotes.map((note) => {
              const color = NOTE_COLORS[note.color] || NOTE_COLORS[0];
              return (
                <div
                  key={note.id}
                  className="rounded-2xl p-4 shadow-xs relative group border"
                  style={{ backgroundColor: color.bg, borderColor: color.border }}
                >
                  <button
                    onClick={() => deleteStickyNote(note.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-500 hover:text-rose-600 w-5 h-5 rounded-full flex items-center justify-center border-none cursor-pointer text-xs"
                  >
                    ✕
                  </button>
                  <p className="text-xs text-[#0A2947] leading-relaxed whitespace-pre-wrap font-sans">{note.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── TAB 3: Follow-Up Dispatches ─── */}
      {activeTab === 'followups' && (
        <div className="bg-white border border-[#D3D4C0] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
          <div className="border-b border-[#D3D4C0]/40 pb-3">
            <h3 className="text-lg font-bold text-[#0A2947] font-serif" style={{ fontFamily: "'Kalice', serif" }}>
              Upcoming Follow-Up Dispatches
            </h3>
            <p className="text-xs text-[#0A2947]/70 font-sans">Automated WhatsApp dispatch for scheduled follow-ups and care plans.</p>
          </div>

          {reminderLoading ? (
            <p className="text-xs text-[#0A2947]/60 italic py-4">Loading scheduled reminders...</p>
          ) : reminders.length === 0 ? (
            <p className="text-xs text-[#0A2947]/60 italic py-6 text-center">No upcoming follow-ups found for the next 7 days.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reminders.map((reminder) => {
                const patientPhone = getPatientPhone(reminder.patientId);
                const formattedDate = new Date(reminder.scheduledFollowUp).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric'
                });

                return (
                  <div key={reminder._id} className="flex items-center justify-between p-4 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl">
                    <div>
                      <div className="text-sm font-bold text-[#0A2947]">{getPatientName(reminder.patientId)}</div>
                      <div className="text-xs text-[#0A2947]/70">Date: <strong>{formattedDate}</strong></div>
                    </div>
                    {patientPhone ? (
                      <button
                        onClick={() => handleSendReminder(reminder)}
                        disabled={sendingReminderId === reminder._id}
                        className="px-3 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-lg border-none cursor-pointer flex items-center gap-1"
                      >
                        <Send width="12" height="12" />
                        Remind WhatsApp
                      </button>
                    ) : (
                      <span className="text-xs text-[#0A2947]/40 font-mono">No Phone</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
