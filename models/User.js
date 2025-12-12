const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

// Index for search
UserSchema.index({ fullName: 'text', email: 'text' });

module.exports = mongoose.model('User', UserSchema);
