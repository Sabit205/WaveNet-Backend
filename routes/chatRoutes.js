const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { requireAuth } = require('../middleware/auth');

// Get Conversation History
router.get('/:otherUserId', requireAuth, async (req, res) => {
    const { userId } = req.auth; // Clerk ID
    const { otherUserId } = req.params;

    try {
        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: userId }
            ]
        }).sort({ createdAt: 1 }); // Oldest first

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
