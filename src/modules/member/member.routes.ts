import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { validate } from "../../middleware/validate";
import { addMember, listMembers, removeMember } from "./member.controller";
import { addMemberSchema, removeMemberSchema } from "./member.schema";

const router = express.Router();

router.post('/add', validate(addMemberSchema), verifyAuthentication, addMember);
router.delete('/remove', validate(removeMemberSchema), verifyAuthentication, removeMember);
router.get('/list/:projectId', verifyAuthentication, listMembers);

export default router;
