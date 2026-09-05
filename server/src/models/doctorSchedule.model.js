import mongoose, { Schema } from 'mongoose';

const slotSchema = new Schema({
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  },
  location: {
    type: String,
    required: true,
  },
  startTime: {
    type: String, // e.g. "09:00"
    required: true,
  },
  endTime: {
    type: String, // e.g. "17:00"
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const doctorScheduleSchema = new Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    slots: [slotSchema],
    maxSlotsPerDay: {
      type: Number,
      default: 30,
    },
  },
  { timestamps: true }
);

export const DoctorSchedule = mongoose.model('DoctorSchedule', doctorScheduleSchema);
