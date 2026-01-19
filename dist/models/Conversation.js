"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const conversationSchema = new mongoose_1.default.Schema({
    participants: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        }],
    lastMessage: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Message',
    },
    isGroup: {
        type: Boolean,
        default: false,
    },
    groupName: {
        type: String,
        required: function () { return this.isGroup; }
    },
    groupAdmin: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });
exports.Conversation = mongoose_1.default.model('Conversation', conversationSchema);
