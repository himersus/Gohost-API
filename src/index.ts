import "dotenv/config";
import express from "express";
import router from "./routers/apiRouter";
import passport from "passport";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import "./modules/auth/github.passport";
import "./modules/auth/google.passport";
import { startPlanExpiryJob } from "./jobs/plan-expiry.job";

import { createServer } from "http";
import { initSocket } from "./sockets/index";
import cookieParser from "cookie-parser";
import { apiLimiter } from "./middleware/rateLimiter";
import { openApiSpec } from "./lib/openapi";

const port = Number(process.env.PORT) || 3000;
const app = express();

const httpServer = createServer(app);

initSocket(httpServer);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        connectSrc: ["'self'", "https://drenoday.enor.tech"],
      },
    },
  }),
);
app.use(
  cors({
    origin: [
      "http://localhost:5500",
      "http://localhost:3000",
      "https://drenoday.enor.tech",
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use(passport.initialize());

app.get("/", (req, res) => {
  res.send("Welcome to drenoday API!");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/api-docs.json", (req, res) => {
  res.json(openApiSpec);
});

app.get("/cookie", (req, res) => {
  res.json(req.cookies);
});

app.use("/api/v1", apiLimiter, router);

httpServer.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
