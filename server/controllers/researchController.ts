import { Response } from 'express';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Research } from '../models/Research.js';
import { generateWordDoc } from '../utils/wordGenerator.js';
import { User } from '../models/User.js';
import { deductPoints } from '../middleware/pointsMiddleware.js';

// Lazy-loaded Gemini client - يحمل عند الحاجة فقط
let genAI: GoogleGenerativeAI | null = null;

// تحديث سحري إلى الطراز الحديث والمجاني
const getGeminiModel = (modelName = "gemini-2.5-flash") => { // أو يمكنك استخدام "gemini-2.0-flash"
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error(
                '❌ مفتاح Gemini API غير موجود!\n' +
                'أضفه في ملف .env:\nGEMINI_API_KEY=your_key_here'
            );
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI.getGenerativeModel({ model: modelName });
};

// دالة مساعدة للانتظار
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * 🛡️ دالة ذكية للتعامل مع طلبات Gemini مع إعادة المحاولة تلقائياً في حال وجود ضغط (Rate Limit)
 */
async function generateWithRetry(model: any, promptData: any, maxRetries = 3) {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(promptData);
            return result;
        } catch (error: any) {
            lastError = error;
            // إذا كان الخطأ هو "كثير من الطلبات" (429) أو خطأ مؤقت
            if (error.message?.includes('429') || error.message?.includes('Quota exceeded')) {
                const waitTime = (i + 1) * 5000; // زيادة وقت الانتظار تدريجياً (5ث، 10ث...)
                console.warn(`⚠️ تم تجاوز الكوتا، جاري إعادة المحاولة بعد ${waitTime/1000} ثانية...`);
                await delay(waitTime);
                continue;
            }
            throw error; // إذا كان خطأ آخر، ارميه فوراً
        }
    }
    throw lastError;
}

// الوظيفة القديمة للتوليد المباشر (للتوافق مع الواجهة البسيطة - بقيت كما هي)
export const generateResearch = async (req: any, res: Response) => {
    try {
        const { title, university, faculty, department, level, doctorName, students, citationStyle } = req.body;
        const user = req.user;

        const updatedUser = await deductPoints(user.id, 10);
        if (!updatedUser) {
            return res.status(500).json({ message: 'فشل خصم النقاط' });
        }

        const prompt = `
            أريد بحثاً أكاديمياً كاملاً بعنوان: "${title}".
            الكلية: ${faculty}، القسم: ${department}.
            صمم خطة تتكون من مقدمة، مبحثين (كل مبحث مطلبين)، خاتمة، ومراجع.
            أكتب محتوى كل جزء بالتفصيل (لا يقل عن 300 كلمة لكل جزء).
            رد بتنسيق JSON فقط:
            {
                "plan": [
                    { "title": "مقدمة", "content": "..." },
                    { "title": "المبحث الأول", "content": "..." },
                    { "title": "المبحث الثاني", "content": "..." },
                    { "title": "خاتمة", "content": "..." },
                    { "title": "المراجع", "content": "..." }
                ]
            }
        `;

        const model = getGeminiModel();
        const result = await generateWithRetry(model, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const responseText = result.response.text();
        const data = JSON.parse(responseText || "{}");
console.log(data)
        const newResearch = new Research({
            creatorId: user.id,
            title, university, faculty, department, level, doctorName,
            students: Array.isArray(students) ? students : [students],
            plan: data.plan.map((item: any, index: number) => ({
                id: `item_${index}`,
                title: item.title,
                type: detectType(item.title),
                content: item.content,
                status: 'completed',
                order: index
            })),
            status: { stage: 'completed', progress: 100 }
        });

        await newResearch.save();

        res.status(201).json({ 
            _id: newResearch._id, 
            title: newResearch.title,
            pointsDeducted: 10,
            remainingPoints: updatedUser.points,
            message: '✅ تم توليد البحث بنجاح'
        });

    } catch (error: any) {
        console.error("Error in generateResearch:", error);
        res.status(500).json({ message: error.message });
    }
};

// detect type helper
function detectType(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('مقدمة')) return 'introduction';
    if (lowerTitle.includes('خاتمة')) return 'conclusion';
    if (lowerTitle.includes('مراجع')) return 'references';
    if (lowerTitle.includes('مبحث') || lowerTitle.includes('فصل')) return 'section';
    return 'demand';
}

// دالة مساعدة لتحديد اسم العنصر
function getItemLabel(type: string): string {
    const labels: { [key: string]: string } = {
        'introduction': 'المقدمة',
        'problem_statement': 'الإشكالية البحثية',
        'section': 'مبحث',
        'demand': 'مطلب',
        'conclusion': 'الخاتمة',
        'references': 'قائمة المصادر والمراجع'
    };
    return labels[type] || type;
}

