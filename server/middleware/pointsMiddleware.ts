import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';

/**
 * Middleware للتحقق من وجود نقاط كافية
 * @param requiredPoints عدد النقاط المطلوبة (افتراضي: 10)
 */
export const checkPoints = (requiredPoints: number = 10) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // التحقق من وجود المستخدم
      if (!req.user) {
        return res.status(401).json({ 
          error: 'غير مصرح - يجب تسجيل الدخول أولاً' 
        });
      }

      // جلب بيانات المستخدم الحالية من قاعدة البيانات
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ 
          error: 'المستخدم غير موجود' 
        });
      }

      // التحقق من النقاط
      if (user.points < requiredPoints) {
        return res.status(402).json({
          error: 'رصيد النقاط غير كافٍ',
          currentPoints: user.points,
          requiredPoints: requiredPoints,
          needPoints: requiredPoints - user.points,
          message: `أنت تحتاج إلى ${requiredPoints - user.points} نقطة(ات) إضافية`
        });
      }

      // تحديث النقاط في req للاستخدام لاحقاً
      req.userPoints = user.points;
      
      next();
    } catch (error: any) {
      res.status(500).json({ 
        error: 'خطأ في فحص النقاط',
        details: error.message 
      });
    }
  };
};

/**
 * دالة مساعدة لخصم النقاط من المستخدم
 */
export const deductPoints = async (userId: string, points: number) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points: -points } },
      { new: true }
    );
    return user;
  } catch (error: any) {
    throw new Error(`فشل خصم النقاط: ${error.message}`);
  }
};

/**
 * دالة مساعدة لإضافة نقاط للمستخدم
 */
export const addPoints = async (userId: string, points: number) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { points } },
      { new: true }
    );
    return user;
  } catch (error: any) {
    throw new Error(`فشل إضافة النقاط: ${error.message}`);
  }
};

/**
 * Middleware للتحقق من صلاحيات الأدوار
 */
export const authorize = (...roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصرح' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'ليس لديك صلاحية للقيام بهذا الإجراء',
        requiredRole: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};
