import { useState } from 'react';
import { apiClient } from './config.js';

export function AddPatientModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'Male',
    phone: '',
    email: '',
    medicalHistory: '',
    allergies: '',
    notes: '',
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
        onSave(data.patient);
        setFormData({
          firstName: '',
          lastName: '',
          age: '',
          gender: 'Male',
          phone: '',
          email: '',
          medicalHistory: '',
          allergies: '',
          notes: '',
        });
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
    <div className="modal-overlay">
      <div className="modal-content patient-modal">
        <h2>Add New Patient</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              name="firstName"
              placeholder="First Name *"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name *"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <input
              type="number"
              name="age"
              placeholder="Age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              max="150"
            />
            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
              <option>Not specified</option>
            </select>
          </div>

          <div className="form-row">
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <textarea
            name="medicalHistory"
            placeholder="Medical History"
            value={formData.medicalHistory}
            onChange={handleChange}
            rows="3"
          />

          <input
            type="text"
            name="allergies"
            placeholder="Allergies (comma separated)"
            value={formData.allergies}
            onChange={handleChange}
          />

          <textarea
            name="notes"
            placeholder="Additional Notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
          />

          <div className="modal-buttons">
            <button type="submit" className="btn-primary">
              Add Patient
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
