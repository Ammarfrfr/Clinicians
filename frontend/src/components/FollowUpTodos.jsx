import { useState, useEffect } from 'react';
import { apiClient } from '../config.js';

export function FollowUpTodos({ recordingId, initialTodos = [], readOnly = false }) {
  const [todos, setTodos] = useState(initialTodos);
  const [newTodo, setNewTodo] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTodos(initialTodos);
  }, [recordingId]);

  const saveTodos = async (updatedTodos) => {
    if (!recordingId) return;
    setSaving(true);
    try {
      await apiClient.patch(`/api/recordings/${recordingId}/todos`, {
        todos: updatedTodos,
      });
    } catch (err) {
      console.error('Error saving follow-up todos:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    const updated = [
      ...todos,
      { text: newTodo.trim(), completed: false, createdAt: new Date().toISOString(), completedAt: null },
    ];
    setTodos(updated);
    setNewTodo('');
    saveTodos(updated);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleToggle = (index) => {
    if (readOnly) return;
    const updated = todos.map((t, i) =>
      i === index
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null }
        : t
    );
    setTodos(updated);
    saveTodos(updated);
  };

  const handleDelete = (index) => {
    const updated = todos.filter((_, i) => i !== index);
    setTodos(updated);
    saveTodos(updated);
  };

  const pendingCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white border border-gray-150 rounded-xl shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <span className="text-sm font-bold text-navy">Follow-up Checklist</span>
        {pendingCount > 0 && (
          <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full">{pendingCount} pending</span>
        )}
        {saving && <span className="text-[10px] text-gray-400 font-medium animate-pulse">Saving...</span>}
      </div>

      <div className="flex flex-col gap-1">
        {todos.length === 0 && (
          <div className="text-xs text-gray-400 font-medium italic py-2 text-left">No follow-up items yet</div>
        )}
        {todos.map((todo, idx) => (
          <div key={idx} className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-b-0 ${todo.completed ? 'opacity-70' : ''}`}>
            <label className="relative flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggle(idx)}
                disabled={readOnly}
                className="w-4 h-4 accent-teal rounded cursor-pointer disabled:cursor-not-allowed"
              />
            </label>
            <span className={`text-sm text-gray-700 flex-1 text-left ${todo.completed ? 'line-through text-gray-400' : ''}`}>{todo.text}</span>
            {todo.completed && todo.completedAt && (
              <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                {new Date(todo.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            )}
            {!readOnly && (
              <button className="p-1 text-gray-300 hover:text-red-brand bg-transparent border-none cursor-pointer flex items-center justify-center rounded hover:bg-red-brand-light/35 transition-colors" onClick={() => handleDelete(idx)} title="Remove">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Add follow-up item..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-teal bg-white"
          />
          <button onClick={handleAdd} disabled={!newTodo.trim()} className="p-2 bg-teal hover:bg-teal-dark text-navy rounded-lg cursor-pointer border-none flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
