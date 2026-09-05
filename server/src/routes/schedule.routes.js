import { Router } from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import { getDoctorSchedule, saveDoctorSchedule } from '../controller/schedule.controller.js';

const router = Router();

router.use(verifyJwt);

router.get('/', getDoctorSchedule);
router.post('/', saveDoctorSchedule);

export default router;
