import { Router } from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import { getEscalationRules, saveEscalationRules } from '../controller/escalation.controller.js';

const router = Router();

router.use(verifyJwt);

router.get('/', getEscalationRules);
router.post('/', saveEscalationRules);

export default router;
