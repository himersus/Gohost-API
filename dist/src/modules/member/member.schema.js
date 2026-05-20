"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMemberSchema = exports.addMemberSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.addMemberSchema = zod_1.default.object({
    username: zod_1.default.string(),
    projectId: zod_1.default.string(),
    role: zod_1.default.enum(["master", "admin", "member"]),
});
exports.removeMemberSchema = zod_1.default.object({
    username: zod_1.default.string(),
    projectId: zod_1.default.string(),
});
