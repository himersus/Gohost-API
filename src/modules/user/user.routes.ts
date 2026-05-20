import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import { validate } from "../../middleware/validate";
import { createUser, getAllUsers, getUser, updateUser, UserLoged } from "./user.controller";
import { createUserSchema, updateUserSchema } from "./user.schema";

const router = express.Router();

router.post('/create', validate(createUserSchema), createUser);
router.get('/me', verifyAuthentication, UserLoged);
router.get('/all', verifyAuthentication, getAllUsers);
router.get('/each/:userId', verifyAuthentication, getUser);
router.put('/update', validate(updateUserSchema), updateUser);

export default router;
