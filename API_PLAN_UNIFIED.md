# 📋 دليل API - المرحلة الجديدة (خطة البحث المتكاملة)

## 🎯 الهيكل الجديد

### ⭐ المرحلة الأولى **الوحيدة**: توليد الخطة الكاملة

```
POST /api/research/plan
- النقاط المطلوبة: 3
- يولد: الإشكالية + الخطة الهيكلية الكاملة
- يرجع: خطة جاهزة للتعديل
```

---

## 📥 المدخلات (Request Body)

```json
{
  "title": "تأثير الذكاء الاصطناعي على الاقتصاد الجزائري",
  "university": "جامعة الجزائر",
  "faculty": "كلية الاقتصاد",
  "department": "قسم الاقتصاد الكلي",
  "level": "ماستر",
  "doctorName": "د. أحمد محمد",
  "students": ["أحمد علي", "فاطمة محمود"],
  "sectionsCount": 2,
  "demandsPerSection": 2,
  "settings": {
    "depth": "standard",
    "tone": "academic_dry",
    "citationStyle": "قانوني جزائري"
  }
}
```

### شرح المدخلات:
| المدخل | النوع | الوصف |
|--------|-------|-------|
| `title` | string | عنوان البحث |
| `faculty` | string | الكلية/التخصص الرئيسي |
| `department` | string | القسم |
| `sectionsCount` | number | عدد المباحث (افتراضي: 2) |
| `demandsPerSection` | number | عدد المطالب في كل مبحث (افتراضي: 2) |

---

## 📤 المخرجات (Response)

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "تأثير الذكاء الاصطناعي على الاقتصاد الجزائري",
  "faculty": "كلية الاقتصاد",
  
  "problemStatement": {
    "text": "كيف يمكن للذكاء الاصطناعي أن يحسن الإنتاجية في الاقتصاد الجزائري؟",
    "canEdit": true,
    "editUrl": "/api/research/507f1f77bcf86cd799439011/problem-statement"
  },
  
  "plan": [
    {
      "id": "item_1",
      "order": 1,
      "title": "المقدمة",
      "type": "introduction",
      "label": "المقدمة",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_1"
    },
    {
      "id": "item_2",
      "order": 2,
      "title": "كيف يمكن للذكاء الاصطناعي أن يحسن الإنتاجية في الاقتصاد الجزائري؟",
      "type": "problem_statement",
      "label": "الإشكالية البحثية",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_2"
    },
    {
      "id": "item_3",
      "order": 3,
      "title": "المبحث الأول: أساسيات الذكاء الاصطناعي والاقتصاد الرقمي",
      "type": "section",
      "label": "مبحث",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_3"
    },
    {
      "id": "item_4",
      "order": 4,
      "title": "المطلب الأول: مفاهيم الذكاء الاصطناعي الأساسية",
      "type": "demand",
      "label": "مطلب",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_4"
    },
    {
      "id": "item_5",
      "order": 5,
      "title": "المطلب الثاني: الاقتصاد الرقمي والتحولات المعاصرة",
      "type": "demand",
      "label": "مطلب",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_5"
    },
    {
      "id": "item_6",
      "order": 6,
      "title": "المبحث الثاني: تأثير الذكاء الاصطناعي على الاقتصاد الجزائري",
      "type": "section",
      "label": "مبحث",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_6"
    },
    {
      "id": "item_7",
      "order": 7,
      "title": "المطلب الأول: التطبيقات الحالية والمستقبلية",
      "type": "demand",
      "label": "مطلب",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_7"
    },
    {
      "id": "item_8",
      "order": 8,
      "title": "المطلب الثاني: التحديات والفرص",
      "type": "demand",
      "label": "مطلب",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_8"
    },
    {
      "id": "item_9",
      "order": 9,
      "title": "الخاتمة",
      "type": "conclusion",
      "label": "الخاتمة",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_9"
    },
    {
      "id": "item_10",
      "order": 10,
      "title": "قائمة المصادر والمراجع",
      "type": "references",
      "label": "قائمة المصادر والمراجع",
      "canEdit": true,
      "editUrl": "/api/research/507f1f77bcf86cd799439011/plan/item_10"
    }
  ],
  
  "planMetadata": {
    "totalItems": 10,
    "introduction": 1,
    "problemStatement": 1,
    "sections": 2,
    "demands": 4,
    "conclusion": 1,
    "references": 1
  },
  
  "pointsDeducted": 3,
  "remainingPoints": 97,
  "status": "plan_ready",
  
  "availableActions": {
    "editPlanItem": "PUT /api/research/507f1f77bcf86cd799439011/plan/:itemId",
    "editProblemStatement": "PUT /api/research/507f1f77bcf86cd799439011/problem-statement",
    "viewPlanPreview": "GET /api/research/507f1f77bcf86cd799439011/plan-preview",
    "confirmAndProceed": "POST /api/research/507f1f77bcf86cd799439011/confirm-plan"
  },
  
  "message": "✅ تم إنشاء الخطة الكاملة - يمكنك تعديل الإشكالية وأي عنصر في الخطة"
}
```

---

## 🔄 ترتيب العناصر

```
1️⃣ المقدمة          (introduction)
2️⃣ الإشكالية        (problem_statement)  ⭐ منفصلة + قابلة للتعديل
3️⃣ المبحث الأول    (section)
4️⃣ المطلب الأول     (demand)
5️⃣ المطلب الثاني    (demand)
6️⃣ المبحث الثاني    (section)
7️⃣ المطلب الأول     (demand)
8️⃣ المطلب الثاني    (demand)
9️⃣ الخاتمة          (conclusion)
🔟 قائمة المراجع   (references)
```

---

## ✏️ كيفية تعديل الخطة

### تعديل عنصر واحد:
```bash
PUT /api/research/:researchId/plan/:itemId
Content-Type: application/json

