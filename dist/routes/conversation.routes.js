"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const conversation_controller_1 = require("../controllers/conversation.controller");
const router = express_1.default.Router();
router.post('/', conversation_controller_1.createConversation);
router.get('/:userId', conversation_controller_1.getUserConversations);
exports.default = router;
