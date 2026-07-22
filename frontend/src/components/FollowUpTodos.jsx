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
    <div className="flex flex-col gap-4 p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs text-left select-none">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
          Patient Follow-Up Checklist
        </span>
        {pendingCount > 0 && (
          <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-200/60">
            {pendingCount} PENDING
          </span>
        )}
        {saving && <span className="text-[10px] text-slate-400 font-mono font-bold animate-pulse">SAVING...</span>}
      </div>

      <div className="flex flex-col gap-2">
        {todos.length === 0 && (
          <div className="text-xs text-slate-400 font-medium italic py-2 text-left">
            No follow-up tasks or rehab exercises assigned yet.
          </div>
        )}
        {todos.map((todo, idx) => (
          <div key={idx} className={`flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0 ${todo.completed ? 'opacity-60' : ''}`}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => handleToggle(idx)}
              disabled={readOnly}
              className="w-4 h-4 accent-[#22252a] rounded cursor-pointer disabled:cursor-not-allowed"
            />
            <span className={`text-xs text-slate-800 flex-1 font-medium ${todo.completed ? 'line-through text-slate-400' : ''}`}>
              {todo.text}
            </span>
            {todo.completed && todo.completedAt && (
              <span className="text-[9px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">
                {new Date(todo.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            )}
            {!readOnly && (
              <button
                className="p-1 text-slate-300 hover:text-rose-600 bg-transparent border-none cursor-pointer flex items-center justify-center rounded transition-colors"
                onClick={() => handleDelete(idx)}
                title="Remove task"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Add rehab exercise or follow-up note..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 bg-slate-50 text-slate-900"
          />
          <button
            onClick={handleAdd}
            disabled={!newTodo.trim()}
            className="px-4 py-2 bg-[#22252a] hover:bg-[#1a1c20] text-white rounded-xl cursor-pointer border-none font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-all shadow-xs"
          >
            Add Task ✦
          </button>
        </div>
      )}
    </div>
  );
}
