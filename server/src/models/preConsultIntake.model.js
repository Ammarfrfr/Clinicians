import mongoose, { Schema } from 'mongoose';

const preConsultIntakeSchema = new Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
      default: null,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    visitType: {
      type: String,
      enum: ['new', 'follow-up'],
      default: 'new',
    },
    currentStepId: {
      type: String,
      default: 'visit_type',
    },
    responses: [
      {
        stepId: String,
        question: String,
        answer: String,
        mediaUrl: String,
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    structuredExtract: {
      chiefComplaint: String,
      affectedBodyPart: String,
      onsetType: String,
      duration: String,
      painLevel: String,
      triggers: String,
      associatedSymptoms: [String],
      priorHistory: String,
      medicationsTried: String,
      mobilityStatus: String,
      summary: String,
    },
    urgencyFlags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'expired', 'escalated'],
      default: 'in_progress',
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

preConsultIntakeSchema.index({ patientId: 1, createdAt: -1 });
preConsultIntakeSchema.index({ doctorId: 1, status: 1 });

export const PreConsultIntake = mongoose.model('PreConsultIntake', preConsultIntakeSchema);
