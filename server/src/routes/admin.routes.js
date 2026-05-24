import { Router } from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import { User } from '../models/user.model.js';
import { Patient } from '../models/patient.model.js';
import { Recording } from '../models/recording.model.js';
import { ApiResponse } from '../Utils/ApiResponse.js';
import { ApiError } from '../Utils/ApiError.js';
import { asyncHandler } from '../Utils/asyncHandler.js';

const router = Router();

const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    throw new ApiError(403, 'Access denied. Admin access only.');
  }
};

router.get(
  '/stats',
  verifyJwt,
  verifyAdmin,
  asyncHandler(async (req, res) => {
    try {
      const totalDoctors = await User.countDocuments({ role: 'doctor' });
      const totalPatients = await Patient.countDocuments({});
      const totalRecordings = await Recording.countDocuments({});

      const doctorsList = await User.find({ role: 'doctor' })
        .select('-password')
        .sort({ createdAt: -1 });

      const doctorsWithStats = await Promise.all(
        doctorsList.map(async (doc) => {
          const docId = doc._id.toString();
          const patientCount = await Patient.countDocuments({ userId: docId });
          const recordingCount = await Recording.countDocuments({ userId: docId });

          return {
            ...doc.toObject(),
            patientCount,
            recordingCount,
          };
        })
      );

      const recentRecordingsList = await Recording.find({})
        .sort({ createdAt: -1 })
        .limit(10);

      const recentActivity = await Promise.all(
        recentRecordingsList.map(async (rec) => {
          let patientName = 'Unknown Patient';
          if (rec.patientId) {
            const patient = await Patient.findById(rec.patientId);
            if (patient) {
              patientName = `${patient.firstName} ${patient.lastName || ''}`.trim();
            }
          }

          let doctorName = 'Unknown Doctor';
          if (rec.userId && rec.userId !== 'anonymous') {
            const doctor = await User.findById(rec.userId);
            if (doctor && doctor.profile?.name) {
              doctorName = doctor.profile.name;
            }
          }

          return {
            id: rec._id,
            patientName,
            doctorName,
            status: rec.processingStatus,
            createdAt: rec.createdAt,
            duration: rec.metadata?.recordingDuration || rec.audioFile?.duration || 0,
          };
        })
      );

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            totals: {
              doctors: totalDoctors,
              patients: totalPatients,
              recordings: totalRecordings,
            },
            doctors: doctorsWithStats,
            recentActivity,
          },
          'Admin dashboard stats fetched successfully'
        )
      );
    } catch (error) {
      throw new ApiError(500, error.message || 'Failed to fetch admin stats');
    }
  })
);

export default router;
