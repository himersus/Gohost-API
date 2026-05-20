import express from "express";
import passport from "passport";
import { validate } from "../../middleware/validate";
import { authLimiter } from "../../middleware/rateLimiter";
import { login, loginGitHub, loginGoogle, loginWithEmail, sendCodeVerification, verifyCode } from "./auth.controller";
import { loginUserSchema, sendCodeVerificationSchema, verifyCodeSchema } from "./auth.schema";

const router = express.Router();

router.post('/login', authLimiter, validate(loginUserSchema), login);
router.post('/email', authLimiter, validate(sendCodeVerificationSchema), loginWithEmail);
router.post('/send-code-verification', authLimiter, validate(sendCodeVerificationSchema), sendCodeVerification);
router.post('/verify-code', authLimiter, validate(verifyCodeSchema), verifyCode);

router.get('/github',
  passport.authenticate('github', {
    scope: ['read:user', 'user:email', 'repo'],
    session: false
  })
);

router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/auth/github', session: false }), loginGitHub);

router.get('/google',
  (req, res, next) => {
    const create = req.query.create;
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      state: JSON.stringify({ create }),
      session: false
    })(req, res, next);
  }
);

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/auth/google', session: false }), loginGoogle);

export default router;
