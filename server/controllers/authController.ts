import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-copysearch';

const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export const loginAdmin = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'admin' });
  if (!user || !(await bcrypt.compare(password, user.password!))) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  res.json({ token: generateToken(user._id.toString()), user });
};

export const loginStudent = async (req: Request, res: Response) => {
  const { token } = req.body;
  const user = await User.findOne({ token, role: 'student' });
  if (!user) return res.status(401).json({ error: 'رمز الدخول غير صحيح' });
  res.json({ token: generateToken(user._id.toString()), user });
};

export const loginShop = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, role: 'shop' });
  if (!user || !(await bcrypt.compare(password, user.password!))) {
    return res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
  }
  res.json({ token: generateToken(user._id.toString()), user });
};

export const getMe = async (req: any, res: Response) => {
  res.json(req.user);
};
