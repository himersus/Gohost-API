import express from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.routes";
import githubRoutes from "../modules/github/github.routes";
import projectRoutes from "../modules/project/project.routes";
import memberRoutes from "../modules/member/member.routes";
import deployRoutes from "../modules/deploy/deploy.routes";
import planRoutes from "../modules/plan/plan.routes";
import paymentRoutes from "../modules/payment/payment.routes";
import notificationRoutes from "../modules/notification/notification.routes";
import environmentRoutes from "../modules/environment/environment.routes";
import metricsRoutes from "../modules/metrics/metrics.routes";
import { verifyAuthentication } from "../middleware/userAuth";
import { createCookieGitHub, readCookieGitHub } from "../modules/github/github.controller";
import { getAllProjects } from "../modules/project/project.controller";
import { getAllPayments } from "../modules/payment/payment.controller";

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/github', githubRoutes);
router.use('/project', projectRoutes);
router.use('/workspace/member', memberRoutes);
router.use('/deploy', deployRoutes);
router.use('/plan', planRoutes);
router.use('/pay', paymentRoutes);
router.use('/notification', notificationRoutes);
router.use('/env', environmentRoutes);

router.use(metricsRoutes);

router.get('/backoffice/project/list', verifyAuthentication, getAllProjects);
router.get('/backoffice/pay/list', verifyAuthentication, getAllPayments);

router.get("/cookie/create", createCookieGitHub);
router.get("/cookie/read", readCookieGitHub);

export default router;
