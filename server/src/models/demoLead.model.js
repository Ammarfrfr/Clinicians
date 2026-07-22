import mongoose from 'mongoose';

const demoLeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    clinic: {
      type: String,
      trim: true,
      default: '',
    },
    specialty: {
      type: String,
      trim: true,
      default: 'General Practice',
    },
    preferredDate: {
      type: String,
      default: '',
    },
    preferredTime: {
      type: String,
      default: '10:00 AM',
    },
    status: {
      type: String,
      enum: ['Pending', 'Contacted', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

export const DemoLead = mongoose.model('DemoLead', demoLeadSchema);
