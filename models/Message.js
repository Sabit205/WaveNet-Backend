const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    senderId: {
        type: String, // Storing Clerk ID for easier frontend matching, or ObjectID if we prefer strict relation.
        // Let's stick to Clerk ID for compatibility with current socket setup to avoid confusion, 
        // OR map everything to MongoIDs.
        // Given current User.js uses ClerkId, let's store ClerkId here for sender/receiver for consistency with socket events.
        // Actually, for robust DB relations, MongoID is better. 
        // Plan: User logs in -> Sync Clerk User to MongoDB -> Use MongoDB _id for relations.
        // But frontend knows Clerk ID easily.
        // Compromise: Store ClerkId for ease, but we have the User model to lookup.
        // Let's use string ClerkIDs to avoid constant lookup overheads during simple messaging.
        required: true,
        index: true
    },
    receiverId: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
