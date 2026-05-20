"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const payment_controller_1 = require("./payment.controller");
const router = express_1.default.Router();
router.post('/create', userAuth_1.verifyAuthentication, payment_controller_1.createPayment);
router.post('/confirm', userAuth_1.verifyAuthentication, payment_controller_1.confirmPayment);
router.get('/my', userAuth_1.verifyAuthentication, payment_controller_1.getUserPayments);
router.get('/each/:paymentId', userAuth_1.verifyAuthentication, payment_controller_1.getPaymentById);
router.post('/reference', userAuth_1.verifyAuthentication, payment_controller_1.referenceSendPaymentGateway);
router.post('/webhook', rateLimiter_1.webhookLimiter, payment_controller_1.webhookPayment);
exports.default = router;
