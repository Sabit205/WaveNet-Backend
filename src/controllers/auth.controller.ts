import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { User } from '../models/User';

export const syncUser = async (req: Request, res: Response) => {
    try {
        const payload = req.body;
        const headers = req.headers;

        const heads = {
            "svix-id": headers["svix-id"] as string,
            "svix-timestamp": headers["svix-timestamp"] as string,
            "svix-signature": headers["svix-signature"] as string,
        };

        const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
        let evt: any;

        try {
            evt = wh.verify(JSON.stringify(payload), heads);
        } catch (err) {
            return res.status(400).json({ message: "Webhook verification failed" });
        }

        const { id, ...attributes } = evt.data;
        const eventType = evt.type;

        if (eventType === 'user.created' || eventType === 'user.updated') {
            const { email_addresses, image_url, first_name, last_name, username } = attributes;
            const email = email_addresses[0].email_address;
            const name = username || `${first_name} ${last_name}`;

            await User.findOneAndUpdate(
                { clerkId: id },
                {
                    clerkId: id,
                    email,
                    username: name,
                    image: image_url,
                },
                { upsert: true, new: true }
            );
        }

        if (eventType === 'user.deleted') {
            await User.findOneAndDelete({ clerkId: id });
        }

        res.status(200).json({ success: true, message: 'Webhook received' });
    } catch (error: any) {
        console.error('Error syncing user:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
