import { apiClient } from '../config.js';

const CHATS_STORAGE_KEY = 'scribologist_chats';
const ACTIVE_CHAT_KEY = 'scribologist_active_chat_id';
export const CHATS_UPDATED_EVENT = 'scribologist_chats_updated';

export const getStoredSessions = () => {
  try {
    const saved = localStorage.getItem(CHATS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading chat sessions:', e);
  }
  // Create default initial session if none exists
  const initialSession = {
    id: Date.now().toString(),
    title: 'New AI Chat',
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hey! How can I help you today? Got a clinical question, need help with documentation, or looking something up?"
      }
    ]
  };
  localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify([initialSession]));
  localStorage.setItem(ACTIVE_CHAT_KEY, initialSession.id);
  return [initialSession];
};

export const saveStoredSessions = (sessions) => {
  try {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(sessions));
    window.dispatchEvent(new CustomEvent(CHATS_UPDATED_EVENT, { detail: sessions }));
  } catch (e) {
    console.error('Error saving chat sessions:', e);
  }
};

export const getStoredActiveSessionId = () => {
  const activeId = localStorage.getItem(ACTIVE_CHAT_KEY);
  const sessions = getStoredSessions();
  if (activeId && sessions.some(s => s.id === activeId)) {
    return activeId;
  }
  if (sessions.length > 0) {
    localStorage.setItem(ACTIVE_CHAT_KEY, sessions[0].id);
    return sessions[0].id;
  }
  return null;
};

export const setStoredActiveSessionId = (id) => {
  localStorage.setItem(ACTIVE_CHAT_KEY, id);
  window.dispatchEvent(new CustomEvent(CHATS_UPDATED_EVENT));
};

export const createNewChatSession = (title = 'New AI Chat') => {
  const sessions = getStoredSessions();
  const newSession = {
    id: Date.now().toString(),
    title: title,
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: 'welcome',
        sender: 'assistant',
        text: "Hey! How can I help you today? Got a clinical question, need help with documentation, or looking something up?"
      }
    ]
  };
  const updated = [newSession, ...sessions];
  saveStoredSessions(updated);
  setStoredActiveSessionId(newSession.id);
  return newSession;
};

export const deleteChatSession = (id) => {
  const sessions = getStoredSessions();
  const updated = sessions.filter(s => s.id !== id);
  saveStoredSessions(updated);
  const currentActive = localStorage.getItem(ACTIVE_CHAT_KEY);
  if (currentActive === id) {
    if (updated.length > 0) {
      setStoredActiveSessionId(updated[0].id);
    } else {
      createNewChatSession();
    }
  }
};

export const generateSmartChatTitle = async (sessionId, firstUserMessage) => {
  if (!firstUserMessage || !firstUserMessage.trim()) return;
  try {
    const res = await apiClient.post('/api/chat/title', { message: firstUserMessage.trim() });
    const aiTitle = res.data?.data?.title;
    if (aiTitle) {
      const sessions = getStoredSessions();
      const updated = sessions.map(s => s.id === sessionId ? { ...s, title: aiTitle } : s);
      saveStoredSessions(updated);
    }
  } catch (err) {
    console.error('Error generating AI title:', err);
  }
};
