import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { verifyDeployToken } from "../../middleware/verifyDeployToken";
import { cancelDeploy, deployApp, getDeploy, getDeployLogs, listDeploys } from "./deploy.controller";

const router = express.Router();

router.post('/', verifyDeployToken, deployApp);
router.get('/all/:projectId', verifyAuthentication, listDeploys);
router.get('/each/:deployId', verifyAuthentication, getDeploy);
router.get('/:deployId/logs', verifyAuthentication, getDeployLogs);
router.post('/:deployId/cancel', verifyAuthentication, cancelDeploy);

export default router;
