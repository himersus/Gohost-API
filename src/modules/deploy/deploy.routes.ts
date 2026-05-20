import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { verifyDeployToken } from "../../middleware/verifyDeployToken";
import { listDeploys, getDeploy, deployApp } from "./deploy.controller";

const router = express.Router();

router.post('/', verifyDeployToken, deployApp);
router.get('/all/:projectId', verifyAuthentication, listDeploys);
router.get('/each/:deployId', verifyAuthentication, getDeploy);

export default router;
