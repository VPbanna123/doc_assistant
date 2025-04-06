import express from 'express';
// import { register, login } from '../controllers/authController';
import {register,login,getCurrentUser, updateProfile, changePassword,saveHistory} from '../controllers/authController'
import { authMiddleware } from '../middleware/authMiddleware';
const router = express.Router();

router.post('/signup', register);
router.post('/login', login);
// Protected routes (Require JWT authentication)
router.get('/profile', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/save-history', authMiddleware, saveHistory);
export default router;
