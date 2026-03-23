import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: false, // Optional - might not always have a patient linked
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
      language: String, // e.g., 'en', 'hi'
      confidence: Number, // 0-1, confidence score from Whisper
      processingTime: Number, // milliseconds
    },
    clinicalNote: {
      chief_complaint: String,
      history: String,
      examination: String,
      diagnosis: String,
      prescription: [
        {
          drug: String,
          dose: String,
          frequency: String,
          duration: String,
        },
      ],
      followup: String,
      notes: String,
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
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Indexes for faster queries
recordingSchema.index({ userId: 1, createdAt: -1 }); // User's recordings sorted by date
recordingSchema.index({ patientId: 1 }); // Find all recordings for a patient
recordingSchema.index({ processingStatus: 1 }); // Find pending recordings

export default mongoose.model('Recording', recordingSchema);
