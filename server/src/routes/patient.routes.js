import express from 'express';
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from '../controller/patient.controller.js';

const router = express.Router();

router.post('/create', createPatient);
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);

export default router;
