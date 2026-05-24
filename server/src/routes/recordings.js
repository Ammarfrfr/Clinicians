import express from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
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
  updateFollowUp,
  getUpcomingFollowUps,
  updateFollowUpTodos,
  createManualVisit,
} from '../controller/recordings.controller.js';

const router = express.Router();

// All recording routes are protected
router.use(verifyJwt);

router.post('/', createManualVisit);
router.get('/user/:userId', getUserRecordings);
router.get('/followups', getUpcomingFollowUps);
router.get('/patient/:patientId/visits', getPatientVisits);
router.get('/patients/:patientId/sessions', getPatientSessions);
router.get('/:recordingId', getRecordingById);
router.patch('/:recordingId/note', updateRecordingNote);
router.patch('/:recordingId/vitals', updateRecordingVitals);
router.patch('/:recordingId/followup', updateFollowUp);
router.patch('/:recordingId/todos', updateFollowUpTodos);
router.delete('/:recordingId', deleteRecording);
router.patch('/:recordingId/archive', archiveRecording);
router.get('/search/:userId', searchRecordings);

export default router;
