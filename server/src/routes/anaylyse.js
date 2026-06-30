import express from 'express';
import multer from 'multer';
import { analyzeAudio, transcribeAudio, dictateSection, searchDrugsFromLLM } from '../controller/analyze.controller.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', verifyJwt, upload.single('audio'), analyzeAudio);
router.post('/transcribe', verifyJwt, upload.single('audio'), transcribeAudio);
router.post('/analyze/dictate-section', verifyJwt, upload.single('audio'), dictateSection);
router.get('/drugs/search', verifyJwt, searchDrugsFromLLM);

export default router;