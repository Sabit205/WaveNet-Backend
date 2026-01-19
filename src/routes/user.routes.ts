import express from 'express';
import { searchUsers } from '../controllers/user.controller';

const router = express.Router();

router.get('/search', searchUsers);

export default router;
