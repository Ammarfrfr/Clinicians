import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
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
    notes: String, // General notes about the patient
  },
  { timestamps: true }
);

// Index for quick lookup
patientSchema.index({ userId: 1 });

export default mongoose.model('Patient', patientSchema);
