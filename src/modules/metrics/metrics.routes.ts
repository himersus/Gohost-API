import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { getServiceMetrics, getMyGeneralMetrics, getVpsMetrics } from "./metrics.controller";

const router = express.Router();

router.get('/project/metrics/:projectId', verifyAuthentication, getServiceMetrics);
router.get('/project/metrics', verifyAuthentication, getMyGeneralMetrics);
router.get('/metrics/general', verifyAuthentication, getVpsMetrics);

export default router;
