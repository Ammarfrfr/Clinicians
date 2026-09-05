import { useState, useEffect } from 'react';
import { apiClient } from '../config';

export function EscalationRulesEditor() {
  const [keywords, setKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/escalation');
      if (res.data?.data) {
        setKeywords(res.data.data.keywords || []);
        setIsActive(res.data.data.isActive !== undefined ? res.data.data.isActive : true);
      }
    } catch (err) {
      console.error('Failed to load escalation rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    const clean = newKeyword.trim().toLowerCase();
    if (!keywords.includes(clean)) {
      setKeywords([...keywords, clean]);
    }
    setNewKeyword('');
  };

  const handleRemoveKeyword = (kw) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/escalation', {
        keywords,
        isActive,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save rules: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F6F1] overflow-y-auto text-[#0A2947] p-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="pb-6 border-b border-[#D3D4C0]">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif tracking-tight text-[#0A2947]">
              Escalation & Clinical Red-Flag Rules
            </h1>
            <span className="text-lg">🚨</span>
          </div>
          <p className="text-sm text-[#0A2947]/70 mt-1">
            Specify clinical trigger words that must <strong>bypass AI auto-answering</strong> immediately. When a patient message matches any of these keywords, an urgent staff alert is triggered and emergency instructions are provided.
          </p>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <span>✓</span>
            <span>Escalation rules updated and active across WhatsApp listeners.</span>
          </div>
        )}

        {/* Form */}
        <div className="mt-6 bg-white p-6 rounded-3xl border border-[#D3D4C0] shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#D3D4C0]">
            <div>
              <div className="text-sm font-bold text-[#0A2947]">Active Red-Flag Scanner</div>
              <div className="text-xs text-[#0A2947]/60">Automatically monitor incoming WhatsApp messages</div>
            </div>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded text-[#8B5E3C] cursor-pointer"
            />
          </div>

          {/* Add Keyword Input */}
          <form onSubmit={handleAddKeyword} className="mt-5 flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Type red-flag symptom / keyword (e.g. infection, allergic rash, numbness)..."
              className="flex-1 px-4 py-2.5 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] focus:outline-none focus:border-[#8B5E3C]"
            />
            <button
              type="submit"
              disabled={!newKeyword.trim()}
              className="px-5 py-2.5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-xl text-xs font-bold cursor-pointer border-none shadow-xs disabled:opacity-50"
            >
              + Add Keyword
            </button>
          </form>

          {/* Tags cloud */}
          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-2.5">
              Trigger Keywords ({keywords.length})
            </div>
            {loading ? (
              <div className="py-4 text-xs text-[#0A2947]/50">Loading keywords...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="text-red-400 hover:text-red-700 cursor-pointer border-none bg-transparent text-xs ml-0.5"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="mt-8 pt-4 border-t border-[#D3D4C0] flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Escalation Rules'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
