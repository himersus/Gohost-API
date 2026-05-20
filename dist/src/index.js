"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const apiRouter_1 = __importDefault(require("./routers/apiRouter"));
const passport_1 = __importDefault(require("passport"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
require("./modules/auth/github.passport");
require("./modules/auth/google.passport");
const http_1 = require("http");
const index_1 = require("./sockets/index");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const rateLimiter_1 = require("./middleware/rateLimiter");
const openapi_1 = require("./lib/openapi");
const port = Number(process.env.PORT) || 3000;
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
(0, index_1.initSocket)(httpServer);
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "validator.swagger.io"],
            connectSrc: ["'self'", "https://drenoday.enor.tech"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:5500",
        "http://localhost:3000",
        "https://drenoday.enor.tech",
    ],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "1mb" }));
app.use((0, cookie_parser_1.default)());
app.use(passport_1.default.initialize());
app.get("/", (req, res) => {
    res.send("Welcome to drenoday API!");
});
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_1.openApiSpec));
app.get("/api-docs.json", (req, res) => {
    res.json(openapi_1.openApiSpec);
});
app.get("/cookie", (req, res) => {
    res.json(req.cookies);
});
app.use("/api/v1", rateLimiter_1.apiLimiter, apiRouter_1.default);
httpServer.listen(port, "0.0.0.0", () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});
