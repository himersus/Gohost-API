import express from "express";
import { verifyAuthentication } from "../../middleware/userAuth";
import {
  getUserRepos,
  getUserRepoByName,
  getUserBranchesByName,
  syncUserWithGitHub,
  unsyncUserFromGitHub,
} from "./github.controller";

const router = express.Router();

router.get('/list/repo', verifyAuthentication, getUserRepos);
router.get('/list/repo/:name', verifyAuthentication, getUserRepos);
router.get('/list/repo/:owner/:repo', verifyAuthentication, getUserRepoByName);
router.get('/list/branches/:owner/:repo', verifyAuthentication, getUserBranchesByName);
router.put('/sync', verifyAuthentication, syncUserWithGitHub);
router.post('/unsync', verifyAuthentication, unsyncUserFromGitHub);

export default router;
