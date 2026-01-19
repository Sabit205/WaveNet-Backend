import { Server } from 'socket.io';
import http from 'http';

let io: Server;
const onlineUsers = new Map<string, string>(); // socketId -> clerkId

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
                onlineUsers.set(socket.id, userData.id);
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
            const userId = onlineUsers.get(socket.id);
            if (userId) {
                try {
                    await require('./models/User').User.findOneAndUpdate(
                        { clerkId: userId },
                        { online: false }
                    );
                    socket.broadcast.emit('userOffline', userId);
                    onlineUsers.delete(socket.id);
                } catch (err) {
                    console.error('Error updating offline status:', err);
                }
            }
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
