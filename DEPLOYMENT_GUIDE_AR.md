# 📋 دليل النشر على Render

## الخطوة 1️⃣: إعداد قاعدة البيانات

### تثبيت MongoDB Atlas (مجاني)
1. اذهب إلى https://www.mongodb.com/cloud/atlas
2. أنشئ حساب مجاني (Free)
3. أنشئ Cluster جديد
4. أنشئ Database User مع كلمة مرور قوية
5. انسخ Connection String:
   ```
   mongodb+srv://username:password@cluster.xxxxx.mongodb.net/databasename?appName=Cluster0
   ```

---

## الخطوة 2️⃣: إعداد مفاتيح API

### Gemini API (مجاني)
1. اذهب إلى https://ai.google.dev/
2. انقر على "Get API Key"
3. أنشئ مفتاح API جديد
4. انسخ المفتاح

---

## الخطوة 3️⃣: نشر المشروع على Render

### إعداد الخدمة الأولى (الباكند + الفرونت معًا)

1. **إنشء خدمة Web جديدة**
   - اذهب إلى https://render.com
   - انقر على "+ New +" ثم اختر "Web Service"
   - اختر GitHub repository الخاص بك (أو upload الملفات مباشرة)

2. **إعدادات الخدمة**
   - **Name**: `copysearch-app` (أو أي اسم تفضله)
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm run server
     ```

3. **إضافة متغيرات البيئة (Environment Variables)**
   في قسم "Environment Variables" أضف:
   
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://username:password@cluster.xxxxx.mongodb.net/database?appName=Cluster0
   JWT_SECRET = your-very-secure-jwt-secret-key-123456789
   GEMINI_API_KEY = AIzaSy...xxxxx
   CLIENT_URL = https://copysearch-app.onrender.com
   VITE_API_URL = https://copysearch-app.onrender.com
   ```

4. **أنشئ الخدمة** بالنقر على "Create Web Service"

---

## الخطوة 4️⃣: التحقق من النشر

### متابعة السجلات (Logs)
- الخدمة ستُبني تلقائيًا (قد تستغرق 3-5 دقائق)
- اذهب إلى قسم "Logs" في Render للتحقق من:
  - ✅ `npm install` اكتملت
  - ✅ `npm run build` اكتملت
  - ✅ `Server is running on...`
  - ✅ `MongoDB Connected Successfully`

### اختبار الخدمة
بعد أن ترى "Server is running"، جرّب:

```bash
# اختبر الاتصال
curl https://copysearch-app.onrender.com/api/auth/admin/login

# اختبر CORS (optional)
curl -i -X OPTIONS https://copysearch-app.onrender.com/api/auth/admin/login \
  -H "Origin: https://copysearch-app.onrender.com" \
  -H "Access-Control-Request-Method: POST"

# اختبر الفرونت
curl https://copysearch-app.onrender.com/
```

---

## الخطوة 5️⃣: استخدام الموقع

### روابط الدخول
- **الواجهة الأمامية**: https://copysearch-app.onrender.com/
- **تسجيل دخول المدير**: https://copysearch-app.onrender.com/login

### بيانات الدخول الافتراضية
- **البريد الإلكتروني**: `admin@copysearch.dz`
- **كلمة المرور**: `admin123`

---

## الخطوة 6️⃣: تحديث الكود

كلما تحديث الكود وأردت نشره:

```bash
# إذا كنت تستخدم GitHub
git add .
git commit -m "تحديث المشروع"
git push origin main
```

Render سيُعيد بناء ونشر تلقائيًا!

---

## استكشاف الأخطاء

### خطأ: "Not Found" عند فتح الموقع
- تأكد من أن `npm run build` اكتملت بنجاح في Logs
- تأكد من أن ملف `dist/index.html` موجود

### خطأ: "MongoDB Connection Error"
- تحقق من `MONGODB_URI` في متغيرات البيئة
- تأكد من أن المستخدم له صلاحيات الوصول في Atlas
- تأكد من أن عنوان IP محمي (في Atlas اختر "Allow Access from Anywhere")

### خطأ: "CORS Error"
- تحقق من أن `CLIENT_URL` صحيح في متغيرات البيئة
- تأكد من أن الدومين يطابق دومين Render الفعلي

### خطأ: "Student login not working"
- تأكد من أن قاعدة البيانات فيها بيانات طلاب
- جرّب تشغيل script البذر: `npm run seed`

---

## ملاحظات مهمة

1. **الخادم يخدم الفرونت والباكند معًا**
   - ملفات الواجهة تُخدم من مجلد `dist`
   - API متوفر في `/api/...`

2. **المتغيرات البيئية آمنة**
   - لا تضع secrets في الكود
   - كل شيء في متغيرات البيئة على Render

3. **الخدمة مجانية لكن بقيود**
   - Free tier في Render قد ينام بعد 15 دقيقة عدم استخدام
   - لـ uptime مستمر، استخدم paid plan

4. **في حالة المشاكل**
   - راجع قسم Logs في Render
   - تأكد من جميع المتغيرات البيئية المطلوبة موجودة
   - أعد deploy يدويًا من زر "Manual Deploy"

---

## روابط مفيدة

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Render: https://render.com
- Google Gemini API: https://ai.google.dev/
- توثيق المشروع: README.md
