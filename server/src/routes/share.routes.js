import express from 'express';
import { generateShareableLink } from '../controller/share.controller.js';
import { verifyJwt } from '../middlewares/verifyJwt.js';

const router = express.Router();

router.post('/prescription', verifyJwt, generateShareableLink);

export default router;
