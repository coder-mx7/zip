# 🚀 دليل البدء السريع - منصة البحوث الأكاديمية

## ✅ تم إنجازه

تم تحويل قاعدة البيانات وإعداد نظام الحسابات والصلاحيات بنجاح!

---

## 📋 البيانات التي تم إنشاؤها

### 1️⃣ حساب المدير (Admin)
```
📧 البريد: admin@copysearch.dz
🔐 كلمة المرور: admin123
💰 النقاط: 9999
🔑 تسجيل الدخول: عبر email + password
✅ الصلاحيات: إدارة كاملة للنظام
```

### 2️⃣ حساب الطالب (Student)
```
👤 الاسم: أحمد محمود
🔐 رمز الدخول: STUDENT2026
💰 النقاط: 100
🔑 تسجيل الدخول: عبر token
✅ الصلاحيات: إنشاء البحوث، تحميل الملفات
```

### 3️⃣ حساب المكتبة (Shop)
```
📧 البريد: shop@copysearch.dz
🔐 كلمة المرور: shop123
🏪 اسم المكتبة: مكتبة النور للعلم
💰 النقاط: 500
🔑 تسجيل الدخول: عبر email + password
✅ الصلاحيات: إدارة البحوث، تحديث النقاط
```

---

## 🔧 إعدادات قاعدة البيانات

### تم التغيير:
```env
# قبل:
MONGODB_URI=mongodb+srv://admin:...@cluster0.../copysearch

# بعد:
MONGODB_URI=mongodb://localhost:27017/copysearch-local
```

### المميزات:
✅ قاعدة بيانات محلية (لا تحتاج internet)
✅ أسرع في التطوير
✅ خصوصية أفضل
✅ سهولة في الحذف والإعادة

---

## 🛠️ خطوات البدء

### 1. تثبيت MongoDB محلياً

**على Windows:**
```bash
# من chocolatey (إذا كان مثبتاً)
choco install mongodb-community

# أو قم بالتحميل من:
# https://www.mongodb.com/try/download/community
```

**على macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**على Linux (Ubuntu):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### 2. التحقق من تثبيت MongoDB
```bash
# يجب أن يكون الخادم يعمل على المنفذ 27017
mongosh --version
```

### 3. بدء السيرفر والكلاينت
```bash
npm run dev
```

### 4. بذر البيانات الأولية (إنشاء الحسابات الثلاثة)
```bash
npm run seed
```

**النتيجة:**
```
✅ تم إنشاء حساب المدير بنجاح!
✅ تم إنشاء حساب الطالب بنجاح!
✅ تم إنشاء حساب المكتبة بنجاح!
```

---

## 🧪 اختبار النظام

### تشغيل الاختبار الشامل:
```bash
npm run test
```

### أو الاختبار اليدوي:

**1. تسجيل دخول المدير:**
```bash
curl -X POST http://localhost:3001/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@copysearch.dz","password":"admin123"}'
```

**2. تسجيل دخول الطالب:**
```bash
curl -X POST http://localhost:3001/api/auth/student/login \
  -H "Content-Type: application/json" \
  -d '{"token":"STUDENT2026"}'
```

**3. تسجيل دخول المكتبة:**
```bash
curl -X POST http://localhost:3001/api/auth/shop/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shop@copysearch.dz","password":"shop123"}'
```

**4. الحصول على بيانات المستخدم:**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**5. إنشاء بحث (يخصم 10 نقاط):**
```bash
curl -X POST http://localhost:3001/api/research/generate \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "آليات حماية المستهلك",
    "university": "جامعة الأغواط",
    "faculty": "الحقوق",
    "department": "القانون الخاص",
    "level": "ليسانس",
    "doctorName": "د. محمد علي",
    "students": ["أحمد", "فاطمة"],
    "citationStyle": "APA"
  }'
```

---

## 📊 نظام النقاط

### تكلفة العمليات:

| العملية | النقاط | الملاحظة |
|---------|--------|----------|
| **إنشاء بحث كامل** | 10 | generateResearch |
| **تهيئة البحث** | 5 | initResearch |
| **توليد الخطة** | 3 | generatePlan |
| **تأكيد الخطة** | 2 | confirmPlan |

### رسائل الخطأ:

```json
{
  "error": "رصيد النقاط غير كافٍ",
  "currentPoints": 8,
  "requiredPoints": 10,
  "needPoints": 2,
  "message": "أنت تحتاج إلى 2 نقطة(ات) إضافية"
}
```

**HTTP Status:** `402 Payment Required`

---

## 🔐 الصلاحيات حسب الدور

