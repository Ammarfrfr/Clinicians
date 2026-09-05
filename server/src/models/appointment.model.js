import mongoose, { Schema } from 'mongoose';

const appointmentSchema = new Schema(
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
      required: true,
      index: true,
    },
    intakeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PreConsultIntake',
      default: null,
    },
    recordingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recording',
      default: null,
    },
    proposedSlot: {
      date: {
        type: Date,
        required: true,
      },
      dayOfWeek: Number,
      location: {
        type: String,
        required: true,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['proposed', 'confirmed', 'rescheduled', 'completed', 'cancelled'],
      default: 'proposed',
      index: true,
    },
    confirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    preVisitPrepResponses: [
      {
        question: String,
        answer: String,
        answeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, 'proposedSlot.date': 1 });
appointmentSchema.index({ patientId: 1, createdAt: -1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
