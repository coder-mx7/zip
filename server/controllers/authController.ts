import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-copysearch';

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // التحقق من إدخال البيانات
    if (!email || !password) {
      console.warn('⚠️ Missing email or password');
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    // البحث عن المدير
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      console.warn(`⚠️ Admin not found: ${email}`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    // التحقق من كلمة المرور
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      console.warn(`⚠️ Invalid password for admin: ${email}`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = generateToken(user._id.toString());
    console.log(`✅ Admin login successful: ${email}`);
    
    res.json({ 
      token, 
      user: {
        _id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        points: user.points
      }
    });
  } catch (error: any) {
    console.error('❌ Error in loginAdmin:', error.message);
    res.status(500).json({ 
      error: 'حدث خطأ في تسجيل الدخول', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const loginStudent = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    
    // التحقق من إدخال البيانات
    if (!token) {
      console.warn('⚠️ Missing student token');
      return res.status(400).json({ error: 'رمز الدخول مطلوب' });
    }

    // البحث عن الطالب
    const user = await User.findOne({ token, role: 'student' });
    if (!user) {
      console.warn(`⚠️ Student not found with token: ${token}`);
      return res.status(401).json({ error: 'رمز الدخول غير صحيح' });
    }

    const jwtToken = generateToken(user._id.toString());
    console.log(`✅ Student login successful: ${user.name}`);
    
    res.json({ 
      token: jwtToken, 
      user: {
        _id: user._id,
        role: user.role,
        name: user.name,
        token: user.token,
        points: user.points
      }
    });
  } catch (error: any) {
    console.error('❌ Error in loginStudent:', error.message);
    res.status(500).json({ 
      error: 'حدث خطأ في تسجيل الدخول', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const loginShop = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // التحقق من إدخال البيانات
    if (!email || !password) {
      console.warn('⚠️ Missing email or password');
      return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبة' });
    }

    // البحث عن المحل
    const user = await User.findOne({ email, role: 'shop' });
    if (!user) {
      console.warn(`⚠️ Shop not found: ${email}`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    // التحقق من كلمة المرور
    if (!user.password || !(await bcrypt.compare(password, user.password))) {
      console.warn(`⚠️ Invalid password for shop: ${email}`);
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    }

    const token = generateToken(user._id.toString());
    console.log(`✅ Shop login successful: ${email}`);
    
    res.json({ 
      token, 
      user: {
        _id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        points: user.points
      }
    });
  } catch (error: any) {
    console.error('❌ Error in loginShop:', error.message);
    res.status(500).json({ 
      error: 'حدث خطأ في تسجيل الدخول', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('❌ Error in getMe:', error.message);
    res.status(500).json({ 
      error: 'حدث خطأ', 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};
