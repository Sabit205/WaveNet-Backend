const CallLog = require('../models/CallLog');

const onlineUsers = new Map(); // userId -> socketId

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New socket connection:', socket.id);

        // User comes online
        socket.on('user-online', ({ userId, userInfo }) => {
            onlineUsers.set(userId, { socketId: socket.id, userInfo });

            // Convert map to array of objects for frontend
            const usersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
                userId: id,
                userInfo: data.userInfo
            }));

            io.emit('online-users', usersList);
            console.log(`User ${userId} is online`);
        });

        // Initiate Call
        socket.on('call-user', ({ callerId, receiverId, callType, callerName, callerAvatar }) => {
            const receiverData = onlineUsers.get(receiverId);
            if (receiverData?.socketId) {
                io.to(receiverData.socketId).emit('incoming-call', {
                    callerId,
                    callerName,
                    callerAvatar,
                    callType,
                    signal: null
                });
                console.log(`Call initiated from ${callerId} to ${receiverId}`);
            } else {
                socket.emit('user-offline', receiverId);
            }
        });

        // Call Accepted
        socket.on('call-accepted', ({ callerId, signal }) => {
            const callerData = onlineUsers.get(callerId);
            if (callerData?.socketId) {
                io.to(callerData.socketId).emit('call-accepted', { signal });
                console.log(`Call accepted by ${callerId}`);
            }
        });

        // Call Rejected
        socket.on('call-rejected', async ({ callerId, receiverId }) => {
            const callerData = onlineUsers.get(callerId);
            if (callerData?.socketId) {
                io.to(callerData.socketId).emit('call-rejected');
            }

            try {
                await CallLog.create({
                    callerId,
                    receiverId,
                    callType: 'audio',
                    callStatus: 'rejected'
                });
            } catch (err) {
                console.error('Error logging rejected call:', err);
            }
        });

        // WebRTC Signaling
        socket.on('signal', ({ targetId, signal }) => {
            const targetData = onlineUsers.get(targetId);
            if (targetData?.socketId) {
                io.to(targetData.socketId).emit('signal', { senderId: socket.id, signal });
            }
        });

        // End Call
        socket.on('end-call', async ({ callerId, receiverId, callType }) => {
            const otherUserId = callerId === socket.handshake.query.userId ? receiverId : callerId;
            const otherData = onlineUsers.get(otherUserId);

            if (otherData?.socketId) {
                io.to(otherData.socketId).emit('call-ended');
            }

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
            for (const [userId, data] of onlineUsers.entries()) {
                if (data.socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                const usersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
                    userId: id,
                    userInfo: data.userInfo
                }));
                io.emit('online-users', usersList);
                console.log(`User ${disconnectedUserId} disconnected`);
            }
        });
    });
};