// ============================================================
// ⭐ المرحلة 1 (محدثة): محرك الخطة الاستراتيجي (Plan Architect)
// ============================================================
export const generatePlan = async (req: any, res: Response) => {
    try {
        const { title, university, faculty, department, level, doctorName, students, settings, sectionsCount = 2, demandsPerSection = 2 } = req.body;
        const user = req.user;

        const updatedUser = await deductPoints(user.id, 3);
        if (!updatedUser) return res.status(402).json({ message: 'لا توجد نقاط كافية' });

        const prompt = `
أنت باحث أكاديمي متمرس ومحترف. مهمتك هي بناء هيكل بحثي شامل ومفصل لموضوع: "${title}".
السياق الأكاديمي: كلية ${faculty}، قسم ${department}.

المطلوب إرجاعه هو كائن JSON حصراً، ويجب أن يحتوي بدقة على:
1. "title": عنوان البحث كما هو.
2. "problemStatement": إشكالية قوية وعميقة تنتهي بعلامة استفهام.
3. "sources": مصفوفة تحتوي على 5 إلى 8 مصادر ومراجع أكاديمية حقيقية مرتبطة بالموضوع بنظام شيكاغو (Chicago Style).
4. "plan": مصفوفة تحتوي على هيكل البحث بالترتيب التالي:
   - مقدمة (type: introduction).
   - مباحث ومطالب: صمم ${sectionsCount} مباحث، كل مبحث يحتوي على ${demandsPerSection} مطالب. 
     *هام جداً*: لكل "مطلب"، أضف مصفوفة "subPoints" تحتوي على 3 أفكار فرعية سيتم شرحها لاحقاً.
   - خاتمة (type: conclusion).
   - قائمة المصادر والمراجع (type: references).

هيكل JSON المطلوب:
{
    "title": "${title}",
    "problemStatement": "ما هو...؟",
    "sources": ["المرجع 1", "المرجع 2"],
    "plan": [
        { "title": "مقدمة", "type": "introduction" },
        {
            "title": "المبحث الأول: [عنوان احترافي]",
            "type": "section",
            "demands": [
                { "title": "المطلب الأول: [عنوان]", "subPoints": ["نقطة 1", "نقطة 2", "نقطة 3"] },
                { "title": "المطلب الثاني: [عنوان]", "subPoints": ["...", "...", "..."] }
            ]
        },
        {
            "title": "المبحث الثاني: [عنوان احترافي]",
            "type": "section",
            "demands": [
                { "title": "المطلب الأول: [عنوان]", "subPoints": ["...", "...", "..."] },
                { "title": "المطلب الثاني: [عنوان]", "subPoints": ["...", "...", "..."] }
            ]
        },
        { "title": "خاتمة", "type": "conclusion" },
        { "title": "قائمة المصادر والمراجع", "type": "references" }
    ]
}`;

        const model = getGeminiModel();
        const result = await generateWithRetry(model, {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.7
            }
        });

        const responseContent = result.response.text();
        if (!responseContent) return res.status(500).json({ message: 'فشل الحصول على رد من Gemini' });

        const responseData = JSON.parse(responseContent);
        const finalPlan: any[] = [];
        let order = 1;

        // الإشكالية
        finalPlan.push({
            id: `item_problem`,
            title: responseData.problemStatement,
            type: 'problem_statement',
            order: order++,
            canEdit: true,
            label: 'الإشكالية البحثية'
        });

        // تسطيح الخطة (Flattening)
        responseData.plan.forEach((item: any) => {
            if (item.type === 'section') {
                finalPlan.push({ id: `item_${order}`, title: item.title, type: 'section', order: order++, canEdit: true });
                item.demands?.forEach((demand: any) => {
                    finalPlan.push({
                        id: `item_${order}`, title: demand.title, type: 'demand', subPoints: demand.subPoints || [], order: order++, canEdit: true
                    });
                });
            } else if (item.type === 'references') {
                finalPlan.push({
                    id: `item_${order}`, title: item.title, type: 'references', 
                    content: responseData.sources.join('\n- '), // دمج المراجع مباشرة هنا
                    status: 'completed', // نضعها مكتملة لتخطيها لاحقاً
                    order: order++, canEdit: true
                });
            } else {
                finalPlan.push({ id: `item_${order}`, title: item.title, type: item.type, order: order++, canEdit: true });
            }
        });

        const newResearch = new Research({
            creatorId: user.id, title, university, faculty, department, level, doctorName,
            students: Array.isArray(students) ? students : [students],
            methodology: { problemStatement: responseData.problemStatement, approach: 'تحليلي', globalSources: responseData.sources },
            plan: finalPlan,
            status: { stage: 'plan_approval', progress: 30 }
        });

        await newResearch.save();

        res.status(201).json({
            _id: newResearch._id, title: title, faculty: faculty, department: department,
            problemStatement: { text: responseData.problemStatement, canEdit: true },
            plan: finalPlan.map(item => ({
                id: item.id, order: item.order, title: item.title, type: item.type, label: getItemLabel(item.type), canEdit: item.canEdit
            })),
            pointsDeducted: 3, remainingPoints: updatedUser?.points, status: 'plan_ready',
            message: '✅ تم إنشاء الخطة الكاملة والمراجع المبدئية بنجاح'
        });

    } catch (error: any) {
        res.status(500).json({ message: error.message || 'حدث خطأ في إنشاء الخطة' });
    }
};

