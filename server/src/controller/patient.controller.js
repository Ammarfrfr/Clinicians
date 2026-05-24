import { Patient } from '../models/patient.model.js';
import { asyncHandler } from '../Utils/asyncHandler.js';
import { ApiError } from '../Utils/ApiError.js';
import { ApiResponse } from '../Utils/ApiResponse.js';

export const createPatient = asyncHandler(async (req, res) => {
  const { firstName, lastName, age, gender, phone, email, medicalHistory, allergies, notes } = req.body;

  if (!firstName || !lastName) {
    throw new ApiError(400, 'First name and last name are required');
  }

  const patient = new Patient({
    userId: req.user._id,
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
  return res
    .status(201)
    .json(new ApiResponse(201, savedPatient, 'Patient created successfully'));
});

export const getAllPatients = asyncHandler(async (req, res) => {
  const patients = await Patient.find({ userId: req.user._id }).select('-__v').sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, patients, 'Patients fetched successfully'));
});

export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ _id: req.params.id, userId: req.user._id });

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }
  
  return res
    .status(200)
    .json(new ApiResponse(200, patient, 'Patient fetched successfully'));
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

  const updatedPatient = await Patient.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    updateData,
    { new: true }
  );

  if (!updatedPatient) {
    throw new ApiError(404, 'Patient not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPatient, 'Patient updated successfully'));
});

export const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

  if (!patient) {
    throw new ApiError(404, 'Patient not found');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'Patient deleted successfully'));
});

export const searchPatients = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || !q.trim()) {
    const patients = await Patient.find({ userId: req.user._id }).select('-__v').sort({ createdAt: -1 });
    return res
      .status(200)
      .json(new ApiResponse(200, patients, 'Patients fetched successfully'));
  }

  const regex = new RegExp(q.trim(), 'i');

  const patients = await Patient.find({
    userId: req.user._id,
    $or: [
      { firstName: regex },
      { lastName: regex },
      { 'contactInfo.phone': regex },
      { 'contactInfo.email': regex },
    ],
  }).select('-__v').sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, patients, 'Patients searched successfully'));
});
