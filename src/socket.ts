import { Server } from 'socket.io';
import http from 'http';

let io: Server;

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('setup', async (userData: any) => {
            if (userData?.id) { // This is Clerk ID
                socket.join(userData.id);
                console.log(`User ${userData.id} setup`);
                try {
                    // Update user online status
                    await require('./models/User').User.findOneAndUpdate(
                        { clerkId: userData.id },
                        { online: true }
                    );
                    socket.broadcast.emit('userOnline', userData.id);
                } catch (err) {
                    console.error('Error updating online status:', err);
                }
            }
        });

        socket.on('joinConversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation ${conversationId}`);
        });

        socket.on('disconnect', async () => {
            console.log('User disconnected:', socket.id);
            // We need to know WHICH user disconnected. 
            // In a real app we'd map socketId -> userId.
            // For now, this is a limitation unless we store it.
            // TODO: Add socketId -> userId mapping for robust offline status.
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
