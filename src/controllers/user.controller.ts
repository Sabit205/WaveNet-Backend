import { Request, Response } from 'express';
import { User } from '../models/User';

export const searchUsers = async (req: Request, res: Response) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } }
            ]
        } as any).select('username email image clerkId online lastSeen');

        res.status(200).json(users);
    } catch (error: any) {
        console.error('Error searching users:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
