# 🔧 حل مشكلة: ECONNREFUSED - فشل الاتصال بين Frontend و Backend

## 🔴 المشكلة

```
[vite] http proxy error: /api/auth/student/login
AggregateError [ECONNREFUSED]:
    at internalConnectMultiple (node:net:1116:18)
    at afterConnectMultiple (node:net:1683:7)
```

---

## 📋 الأسباب المحتملة

| السبب | الحل |
|-------|------|
| **السيرفر لم يبدأ بعد** | تأكد من تشغيل `npm run dev` |
| **MongoDB غير مشغل** | شغل `mongosh` أولاً |
| **البورت مشغول** | قتل العملية على البورت 3001 |
| **وقت بدء السيرفر** | انتظر 2-3 ثوان بعد بدء `dev` |
| **proxy غير صحيح** | تحقق من `vite.config.ts` |

---

## ✅ الحل السريع (Step by Step)

### 1️⃣ تأكد من تشغيل MongoDB

```powershell
# اختبر الاتصال
mongosh --version

# إذا لم تكن مثبتة:
# https://www.mongodb.com/try/download/community
```

### 2️⃣ شغّل المشروع بشكل صحيح

```bash
# في مجلد المشروع:
cd c:\zip

# شغّل البرنامج
npm run dev
```

**انتظر** حتى تشوف:
```
✅ MongoDB Connected.
👤 Admin account seeded.
🚀 Server is running on http://localhost:3001

VITE v6.4.1  ready in 1389 ms
  ➜  Local:   http://localhost:5173/
```

### 3️⃣ افتح المتصفح

```
http://localhost:5173
```

---

## 🔍 التحقق من الاتصال

### اختبر Backend مباشرة:

```bash
# Server يعمل؟
curl http://localhost:3001/api/auth/status

# يجب ترى رد (أو رسالة not found = server شغال)
```

### اختبر Proxy في Vite:

```bash
# من Terminal آخر، اختبر الـ proxy
curl -H "Authorization: Bearer test" \
  http://localhost:5173/api/research/history

# يجب ترى رد من Backend عبر Vite
```

---

## 🛠️ التشخيص المتقدم

### تحقق من `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  ✅ صحيح
      changeOrigin: true,
      secure: false,
    },
  },
}
```

### تحقق من المنفذ:

```powershell
# على Windows: شوف مين يستخدم المنفذ 3001
netstat -ano | findstr :3001

# إذا موجود شيء:
# قتل العملية (استبدل PID):
taskkill /PID 12345 /F

# ثم أعد التشغيل
npm run dev
```

---

## 📝 قائمة التحقق

- [ ] MongoDB يعمل (`mongosh` بدون أخطاء)
- [ ] لا توجد أخطاء في startup
- [ ] "Server is running on http://localhost:3001" يظهر
- [ ] "VITE ready" يظهر
- [ ] لم تدخل localhost:5173 وسريعاً (انتظر 2 ثانية)
- [ ] استخدم الـ token الصحيح عند الاختبار

---

## 🚀 إذا استمرت المشكلة:

### أعد التشغيل الكامل:

```bash
# 1. اضغط Ctrl+C لإيقاف الـ server

# 2. امحي node_modules والـ cache
rm -r node_modules
npm cache clean --force

# 3. أعد التثبيت
npm install

# 4. شغّل من جديد
npm run dev
```

---

## 📌 نقاط مهمة

✅ **السيرفر والـ Frontend يجب يعملوا معاً**  
✅ **Backend على 3001**  
✅ **Frontend على 5173**  
✅ **Vite يترجم `/api/*` إلى `localhost:3001/api/*`**  
✅ **الـ Backend يجب يكون مشغل قبل أو بنفس وقت Frontend**

---

## 🎯 المنطق الصحيح

```
Browser (localhost:5173)
    ↓ (يطلب /api/research/plan)
    ↓
Vite Proxy
    ↓ (يترجمها إلى http://localhost:3001/api/research/plan)
    ↓
Express Server (3001)
    ↓ (يرد البيانات)
    ↓
Browser (يستقبل البيانات)
```

إذا انقطع أي حلقة = ECONNREFUSED ❌

---

## 💬 إذا استمرت المشكلة افتح Issue أو أخبرني بـ:

```
1. شاشة الـ Terminal كاملة
2. هل تظهر أي أخطاء أثناء npm run dev؟
3. هل MongoDB يعمل؟
4. النتيجة من: netstat -ano | findstr :3001
```
