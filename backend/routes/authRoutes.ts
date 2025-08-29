import express from 'express';
// import { register, login } from '../controllers/authController';
import {register,login,getCurrentUser, updateProfile, changePassword,saveHistory,VerifyEmail,resetPassword,VerifyOtp,ForgotPassword} from '../controllers/authController'
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();

router.post('/signup', register);
router.post('/login', login);
router.post("/verify-email",VerifyEmail)
router.post("/verifyotp",VerifyOtp)
router.post("/resetPassword",resetPassword)
router.post("/forgot-password",ForgotPassword)
// Protected routes (Require JWT authentication)
router.get('/profile', authMiddleware, getCurrentUser);
router.put('/update-profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/save-history', authMiddleware, saveHistory);
export default router;
