# ميزات احترافية وقوية للإضافة (Professional Features)

---

## 🌟 الميزة 1: Saved Drafts (المسودات المحفوظة)

هذه الميزة **تمنع الطالب من فقدان العمل** وتسمح له بالتعديل والحفظ.

### 1. تعديل نموذج Research

**الملف:** `server/models/Research.ts`

```typescript
const DraftSchema = new mongoose.Schema({
    title: String,
    content: String,
    plan: [PlanItemSchema],
    savedAt: { type: Date, default: Date.now },
    version: Number,
    notes: String
});

const ResearchSchema = new mongoose.Schema({
    // ... الحقول الموجودة
    drafts: [DraftSchema],
    currentDraftVersion: { type: Number, default: 0 }
}, { timestamps: true });
```

### 2. إضافة الـ API endpoints

**الملف:** `server/routes/researchRoutes.ts`

```typescript
// حفظ المسودة الحالية
router.post('/save-draft/:id', researchController.saveDraft);

// جلب جميع المسودات
router.get('/drafts/:id', researchController.getDrafts);

// استعادة مسودة معينة
router.post('/restore-draft/:researchId/:draftId', researchController.restoreDraft);

// حذف مسودة
router.delete('/draft/:researchId/:draftId', researchController.deleteDraft);

// مقارنة مسودتين
router.get('/compare-drafts/:researchId/:draftId1/:draftId2', researchController.compareDrafts);
```

### 3. تطبيق في الكنترولر

**الملف:** `server/controllers/researchController.ts`

```typescript
export const saveDraft = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { plan, notes } = req.body;
        const research = await Research.findById(id);

        if (!research) return res.status(404).json({ message: "البحث غير موجود" });
        if (research.creatorId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "ليس لديك صلاحية" });
        }

        const newVersion = (research.currentDraftVersion || 0) + 1;
        
        const updatedResearch = await Research.findByIdAndUpdate(
            id,
            {
                $push: {
                    drafts: {
                        title: research.title,
                        plan,
                        notes,
                        version: newVersion,
                        savedAt: new Date()
                    }
                },
                currentDraftVersion: newVersion
            },
            { new: true }
        );

        res.json({ 
            message: 'تم حفظ المسودة بنجاح',
            version: newVersion,
            totalDrafts: updatedResearch.drafts.length
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getDrafts = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const research = await Research.findById(id).select('drafts currentDraftVersion');

        if (!research) return res.status(404).json({ message: "البحث غير موجود" });

        res.json({
            currentVersion: research.currentDraftVersion,
            drafts: research.drafts.map((d: any) => ({
                _id: d._id,
                version: d.version,
                savedAt: d.savedAt,
                notes: d.notes,
                itemCount: d.plan?.length || 0
            }))
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const restoreDraft = async (req: any, res: Response) => {
    try {
        const { researchId, draftId } = req.params;
        const research = await Research.findById(researchId);

        if (!research) return res.status(404).json({ message: "البحث غير موجود" });

        const draft = research.drafts.id(draftId);
        if (!draft) return res.status(404).json({ message: "المسودة غير موجودة" });

        await Research.findByIdAndUpdate(
            researchId,
            {
                plan: draft.plan,
                currentDraftVersion: draft.version
            }
        );

        res.json({ message: 'تم استعادة المسودة بنجاح' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
```

### 4. استخدام في الفرونتند

**الملف:** `src/pages/StudentDashboard.tsx`

```typescript
// زر حفظ المسودة
const handleSaveDraft = async () => {
    try {
        const res = await axios.post(`/api/research/save-draft/${researchId}`, {
            plan: currentPlan,
            notes: "تحديث على الأجزاء الأولى"
        });
        setSuccess('تم حفظ المسودة - النسخة ' + res.data.version);
    } catch (err) {
        setError('فشل حفظ المسودة');
    }
};

// عرض المسودات السابقة
const [drafts, setDrafts] = useState([]);
useEffect(() => {
    axios.get(`/api/research/drafts/${researchId}`)
        .then(res => setDrafts(res.data.drafts));
}, [researchId]);

// استعادة مسودة
const restoreDraft = async (draftId: string) => {
    await axios.post(`/api/research/restore-draft/${researchId}/${draftId}`);
    window.location.reload();
};
```

