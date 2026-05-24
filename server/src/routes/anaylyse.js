import express from 'express';
import multer from 'multer';
import { analyzeAudio, transcribeAudio } from '../controller/analyze.controller.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', verifyJwt, upload.single('audio'), analyzeAudio);
router.post('/transcribe', verifyJwt, upload.single('audio'), transcribeAudio);

export default router;