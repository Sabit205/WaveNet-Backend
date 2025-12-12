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

        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                return res.status(400).json({ error: 'Request already sent' });
            } else if (existingRequest.status === 'rejected') {
                existingRequest.status = 'pending';
                await existingRequest.save();

                // Get receiver socket
                const receiverUser = await User.findById(receiver._id);
                // We need to query the socket map which is in socketHandler. 
                // Alternatively, just emit to all (room = user.clerkId) if we joined rooms.
                // Since we didn't implement rooms, we can't easily emit to specific user from HTTP context without shared state.
                // WORKAROUND: For now, we will just rely on Polling or emit a global event and filter on frontend? No, security risk.
                // BETTER: Make users join a room with their ClerkID on connection.

                // Let's implement ROOMS in socketHandler first.
                // Assuming we fix socketHandler to join(userId), we can:
                // req.io.to(receiverUser.clerkId).emit('friend-request-received', existingRequest);

                // Since we haven't done rooms:
                // Let's return the request and frontend of SENDER emits the notification? 
                // No, sender shouldn't control receiver's UI.

                // Best approach: Add global 'onlineUsers' map export or use IO rooms.
                // Let's assume we will switch to Rooms in socketHandler.

                return res.json(existingRequest);
            } else if (existingRequest.status === 'accepted') {
                return res.status(400).json({ error: 'Already friends' });
            }
        }

        const request = await FriendRequest.create({
            sender: sender._id,
            receiver: receiver._id
        });

        // Populate sender details for the notification
        await request.populate('sender', 'clerkId fullName imageUrl email');

        // Emit event - PRE-REQUISITE: Users must join their own ID room
        req.io.to(receiver.clerkId).emit('friend-request-received', request);

        res.json(request);

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

        // Optimize: Populate sender (current user) info to send to the requester (new friend)
        const receiverUser = await User.findById(currentUser._id).select('clerkId fullName imageUrl email');
        const senderUser = await User.findById(request.sender); // The one who sent the request

        req.io.to(senderUser.clerkId).emit('friend-request-accepted', { friend: receiverUser });

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
