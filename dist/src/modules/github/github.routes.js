"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const github_controller_1 = require("./github.controller");
const router = express_1.default.Router();
router.get('/list/repo', userAuth_1.verifyAuthentication, github_controller_1.getUserRepos);
router.get('/list/repo/:name', userAuth_1.verifyAuthentication, github_controller_1.getUserRepos);
router.get('/list/repo/:owner/:repo', userAuth_1.verifyAuthentication, github_controller_1.getUserRepoByName);
router.get('/list/branches/:owner/:repo', userAuth_1.verifyAuthentication, github_controller_1.getUserBranchesByName);
router.put('/sync', userAuth_1.verifyAuthentication, github_controller_1.syncUserWithGitHub);
router.post('/unsync', userAuth_1.verifyAuthentication, github_controller_1.unsyncUserFromGitHub);
exports.default = router;
