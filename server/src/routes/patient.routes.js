import express from 'express';
import Patient from '../models/patient.model.js';

const router = express.Router();

// All data is stored directly in MongoDB - no file-based fallback

// Create new patient - MongoDB only
router.post('/create', async (req, res) => {
  try {
    const { firstName, lastName, age, gender, phone, email, medicalHistory, allergies, notes } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ success: false, error: 'First name and last name are required' });
    }

    const patientData = {
      firstName,
      lastName,
      age: age || null,
      gender: gender || 'Not specified',
      contactInfo: {
        phone: phone || '',
        email: email || '',
      },
      medicalInfo: {
        medicalHistory: medicalHistory || '',
        allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
        currentMedications: [],
      },
      notes: notes || '',
    };

    const patient = new Patient(patientData);
    const savedPatient = await patient.save();
    
    console.log('✅ Patient created in MongoDB:', savedPatient._id);
    res.json({ success: true, patient: savedPatient });
  } catch (err) {
    console.error('❌ Error creating patient:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all patients from MongoDB
router.get('/', async (req, res) => {
  try {
    const patients = await Patient.find().select('-__v').sort({ createdAt: -1 });
    res.json({ success: true, patients });
  } catch (err) {
    console.error('❌ Error fetching patients:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single patient from MongoDB
router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    res.json({ success: true, patient });
  } catch (err) {
    console.error('❌ Error fetching patient:', err.message);
    res.status(404).json({ success: false, error: 'Patient not found' });
  }
});

// Update patient in MongoDB
router.patch('/:id', async (req, res) => {
  try {
    const { firstName, lastName, age, gender, phone, email, medicalHistory, allergies, notes } = req.body;

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (phone !== undefined) updateData['contactInfo.phone'] = phone;
    if (email !== undefined) updateData['contactInfo.email'] = email;
    if (medicalHistory !== undefined) updateData['medicalInfo.medicalHistory'] = medicalHistory;
    if (allergies !== undefined) updateData['medicalInfo.allergies'] = Array.isArray(allergies) ? allergies : [allergies];
    if (notes !== undefined) updateData.notes = notes;

    const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    console.log('✅ Patient updated in MongoDB:', patient._id);
    res.json({ success: true, patient });
  } catch (err) {
    console.error('❌ Error updating patient:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete patient from MongoDB
router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);

    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    console.log('✅ Patient deleted from MongoDB:', req.params.id);
    res.json({ success: true, message: 'Patient deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting patient:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
