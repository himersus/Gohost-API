import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { validate } from "../../middleware/validate";
import { addPlan, updatePlan, deletePlan, getPlanById, getPlans } from "./plan.controller";
import { createPlanSchema, updatePlanSchema } from "./plan.schema";

const router = express.Router();

router.post('/create', validate(createPlanSchema), verifyAuthentication, addPlan);
router.put('/update/:planId', validate(updatePlanSchema), verifyAuthentication, updatePlan);
router.get('/all', getPlans);
router.get('/each/:planId', getPlanById);
router.delete('/delete/:planId', verifyAuthentication, deletePlan);

export default router;
