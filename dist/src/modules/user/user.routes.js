"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userAuth_1 = require("../../middleware/userAuth");
const validate_1 = require("../../middleware/validate");
const user_controller_1 = require("./user.controller");
const user_schema_1 = require("./user.schema");
const router = express_1.default.Router();
router.post('/create', (0, validate_1.validate)(user_schema_1.createUserSchema), user_controller_1.createUser);
router.get('/me', userAuth_1.verifyAuthentication, user_controller_1.UserLoged);
router.get('/all', userAuth_1.verifyAuthentication, user_controller_1.getAllUsers);
router.get('/each/:userId', userAuth_1.verifyAuthentication, user_controller_1.getUser);
router.put('/update', (0, validate_1.validate)(user_schema_1.updateUserSchema), user_controller_1.updateUser);
exports.default = router;
