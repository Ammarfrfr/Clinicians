import { useState, useEffect } from 'react';

export function EditPatientModal({ isOpen, onClose, onSave, patient }) {
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

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        age: patient.age || '',
        gender: patient.gender || 'Male',
        phone: patient.contactInfo?.phone || '',
        email: patient.contactInfo?.email || '',
        medicalHistory: patient.medicalInfo?.medicalHistory || '',
        allergies: (patient.medicalInfo?.allergies || []).join(', '),
        notes: patient.notes || '',
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:7001/api/patients/${patient._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          allergies: formData.allergies.split(',').map((a) => a.trim()).filter(Boolean),
        }),
      });

      const data = await response.json();
      if (data.success) {
        onSave(data.patient);
        onClose();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error('Error updating patient:', err);
      alert('Error updating patient: ' + err.message);
    }
  };

  if (!isOpen || !patient) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content patient-modal">
        <h2>Edit Patient: {patient.firstName} {patient.lastName}</h2>
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
              Save Changes
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
