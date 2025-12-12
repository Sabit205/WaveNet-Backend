const express = require('express');
const router = express.Router();
const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { requireAuth } = require('../middleware/auth');

// Get Pending Requests
router.get('/requests', requireAuth, async (req, res) => {
    const { userId } = req.auth;
    try {
        const currentUser = await User.findOne({ clerkId: userId });
        if (!currentUser) return res.status(404).json({ error: 'User not found' });

        const requests = await FriendRequest.find({
            receiver: currentUser._id,
            status: 'pending'
        }).populate('sender', 'clerkId fullName imageUrl email');

        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Send Friend Request
router.post('/request', requireAuth, async (req, res) => {
    const { userId } = req.auth; // Sender Clerk ID
    const { receiverClerkId } = req.body;

    try {
        const sender = await User.findOne({ clerkId: userId });
        const receiver = await User.findOne({ clerkId: receiverClerkId });

        if (!sender || !receiver) return res.status(404).json({ error: 'User not found' });

        // Check compatibility (already friends?)
        if (sender.friends.includes(receiver._id)) {
            return res.status(400).json({ error: 'Already friends' });
        }

        const existingRequest = await FriendRequest.findOne({
            sender: sender._id,
            receiver: receiver._id
        });

        if (existingRequest) return res.status(400).json({ error: 'Request already sent' });

        const request = await FriendRequest.create({
            sender: sender._id,
            receiver: receiver._id
        });

        res.json(request);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Accept Request
router.post('/accept', requireAuth, async (req, res) => {
    const { requestId } = req.body;
    const { userId } = req.auth; // Receiver Clerk ID

    try {
        const currentUser = await User.findOne({ clerkId: userId });
        const request = await FriendRequest.findById(requestId);

        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.receiver.toString() !== currentUser._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        request.status = 'accepted';
        await request.save();

        // Update Friends Lists
        await User.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
        await User.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

        res.json({ message: 'Friend accepted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reject Request
router.post('/reject', requireAuth, async (req, res) => {
    const { requestId } = req.body;
    const { userId } = req.auth;

    try {
        const currentUser = await User.findOne({ clerkId: userId });
        const request = await FriendRequest.findById(requestId);

        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.receiver.toString() !== currentUser._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
