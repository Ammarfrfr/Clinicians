import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    personalInfo: {
      name: String,
      age: Number,
      gender: String,
      mrn: String, // Medical Record Number
      phone: String,
      email: String,
    },
    medicalInfo: {
      bloodGroup: String,
      height: Number, // in cm
      weight: Number, // in kg
      allergies: [String],
      existingConditions: [String],
      medications: [String],
    },
    consultations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recording',
      },
    ],
    notes: String, // General notes about the patient
  },
  { timestamps: true }
);

// Index for quick lookup
patientSchema.index({ userId: 1, mrn: 1 }); // Find patient by MRN under a user

export default mongoose.model('Patient', patientSchema);
