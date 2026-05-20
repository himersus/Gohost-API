"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const validate_1 = require("../../middleware/validate");
const rateLimiter_1 = require("../../middleware/rateLimiter");
const auth_controller_1 = require("./auth.controller");
const auth_schema_1 = require("./auth.schema");
const router = express_1.default.Router();
router.post('/login', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schema_1.loginUserSchema), auth_controller_1.login);
router.post('/email', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schema_1.sendCodeVerificationSchema), auth_controller_1.loginWithEmail);
router.post('/send-code-verification', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schema_1.sendCodeVerificationSchema), auth_controller_1.sendCodeVerification);
router.post('/verify-code', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schema_1.verifyCodeSchema), auth_controller_1.verifyCode);
router.post('/forgot-password', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schema_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password', rateLimiter_1.authLimiter, (0, validate_1.validate)(auth_schema_1.resetPasswordSchema), auth_controller_1.resetPassword);
router.get('/github', passport_1.default.authenticate('github', {
    scope: ['read:user', 'user:email', 'repo'],
    session: false
}));
router.get('/github/callback', passport_1.default.authenticate('github', { failureRedirect: '/auth/github', session: false }), auth_controller_1.loginGitHub);
router.get('/google', (req, res, next) => {
    const create = req.query.create;
    passport_1.default.authenticate('google', {
        scope: ['profile', 'email'],
        state: JSON.stringify({ create }),
        session: false
    })(req, res, next);
});
router.get('/google/callback', passport_1.default.authenticate('google', { failureRedirect: '/auth/google', session: false }), auth_controller_1.loginGoogle);
exports.default = router;