{
  "title": "عنوان جديد"
}
```

### تعديل الإشكالية:
```bash
PUT /api/research/:researchId/problem-statement
Content-Type: application/json

{
  "problemStatement": "إشكالية جديدة معدلة؟"
}
```

### تأكيد الخطة والمتابعة:
```bash
POST /api/research/:researchId/confirm-plan
Content-Type: application/json

{
  "plan": [
    { "id": "item_1", "title": "..." },
    ...
  ]
}
```

---

## 💡 مثال عملي كامل

### 1️⃣ إنشاء الخطة:
```bash
curl -X POST http://localhost:3001/api/research/plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "تأثير AI على الاقتصاد",
    "faculty": "الاقتصاد",
    "department": "القسم الاقتصادي",
    "sectionsCount": 2,
    "demandsPerSection": 2
  }'
```

### 2️⃣ النتيجة:
```json
{
  "_id": "507f...",
  "plan": [...],  ✅
  "message": "تم إنشاء الخطة الكاملة"
}
```

### 3️⃣ تعديل الإشكالية:
```bash
curl -X PUT http://localhost:3001/api/research/507f.../problem-statement \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problemStatement": "إشكالية معدلة جديدة؟"
  }'
```

### 4️⃣ تأكيد والمتابعة:
```bash
curl -X POST http://localhost:3001/api/research/507f.../confirm-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": [...]  ✅ الخطة المعدلة
  }'
```

---

## 📊 ملخص التغييرات

| النقطة | القديم | الجديد |
|--------|--------|-------|
| **عدد المراحل** | 2 منفصلة | مرحلة واحدة شاملة |
| **Endpoint** | POST /init + POST /plan | POST /plan فقط |
| **النقاط المطلوبة** | 5 + 3 = 8 | 3 فقط |
| **المخرجات** | إشكالية فقط ثم خطة | خطة متكاملة + إشكالية |
| **التعديل** | خطأ في التدفق | كل عنصر قابل للتعديل |

---

## ✅ الحالة الجديدة

```
❌ initResearch (حذفت)
❌ generatePlan (القديم - حذف)
✅ generatePlan (الجديد - شامل)
✅ confirmPlan (تأكيد الخطة النهائية)
✅ startGeneration (توليد المحتوى)
```

---

## 🎯 الفائدة للعميل

✅ عملية **واحدة** بدلاً من اثنتين
✅ يرى **الخطة الكاملة** فوراً
✅ يمكنه تعديل **كل شيء** (الإشكالية + المباحث + المطالب)
✅ **توفير نقاط** (3 بدلاً من 8)
✅ **تجربة أسلس** وأسرع
