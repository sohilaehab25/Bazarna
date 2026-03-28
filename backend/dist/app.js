"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dataSource_1 = require("./config/dataSource");
const errorHandler_1 = require("./middlewares/errorHandler");
const notFoundHandler_1 = require("./middlewares/notFoundHandler");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// Initialize database
dataSource_1.AppDataSource.initialize()
    .then(() => {
    console.log('Database connected successfully');
})
    .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
});
// Security middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
// Logging
app.use((0, morgan_1.default)('combined'));
// Body parsing
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api', routes_1.default);
// Error handling
app.use(notFoundHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
exports.default = app;
