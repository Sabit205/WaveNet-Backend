"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = require("./lib/db");
const socket_1 = require("./socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Middleware
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || '*', // Fallback to * for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Health Check
app.get('/', (req, res) => {
    res.send('WaveNet Server is running');
});
// Database
(0, db_1.connectDB)();
// Socket.IO
(0, socket_1.initSocket)(server);
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const conversation_routes_1 = __importDefault(require("./routes/conversation.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/conversations', conversation_routes_1.default);
app.use('/api/messages', message_routes_1.default);
app.use('/api/users', user_routes_1.default);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
