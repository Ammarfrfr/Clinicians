import mongoose, { Schema } from 'mongoose';

const patientSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Optional for now - can add auth later
      default: null,
    },
    firstName: String,
    lastName: String,
    age: Number,
    gender: String,
    contactInfo: {
      phone: String,
      email: String,
    },
    medicalInfo: {
      medicalHistory: String,
      bloodGroup: String,
      height: Number, // in cm
      weight: Number, // in kg
      allergies: [String],
      currentMedications: [String],
      existingConditions: [String],
    },
    consultations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recording',
      },
    ],
    files: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        category: { type: String, default: 'General' }, // 'MRI', 'X-ray', 'Surgery', etc.
        notes: String,
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
    notes: String, // General notes about the patient
  },
  { timestamps: true }
);

// Indexes for quick lookup and search
patientSchema.index({ userId: 1 });
patientSchema.index({ firstName: 1, lastName: 1 });
patientSchema.index({ 'contactInfo.phone': 1 });
patientSchema.index({ 'contactInfo.email': 1 });

export const Patient = mongoose.model('Patient', patientSchema);
