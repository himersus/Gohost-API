import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { myNotifications, markNotificationAsRead, getOneNotification } from "./notification.controller";

const router = express.Router();

router.get("/my", verifyAuthentication, myNotifications);
router.post("/read/:notificationId", verifyAuthentication, markNotificationAsRead);
router.get("/each/:notificationId", verifyAuthentication, getOneNotification);

export default router;
