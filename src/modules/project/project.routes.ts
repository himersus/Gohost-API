import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { validate } from "../../middleware/validate";
import { createProjectSchema, updateProjectSchema } from "./project.schema";
import { createProject, deleteProject, getMyProjects, getProject, updateProject } from "./project.controller";

const router = express.Router();

router.post('/create', validate(createProjectSchema), verifyAuthentication, createProject);
router.get('/each/:projectId', verifyAuthentication, getProject);
router.get('/my', verifyAuthentication, getMyProjects);
router.put('/update/:projectId', validate(updateProjectSchema), verifyAuthentication, updateProject);
router.delete('/delete/:projectId', verifyAuthentication, deleteProject);

export default router;
