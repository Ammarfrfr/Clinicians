import mongoose, { Schema } from 'mongoose';

const recordingSchema = new Schema(
  {
    userId: {
      type: String, // Allow string IDs (like 'anonymous') or ObjectId strings
      required: false,
      default: 'anonymous',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: false,
      default: null,
    },
    audioFile: {
      filename: String,
      fileSize: Number, // in bytes
      mimeType: String, // audio/webm, audio/mp3, etc.
      duration: Number, // in seconds
      // Store path to audio file (local storage or cloud URL)
      path: String,
    },
    transcript: {
      text: String,
      labeledText: String, // Speaker-labeled version
      utterances: [
        {
          speaker: String,
          text: String,
        }
      ],
      language: String, // e.g., 'en', 'hi'
      confidence: Number, // 0-1, confidence score from Whisper
      processingTime: Number, // milliseconds
      hasSpokenLabels: Boolean,
    },
    clinicalNote: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    vitals: {
      systolic: Number,
      diastolic: Number,
      hr: Number, // Heart rate in bpm
      spo2: Number, // SpO2 percentage
      temp: Number, // Temperature in °F
      weight: Number, // Weight in kg
    },
    metadata: {
      recordedAt: Date, // When the audio was recorded (from client)
      recordingDuration: Number, // Duration of recording in seconds
      deviceInfo: String, // Browser/device info
      ipAddress: String,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'transcribing', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    processingErrors: [
      {
        step: String, // 'transcription', 'llama_processing', etc.
        error: String,
        timestamp: Date,
      },
    ],
    tags: [String], // User-defined tags/categories
    isArchived: {
      type: Boolean,
      default: false,
    },
    scheduledFollowUp: {
      type: Date,
      default: null,
    },
    followUpReminderSent: {
      type: Boolean,
      default: false,
    },
    isFinalized: {
      type: Boolean,
      default: false,
    },
    followUpTodos: [{
      text: { type: String, required: true },
      completed: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      completedAt: { type: Date, default: null },
    }],
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Indexes for faster queries
recordingSchema.index({ userId: 1, createdAt: -1 }); // User's recordings sorted by date
recordingSchema.index({ patientId: 1 }); // Find all recordings for a patient
recordingSchema.index({ processingStatus: 1 }); // Find pending recordings

export const Recording = mongoose.model('Recording', recordingSchema);
