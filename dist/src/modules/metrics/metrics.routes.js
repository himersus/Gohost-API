"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const metrics_controller_1 = require("./metrics.controller");
const router = express_1.default.Router();
router.get('/project/metrics/:projectId', userAuth_1.verifyAuthentication, metrics_controller_1.getServiceMetrics);
router.get('/project/metrics', userAuth_1.verifyAuthentication, metrics_controller_1.getMyGeneralMetrics);
router.get('/metrics/general', userAuth_1.verifyAuthentication, metrics_controller_1.getVpsMetrics);
exports.default = router;
