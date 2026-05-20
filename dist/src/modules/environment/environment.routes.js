"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const validate_1 = require("../../middleware/validate");
const project_schema_1 = require("../project/project.schema");
const environment_controller_1 = require("./environment.controller");
const router = express_1.default.Router();
router.post("/save/:projectId", (0, validate_1.validate)(project_schema_1.saveEnvSchema), userAuth_1.verifyAuthentication, environment_controller_1.saveEnvVars);
router.get("/list/:projectId", userAuth_1.verifyAuthentication, environment_controller_1.getEnvVars);
router.delete("/delete/:projectId/:envId", userAuth_1.verifyAuthentication, environment_controller_1.deleteEnvVar);
exports.default = router;
