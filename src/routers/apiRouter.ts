import express from "express";
import { createUser, getAllUsers, getUser, updateUser, UserLoged } from "../controller/User";
import dotenv from 'dotenv';
import { verifyAuthentication } from "../middleware/userLoged";
import { login, loginGoogle, sendCodeVerification } from "../controller/Auth";
import passport from "passport";
import { getUserRepos } from "../controller/github";
import { createWorkspace, deleteWorkspace, getAllWorkspaces, getWorkspace, updateWorkspace } from "../controller/Workspace";
import { createProject, deleteProject, getMyProjects, GetPendingProjectsPayments, getProject, updateProject } from "../controller/Project";
import { addMember, removeMember } from "../controller/member";

dotenv.config();

const router = express.Router();

// {{AUTH ROUTES}}
router.post('/auth/login', login);
router.post('/auth/send-code-verification', sendCodeVerification);
router.post('/auth/verify-code', sendCodeVerification);

// {{GITHUB AUTH ROUTES}}
router.get('/auth/github', passport.authenticate('github', { scope: ['profile', 'email'] }));
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/auth/login' }), (req : any, res) => {
    const token = (req.user as any).token;
    console.log("GitHub OAuth successful, user ID:", req.userId);
    // Redireciona para o frontend com o token como query param
    res.json({ token });
});

// {{GOOGLE AUTH ROUTES}}
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/google' }), loginGoogle);

// Github 
router.get('/github/list/repo', verifyAuthentication, getUserRepos);

// {{USER ROUTES}}
router.post('/user/create', createUser);
router.get('/user/me', verifyAuthentication, UserLoged);
router.get('/user/all', verifyAuthentication, getAllUsers);
router.get('/user/each/:userId', verifyAuthentication, getUser);
router.put('/user/update', verifyAuthentication, updateUser);

// {{Create Workspace ROUTE}}
router.post('/workspace/create', verifyAuthentication, createWorkspace);
router.get('/workspace/each/:workspaceId', verifyAuthentication, getWorkspace);
router.get('/workspace/all', verifyAuthentication, getAllWorkspaces);
router.put('/workspace/update/:workspaceId', verifyAuthentication, updateWorkspace);
router.delete('/workspace/delete/:workspaceId', verifyAuthentication, deleteWorkspace);

// {{ Project ROUTES}}
router.post('/project/create', verifyAuthentication, createProject);
router.get('/project/each/:projectId', verifyAuthentication, getProject);
router.get('/project/my/:workspaceId', verifyAuthentication, getMyProjects);
router.get('/project/pending', verifyAuthentication, GetPendingProjectsPayments);
router.put('/project/update/:projectId', verifyAuthentication, updateProject);
router.delete('/project/delete/:projectId', verifyAuthentication, deleteProject);

// {{ Member ROUTES}}
router.post('/workspace/member/add', verifyAuthentication, addMember);
router.post('/workspace/member/remove', verifyAuthentication, removeMember);

export default router;