
# تحليل التباين بين الهيكل الحالي والهيكل الجديد المطلوب

## 1. الهيكل الجذري (Root Structure)

### الهيكل الحالي (Current):
```json
{
  "title": "...",
  "problemStatement": "...",
  "sources": ["مرجع 1", "مرجع 2"],
  "plan": [...]
}
```

### الهيكل الجديد المطلوب (New):
```json
{
  "researchMetadata": { ... },
  "globalSources": [ ... ],
  "plan": [ ... ]
}
```

## 2. researchMetadata (جديد)
- **المميزات الجديدة**:
  - `title`: موجود في الحالي لكن داخل `researchMetadata` في الجديد
  - `problemStatement`: موجود في الحالي لكن داخل `researchMetadata` في الجديد
  - `methodology`: **جديد** (مثال: "المنهج الوصفي التحليلي")
  - `keywords`: **جديد** (مصفوفة من الكلمات المفتاحية)

## 3. globalSources (محدث)
### الحالي:
- مصفوفة من النصوص فقط (`["مرجع 1", "مرجع 2"]`)
- تم تخزينها في `responseData.sources` ثم في `methodology.globalSources`

### الجديد:
- مصفوفة من كائنات مفصلة:
  - `id`: "ref_1", "ref_2", ...
  - `type`: "book_or_article_or_law"
  - `author`: "اللقب، الاسم"
  - `title`: "العنوان الكامل للمرجع"
  - `publicationInfo`: "دار النشر، المدينة"
  - `year`: "سنة النشر"
  - `fullChicagoCitation**: "اللقب، الاسم. العنوان. المدينة: دار النشر، السنة."

## 4. plan Array (محدث بعمق)

### العنصر: Introduction (مقدمة)
#### الحالي:
```json
{ "title": "المقدمة", "type": "introduction" }
```
#### الجديد:
```json
{
  "elementId": "intro_1",
  "type": "introduction",
  "title": "المقدمة",
  "directives": {
    "hook": "...",
    "importance": "...",
    "objectives": ["الهدف 1", "الهدف 2"]
  },
  "order": 1
}
```

### العنصر: Section (مبحث)
#### الحالي:
```json
{
  "title": "المبحث الأول: ...",
  "type": "section",
  "demands": [
    { "title": "...", "subPoints": ["نقطة 1", ...] }
  ]
}
```
#### الجديد:
```json
{
  "elementId": "sec_1",
  "type": "section",
  "title": "المبحث الأول: ...",
  "order": 2,
  "demands": [
    {
      "elementId": "dem_1_1",
      "type": "demand",
      "title": "المطلب الأول: ...",
      "order": 3,
      "contentStructure": {
        "opening": { "directive": "...", "requiresFootnote": false },
        "analyticalPoints": [
          {
            "pointId": "pt_1",
            "pointTitle": "...",
            "directive": "...",
            "requiresFootnote": true,
            "footnoteData": {
              "sourceId": "ref_1",
              "page": "45",
              "formattedChicagoText": "..."
            }
          }
        ],
        "closing": { "directive": "...", "requiresFootnote": false }
      }
    }
  ]
}
```

### العنصر: Conclusion (خاتمة)
#### الحالي:
```json
{ "title": "الخاتمة", "type": "conclusion" }
```
#### الجديد:
```json
{
  "elementId": "conc_1",
  "type": "conclusion",
  "title": "الخاتمة",
  "directives": {
    "summary": "...",
    "suggestions": ["التوصية 1", "التوصية 2"]
  },
  "order": 10
}
```

## 5. مولد الوورد (Word Generator)
### التغييرات المطلوبة:
- يجب أن يتعامل مع `researchMetadata`
- يجب أن يتعامل مع `globalSources` ككائنات وليس نصوص
- يجب أن يستخدم `contentStructure` لإنشاء المحتوى
- يجب أن يستخدم `footnoteData` لإنشاء التهميشات تلقائيًا مع أرقام الصفحات!
