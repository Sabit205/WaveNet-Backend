const CallLog = require('../models/CallLog');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New socket connection:', socket.id);

        // User comes online
        socket.on('user-online', (userId) => {
            onlineUsers.set(userId, socket.id);
            io.emit('online-users', Array.from(onlineUsers.keys()));
            console.log(`User ${userId} is online`);
        });

        // Initiate Call
        socket.on('call-user', ({ callerId, receiverId, callType, callerName, callerAvatar }) => {
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('incoming-call', {
                    callerId,
                    callerName,
                    callerAvatar,
                    callType,
                    signal: null // Initial signal might come later or here depending on flow
                });
                console.log(`Call initiated from ${callerId} to ${receiverId}`);
            } else {
                // Handle user offline case if needed
                socket.emit('user-offline', receiverId);
            }
        });

        // Call Accepted
        socket.on('call-accepted', ({ callerId, signal }) => {
            const callerSocketId = onlineUsers.get(callerId);
            if (callerSocketId) {
                io.to(callerSocketId).emit('call-accepted', { signal });
                console.log(`Call accepted by ${callerId}`);
            }
        });

        // Call Rejected
        socket.on('call-rejected', async ({ callerId, receiverId }) => {
            const callerSocketId = onlineUsers.get(callerId);
            if (callerSocketId) {
                io.to(callerSocketId).emit('call-rejected');
            }

            // Log as rejected
            try {
                await CallLog.create({
                    callerId,
                    receiverId,
                    callType: 'audio', // Default or passed from frontend
                    callStatus: 'rejected'
                });
            } catch (err) {
                console.error('Error logging rejected call:', err);
            }
        });

        // WebRTC Signaling (Offer/Answer/IceCandidate)
        socket.on('signal', ({ targetId, signal }) => {
            const targetSocketId = onlineUsers.get(targetId);
            if (targetSocketId) {
                io.to(targetSocketId).emit('signal', { senderId: socket.id, signal }); // senderId might need to be userId
            }
        });

        // End Call
        socket.on('end-call', async ({ callerId, receiverId, callType }) => {
            const otherUserId = callerId === socket.handshake.query.userId ? receiverId : callerId; // Logic depends on how we track current user
            const otherSocketId = onlineUsers.get(otherUserId);

            if (otherSocketId) {
                io.to(otherSocketId).emit('call-ended');
            }

            // Log call
            try {
                await CallLog.create({
                    callerId,
                    receiverId,
                    callType,
                    callStatus: 'accepted',
                    endTime: new Date()
                });
            } catch (err) {
                console.error('Error logging ended call:', err);
            }
        });

        // Disconnect
        socket.on('disconnect', () => {
            let disconnectedUserId;
            for (const [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                io.emit('online-users', Array.from(onlineUsers.keys()));
                console.log(`User ${disconnectedUserId} disconnected`);
            }
        });
    });
};
