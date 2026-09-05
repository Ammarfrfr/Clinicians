import { DoctorSchedule } from '../models/doctorSchedule.model.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

/**
 * Get Doctor Schedule (for logged in doctor or default)
 */
export const getDoctorSchedule = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;
  let schedule = await DoctorSchedule.findOne({ doctorId });

  if (!schedule) {
    // Return default initial template if not yet created
    schedule = {
      doctorId,
      slots: [
        { dayOfWeek: 1, location: 'City Ortho Clinic - Room 102', startTime: '09:00 AM', endTime: '01:00 PM', isActive: true },
        { dayOfWeek: 3, location: 'Metro Specialty Hospital', startTime: '02:00 PM', endTime: '06:00 PM', isActive: true },
        { dayOfWeek: 5, location: 'Apex Trauma & Joint Care Center', startTime: '10:00 AM', endTime: '04:00 PM', isActive: true },
      ],
      maxSlotsPerDay: 30,
    };
  }

  return res.status(200).json(new ApiResponse(200, schedule, 'Doctor schedule retrieved'));
});

/**
 * Save / Update Doctor Schedule
 */
export const saveDoctorSchedule = asyncHandler(async (req, res) => {
  const doctorId = req.user?._id;
  const { slots, maxSlotsPerDay } = req.body;

  if (!slots || !Array.isArray(slots)) {
    throw new ApiError(400, 'Slots array is required');
  }

  const schedule = await DoctorSchedule.findOneAndUpdate(
    { doctorId },
    {
      doctorId,
      slots,
      maxSlotsPerDay: maxSlotsPerDay || 30,
    },
    { upsert: true, new: true }
  );

  return res.status(200).json(new ApiResponse(200, schedule, 'Doctor schedule saved successfully'));
});
