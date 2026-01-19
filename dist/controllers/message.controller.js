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
exports.getMessages = exports.sendMessage = void 0;
const Message_1 = require("../models/Message");
const Conversation_1 = require("../models/Conversation");
const socket_1 = require("../socket");
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderId, conversationId, content, fileUrl, fileType } = req.body;
        const io = (0, socket_1.getIO)();
        let senderObjectId = senderId;
        if (senderId.startsWith('user_')) {
            // Import User model if not imported
            const User = require('../models/User').User;
            const sender = yield User.findOne({ clerkId: senderId });
            if (!sender)
                return res.status(404).json({ message: 'Sender not found' });
            senderObjectId = sender._id;
        }
        const newMessage = yield Message_1.Message.create({
            conversationId,
            sender: senderObjectId,
            content,
            fileUrl,
            fileType,
        });
        // Update conversation last message
        yield Conversation_1.Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id,
        });
        const populatedMessage = yield Message_1.Message.findById(newMessage._id).populate('sender', 'username image clerkId');
        // Emit socket event
        io.to(conversationId).emit('newMessage', populatedMessage);
        res.status(201).json(populatedMessage);
    }
    catch (error) {
        console.error('Error sending message:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const messages = yield Message_1.Message.find({ conversationId })
            .populate('sender', 'username image clerkId')
            .sort({ createdAt: 1 });
        res.status(200).json(messages);
    }
    catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getMessages = getMessages;
