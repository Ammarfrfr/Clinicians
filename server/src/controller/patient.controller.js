import Patient from '../models/patient.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

export const createPatient = asyncHandler(async (req, res) => {
  const { firstName, lastName, age, gender, phone, email, medicalHistory, allergies, notes } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ success: false, error: 'First name and last name are required' });
  }

  const patient = new Patient({
    firstName,
    lastName,
    age: age || null,
    gender: gender || 'Not specified',
    contactInfo: { phone: phone || '', email: email || '' },
    medicalInfo: {
      medicalHistory: medicalHistory || '',
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      currentMedications: [],
    },
    notes: notes || '',
  });

  const savedPatient = await patient.save();
  res.json({ success: true, patient: savedPatient });
});

export const getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find().select('-__v').sort({ createdAt: -1 });
  res.json({ success: true, patients });
});

export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }
  
  res.json({ success: true, patient });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const { firstName, lastName, age, gender, phone, email, medicalHistory, allergies, notes } = req.body;

  const updateData = {};
  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (age !== undefined) updateData.age = age;
  if (gender !== undefined) updateData.gender = gender;
  if (notes !== undefined) updateData.notes = notes;

  if (phone !== undefined || email !== undefined) {
    updateData.contactInfo = {
      phone: phone !== undefined ? phone : undefined,
      email: email !== undefined ? email : undefined,
    };
  }

  if (medicalHistory !== undefined || allergies !== undefined) {
    updateData.medicalInfo = {};
    if (medicalHistory !== undefined) updateData.medicalInfo.medicalHistory = medicalHistory;
    if (allergies !== undefined) {
      updateData.medicalInfo.allergies = Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []);
    }
  }

  const updatedPatient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true });

  if (!updatedPatient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  res.json({ success: true, patient: updatedPatient });
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndDelete(req.params.id);

  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  res.json({ success: true, message: 'Patient deleted successfully' });
});
