"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const validate_1 = require("../../middleware/validate");
const project_schema_1 = require("./project.schema");
const project_controller_1 = require("./project.controller");
const router = express_1.default.Router();
router.post('/create', (0, validate_1.validate)(project_schema_1.createProjectSchema), userAuth_1.verifyAuthentication, project_controller_1.createProject);
router.get('/each/:projectId', userAuth_1.verifyAuthentication, project_controller_1.getProject);
router.get('/:projectId/deploy-token', userAuth_1.verifyAuthentication, project_controller_1.getDeployToken);
router.post('/:projectId/regenerate-token', userAuth_1.verifyAuthentication, project_controller_1.regenerateDeployToken);
router.get('/my', userAuth_1.verifyAuthentication, project_controller_1.getMyProjects);
router.put('/update/:projectId', (0, validate_1.validate)(project_schema_1.updateProjectSchema), userAuth_1.verifyAuthentication, project_controller_1.updateProject);
router.delete('/delete/:projectId', userAuth_1.verifyAuthentication, project_controller_1.deleteProject);
exports.default = router;
