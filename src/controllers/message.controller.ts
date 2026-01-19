import { Request, Response } from 'express';
import { Message } from '../models/Message';
import { Conversation } from '../models/Conversation';
import { getIO } from '../socket';

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { senderId, conversationId, content, fileUrl, fileType } = req.body;
        const io = getIO();

        let senderObjectId = senderId;
        if (senderId.startsWith('user_')) {
            // Import User model if not imported
            const User = require('../models/User').User;
            const sender = await User.findOne({ clerkId: senderId });
            if (!sender) return res.status(404).json({ message: 'Sender not found' });
            senderObjectId = sender._id;
        }

        const newMessage = await Message.create({
            conversationId,
            sender: senderObjectId,
            content,
            fileUrl,
            fileType,
        });

        // Update conversation last message
        await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id,
        });

        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username image clerkId');

        // Emit socket event
        io.to(conversationId).emit('newMessage', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error: any) {
        console.error('Error sending message:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;

        const messages = await Message.find({ conversationId })
            .populate('sender', 'username image clerkId')
            .sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error: any) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
