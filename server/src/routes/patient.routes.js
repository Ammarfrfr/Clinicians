import express from 'express';
import multer from 'multer';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
} from '../controller/patient.controller.js';
import {
  uploadPatientFile,
  deletePatientFile,
} from '../controller/patientFiles.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// All patient routes are protected
router.use(verifyJwt);

router.get('/search', searchPatients);
router.post('/create', createPatient);
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.patch('/:id', updatePatient);
router.delete('/:id', deletePatient);

// File capture attachments
router.post('/:id/files', upload.single('file'), uploadPatientFile);
router.delete('/:id/files/:fileId', deletePatientFile);

export default router;
