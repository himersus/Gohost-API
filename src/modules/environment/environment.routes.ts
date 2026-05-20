import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { validate } from "../../middleware/validate";
import { saveEnvSchema } from "../project/project.schema";
import { saveEnvVars, getEnvVars, deleteEnvVar } from "./environment.controller";

const router = express.Router();

router.post("/save/:projectId", validate(saveEnvSchema), verifyAuthentication, saveEnvVars);
router.get("/list/:projectId", verifyAuthentication, getEnvVars);
router.delete("/delete/:projectId/:envId", verifyAuthentication, deleteEnvVar);

export default router;
