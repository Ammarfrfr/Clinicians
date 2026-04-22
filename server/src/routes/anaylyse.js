import express from 'express';
import multer from 'multer';
import { analyzeAudio } from '../controller/analyze.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', upload.single('audio'), analyzeAudio);

export default router;