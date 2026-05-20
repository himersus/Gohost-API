import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { listDeploys, getDeploy } from "./deploy.controller";

const router = express.Router();

router.get('/all/:projectId', verifyAuthentication, listDeploys);
router.get('/each/:deployId', verifyAuthentication, getDeploy);

export default router;
