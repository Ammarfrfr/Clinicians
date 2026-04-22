import express from 'express';
import {
  getUserRecordings,
  getPatientVisits,
  getPatientSessions,
  getRecordingById,
  updateRecordingNote,
  updateRecordingVitals,
  deleteRecording,
  archiveRecording,
  searchRecordings,
} from '../controller/recordings.controller.js';

const router = express.Router();

router.get('/user/:userId', getUserRecordings);
router.get('/patient/:patientId/visits', getPatientVisits);
router.get('/patients/:patientId/sessions', getPatientSessions);
router.get('/:recordingId', getRecordingById);
router.patch('/:recordingId/note', updateRecordingNote);
router.patch('/:recordingId/vitals', updateRecordingVitals);
router.delete('/:recordingId', deleteRecording);
router.patch('/:recordingId/archive', archiveRecording);
router.get('/search/:userId', searchRecordings);

export default router;
