import { useState } from 'react';
import { apiClient } from './config.js';

export function AddPatientModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', age: '', gender: 'Male',
    phone: '', email: '', medicalHistory: '', allergies: '', notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post('/api/patients/create', {
        ...formData,
        allergies: formData.allergies.split(',').map((a) => a.trim()).filter(Boolean),
      });
      const data = response.data;
      if (data.success) {
        onSave(data.data);
        setFormData({ firstName: '', lastName: '', age: '', gender: 'Male', phone: '', email: '', medicalHistory: '', allergies: '', notes: '' });
        onClose();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error saving patient:', err.response?.data || err.message);
      alert('Error saving patient: ' + (err.response?.data?.error || err.message));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy/40 flex items-center justify-center z-[9999] p-4 backdrop-blur-xs" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-gray-100 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-bold text-navy mb-4 text-left">New Patient</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-left">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="firstName" placeholder="First Name *" value={formData.firstName} onChange={handleChange} required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
            <input type="text" name="lastName" placeholder="Last Name *" value={formData.lastName} onChange={handleChange} required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" name="age" placeholder="Age" value={formData.age} onChange={handleChange} min="0" max="150" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all h-[38px]">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Not specified</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          </div>
          <textarea name="medicalHistory" placeholder="Medical History" value={formData.medicalHistory} onChange={handleChange} rows="3" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-y" />
          <input type="text" name="allergies" placeholder="Allergies (comma separated)" value={formData.allergies} onChange={handleChange} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all" />
          <textarea name="notes" placeholder="Additional Notes" value={formData.notes} onChange={handleChange} rows="2" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all resize-y" />
          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100 mt-2">
            <button type="submit" className="inline-flex items-center justify-center px-4 py-2 bg-teal hover:bg-teal-dark text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer border-none shadow-xs">Add Patient</button>
            <button type="button" className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-navy font-semibold text-sm rounded-xl transition-all cursor-pointer" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
