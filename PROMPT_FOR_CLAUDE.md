# تحليل وتصحيح نظام توليد الأبحاث الأكاديمية

## المقدمة

يرجى تحليل النظام التالي وتصحيحه وتطويره، حيث يواجه مشكلة عدم توليد المحتوى الكامل للمبحثات والمطالب، مع ضمان تطبيق نظام التهميشات الشيكاغي الرسمي، وتحويل النتيجة إلى ملف وورد (DOCX).

## الملفات المرفقة

1. `server/controllers/researchController.ts`: الخادم الرئيسي (Node.js/Express) مع رابط Gemini API
2. `src/pages/CustomResearchPlanWizard.tsx`: الواجهة الأمامية (React)
3. `server/utils/advancedPlanProcessor.ts`: توليد ملفات الوورد (يحتوي على `generateWordDoc` و `processFootnotes`)
4. `server/routes/researchRoutes.ts`: رابط الطلبات
5. `server/models/Research.ts`: نموذج MongoDB لبيانات البحث

## سير العمل الحالي (المشكل)

1. المستخدم يدخل بيانات البحث (عنوان، كلية، قسم، جامعة) في الواجهة الأمامية `/create-plan`
2. يرسل طلب POST إلى `/api/research/custom-simple-plan`
3. الدالة `generateCustomSimplePlan` في `researchController.ts` تستدعي Gemini لتوليد الخطة
4. الواجهة الأمامية تعرض الخطة، لكنها تعرض محتوى افتراضي فقط (لا يُحصل على محتوى كامل من Gemini)

## المشكلة الأساسية

- الخطة تُنتج بصيغة هيكلية فقط (عناوين المبحثات والمطالب)
- لا يُنتج محتوى كامل لكل مطلب (تمهيد، نقاط تحليلية مع تهميشات، خاتمة)
- التهميشات غير مطبقة بشكل رسمي بنظام شيكاغو
- لا يوجد رابط واضح لتحويل الخطة الكاملة إلى ملف وورد

## ما نريد بالضبط

1. تحويل المطالبات إلى نهاية واحدة تولد الخطة مع المحتوى الكامل والتهميشات في طلب واحد أو مرحلتين واضحتين
2. تطبيق نظام التهميش الشيكاغي الرسمي:
   - الظهور الأول: (اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، السنة، ص. رقم الصفحة.)
   - التكرار المباشر: (المرجع نفسه، ص. رقم الصفحة.)
   - التكرار غير المباشر: (اللقب، المرجع السابق، ص. رقم الصفحة.)
3. توليد خطة كاملة تحتوي على:
   - مقدمة كاملة مع محتوى
   - إشكالية البحث
   - مباحث (كل مبحث يحتوي على مطالب)
     - لكل مطلب: تمهيد، 3-5 نقاط تحليلية مع تهميش لكل نقطة، خاتمة للمطلب
   - خاتمة عامة
   - قائمة مصادر ومراجع كاملة
4. زر في الواجهة الأمامية لتحويل الخطة الكاملة إلى ملف وورد (DOCX) باستخدام `generateWordDoc`
5. مسك المحتوى الكامل بشكل صحيح وتحويله إلى التنسيق المتوافق مع `generateWordDoc`

## كيفية مسك المحتوى وتحويله إلى وورد (الجزء المهم)

1. تنسيق المحتوى باستخدام وسم التهميش `{{footnote: SOURCE_ID}}`، مثلاً:
   `كما أشار الباحث إلى أن هذا المفهوم حديث {{footnote: ref_1}}.`
2. استخدام الدالة `processFootnotes` من `advancedPlanProcessor.ts` لتحويل الأوسم إلى أرقام مثل [1]
3. تحويل الهيكل الجديد إلى الكائن المتوافق مع `generateWordDoc`:
   - يجب أن يحتوي الكائن على:
     - `title`: عنوان البحث
     - `methodology`: { problemStatement: string, globalSources: Array<{id: string, text: string}> }
     - `plan`: مصفوفة من العناصر (introduction, section, demand, conclusion, references)
       - كل عنصر يحتوي: `id`, `title`, `type`, `order`, `content` (نص كامل)
4. استدعاء `generateWordDoc(data)` التي ترجع `Buffer` ثم إرساله للواجهة للتنزيل كملف DOCX

## هيكل البيانات المطلوب للنظام الجديد

```typescript
// الرد من الخادم إلى الواجهة الأمامية
interface FullResearchPlan {
  title: string;
  faculty: string;
  department: string;
  university?: string;
  introduction: {
    title: string;
    content: string; // نص كامل مع {{footnote: SOURCE_ID}}
    footnotes: Array<{ id: string; text: string }>;
  };
  problemStatement: {
    title: string;
    content: string;
  };
  chapters: Array<{
    id: string;
    title: string;
    demands: Array<{
      id: string;
      title: string;
      opening: string; // تمهيد المطلب
      subPoints: Array<{
        point: string; // نقطة تحليلية كاملة مع {{footnote: SOURCE_ID}}
        footnote: string; // تهميشة شيكاغوية
      }>;
      closing: string; // خاتمة المطلب
      fullContent: string; // محتوى كامل للمطلب (تمهيد + نقاط + خاتمة) مع {{footnote: SOURCE_ID}}
    }>;
  }>;
  conclusion: {
    title: string;
    content: string; // نص كامل
  };
  references: {
    title: string;
    sources: Array<{ id: string; type: string; citation: string }>;
  };
  // كائن متوافق مع `generateWordDoc` لتصدير الوورد
  exportableResearchObject: any;
}
```

## التعليمات الخاصة بالتعامل مع JSON

1. تأكد من أن الرد من Gemini يكون JSON صالح 100% بدون أخطاء في التنسيق
2. استخدم `safeJsonParse` (موجودة في `researchController.ts`) لحل أي مشاكل في تنسيق JSON
3. في حال فشل تحليل JSON، أعد المحاولة مع تنسيق أكثر وضوحًا

## مهمة واحدة فقط الآن

أعد تصميم `generateCustomSimplePlan` في `researchController.ts` و `CustomResearchPlanWizard.tsx`، وإضافة نهاية جديدة `/api/research/download-word` لتحويل الخطة إلى وورد، لتحقيق ما سبق، مع الحفاظ على التوافق مع باقي النظام.
