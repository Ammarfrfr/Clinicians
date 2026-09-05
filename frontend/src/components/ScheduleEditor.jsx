import { useState, useEffect } from 'react';
import { apiClient } from '../config';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function ScheduleEditor() {
  const [slots, setSlots] = useState([]);
  const [maxSlotsPerDay, setMaxSlotsPerDay] = useState(30);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/schedule');
      if (res.data?.data) {
        setSlots(res.data.data.slots || []);
        setMaxSlotsPerDay(res.data.data.maxSlotsPerDay || 30);
      }
    } catch (err) {
      console.error('Failed to load schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = () => {
    setSlots([
      ...slots,
      {
        dayOfWeek: 1,
        location: 'City Ortho Clinic',
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        isActive: true,
      },
    ]);
  };

  const handleUpdateSlot = (index, field, value) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleRemoveSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/schedule', {
        slots,
        maxSlotsPerDay,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save schedule: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F9F6F1] overflow-y-auto text-[#0A2947] p-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[#D3D4C0]">
          <div>
            <h1 className="text-2xl font-bold font-serif tracking-tight text-[#0A2947]">
              Doctor Locations & Schedule Configuration
            </h1>
            <p className="text-sm text-[#0A2947]/70 mt-1">
              Configure clinic branches, practice days, and visiting hours. The WhatsApp intake bot will automatically propose matching slots to patients.
            </p>
          </div>

          <button
            onClick={handleAddSlot}
            className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-xl text-xs font-semibold cursor-pointer border-none shadow-xs flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Add Practice Slot</span>
          </button>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
            <span>✓</span>
            <span>Doctor schedule saved successfully! WhatsApp appointment proposals are updated.</span>
          </div>
        )}

        {/* Schedule Slots List */}
        <div className="mt-6 flex flex-col gap-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#0A2947]/50">Loading doctor schedule...</div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#0A2947]/50 bg-white rounded-2xl border border-dashed border-[#D3D4C0]">
              No practice slots configured yet. Click "Add Practice Slot" to set up your clinic locations.
            </div>
          ) : (
            slots.map((slot, index) => (
              <div
                key={index}
                className="bg-white p-5 rounded-2xl border border-[#D3D4C0] shadow-xs flex items-center gap-4 transition-all hover:border-[#8B5E3C]/40"
              >
                {/* Day of Week */}
                <div className="w-40">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-1">
                    Day of Week
                  </label>
                  <select
                    value={slot.dayOfWeek}
                    onChange={(e) => handleUpdateSlot(index, 'dayOfWeek', parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] font-semibold focus:outline-none"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Location / Clinic Name */}
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-1">
                    Hospital / Clinic Location
                  </label>
                  <input
                    type="text"
                    value={slot.location}
                    onChange={(e) => handleUpdateSlot(index, 'location', e.target.value)}
                    placeholder="e.g. Apex Joint Center, Room 204"
                    className="w-full px-3 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] focus:outline-none"
                  />
                </div>

                {/* Start Time */}
                <div className="w-32">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-1">
                    Start Time
                  </label>
                  <input
                    type="text"
                    value={slot.startTime}
                    onChange={(e) => handleUpdateSlot(index, 'startTime', e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full px-3 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] focus:outline-none"
                  />
                </div>

                {/* End Time */}
                <div className="w-32">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-1">
                    End Time
                  </label>
                  <input
                    type="text"
                    value={slot.endTime}
                    onChange={(e) => handleUpdateSlot(index, 'endTime', e.target.value)}
                    placeholder="01:00 PM"
                    className="w-full px-3 py-2 bg-[#F9F6F1] border border-[#D3D4C0] rounded-xl text-xs text-[#0A2947] focus:outline-none"
                  />
                </div>

                {/* Active Toggle */}
                <div className="flex flex-col items-center">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B5E3C] mb-1">
                    Active
                  </label>
                  <input
                    type="checkbox"
                    checked={slot.isActive}
                    onChange={(e) => handleUpdateSlot(index, 'isActive', e.target.checked)}
                    className="w-4 h-4 rounded text-[#8B5E3C] cursor-pointer"
                  />
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleRemoveSlot(index)}
                  className="mt-4 p-2 rounded-xl text-red-500 hover:bg-red-50 cursor-pointer border-none text-sm"
                  title="Remove Slot"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Save Bar */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-[#8B5E3C] hover:bg-[#6e482d] text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer border-none shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Schedule Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
