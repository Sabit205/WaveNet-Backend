const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

// Sync User (Call this on frontend login)
router.post('/sync', requireAuth, async (req, res) => {
    const { userId } = req.auth; // Clerk ID
    const { email, fullName, imageUrl } = req.body;

    try {
        let user = await User.findOne({ clerkId: userId });
        if (user) {
            user.email = email;
            user.fullName = fullName;
            user.imageUrl = imageUrl;
            await user.save();
        } else {
            user = await User.create({
                clerkId: userId,
                email,
                fullName,
                imageUrl
            });
        }
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Search Users
router.get('/search', requireAuth, async (req, res) => {
    const { query } = req.query;
    const { userId } = req.auth;

    if (!query) return res.json([]);

    try {
        const users = await User.find({
            $and: [
                { clerkId: { $ne: userId } }, // Exclude self
                {
                    $or: [
                        { fullName: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).select('clerkId fullName imageUrl email').limit(10);

        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get My Profile (with populated friends)
router.get('/me', requireAuth, async (req, res) => {
    const { userId } = req.auth;
    try {
        const user = await User.findOne({ clerkId: userId }).populate('friends', 'clerkId fullName imageUrl email');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
