"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const notification_controller_1 = require("./notification.controller");
const router = express_1.default.Router();
router.get("/my", userAuth_1.verifyAuthentication, notification_controller_1.myNotifications);
router.post("/read/:notificationId", userAuth_1.verifyAuthentication, notification_controller_1.markNotificationAsRead);
router.get("/each/:notificationId", userAuth_1.verifyAuthentication, notification_controller_1.getOneNotification);
exports.default = router;
