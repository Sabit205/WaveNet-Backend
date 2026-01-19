import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';

// Create or fetch existing conversation
export const createConversation = async (req: Request, res: Response) => {
    try {
        const { senderId, receiverId } = req.body;

        // Resolve sender if it's a Clerk ID (string starting with 'user_')
        let senderObjectId = senderId;
        if (senderId.startsWith('user_')) {
            const sender = await User.findOne({ clerkId: senderId });
            if (!sender) return res.status(404).json({ message: 'Sender not found' });
            senderObjectId = sender._id;
        }

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [senderObjectId, receiverId] },
            isGroup: false,
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderObjectId, receiverId],
            });
        }

        const populatedConversation = await Conversation.findById(conversation._id)
            .populate('participants', 'username image email clerkId online lastSeen')
            .populate('lastMessage');

        res.status(200).json(populatedConversation);
    } catch (error: any) {
        console.error('Error creating conversation:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get conversations for a user
export const getUserConversations = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId as string;

        let targetObjectId = userId;
        if (userId.startsWith('user_')) {
            const user = await User.findOne({ clerkId: userId });
            if (!user) return res.status(404).json({ message: 'User not found' });
            targetObjectId = user._id.toString();
        }

        if (targetObjectId) {
            const conversations = await Conversation.find({
                participants: { $in: [new mongoose.Types.ObjectId(targetObjectId as string)] },
            })
                .populate('participants', 'username image email clerkId online lastSeen')
                .populate('lastMessage')
                .sort({ updatedAt: -1 });
            return res.status(200).json(conversations);
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } catch (error: any) {
        console.error('Error fetching conversations:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
// Get single conversation by ID
export const getConversationById = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;

        const conversation = await Conversation.findById(conversationId)
            .populate('participants', 'username image email clerkId online lastSeen')
            .populate('lastMessage');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        res.status(200).json(conversation);
    } catch (error: any) {
        console.error('Error fetching conversation:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
