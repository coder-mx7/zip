import express from 'express';
import { loginAdmin, loginStudent, loginShop, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/admin/login', loginAdmin);
router.post('/student/login', loginStudent);
router.post('/shop/login', loginShop);
router.get('/me', protect, getMe);

export default router;
