"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const validate_1 = require("../../middleware/validate");
const member_controller_1 = require("./member.controller");
const member_schema_1 = require("./member.schema");
const router = express_1.default.Router();
router.post('/add', (0, validate_1.validate)(member_schema_1.addMemberSchema), userAuth_1.verifyAuthentication, member_controller_1.addMember);
router.delete('/remove', (0, validate_1.validate)(member_schema_1.removeMemberSchema), userAuth_1.verifyAuthentication, member_controller_1.removeMember);
router.get('/list/:projectId', userAuth_1.verifyAuthentication, member_controller_1.listMembers);
exports.default = router;
