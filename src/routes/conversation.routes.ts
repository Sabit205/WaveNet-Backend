import express from 'express';
import { createConversation, getUserConversations, getConversationById } from '../controllers/conversation.controller';

const router = express.Router();

router.post('/', createConversation);
router.get('/:userId', getUserConversations);
router.get('/detail/:conversationId', getConversationById);

export default router;
