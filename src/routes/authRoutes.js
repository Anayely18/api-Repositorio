import express from 'express';
import authController from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import passwordResetController from '../controllers/passwordResetController.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authMiddleware, authController.getProfile);

router.post('/forgot-password', passwordResetController.requestCode);
router.post('/verify-code', passwordResetController.verifyCode);
router.post('/reset-password', passwordResetController.resetPassword);

export default router;