---

## 🌟 الميزة 2: Quality Score للبحث

نظام يقيّم جودة البحث بناءً على عدة معايير.

### 1. نموذج Quality Score

**الملف:** `server/models/Research.ts`

```typescript
const QualityScoreSchema = new mongoose.Schema({
    completeness: { type: Number, min: 0, max: 100 },      // 92%
    coherence: { type: Number, min: 0, max: 100 },         // 85%
    academicTone: { type: Number, min: 0, max: 100 },      // 88%
    citationQuality: { type: Number, min: 0, max: 100 },   // 90%
    originalityScore: { type: Number, min: 0, max: 100 },  // 75%
    overall: { type: Number, min: 0, max: 100 },           // 86%
    calculatedAt: Date,
    feedback: String
});

// إضافة إلى ResearchSchema:
qualityScore: QualityScoreSchema
```

### 2. دالة حساب الجودة

**ملف جديد:** `server/utils/qualityAnalyzer.ts`

```typescript
import { Research } from '../models/Research.js';

export async function calculateQualityScore(research: any): Promise<any> {
    let scores = {
        completeness: 0,
        coherence: 0,
        academicTone: 0,
        citationQuality: 0,
        originalityScore: 0
    };

    // 1. Completeness: جميع الأجزاء موجودة؟
    const requiredTypes = ['introduction', 'section', 'demand', 'conclusion', 'references'];
    const presentTypes = new Set(research.plan.map(p => p.type));
    scores.completeness = (presentTypes.size / requiredTypes.length) * 100;

    // 2. Coherence: المحتوى متسق؟
    let totalContent = research.plan.reduce((sum: number, p: any) => sum + (p.content?.length || 0), 0);
    let completedItems = research.plan.filter(p => p.status === 'completed').length;
    scores.coherence = (completedItems / research.plan.length) * 100;

    // 3. Academic Tone: أسلوب أكاديمي؟
    let academicWords = 0;
    const academicKeywords = ['يُلاحَظ', 'ثابت', 'متغير', 'فرضية', 'منهجية', 'نتيجة'];
    for (let item of research.plan) {
        academicKeywords.forEach(keyword => {
            const count = (item.content || '').split(keyword).length - 1;
            academicWords += count;
        });
    }
    scores.academicTone = Math.min(100, (academicWords / (totalContent || 1)) * 1000);

    // 4. Citation Quality: المراجع كافية؟
    let citationCount = research.plan
        .filter(p => p.footnotes)
        .reduce((sum: number, p: any) => sum + p.footnotes.length, 0);
    scores.citationQuality = Math.min(100, (citationCount / 20) * 100);

    // 5. Originality: تحذير من التشابه المحتمل
    scores.originalityScore = 75; // يمكن دمج مع plagiarism checker

    const overall = Object.values(scores).reduce((a, b) => a + b) / Object.keys(scores).length;

    return {
        ...scores,
        overall: Math.round(overall),
        calculatedAt: new Date(),
        feedback: generateFeedback(scores)
    };
}

function generateFeedback(scores: any): string {
    let feedback = [];

    if (scores.completeness < 70) {
        feedback.push('⚠️ البحث ناقص - تأكد من وجود جميع الأجزاء الأساسية');
    }
    if (scores.academicTone < 60) {
        feedback.push('⚠️ الأسلوب قد لا يكون أكاديمياً كافياً');
    }
    if (scores.citationQuality < 50) {
        feedback.push('⚠️ المراجع قليلة جداً - أضيف مراجع أكثر');
    }
    if (scores.overall >= 85) {
        feedback.push('✅ بحث عالي الجودة!');
    }

    return feedback.join(' | ') || 'متوسط الجودة';
}
```

### 3. حساب الجودة بعد التوليد

```typescript
// في endGeneration:
const qualityScore = await calculateQualityScore(research);
await Research.findByIdAndUpdate(researchId, { qualityScore });
```

