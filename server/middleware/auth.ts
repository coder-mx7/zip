import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-copysearch';
 
export const protect = async (req: any, res: Response, next: NextFunction) => {
  try {
    let token;
    
    // الحصول على الـ token من headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.warn('⚠️ No token provided');
      return res.status(401).json({ error: 'غير مصرح لك بالدخول' });
    }
    
    try {
      // التحقق من الـ token
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.warn(`⚠️ User not found for token`);
        return res.status(401).json({ error: 'المستخدم غير موجود' });
      }
      
      req.user = user;
      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        console.warn('⚠️ Token expired');
        return res.status(401).json({ error: 'انتهت صلاحية الرمز' });
      }
      throw jwtError;
    }
  } catch (error: any) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({ error: 'رمز الدخول غير صالح' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصرح لك بالدخول' });
    }
    
    if (!roles.includes(req.user.role)) {
      console.warn(`⚠️ User ${req.user._id} lacks permission for role: ${roles.join(', ')}`);
      return res.status(403).json({ error: 'ليس لديك صلاحية للقيام بهذا الإجراء' });
    }
    
    next();
  };
};
