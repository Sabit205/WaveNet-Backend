const mongoose = require('mongoose');

const CallLogSchema = new mongoose.Schema({
    callerId: {
        type: String,
        required: true,
        index: true
    },
    receiverId: {
        type: String,
        required: true,
        index: true
    },
    callType: {
        type: String,
        enum: ['audio', 'video'],
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    callStatus: {
        type: String,
        enum: ['accepted', 'rejected', 'missed', 'canceled'],
        default: 'missed'
    }
}, { timestamps: true });

module.exports = mongoose.model('CallLog', CallLogSchema);
