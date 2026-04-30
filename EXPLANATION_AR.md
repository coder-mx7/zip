# 📚 شرح تفصيلي - كيف يعمل نظام التوليد

---

## 🎯 المشكلة الحالية

### ❌ الخطأ:
في `generatePlan` أنت تستخدم الإشكالية مرتين:
1. **مرة أولى** في `initResearch` - يتم توليدها ✅
2. **مرة ثانية** في `generatePlan` - تستخدمها في الـ prompt ❌ **خطأ!**

```typescript
// initResearch (مرحلة 1)
"صغ إشكالية بحث قوية..." → يتم توليدها
↓ يحفظ في: research.methodology.problemStatement

// generatePlan (مرحلة 2)
"بناءً على الإشكالية: ${research.methodology?.problemStatement}"
↑ يستخدمها مرة ثانية ❌ زائدة!
```

---

## 🔄 كيف يعمل التدفق منطقياً:

```
┌──────────────────────────────────────────┐
│   initResearch (مرحلة 1)                 │
│   🎓 تحليل البحث واستخراج الإشكالية    │
├──────────────────────────────────────────┤
│ INPUT:                                    │
│  - title: "تأثير AI على الاقتصاد"      │
│  - faculty: "الاقتصاد"                   │
│                                          │
│ PROCESS:                                 │
│  1. Groq يحلل العنوان                   │
│  2. يحدد التخصص (اقتصاد كلي)            │
│  3. يصيغ الإشكالية                      │
│  4. يقترح الفرضيات                      │
│  5. يحدد المنهج (وصفي/تحليلي)          │
│                                          │
│ OUTPUT:                                  │
│  {                                       │
│    discipline: "اقتصاد كلي",            │
│    problemStatement: "كيف يؤثر..?",     │
│    hypotheses: [...],                    │
│    approach: "تحليلي"                    │
│  }                                       │
│                                          │
│ POINTS: -5 ✅                           │
└──────────────────────────────────────────┘
              ⬇️  (حفظ في DB)
┌──────────────────────────────────────────┐
│   generatePlan (مرحلة 2)                 │
│   📋 بناء الخطة الهيكلية                │
├──────────────────────────────────────────┤
│ INPUT:                                    │
│  - researchId (من DB)                   │
│  - sectionsCount: 2 (مباحث)             │
│  - demandsPerSection: 2 (مطالب)         │
│                                          │
│ ❌ يجب أن لا يستخدم الإشكالية!         │
│ ✅ يستخدم: العنوان والتخصص فقط         │
│                                          │
│ PROCESS:                                 │
│  1. استرجع البحث من DB                  │
│  2. Groq يصمم الخطة الهيكلية            │
│  3. ينقسّم المحتوى إلى مباحث ومطالب    │
│                                          │
│ OUTPUT:                                  │
│  {                                       │
│    "plan": [                             │
│      { title: "مقدمة", type: "intro" }, │
│      {                                   │
│        title: "المبحث الأول: ...",      │
│        demands: [                        │
│          { title: "المطلب الأول: ..." }, │
│          { title: "المطلب الثاني: ..." } │
│        ]                                 │
│      },                                  │
│      ...                                 │
│    ]                                     │
│  }                                       │
│                                          │
│ POINTS: -3 ✅                           │
└──────────────────────────────────────────┘
```

---

## 🔊 كيف يطلب الكود من Groq بالضبط:

### **1️⃣ بناء الطلب (Request Building):**

```typescript
// ما يحدث في الكود:
const prompt = `
    بناءً على العنوان: "${research.title}"
    والتخصص: "${research.discipline}"
    صمم خطة بحث أكاديمية تتكون من 2 مباحث، 
    وفي كل مبحث 2 مطالب.
    ...
`;

// الكود يصنع هذا الكائن:
const requestMessage = {
    messages: [
        {
            role: 'user',      // أنت المستخدم
            content: prompt    // محتوى الطلب كاملاً
        }
    ],
    model: 'llama-3.3-70b-versatile',
    response_format: { type: 'json_object' }  // توقع JSON
};

// يرسله:
const response = await getGroqClient()
    .chat.completions.create(requestMessage);
```

### **2️⃣ ما يأتي من Groq (الرد الخام):**

```json
{
    "id": "chatcmpl-123456",
    "object": "chat.completion",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "{\"plan\": [{\"title\": \"مقدمة\", \"type\": \"introduction\"}, ...]}"
            },
            "finish_reason": "stop"
        }
    ]
}
```

### **3️⃣ كيف يستخرج الكود الرد:**

