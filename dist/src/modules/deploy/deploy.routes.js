"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const verifyDeployToken_1 = require("../../middleware/verifyDeployToken");
const deploy_controller_1 = require("./deploy.controller");
const router = express_1.default.Router();
router.post('/', verifyDeployToken_1.verifyDeployToken, deploy_controller_1.deployApp);
router.get('/all/:projectId', userAuth_1.verifyAuthentication, deploy_controller_1.listDeploys);
router.get('/each/:deployId', userAuth_1.verifyAuthentication, deploy_controller_1.getDeploy);
router.get('/:deployId/logs', userAuth_1.verifyAuthentication, deploy_controller_1.getDeployLogs);
router.post('/:deployId/cancel', userAuth_1.verifyAuthentication, deploy_controller_1.cancelDeploy);
exports.default = router;