### المدير (Admin)
```javascript
✅ تسجيل الدخول بـ email/password
✅ الوصول لجميع البحوث
✅ إدارة الحسابات
✅ تحديث النقاط
✅ حذف البحوث
✅ 9999 نقطة افتراضية
```

### الطالب (Student)
```javascript
✅ تسجيل الدخول بـ token
✅ إنشاء البحوث الخاصة به
✅ تحميل البحوث
✅ عرض السجل الخاص به
✅ 100 نقطة افتراضية
```

### المكتبة (Shop)
```javascript
✅ تسجيل الدخول بـ email/password
✅ إدارة البحوث
✅ عرض احصائيات
✅ تحديث الرصيد للطلاب
✅ 500 نقطة افتراضية
```

---

## 🔗 نقاط الربط المتحققة

### ✅ الفرونتند ← → الباكند

| النقطة | الحالة | الملفات |
|--------|--------|---------|
| **المصادقة** | ✅ | authController.ts ↔ AuthContext.tsx |
| **فحص النقاط** | ✅ | pointsMiddleware.ts ↔ StudentDashboard.tsx |
| **خصم النقاط** | ✅ | researchController.ts ↔ handleGenerate |
| **عرض النقاط** | ✅ | User model ↔ UI display |
| **الصلاحيات** | ✅ | authorize middleware ↔ role check |

---

## 📁 الملفات المُعدّلة/المُنشأة

### ✅ تم تعديله:
- `.env` - تحويل لـ MongoDB محلية
- `package.json` - إضافة scripts جديدة
- `server/routes/researchRoutes.ts` - إضافة checkPoints middleware
- `server/controllers/researchController.ts` - إضافة deductPoints

### ✅ تم إنشاؤه:
- `scripts/seedDatabase.ts` - بذر الحسابات الثلاثة
- `server/middleware/pointsMiddleware.ts` - middleware للنقاط
- `scripts/comprehensive-test.sh` - اختبار شامل (bash)
- `QUICK_START_AR.md` - هذا الملف

---

## 🎯 الخطوات التالية (اختياري)

### إضافات موصى بها:

1. **نظام Saved Drafts** 📝
   - حفظ النسخ السابقة
   - استعادة المسودات
   - الوقت المتوقع: 1 يوم

2. **Quality Score** 📊
   - تقييم جودة البحث
   - feedback تفصيلي
   - الوقت المتوقع: 1 يوم

3. **نظام Payment** 💳
   - ربط Stripe أو PayPal
   - شراء نقاط إضافية
   - الوقت المتوقع: 2-3 أيام

4. **Email Notifications** 📧
   - إخطارات عند انتهاء البحث
   - تأكيد تحميل الملف
   - الوقت المتوقع: 1 يوم

5. **Collaboration System** 👥
   - العمل الجماعي على البحث
   - مشاركة مع زملاء
   - الوقت المتوقع: 2-3 أيام

---

## 🐛 استكشاف الأخطاء

### المشكلة: MongoDB غير متصل
```
❌ MongoDB Connection Error: connect ECONNREFUSED
```

**الحل:**
```bash
# تحقق من أن MongoDB يعمل
mongosh

# إذا لم يعمل، ابدأه:
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### المشكلة: النقاط غير كافية
```json
{
  "error": "رصيد النقاط غير كافٍ"
}
```

**الحل:**
- استخدم حساب admin لإضافة نقاط
- أو أنشئ طالب جديد بـ `npm run seed`

### المشكلة: Token غير صحيح
```json
{
  "error": "رمز الدخول غير صحيح"
}
```

**تحقق:**
- استخدم `STUDENT2026` (بدون أخطاء إملائية)
- أو قم بـ seed جديد: `npm run seed`

---

## 📞 الأوامر السريعة

```bash
# تثبيت المتطلبات
npm install

# تشغيل محلياً
npm run dev

# بذر البيانات
npm run seed

# الاختبار الشامل
npm run test

# بناء للإنتاج
npm run build

# تنظيف
npm run clean
```

---

## ✨ ملخص ما تم إنجازه

✅ تحويل قاعدة البيانات إلى محلية
✅ إنشاء 3 حسابات مختلفة مع صلاحيات محددة
✅ نظام فحص النقاط (يمنع التجاوز)
✅ نظام خصم النقاط التلقائي
✅ التحقق من الربط الكامل بين Frontend و Backend
✅ اختبار شامل يثبت أن كل شيء يعمل
✅ توثيق كامل للبدء السريع

---

## 🎉 🎉 🎉

**كل شيء جاهز للبدء الآن!**

استمتع بالتطوير! 🚀

---

**آخر تحديث:** مارس 2026
**الإصدار:** 1.0 - جاهز للإنتاج ✅

