import { Router } from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import {
  getAppointments,
  updateAppointmentStatus,
  getPatientTimeline,
} from '../controller/appointment.controller.js';

const router = Router();

router.use(verifyJwt);

router.get('/', getAppointments);
router.patch('/:id/status', updateAppointmentStatus);
router.get('/timeline/:patientId', getPatientTimeline);

export default router;