// ============================================================
// ⭐ المرحلة 2 (محدثة): تأكيد الخطة (بشكل آمن يحمي المراجع)
// ============================================================
/**
 * 🛡️ دالة مساعدة لتنظيف وتحويل content إلى string آمن
 */
const sanitizeContent = (content: any): string => {
    if (content === null || content === undefined) return '';
    if (typeof content === 'string') return content.trim();
    if (typeof content === 'object') {
        try {
            return JSON.stringify(content, null, 2);
        } catch {
            return String(content);
        }
    }
    return String(content);
};

export const confirmPlan = async (req: any, res: Response) => {
    try {
        const { researchId, finalPlan } = req.body;
        const user = req.user;

        // 🔍 التحقق من البيانات الأساسية
        if (!researchId || !Array.isArray(finalPlan)) {
            return res.status(400).json({
                message: '❌ البيانات المرسلة غير صحيحة. يجب توفير researchId و finalPlan (مصفوفة)',
                received: { researchId: typeof researchId, finalPlan: typeof finalPlan }
            });
        }

        const updatedUser = await deductPoints(user.id, 2);
        const research = await Research.findById(researchId);
        if (!research) return res.status(404).json({ message: "البحث غير موجود" });

        // 🛡️ دمج ذكي: نحافظ على العناصر المكتملة (مثل المراجع) ونحتفظ بالـ subPoints
        const safePlan = finalPlan.map((item: any, index: number) => {
            const originalItem = research.plan.find(p => p.id === item.id);
            const isCompleted = originalItem?.status === 'completed';
            
            // ✅ تنظيف وتحويل البيانات بأمان
            const cleanedContent = isCompleted 
                ? sanitizeContent(originalItem.content)
                : sanitizeContent(item.content || '');
            
            return {
                id: item.id,
                title: item.title || originalItem?.title || '',
                type: item.type || originalItem?.type || 'demand',
                content: cleanedContent,
                status: isCompleted ? 'completed' : (item.status || 'pending'),
                subPoints: item.subPoints || originalItem?.subPoints || [],
                order: item.order !== undefined ? item.order : index,
                canEdit: item.canEdit !== undefined ? item.canEdit : true
            };
        });

        // ✅ التحقق النهائي قبل الحفظ
        for (let i = 0; i < safePlan.length; i++) {
            const item = safePlan[i];
            if (typeof item.content !== 'string') {
                return res.status(400).json({
                    message: `❌ خطأ في البيانات: plan[${i}].content يجب أن يكون string`,
                    index: i,
                    received: typeof item.content,
                    item: item
                });
            }
        }

        const updatedResearch = await Research.findByIdAndUpdate(
            researchId,
            {
                $set: {
                    plan: safePlan,
                    "status.stage": 'generating',
                    "status.progress": 40
                }
            },
            { new: true, runValidators: true }
        );

        res.json({ 
            message: "✅ تم تأكيد الخطة بأمان", 
            research: updatedResearch, 
            pointsDeducted: 2, 
            remainingPoints: updatedUser?.points,
            validationStats: {
                totalItems: safePlan.length,
                completedItems: safePlan.filter(i => i.status === 'completed').length,
                pendingItems: safePlan.filter(i => i.status === 'pending').length
            }
        });
    } catch (error: any) {
        console.error('❌ خطأ في confirmPlan:', error);
        res.status(500).json({ 
            message: error.message || 'فشل تأكيد الخطة',
            details: error.errors ? Object.values(error.errors) : error.message
        });
    }
};

 // ============================================================
