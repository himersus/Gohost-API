import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { webhookLimiter } from "../../middleware/rateLimiter";
import {
  createPayment,
  confirmPayment,
  getUserPayments,
  getPaymentById,
  referenceSendPaymentGateway,
  webhookPayment,
} from "./payment.controller";

const router = express.Router();

router.post('/create', verifyAuthentication, createPayment);
router.post('/confirm', verifyAuthentication, confirmPayment);
router.get('/my', verifyAuthentication, getUserPayments);
router.get('/each/:paymentId', verifyAuthentication, getPaymentById);
router.post('/reference', verifyAuthentication, referenceSendPaymentGateway);
router.post('/webhook', webhookLimiter, webhookPayment);

export default router;
