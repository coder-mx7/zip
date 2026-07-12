# 🚀 نشر التطبيق على Render بخطوات ثابتة وموثوقة

## 1️⃣ تحضير المشروع

1. تأكد أن الكود يعمل محليًا بسيرفر وواجهة.
2. تأكد أن جميع التعديلات التي تريد نشرها قد تم حفظها في Git.
3. تأكد أن ملف `.env` غير موجود في GitHub ولا يتم رفعه.

## 2️⃣ تأكد من أن `render.yaml` موجود

الملف `render.yaml` يجب أن يحتوي على:

```yaml
services:
  - type: web
    name: copysearch-app
    runtime: node
    plan: free
    buildCommand: npm install && npm run build
    startCommand: npm run server
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        scope: build,runtime
        sync: false
      - key: JWT_SECRET
        scope: build,runtime
        sync: false
      - key: CLIENT_URL
        scope: build,runtime
        sync: false
      - key: FRONTEND_URL
        scope: build,runtime
        sync: false
      - key: VITE_API_URL
        scope: build,runtime
        sync: false
      - key: GEMINI_API_KEY
        scope: build,runtime
        sync: false
```

> هذا الملف يضمن أن Render يعرف كيف يبني المشروع ويشغل الخادم.

## 3️⃣ إنشاء الخدمة على Render

1. افتح: https://render.com/dashboard
2. اضغط "+ New" ثم اختر "Web Service".
3. اربط حساب GitHub وRepo الخاص بالمشروع.
4. اختر الفرع `main` للنشر.

### إعدادات الخدمة
- Name: `copysearch-app`
- Environment: Node
- Build Command:
  ```bash
  npm install && npm run build
  ```
- Start Command:
  ```bash
  npm run server
  ```
- Instance Type: Free أو Starter

## 4️⃣ متغيرات البيئة في لوحة Render

في قسم `Environment` أضف المتغيرات التالية:

- `NODE_ENV` = `production`
- `MONGODB_URI` = رابط MongoDB Atlas الكامل
- `JWT_SECRET` = كلمة سر قوية (مثال: `MySecret@2026!`)
- `GEMINI_API_KEY` = مفتاح Google AI
- `CLIENT_URL` = رابط التطبيق على Render بعد إنشائه
- `VITE_API_URL` = نفس `CLIENT_URL`

> مهم جدًا: `CLIENT_URL` و `VITE_API_URL` يجب أن يكونا نفس الدومين النهائي، مثل:
> `https://copysearch-app.onrender.com`

## 5️⃣ نشر التطبيق

1. انقر على "Create Web Service".
2. انتظر عملية البناء حتى تنتهي.
3. تابع السجلات في `Logs` لتتأكد من أن كل شيء يعمل.

## 6️⃣ التحقق من نجاح النشر

افتح `Logs` وتحقق من وجود:

- `🚀 Server is running on http://localhost:3001` أو رسالة تشغيل الخادم
- `✅ MongoDB Connected Successfully`
- `👤 Admin account seeded.` (مرة واحدة فقط في أول تشغيل)
- عدم وجود أخطاء حمراء

## 7️⃣ اختبار الخدمة بعد النشر

افتح الرابط النهائي لموقعك:
- `https://copysearch-app.onrender.com`

اختبر أن الواجهة تعمل وتستجيب.

اختبر API مباشرة من المتصفح أو باستخدام `curl`:

```bash
curl -I https://copysearch-app.onrender.com
```

وتحقق من الاستجابة:
- يجب أن تكون `200` أو صفحة HTML

اختبر نقطة تسجيل الدخول:

```bash
curl -X POST https://copysearch-app.onrender.com/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@copysearch.dz","password":"admin123"}'
```

- يجب أن ترد بـ JSON وليس 404.

## 8️⃣ إذا واجهت مشكلة

### مشكلة: لا يظهر الموقع أو يعطي 404
- تأكد أن البناء نجح.
- اضغط `Refresh` في صفحة Render.
- تأكد أن `render.yaml` موجود في المستودع وملف مستقل.

### مشكلة: الخادم لا يبدأ
- تأكد من صحة `MONGODB_URI`.
- تأكد أن MongoDB Atlas يسمح بالوصول من أي عنوان IP.
- تأكد أن `JWT_SECRET` موجود.

### مشكلة: تسجيل الدخول لا ينجح
- تحقق من السجلات هل وصل الطلب إلى `/api/auth/admin/login`.
- تأكد من أن `VITE_API_URL` مضبوط على رابط الموقع.
- تأكد من أن `CLIENT_URL` هو نفس الرابط.

### مشكلة: خطأ CORS
- حللت الكود ليقبل الـ origin المباشر.
- المهم أن `CLIENT_URL` يطابق الرابط الذي تستخدمه في المتصفح.

## 9️⃣ تحديث المشروع على Render بعد أي تغيير

عندما تنفذ أي تغيير في الكود:

```bash
git add .
git commit -m "تحديث للنشر على Render"
git push origin main
```

Render سيقوم بالبناء والنشر تلقائيًا على الفرع `main`.

## 1️⃣0️⃣ نصائح أخيرة

- لا ترفع ملف `.env` إلى GitHub.
- إذا لم تعمل الواجهة بعد النشر، تأكد من وجود `VITE_API_URL` الصحيح.
- إذا استمر الخطأ، أعد نشر الخدمة يدويًا من لوحة Render.

---

🎉 الآن لديك تعليمات نشر واضحة ومباشرة. بعد حفظ هذه التعليمات ورفعها، ابدأ نشر الخدمة على Render ثم تأكد من السجلات. إذا أردت، يمكنني مساعدتك في كتابة الأمر الكامل للرفع وتأكيد الإعداد على GitHub.  