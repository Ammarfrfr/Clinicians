import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../config.js';
import {
  getStoredSessions,
  saveStoredSessions,
  getStoredActiveSessionId,
  setStoredActiveSessionId,
  createNewChatSession,
  deleteChatSession,
  generateSmartChatTitle,
  CHATS_UPDATED_EVENT
} from '../utils/chatStorage.js';

export function ChatHistoryDashboard({ doctor, patients }) {
  const [sessions, setSessions] = useState(() => getStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState(() => getStoredActiveSessionId());
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [activePatientId, setActivePatientId] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Sync state with storage events across components
  useEffect(() => {
    const handleStorageUpdate = () => {
      const updatedSessions = getStoredSessions();
      const updatedActiveId = getStoredActiveSessionId();
      setSessions(updatedSessions);
      setActiveSessionId(updatedActiveId);
    };

    window.addEventListener(CHATS_UPDATED_EVENT, handleStorageUpdate);
    return () => window.removeEventListener(CHATS_UPDATED_EVENT, handleStorageUpdate);
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleCreateNewChat = () => {
    createNewChatSession();
  };

  const handleDeleteChat = (id, e) => {
    e.stopPropagation();
    deleteChatSession(id);
  };

  const handleSelectSession = (id) => {
    setStoredActiveSessionId(id);
  };

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    let currentActiveId = activeSessionId;
    let allSessions = [...sessions];
    let targetSession = allSessions.find(s => s.id === currentActiveId);

    if (!targetSession) {
      const newSess = createNewChatSession();
      currentActiveId = newSess.id;
      allSessions = getStoredSessions();
      targetSession = allSessions.find(s => s.id === currentActiveId);
    }

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim()
    };

    const needsTitle = targetSession && (targetSession.title === 'New AI Chat' || targetSession.title === 'New AI Chat Session' || !targetSession.title);

    const updatedSessions = allSessions.map(s => {
      if (s.id === currentActiveId) {
        return {
          ...s,
          messages: [...s.messages, userMessage]
        };
      }
      return s;
    });

    saveStoredSessions(updatedSessions);
    setInputText('');
    setSending(true);

    if (needsTitle) {
      generateSmartChatTitle(currentActiveId, text.trim());
    }

    try {
      const selectedPatient = patients?.find(p => p._id === activePatientId) || null;

      const response = await apiClient.post('/api/chat', {
        message: text.trim(),
        patient: selectedPatient,
        note: null
      });

      const data = response.data;
      if (data.success && data.data) {
        const { response: aiReply } = data.data;

        const latestSessions = getStoredSessions();
        const withAiReply = latestSessions.map(s => {
          if (s.id === currentActiveId) {
            return {
              ...s,
              messages: [...s.messages, {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: aiReply
              }]
            };
          }
          return s;
        });
        saveStoredSessions(withAiReply);
      } else {
        throw new Error(data.message || 'No response returned');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const latestSessions = getStoredSessions();
      const withError = latestSessions.map(s => {
        if (s.id === currentActiveId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: (Date.now() + 1).toString(),
              sender: 'assistant',
              text: 'Sorry, I encountered an error processing that request. Please try again.'
            }]
          };
        }
        return s;
      });
      saveStoredSessions(withError);
    } finally {
      setSending(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      if (text) {
        setInputText(prev => (prev ? prev + ' ' + text : text));
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const executeCommand = (cmdText) => {
    handleSend(cmdText);
    setShowCommands(false);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickCommands = [
    { label: 'Clinical Prep Patient', text: '/prep' },
    { label: 'Diagnostic Questions', text: '/questions' },
    { label: 'Summarize note', text: 'Please summarize the entire clinical note.' },
    { label: 'Check interactions', text: 'Analyze for drug-drug interactions in this note.' }
  ];

  return (
    <div className="flex-1 flex min-h-0 bg-white rounded-2xl border border-slate-200 overflow-hidden font-sans shadow-xs select-none h-full">
      {/* Left panel: list of chats */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50 shrink-0">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-2 shrink-0">
          <button
            onClick={handleCreateNewChat}
            className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white font-bold text-xs rounded-xl border-none cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="text-sm font-bold">+</span> New AI Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 no-scrollbar">
          {sessions.map(s => (
            <div
              key={s.id}
              onClick={() => handleSelectSession(s.id)}
              className={`p-3 rounded-xl flex items-center justify-between cursor-pointer group transition-all text-left ${
                s.id === activeSessionId
                  ? 'bg-[#F3E4C9] text-[#0A2947] font-bold border border-[#8B5E3C]/30 shadow-xs'
                  : 'hover:bg-slate-200/60 text-slate-655 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="text-xs truncate">{s.title || 'New AI Chat'}</span>
              </div>
              <button
                onClick={(e) => handleDeleteChat(s.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded bg-transparent border-none cursor-pointer flex items-center justify-center transition-all ml-1"
                title="Delete Chat"
              >
                ✕
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-xs text-slate-400 italic p-4 text-center">No chat sessions.</div>
          )}
        </div>
      </div>

      {/* Right panel: Active Chat view */}
      <div className="flex-1 flex flex-col min-h-0 relative bg-white">
        {activeSession ? (
          <>
            {/* Header */}
            <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex flex-col text-left">
                <span className="text-sm font-extrabold text-[#0A2947]">{activeSession.title || 'New AI Chat'}</span>
                <span className="text-[10px] text-slate-450 mt-0.5">Persistent Clinical AI Scribe Assistant</span>
              </div>

              {/* Patient Context Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Patient Context:</span>
                <select
                  value={activePatientId}
                  onChange={(e) => setActivePatientId(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none bg-slate-50 font-sans text-slate-700 font-medium"
                >
                  <option value="">No Active Patient Context</option>
                  {patients?.map(p => (
                    <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Messages Feed matching ChatAssistant style */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 scrollbar-none pb-2">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                if (isUser) {
                  return (
                    <div key={msg.id} className="flex flex-col max-w-[75%] self-end items-end animate-fadeIn">
                      <div className="p-3 px-4 rounded-3xl text-sm leading-relaxed bg-[#F3E4C9] text-[#0A2947] shadow-sm select-text font-sans">
                        {msg.text}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={msg.id} className="flex flex-col max-w-[85%] self-start items-start text-left animate-fadeIn">
                    <div className="text-[10.5px] uppercase font-mono font-bold tracking-wider text-slate-400/80 mb-1.5 italic select-none pl-1">
                      Thought
                    </div>
                    <div className="text-sm text-slate-800 leading-relaxed font-sans px-1 select-text whitespace-pre-wrap">
                      {msg.text}
                    </div>
                    
                    {/* Actions row under assistant message */}
                    <div className="flex items-center justify-between w-full mt-3 pl-1 select-none">
                      {/* Left actions */}
                      <div className="flex items-center gap-3">
                        {/* Like */}
                        <button className="text-slate-400 hover:text-slate-655 bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                          </svg>
                        </button>
                        {/* Dislike */}
                        <button className="text-slate-400 hover:text-slate-655 bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm8-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
                          </svg>
                        </button>
                        {/* Check other sources */}
                        <button className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-[10.5px] font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          Check other sources
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>
                      </div>
                      {/* Right actions */}
                      <div className="flex items-center gap-2.5 text-slate-400">
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="hover:text-slate-655 bg-transparent border-none cursor-pointer p-0.5 flex items-center justify-center transition-colors"
                          title={copiedId === msg.id ? "Copied!" : "Copy reply"}
                        >
                          {copiedId === msg.id ? (
                            <span className="text-[10px] text-teal font-bold">Copied</span>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="self-start flex flex-col items-start animate-pulse text-left w-full pl-1">
                  <div className="text-[10.5px] uppercase font-mono font-bold tracking-wider text-slate-400 mb-1 select-none">
                    Thought
                  </div>
                  <div className="flex gap-1.5 items-center mt-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestion Chips Above Input */}
            <div className="px-6 pb-2 pt-1 flex gap-2 overflow-x-auto scrollbar-none select-none shrink-0 font-sans">
              <button
                onClick={() => handleSend('/prep')}
                disabled={sending}
                className="shrink-0 px-3.5 py-1.5 bg-[#f8f9fa] hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
              >
                Prep patient
              </button>
              <button
                onClick={() => handleSend('/questions')}
                disabled={sending}
                className="shrink-0 px-3.5 py-1.5 bg-[#f8f9fa] hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
              >
                Ask prep questions
              </button>
              <button
                onClick={() => handleSend('Are there any critical drug contraindications in this note?')}
                disabled={sending}
                className="shrink-0 px-3.5 py-1.5 bg-[#f8f9fa] hover:bg-slate-100 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 cursor-pointer transition-all flex items-center gap-1.5"
              >
                Check interactions
              </button>
            </div>

            {/* Command suggestion list overlay */}
            {showCommands && (
              <div className="absolute bottom-28 left-6 right-6 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1">
                <div className="text-[10px] text-slate-400 font-mono px-2 py-1 uppercase tracking-wider font-bold">Quick Actions</div>
                {quickCommands.map((cmd, idx) => (
                  <button
                    key={idx}
                    className="text-left w-full hover:bg-slate-50 p-2 text-xs rounded-lg text-slate-655 font-bold transition-colors bg-transparent border-none cursor-pointer font-sans"
                    onClick={() => executeCommand(cmd.text)}
                  >
                    {cmd.label}
                  </button>
                ))}
              </div>
            )}

            {/* Mockup-style bounded prompt input block */}
            <div className="mx-6 mb-2 mt-1 border border-slate-200 rounded-2xl p-3 bg-white flex flex-col gap-2 relative shadow-xs focus-within:border-slate-350 transition-colors shrink-0">
              <textarea
                className="w-full bg-transparent border-none text-slate-800 text-xs px-1.5 focus:outline-none placeholder:text-slate-400 font-sans resize-none min-h-[3rem] max-h-[7rem] leading-relaxed"
                placeholder={isListening ? "Listening dictation..." : "Ask a clinical question, draft notes, or request patient prep..."}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <div className="flex items-center justify-between select-none">
                {/* Left Actions */}
                <div className="flex items-center gap-1">
                  {/* Quick Actions Plus */}
                  <button
                    onClick={() => setShowCommands(!showCommands)}
                    className="w-7 h-7 hover:bg-slate-50 text-slate-500 border-none cursor-pointer flex items-center justify-center rounded-lg bg-transparent transition-colors"
                    title="Quick commands"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>

                  {/* Sources */}
                  <button className="ml-1 flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/80 rounded-full text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors font-sans">
                    Sources
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5">
                  {/* Dictate */}
                  <button
                    onClick={toggleListening}
                    className={`w-7 h-7 hover:bg-slate-50 border-none cursor-pointer flex items-center justify-center rounded-lg bg-transparent transition-colors ${
                      isListening ? 'text-amber-600 animate-pulse bg-amber-50' : 'text-slate-400'
                    }`}
                    title={isListening ? "Stop listening" : "Dictate"}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                    </svg>
                  </button>

                  {/* Send Arrow Up */}
                  <button
                    onClick={() => handleSend()}
                    disabled={sending}
                    className="w-7 h-7 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-lg border-none cursor-pointer flex items-center justify-center shadow-xs transition-colors shrink-0 disabled:opacity-40"
                    title="Send"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="19" x2="12" y2="5" />
                      <polyline points="5 12 12 5 19 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Fine-print disclaimer */}
            <div className="text-[9.5px] text-slate-400 text-center w-full pb-3 px-6 leading-normal select-none">
              Medical knowledge only. Not for autonomous decision making. Check sources and use your clinical judgement.
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 gap-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <div className="text-center">
              <div className="font-bold text-[#0A2947] text-sm">Select or Create a Chat Session</div>
              <div className="text-xs text-slate-450 mt-1">AI clinical chat context is shared and persisted across all views.</div>
            </div>
            <button
              onClick={handleCreateNewChat}
              className="py-2.5 px-5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white font-bold text-xs rounded-xl border-none cursor-pointer transition-colors shadow-xs mt-2"
            >
              Start New AI Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