### 4. عرض في الفرونتند

```tsx
// component: QualityScoreBadge.tsx
export function QualityScoreBadge({ score }) {
    const getColor = (score) => {
        if (score >= 85) return 'bg-green-500';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className={`${getColor(score)} p-4 rounded text-white`}>
            <div className="text-3xl font-bold">{score}%</div>
            <div className="text-sm">جودة البحث</div>
            <div className="mt-2">
                <div className="w-full bg-black/20 rounded h-2">
                    <div className="bg-white h-2 rounded" style={{width: `${score}%`}}></div>
                </div>
            </div>
        </div>
    );
}
```

---

## 🌟 الميزة 3: Revision and Regeneration

السماح بإعادة توليد أجزاء محددة بتكلفة أقل.

### 1. إضافة endpoint جديد

```typescript
router.post('/regenerate-section/:researchId/:itemId', researchController.regenerateSection);
```

### 2. تطبيق في الكنترولر

```typescript
export const regenerateSection = async (req: any, res: Response) => {
    try {
        const { researchId, itemId } = req.params;
        const { enhancedPrompt, focus } = req.body;

        const research = await Research.findById(researchId);
        if (!research) return res.status(404).json({ message: "البحث غير موجود" });

        // ✅ التحقق من النقاط (3 نقاط بدلاً من 10)
        const user = await User.findById(req.user.id);
        if (!user || user.points < 3) {
            return res.status(402).json({ message: 'نقاط غير كافية (3 نقاط مطلوبة)' });
        }

        const item = research.plan.find(p => p.id === itemId);
        if (!item) return res.status(404).json({ message: "الجزء غير موجود" });

        // بدء التوليد المحسّن
        res.json({ message: 'بدأت إعادة التوليد', itemId });

        await Research.updateOne(
            { _id: researchId, "plan.id": itemId },
            { $set: { "plan.$.status": 'generating' } }
        );

        const enhancedUserPrompt = `
            أعد كتابة هذا الجزء: "${item.title}"
            التركيز على: "${focus}"
            ملاحظات إضافية: "${enhancedPrompt}"
            
            النص الحالي: "${item.content}"
            
            حسّن النص بناءً على الملاحظات. احتفظ بالبنية الأساسية لكن اجعله أفضل.
        `;

        const content = await callGroqWithRetry([
            { role: 'system', content: 'أنت محرر أكاديمي متخصص' },
            { role: 'user', content: enhancedUserPrompt }
        ]);

        await Research.updateOne(
            { _id: researchId, "plan.id": itemId },
            { $set: { "plan.$.status": 'completed', "plan.$.content": content } }
        );

        // خصم النقاط
        await User.findByIdAndUpdate(req.user.id, { $inc: { points: -3 } });

    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
```

---

## 🌟 الميزة 4: Collaboration System

السماح لمجموعة من الطلاب بالعمل على نفس البحث.

### 1. نموذج البيانات

```typescript
const CollaboratorSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    email: String,
    role: { type: String, enum: ['editor', 'reviewer', 'viewer'], default: 'viewer' },
    joinedAt: Date,
    lastActive: Date,
    permissions: [String]
});

// إضافة إلى ResearchSchema:
collaborators: [CollaboratorSchema],
accessLevel: { type: String, enum: ['private', 'shared', 'public'], default: 'private' }
```

### 2. API endpoints

```typescript
router.post('/invite/:researchId', researchController.inviteCollaborator);
router.get('/shared', researchController.getSharedResearch);
router.put('/permissions/:researchId/:userId', researchController.updatePermissions);
router.delete('/remove-collaborator/:researchId/:userId', researchController.removeCollaborator);
```

### 3. تطبيق الوظائف

