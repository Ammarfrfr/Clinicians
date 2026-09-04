import express from 'express';
import multer from 'multer';
import { analyzeAudio, transcribeAudio, dictateSection, searchDrugsFromLLM, chatWithAssistant, analyzeText, generateChatTitle } from '../controller/analyze.controller.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/analyze', verifyJwt, upload.single('audio'), analyzeAudio);
router.post('/transcribe', verifyJwt, upload.single('audio'), transcribeAudio);
router.post('/analyze/dictate-section', verifyJwt, upload.single('audio'), dictateSection);
router.get('/drugs/search', verifyJwt, searchDrugsFromLLM);
router.post('/chat', verifyJwt, chatWithAssistant);
router.post('/chat/title', verifyJwt, generateChatTitle);
router.post('/analyze/text', verifyJwt, analyzeText);


export default router;