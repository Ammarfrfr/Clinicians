import express from 'express';
import { generateShareableLink, getSharedExercisesPage } from '../controller/share.controller.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';

const router = express.Router();

router.post('/prescription', verifyJwt, generateShareableLink);
router.get('/exercises', getSharedExercisesPage);

export default router;
