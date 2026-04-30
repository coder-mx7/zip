import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { 
  getStudents, createStudent, updateStudentPoints, deleteStudent,
  getShops, createShop, updateShopPoints, deleteShop,
  getAllResearch
} from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id/points').put(updateStudentPoints);
router.route('/students/:id').delete(deleteStudent);

router.route('/shops').get(getShops).post(createShop);
router.route('/shops/:id/points').put(updateShopPoints);
router.route('/shops/:id').delete(deleteShop);

router.get('/research', getAllResearch);

export default router;
