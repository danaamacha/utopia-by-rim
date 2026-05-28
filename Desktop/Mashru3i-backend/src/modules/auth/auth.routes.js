import { Router } from 'express';
import {
  postLogin,
  postRegister,
  postRefresh,
  postLogout,
  getMe,
  postResendVerification,
  getVerifyEmail,
  postForgotPassword,
  postResetPassword,
} from './auth.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = Router();

router.post('/register', postRegister);
router.post('/login', postLogin);
router.post('/refresh', postRefresh);
router.post('/logout', postLogout);
router.get('/me', authenticate, getMe);

// Email verification endpoints
router.post('/resend-verification', postResendVerification);
router.get('/verify-email', getVerifyEmail);
// Password reset
router.post('/forgot-password', postForgotPassword);
router.post('/reset-password', postResetPassword);
export default router;
