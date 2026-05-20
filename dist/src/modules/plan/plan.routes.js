"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const validate_1 = require("../../middleware/validate");
const plan_controller_1 = require("./plan.controller");
const plan_schema_1 = require("./plan.schema");
const router = express_1.default.Router();
router.post('/create', (0, validate_1.validate)(plan_schema_1.createPlanSchema), userAuth_1.verifyAuthentication, plan_controller_1.addPlan);
router.put('/update/:planId', (0, validate_1.validate)(plan_schema_1.updatePlanSchema), userAuth_1.verifyAuthentication, plan_controller_1.updatePlan);
router.get('/all', plan_controller_1.getPlans);
router.get('/each/:planId', plan_controller_1.getPlanById);
router.delete('/delete/:planId', userAuth_1.verifyAuthentication, plan_controller_1.deletePlan);
exports.default = router;
