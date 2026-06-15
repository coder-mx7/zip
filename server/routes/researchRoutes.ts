import express from 'express';
import * as researchController from '../controllers/researchController.js';
import { protect } from '../middleware/auth.js';
import { checkPoints, authorize } from '../middleware/pointsMiddleware.js';
import { validateResearchData, sanitizeResearchData, logResearchData } from '../middleware/dataValidation.js';

const router = express.Router();

router.use(protect);

// ⭐ المرحلة الأولى: توليد الإشكالية + الخطة الكاملة معاً (3 نقاط)
router.post('/plan', checkPoints(3), researchController.generatePlan);

// المراحل الإضافية
router.post('/generate', checkPoints(10), researchController.generateResearch);

// 🛡️ إضافة middleware للتحقق من البيانات والتنظيف
router.put('/plan/confirm', 
    checkPoints(2),
    logResearchData,           // طباعة البيانات للـ debug
    sanitizeResearchData,      // تنظيف البيانات
    validateResearchData,      // التحقق من الصيغة
    researchController.confirmPlan
);

router.get('/generate/:id', researchController.startGeneration);
router.get('/status/:id', researchController.getResearchStatus);
router.get('/history', researchController.getHistory);
router.get('/download/:id', researchController.downloadWord);
router.post('/generate', checkPoints(10), researchController.generateResearch);
router.post('/generate/debug', researchController.generateResearchDebug);
router.post('/single-demand', checkPoints(1), researchController.generateSingleDemand);
router.post('/single-demand/debug', researchController.generateSingleDemandDebug);
router.post('/custom-simple-plan', researchController.generateCustomSimplePlan); // Endpoint جديد للمصفحة

export default router;
