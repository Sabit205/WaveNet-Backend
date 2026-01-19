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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationById = exports.getUserConversations = exports.createConversation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Conversation_1 = require("../models/Conversation");
const User_1 = require("../models/User");
// Create or fetch existing conversation
const createConversation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { senderId, receiverId } = req.body;
        // Resolve sender if it's a Clerk ID (string starting with 'user_')
        let senderObjectId = senderId;
        if (senderId.startsWith('user_')) {
            const sender = yield User_1.User.findOne({ clerkId: senderId });
            if (!sender)
                return res.status(404).json({ message: 'Sender not found' });
            senderObjectId = sender._id;
        }
        // Check if conversation exists
        let conversation = yield Conversation_1.Conversation.findOne({
            participants: { $all: [senderObjectId, receiverId] },
            isGroup: false,
        });
        if (!conversation) {
            conversation = yield Conversation_1.Conversation.create({
                participants: [senderObjectId, receiverId],
            });
        }
        const populatedConversation = yield Conversation_1.Conversation.findById(conversation._id)
            .populate('participants', 'username image email clerkId online lastSeen')
            .populate('lastMessage');
        res.status(200).json(populatedConversation);
    }
    catch (error) {
        console.error('Error creating conversation:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.createConversation = createConversation;
// Get conversations for a user
const getUserConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        let targetObjectId = userId;
        if (userId.startsWith('user_')) {
            const user = yield User_1.User.findOne({ clerkId: userId });
            if (!user)
                return res.status(404).json({ message: 'User not found' });
            targetObjectId = user._id.toString();
        }
        if (targetObjectId) {
            const conversations = yield Conversation_1.Conversation.find({
                participants: { $in: [new mongoose_1.default.Types.ObjectId(targetObjectId)] },
            })
                .populate('participants', 'username image email clerkId online lastSeen')
                .populate('lastMessage')
                .sort({ updatedAt: -1 });
            return res.status(200).json(conversations);
        }
        else {
            return res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        console.error('Error fetching conversations:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getUserConversations = getUserConversations;
// Get single conversation by ID
const getConversationById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const conversation = yield Conversation_1.Conversation.findById(conversationId)
            .populate('participants', 'username image email clerkId online lastSeen')
            .populate('lastMessage');
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        res.status(200).json(conversation);
    }
    catch (error) {
        console.error('Error fetching conversation:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
exports.getConversationById = getConversationById;
