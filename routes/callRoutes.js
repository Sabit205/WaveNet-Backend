const express = require('express');
const router = express.Router();
const CallLog = require('../models/CallLog');
const { requireAuth } = require('../middleware/auth');

// Get call history for a user
router.get('/history/:userId', requireAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Security check: Ensure requesting user matches the param or is admin
        if (req.auth.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized access to call history' });
        }

        const logs = await CallLog.find({
            $or: [{ callerId: userId }, { receiverId: userId }]
        }).sort({ createdAt: -1 });

        res.json(logs);
    } catch (err) {
        console.error('Error fetching call logs:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save a new call log (optional, mostly handled by socket but good to have API)
router.post('/log', requireAuth, async (req, res) => {
    try {
        const { callerId, receiverId, callType, callStatus } = req.body;
        const newLog = await CallLog.create({
            callerId,
            receiverId,
            callType,
            callStatus
        });
        res.status(201).json(newLog);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
