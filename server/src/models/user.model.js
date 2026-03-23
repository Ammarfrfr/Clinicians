import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profile: {
      name: String,
      licenseNumber: String, // Medical license
      specialization: String, // Cardiology, Orthopedics, etc.
      institution: String, // Hospital/Clinic name
      phone: String,
    },
    recordingStats: {
      totalRecordings: {
        type: Number,
        default: 0,
      },
      totalDuration: {
        type: Number,
        default: 0, // in seconds
      },
      lastRecordingDate: Date,
    },
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    quotas: {
      recordingsPerMonth: Number,
      maxAudioDurationSeconds: Number,
      storageGBs: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
