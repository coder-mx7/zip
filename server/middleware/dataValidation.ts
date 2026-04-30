import { Request, Response, NextFunction } from 'express';

/**
 * 🛡️ Middleware للتحقق من صحة البيانات المرسلة
 * - يتأكد من أن content يكون String
 * - يحول Objects إلى JSON.stringify تلقائياً
 * - يقدم رسائل خطأ واضحة
 */

export const validateResearchData = (req: any, res: Response, next: NextFunction) => {
  try {
    const { plan, finalPlan } = req.body;
    const dataToValidate = plan || finalPlan || [];

    if (!Array.isArray(dataToValidate)) {
      return res.status(400).json({
        message: '❌ البيانات يجب أن تكون مصفوفة (Array)',
        received: typeof dataToValidate
      });
    }

    // Validate each item in the plan
    dataToValidate.forEach((item: any, index: number) => {
      if (item.content !== undefined) {
        // إذا كان content object، حوله إلى JSON string
        if (typeof item.content === 'object' && item.content !== null) {
          console.warn(`⚠️ تحويل content في item ${index} من object إلى string`);
          item.content = JSON.stringify(item.content, null, 2);
        }

        // تحقق من أنه الآن string
        if (typeof item.content !== 'string') {
          return res.status(400).json({
            message: `❌ خطأ في التحقق: plan[${index}].content يجب أن يكون string`,
            field: `plan[${index}].content`,
            received: typeof item.content,
            value: item.content
          });
        }

        // تحقق من الطول (محتوى فارغ جداً)
        if (item.content.trim().length === 0 && item.status !== 'pending') {
          return res.status(400).json({
            message: `⚠️ تحذير: plan[${index}].content فارغ`,
            field: `plan[${index}].content`
          });
        }
      }

      // تحقق من الحقول الأساسية
      if (!item.id || !item.type) {
        return res.status(400).json({
          message: `❌ خطأ: plan[${index}] يفتقد id أو type`,
          item: item
        });
      }
    });

    console.log('✅ تم التحقق من البيانات بنجاح');
    next();
  } catch (error: any) {
    res.status(500).json({
      message: '❌ خطأ في middleware التحقق من البيانات',
      error: error.message
    });
  }
};

/**
 * 🔍 Middleware لطباعة البيانات المرسلة (debugging)
 */
export const logResearchData = (req: any, res: Response, next: NextFunction) => {
  if (req.body.plan || req.body.finalPlan) {
    const dataToLog = req.body.plan || req.body.finalPlan;
    console.log('📋 البيانات المرسلة:');
    console.log(JSON.stringify(dataToLog, null, 2));
  }
  next();
};

/**
 * 🧹 Middleware لتنظيف البيانات (Remove undefined/null)
 */
export const sanitizeResearchData = (req: any, res: Response, next: NextFunction) => {
  try {
    const { plan, finalPlan } = req.body;
    const dataToSanitize = plan || finalPlan;

    if (Array.isArray(dataToSanitize)) {
      dataToSanitize.forEach((item: any) => {
        // إزالة الحقول الفارغة
        Object.keys(item).forEach(key => {
          if (item[key] === undefined || item[key] === null) {
            delete item[key];
          }
        });

        // تأكد من وجود القيم الافتراضية
        if (!item.status) item.status = 'pending';
        if (!item.order) item.order = 0;
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      message: '❌ خطأ في تنظيف البيانات',
      error: error.message
    });
  }
};
