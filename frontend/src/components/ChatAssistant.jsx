import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../config.js';
import {
  getStoredSessions,
  saveStoredSessions,
  getStoredActiveSessionId,
  setStoredActiveSessionId,
  createNewChatSession,
  generateSmartChatTitle,
  CHATS_UPDATED_EVENT
} from '../utils/chatStorage.js';

export function ChatAssistant({ patient, currentNote, transcript, typedContext, onUpdateNote, onClose, initialQuery, onClearInitialQuery }) {
  const [sessions, setSessions] = useState(() => getStoredSessions());
  const [activeSessionId, setActiveSessionId] = useState(() => getStoredActiveSessionId());
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
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

  // Trigger initial query from external source (like bottom chat bar)
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [initialQuery]);

  // Auto-scroll to the bottom of the message list
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
      const response = await apiClient.post('/api/chat', {
        message: text.trim(),
        note: currentNote,
        patient: patient,
        transcript: transcript,
        typedContext: typedContext
      });

      const data = response.data;
      if (data.success && data.data) {
        const { response: aiReply, updatedNote, followUpQuestions } = data.data;

        const latestSessions = getStoredSessions();
        const withAiReply = latestSessions.map(s => {
          if (s.id === currentActiveId) {
            return {
              ...s,
              messages: [...s.messages, {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: aiReply,
                followUpQuestions: Array.isArray(followUpQuestions) ? followUpQuestions : []
              }]
            };
          }
          return s;
        });

        saveStoredSessions(withAiReply);

        if (updatedNote && onUpdateNote) {
          onUpdateNote(updatedNote);
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
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

  const handleNewChat = () => {
    createNewChatSession();
  };

  // Toggle local Speech Recognition
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
    <div className="flex-1 flex flex-col min-h-0 bg-white text-slate-805 select-none relative font-sans text-left">
      {/* Header (Mockup style) */}
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <div className="relative">
          <button className="flex items-center gap-1 text-slate-800 text-xs font-bold hover:bg-slate-50 px-2 py-1 rounded-lg bg-transparent border-none cursor-pointer transition-colors font-sans">
            Document
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* New Chat */}
          <button onClick={handleNewChat} className="flex items-center gap-1.5 text-xs text-slate-655 hover:text-slate-800 font-bold px-2 py-1 hover:bg-slate-50 rounded-lg bg-transparent border-none cursor-pointer transition-colors font-sans mr-2">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            New chat
          </button>

          {/* Close */}
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-750 bg-transparent border-none cursor-pointer flex items-center justify-center transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 scrollbar-none pb-2">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          if (isUser) {
            return (
              <div key={msg.id} className="flex flex-col max-w-[85%] self-end items-end animate-fadeIn">
                <div className="p-2.5 px-4 rounded-3xl text-sm leading-relaxed bg-[#F3E4C9] text-[#0A2947] shadow-sm select-text font-sans">
                  {msg.text}
                </div>
              </div>
            );
          }
          return (
            <div key={msg.id} className="flex flex-col max-w-[95%] self-start items-start text-left animate-fadeIn">
              <div className="text-[10.5px] uppercase font-mono font-bold tracking-wider text-slate-400/80 mb-1.5 italic select-none pl-1">
                Thought
              </div>
              <div className="text-sm text-slate-800 leading-relaxed font-sans px-1 select-text whitespace-pre-wrap">
                {msg.text}
              </div>

              {/* Interactive Follow-Up Questions List */}
              {Array.isArray(msg.followUpQuestions) && msg.followUpQuestions.length > 0 && (
                <div className="flex flex-col mt-4 w-full pl-1 select-none border-t border-slate-100 pt-2.5">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 mb-1">
                    Suggested Follow-up Questions:
                  </span>
                  <div className="flex flex-col divide-y divide-slate-100">
                    {msg.followUpQuestions.map((qText, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleSend(qText)}
                        disabled={sending}
                        className="text-left py-2 px-1 text-xs font-medium text-slate-700 hover:text-[#8B5E3C] hover:bg-slate-50/80 bg-transparent border-none cursor-pointer transition-colors flex items-center justify-between group disabled:opacity-50"
                      >
                        <span className="group-hover:translate-x-0.5 transition-transform">{qText}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300 group-hover:text-[#8B5E3C] transition-colors shrink-0 ml-2">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
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
      <div className="px-4 pb-2 pt-1 flex gap-1.5 overflow-x-auto scrollbar-none select-none shrink-0 font-sans">
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
        <div className="absolute bottom-28 left-4 right-4 bg-white border border-slate-200 rounded-2xl shadow-xl p-2.5 z-50 flex flex-col gap-1">
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
      <div className="mx-4 mb-2 mt-1 border border-slate-200 rounded-2xl p-2.5 bg-white flex flex-col gap-2 relative shadow-xs focus-within:border-slate-350 transition-colors shrink-0">
        <textarea
          className="w-full bg-transparent border-none text-slate-800 text-xs px-1.5 focus:outline-none placeholder:text-slate-400 font-sans resize-none min-h-[2.5rem] max-h-[6rem] leading-relaxed"
          placeholder={isListening ? "Listening dictation..." : "Ask a follow-up question..."}
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
              className="w-6.5 h-6.5 hover:bg-slate-50 text-slate-500 border-none cursor-pointer flex items-center justify-center rounded-lg bg-transparent transition-colors"
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
          <div className="flex items-center gap-1">
            {/* Dictate */}
            <button
              onClick={toggleListening}
              className={`w-6.5 h-6.5 hover:bg-slate-50 border-none cursor-pointer flex items-center justify-center rounded-lg bg-transparent transition-colors ${
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
              className="w-6.5 h-6.5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-lg border-none cursor-pointer flex items-center justify-center shadow-xs transition-colors shrink-0 disabled:opacity-40"
              title="Send"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Fine-print disclaimer */}
      <div className="text-[9.5px] text-slate-400 text-center w-full pb-3 px-4 leading-normal select-none">
        Medical knowledge only. Not for autonomous decision making. Check sources and use your clinical judgement.
      </div>
    </div>
  );
}
