"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || '*',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);
        socket.on('setup', (userData) => __awaiter(void 0, void 0, void 0, function* () {
            if (userData === null || userData === void 0 ? void 0 : userData.id) { // This is Clerk ID
                socket.join(userData.id);
                console.log(`User ${userData.id} setup`);
                try {
                    // Update user online status
                    yield require('./models/User').User.findOneAndUpdate({ clerkId: userData.id }, { online: true });
                    socket.broadcast.emit('userOnline', userData.id);
                }
                catch (err) {
                    console.error('Error updating online status:', err);
                }
            }
        }));
        socket.on('joinConversation', (conversationId) => {
            socket.join(conversationId);
            console.log(`User ${socket.id} joined conversation ${conversationId}`);
        });
        socket.on('disconnect', () => __awaiter(void 0, void 0, void 0, function* () {
            console.log('User disconnected:', socket.id);
            // We need to know WHICH user disconnected. 
            // In a real app we'd map socketId -> userId.
            // For now, this is a limitation unless we store it.
            // TODO: Add socketId -> userId mapping for robust offline status.
        }));
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
exports.getIO = getIO;
