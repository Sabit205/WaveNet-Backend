import express from 'express';
import { syncUser } from '../controllers/auth.controller';

const router = express.Router();

router.post('/webhook', syncUser);

export default router;