// ⭐ المرحلة 3 (محدثة): المحرك السياقي المسترسل (Contextual Generator)
// ============================================================
export const startGeneration = async (req: any, res: Response) => {
    const { id } = req.params;

    try {
        const research = await Research.findById(id);
        if (!research) return res.status(404).json({ message: "البحث غير موجود" });

        // نرسل رد أولي للمتصفح ليخبر المستخدم أن العملية بدأت
        res.json({ message: "بدأت عملية التوليد، انتظر اكتمال الملف", researchId: id });

        for (let item of research.plan) {
            // إذا كان العنصر مكتمل بالفعل وله محتوى، نتخطاه
            if (item.status === 'completed' && item.content && item.content.length > 100) {
                continue;
            }

            // تحديث الحالة إلى جاري التوليد
            await Research.updateOne(
                { _id: id, "plan.id": item.id },
                { $set: { "plan.$.status": 'generating' } }
            );

            let prompt = "";
            let systemRole = "أنت باحث أكاديمي محترف. اكتب بأسلوب سردي بشري مسترسل. استخدم نظام التوثيق في الهامش (Footnotes) وفق نظام شيكاغو (Chicago Style). ممنوع الترقيم أو القوائم في المحتوى. اكتب فقرات طويلة ومترابطة.";

            // تحديد البرومبت بناءً على النوع
            if (item.type === 'introduction') {
                prompt = `اكتب مقدمة بحثية مركزة (بين 300 إلى 400 كلمة) للبحث المعنون: "${research.title}". 
                يجب أن تتضمن المقدمة تمهيداً للموضوع وأهميته، ويجب أن تنتهي مباشرة وبشكل صريح بطرح الإشكالية التالية: "${research.methodology?.problemStatement}".
                ابدأ كتابة المحتوى مباشرة بدون تكرار العنوان.`;
            } 
            else if (item.type === 'demand') {
                prompt = `اكتب محتوى تفصيلياً للمطلب بعنوان: "${item.title}". 
                هذا المطلب يندرج ضمن بحث بعنوان: "${research.title}".
                النقاط التي يجب تغطيتها: ${item.subPoints?.join("، ") || "توسع في شرح العنوان سياقياً"}.
                المطلوب: كتابة 700 كلمة على الأقل بأسلوب فقرات أكاديمية مسترسلة مع استخدام التهميش (Footnotes) بنظام شيكاغو في نهاية الفقرات.
                ابدأ كتابة المحتوى مباشرة بدون تكرار العنوان.`;
            }
            else if (item.type === 'conclusion') {
                prompt = `اكتب خاتمة شاملة وموجزة للبحث: "${research.title}". لخص النتائج وأجب على الإشكالية بأسلوب أكاديمي رصين.
                ابدأ كتابة المحتوى مباشرة بدون تكرار العنوان.`;
            }

            if (prompt) {
                try {
                    const model = getGeminiModel(); // سيستخدم gemini-1.5-flash افتراضياً
                    const result = await generateWithRetry(model, {
                        contents: [
                            { role: 'user', parts: [{ text: systemRole + "\n\n" + prompt }] }
                        ],
                        generationConfig: {
                            temperature: 0.6
                        }
                    });

                    let fullText = result.response.text() || "";

                    // تنظيف النص من "تفكير" الموديل (إن وجد)
                    if (fullText.includes('</think>')) {
                        fullText = fullText.split('</think>').pop()?.trim() || fullText;
                    }

                    // تحديث قاعدة البيانات بالمحتوى الناتج
                    await Research.updateOne(
                        { _id: id, "plan.id": item.id },
                        { 
                            $set: { 
                                "plan.$.content": fullText, 
                                "plan.$.status": 'completed' 
                            } 
                        }
                    );
                    
                    console.log(`✅ تم اكتمال توليد: ${item.title}`);

                } catch (apiError) {
                    console.error(`❌ خطأ في API للمطلب ${item.title}:`, apiError);
                    await Research.updateOne({ _id: id, "plan.id": item.id }, { $set: { "plan.$.status": 'failed' } });
                }
            } else {
                // للمباحث (Sections) أو العناصر التي لا تحتاج توليد نصي طويل
                await Research.updateOne(
                    { _id: id, "plan.id": item.id },
                    { $set: { "plan.$.status": 'completed' } }
                );
            }
        }

        // في النهاية، نحدث حالة البحث ككل
        await Research.findByIdAndUpdate(id, { 
            "status.stage": 'completed', 
            "status.progress": 100 
        });

    } catch (error) {
        console.error("Critical Generation Error:", error);
    }
};

// ============================================================
// الدوال الباقية بقيت كما هي دون المساس بها
// ============================================================
export const getResearchStatus = async (req: any, res: Response) => {
    try {
        const research = await Research.findById(req.params.id);
        if (!research) return res.status(404).json({ message: "البحث غير موجود" });
        res.json(research);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const getHistory = async (req: any, res: Response) => {
    try {
        const history = await Research.find({ creatorId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadWord = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const research = await Research.findById(id);

        if (!research) return res.status(404).json({ message: "البحث غير موجود" });
        
        const buffer = await generateWordDoc(research);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(research.title)}.docx`);
        res.send(buffer);

        await Research.findByIdAndUpdate(id, { 
            "status.stage": 'completed',
            $inc: { "metadata.downloadCount": 1 } 
        });

    } catch (error: any) {
        console.error("Error in downloadWord:", error);
        res.status(500).json({ message: error.message });
    }
};