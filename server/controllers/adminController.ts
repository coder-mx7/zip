import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Research } from '../models/Research.js';

// Students
export const getStudents = async (req: Request, res: Response) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في جلب بيانات الطلاب' });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  try {
    const { name, points } = req.body;
    const token = Math.random().toString(36).substring(2, 9).toUpperCase();
    const student = await User.create({ role: 'student', name, points, token });
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في إنشاء حساب الطالب' });
  }
};

export const updateStudentPoints = async (req: Request, res: Response) => {
  try {
    const { points } = req.body;
    const student = await User.findByIdAndUpdate(req.params.id, { points }, { new: true });
    res.json(student);
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في تحديث نقاط الطالب' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Research.deleteMany({ creatorId: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في حذف الطالب' });
  }
};

// Shops
export const getShops = async (req: Request, res: Response) => {
  try {
    const shops = await User.find({ role: 'shop' }).sort({ createdAt: -1 }).select('-password');
    res.json(shops);
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في جلب بيانات المكتبات' });
  }
};

export const createShop = async (req: Request, res: Response) => {
  try {
    const { name, shopName, email, password, points } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'البريد الإلكتروني مستخدم مسبقاً' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const shop = await User.create({ 
      role: 'shop', name, shopName, email, password: hashedPassword, points 
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في إنشاء حساب المكتبة' });
  }
};

export const updateShopPoints = async (req: Request, res: Response) => {
  try {
    const { points } = req.body;
    const shop = await User.findByIdAndUpdate(req.params.id, { points }, { new: true }).select('-password');
    res.json(shop);
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في تحديث نقاط المكتبة' });
  }
};

export const deleteShop = async (req: Request, res: Response) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Research.deleteMany({ creatorId: req.params.id });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في حذف المكتبة' });
  }
};

// All Research
export const getAllResearch = async (req: Request, res: Response) => {
  try {
    const research = await Research.find().populate('creatorId', 'name role shopName').sort({ createdAt: -1 });
    res.json(research);
  } catch (error: any) {
    res.status(500).json({ error: 'خطأ في جلب سجل البحوث' });
  }
};
