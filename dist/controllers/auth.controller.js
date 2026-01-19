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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUser = void 0;
const svix_1 = require("svix");
const User_1 = require("../models/User");
const syncUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const headers = req.headers;
        const heads = {
            "svix-id": headers["svix-id"],
            "svix-timestamp": headers["svix-timestamp"],
            "svix-signature": headers["svix-signature"],
        };
        const wh = new svix_1.Webhook(process.env.CLERK_WEBHOOK_SECRET || "");
        let evt;
        try {
            console.log('Verifying webhook signature...');
            evt = wh.verify(req.rawBody, heads);
            console.log('Webhook signature verified');
        }
        catch (err) {
            console.error('Webhook verification failed:', err);
            return res.status(400).json({ message: "Webhook verification failed" });
        }
        const _a = evt.data, { id } = _a, attributes = __rest(_a, ["id"]);
        const eventType = evt.type;
        if (eventType === 'user.created' || eventType === 'user.updated') {
            const { email_addresses, image_url, first_name, last_name, username } = attributes;
            const email = email_addresses[0].email_address;
            const name = username || `${first_name} ${last_name}`;
            yield User_1.User.findOneAndUpdate({ clerkId: id }, {
                clerkId: id,
                email,
                username: name,
                image: image_url,
            }, { upsert: true, new: true });
        }
        if (eventType === 'user.deleted') {
            yield User_1.User.findOneAndDelete({ clerkId: id });
        }
        res.status(200).json({ success: true, message: 'Webhook received' });
    }
    catch (error) {
        console.error('Error syncing user:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
exports.syncUser = syncUser;
