import express from 'express';
import { createConversation, getUserConversations } from '../controllers/conversation.controller';

const router = express.Router();

router.post('/', createConversation);
router.get('/:userId', getUserConversations);

export default router;
