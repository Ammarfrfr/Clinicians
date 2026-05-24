import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    // Auth fields
    googleId: String,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: false, // Optional — Google OAuth users don't have one
    },

    // Doctor Profile
    profile: {
      name: { type: String, required: true },
      username: { type: String, unique: true, sparse: true },
      avatar: String,
      hospital: String,
      specialization: String, // Cardiology, Orthopedics, General, etc.
      licenseNumber: String,
      phone: String,
      qualification: String, // MBBS, MD, MS, DNB, etc.
    },

    // Subscription
    subscriptionPlan: {
      type: String,
      enum: ['free', 'pro', 'clinic'],
      default: 'free',
    },

    // Usage tracking (for quota enforcement)
    usage: {
      consultationsThisMonth: { type: Number, default: 0 },
      storageUsedMB: { type: Number, default: 0 },
      lastResetDate: Date,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['doctor', 'admin'],
      default: 'doctor',
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ googleId: 1 });

export const User = mongoose.model('User', userSchema);