```typescript
export const inviteCollaborator = async (req: any, res: Response) => {
    try {
        const { researchId } = req.params;
        const { email, role } = req.body;

        const research = await Research.findById(researchId);
        if (!research) return res.status(404).json({ message: "البحث غير موجود" });

        // ✅ التحقق من الملكية
        if (research.creatorId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: "فقط المالك يمكنه الدعوة" });
        }

        const targetUser = await User.findOne({ email });
        if (!targetUser) return res.status(404).json({ message: "المستخدم غير موجود" });

        // التحقق من عدم وجود مسبقاً
        const existing = research.collaborators.find(c => c.userId.toString() === targetUser._id.toString());
        if (existing) {
            return res.status(400).json({ message: "المستخدم مضاف بالفعل" });
        }

        research.collaborators.push({
            userId: targetUser._id,
            email,
            role,
            joinedAt: new Date(),
            permissions: getPermissionsForRole(role)
        });

        await research.save();

        // إرسال email إشعار
        // await sendCollaborationInvite(email, research.title);

        res.json({ message: 'تم إرسال الدعوة بنجاح' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getSharedResearch = async (req: any, res: Response) => {
    try {
        const sharedResearch = await Research.find({
            collaborators: {
                $elemMatch: { userId: req.user.id }
            }
        });

        res.json(sharedResearch);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

function getPermissionsForRole(role: string): string[] {
    const permissions = {
        'viewer': ['view', 'download'],
        'reviewer': ['view', 'download', 'comment'],
        'editor': ['view', 'download', 'edit', 'comment']
    };
    return permissions[role] || permissions.viewer;
}
```

---

## 🌟 الميزة 5: Advanced Search و Filtering

نظام بحث متقدم مع فلاتر.

### 1. API endpoint

```typescript
router.get('/search', researchController.advancedSearch);
```

### 2. التطبيق

```typescript
export const advancedSearch = async (req: any, res: Response) => {
    try {
        const {
            query,
            faculty,
            level,
            status,
            dateFrom,
            dateTo,
            minQuality,
            sort = 'date',
            page = 1,
            limit = 10
        } = req.query;

        let filter: any = { creatorId: req.user.id };

        // ✅ البحث النصي
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { discipline: { $regex: query, $options: 'i' } }
            ];
        }

        // ✅ الفلاتر
        if (faculty) filter.faculty = faculty;
        if (level) filter.level = level;
        if (status) filter["status.stage"] = status;

        // ✅ نطاق التاريخ
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filter.createdAt.$lte = new Date(dateTo);
        }

        // ✅ جودة الحد الأدنى
        if (minQuality) {
            filter["qualityScore.overall"] = { $gte: parseInt(minQuality) };
        }

        // ✅ الترتيب
        let sortObj = {};
        switch (sort) {
            case 'date':
                sortObj = { createdAt: -1 };
                break;
            case 'quality':
                sortObj = { "qualityScore.overall": -1 };
                break;
            case 'title':
                sortObj = { title: 1 };
                break;
        }

        const skip = (page - 1) * limit;
        const total = await Research.countDocuments(filter);
        const results = await Research.find(filter)
            .sort(sortObj)
            .limit(parseInt(limit))
            .skip(skip);

        res.json({
            data: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
```

### 3. استخدام في الفرونتند

```tsx
const [searchQuery, setSearchQuery] = useState('');
const [filters, setFilters] = useState({ faculty: '', level: '', status: '' });

const handleSearch = async () => {
    const params = new URLSearchParams({
        query: searchQuery,
        ...filters,
        sort: 'date',
        page: 1,
        limit: 10
    });

    const res = await axios.get(`/api/research/search?${params}`);
    setResults(res.data.data);
};
```

---

## 📊 ملخص الميزات الاحترافية

| الميزة | المدة | الصعوبة | المكسب |
|--------|------|---------|--------|
| Saved Drafts | 1-2 يوم | سهل | منع فقدان العمل |
| Quality Score | 1 يوم | متوسط | تقييم موضوعي للجودة |
| Revision System | 1-2 يوم | متوسط | تحسين تدريجي |
| Collaboration | 2-3 أيام | متوسط | عمل جماعي فعّال |
| Advanced Search | 1 يوم | سهل | إيجاد سريع |
| Dashboard Stats | 1 يوم | سهل | رؤية شاملة |
| Payment Integration | 2-3 أيام | صعب | نموذج عمل قابل للتطور |
| Email Notifications | 1 يوم | سهل | تواصل أفضل |

---