```typescript
// خطوة 1: الوصول إلى المحتوى
const generatedContent = completion.choices[0]?.message?.content;
// النتيجة (نص JSON):
// "{\"plan\": [{...}]}"

// خطوة 2: تحويل من نص إلى كائن
const planData = JSON.parse(generatedContent);
// النتيجة (كائن JS):
// { plan: [{title: "...", type: "..."}, ...] }

// خطوة 3: معالجة البيانات
planData.plan.forEach((item) => {
    // قم بشيء ما مع كل عنصر
});
```

---

## 🎯 ما الذي يجب أن يتوقعه الكود بالضبط من Groq:

### **JSON المتوقع:**

```json
{
    "plan": [
        {
            "title": "مقدمة",
            "type": "introduction"
        },
        {
            "title": "المبحث الأول: الأساسيات النظرية",
            "type": "section",
            "demands": [
                {
                    "title": "المطلب الأول: المفاهيم الأساسية"
                },
                {
                    "title": "المطلب الثاني: الأطر النظرية"
                }
            ]
        },
        {
            "title": "المبحث الثاني: التطبيقات العملية",
            "type": "section",
            "demands": [
                {
                    "title": "المطلب الأول: الدراسات السابقة"
                },
                {
                    "title": "المطلب الثاني: النتائج"
                }
            ]
        },
        {
            "title": "خاتمة",
            "type": "conclusion"
        },
        {
            "title": "قائمة المصادر والمراجع",
            "type": "references"
        }
    ]
}
```

---

## ✅ كيفية معالجة الرد:

```typescript
const planData = JSON.parse(completion.choices[0]?.message?.content || "{}");

// 1. مسح القديم
const flatPlan: any[] = [];
let order = 1;

// 2. إعادة هيكلة البيانات
planData.plan.forEach((item: any) => {
    // أضف المبحث
    flatPlan.push({
        id: `item_${order}`,
        title: item.title,
        type: item.type,           // "introduction", "section", etc
        order: order++
    });
    
    // إذا كان فيه مطالب، أضفهم
    if (item.demands) {
        item.demands.forEach((demand: any) => {
            flatPlan.push({
                id: `item_${order}`,
                title: demand.title,
                type: 'demand',          // كل مطلب نوعه demand
                order: order++
            });
        });
    }
});

// 3. حفظ في DB
await Research.findByIdAndUpdate(researchId, {
    $set: {
        plan: flatPlan,              // الخطة المسطحة
        "status.stage": 'plan_approval',
        "status.progress": 30
    }
}, { new: true });
```

---

## 🏗️ كيفية جعل الكود مرن للتحديث:

### **المشكلة الحالية:**
```typescript
// الـ prompt مدمج مع الكود ❌
const prompt = `
    بناءً على الإشكالية: ...
    صمم خطة...
    رد بتنسيق JSON فقط كالتالي:
    {...}
`;
```

### **الحل - استخراج الـ Prompts:**

```typescript
// ✅ 1. ملف منفصل: prompts.ts
export const planPromptTemplate = (title: string, discipline: string, sections: number, demands: number) => {
    return `
        أنت خبير أكاديمي متخصص في ${discipline}.
        
        بناءً على العنوان: "${title}"
        
        صمم خطة بحث أكاديمية تتكون من:
        - مقدمة
        - ${sections} مباحث (كل مبحث ${demands} مطالب)
        - خاتمة
        - قائمة المراجع
        
        يجب أن تكون العناوين:
        ✓ احترافية جداً
        ✓ متناسقة
        ✓ واضحة
        
        رد بتنسيق JSON فقط:
        {
            "plan": [...]
        }
    `;
};

// ✅ 2. في الـ Controller:
const prompt = planPromptTemplate(
    research.title,
    research.discipline,
    sectionsCount,
    demandsPerSection
);
```

---

## 📝 الخلاصة:

| المرحلة | الهدف | المدخلات | المخرجات | النقاط |
|--------|-------|---------|---------|--------|
| **initResearch** | تحليل البحث | العنوان، الكلية | Discipline, Problem, Hypotheses | -5 |
| **generatePlan** | بناء الخطة | researchId، عدد المباحث | خطة هيكلية | -3 |
| **confirmPlan** | تأكيد الخطة | الخطة النهائية | جاهز للتوليد | -2 |

---

## ⚠️ الأخطاء الشائعة:

1. ❌ استخدام الإشكالية مرتين
2. ❌ عدم التحقق من صتة JSON
3. ❌ عدم التعامل مع الأخطاء
4. ❌ مزج الـ prompts مع الكود
5. ❌ عدم توقع الرد الصحيح من Groq
