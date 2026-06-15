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

// دالة مساعدة لتحليل JSON بشكل قوي
const safeJsonParse = (text: string) => {
    try {
        return JSON.parse(text);
    } catch (e) {
        console.warn("⚠️  JSON parse failed, trying to extract JSON from text...");
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e2) {
                console.error("❌ Still failed to parse JSON");
            }
        }
        throw new Error("Failed to parse JSON from Gemini response");
    }
};

// الوظيفة القديمة للتوليد المباشر (للتوافق مع الواجهة البسيطة )
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
        const data = safeJsonParse(responseText || "{}");
        console.log("✅ generateResearch data:", data);

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

// ============================================================
// 🐛 نسخة التصحيح (Debug) لـ generateResearch
// ============================================================
export const generateResearchDebug = async (req: any, res: Response) => {
    try {
        const { title, university, faculty, department, level, doctorName, students, citationStyle } = req.body;

        const prompt = `
            أريد بحثاً أكاديمياً كاملاً بعنوان: "${title}".
            الكلية: ${faculty}، القسم: ${department}.
            صمم خطة تتكون من مقدمة، مبحثين (كل مبحث مطالبين)، خاتمة، ومراجع.
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

        const rawGeminiResponse = result.response.text() || "";
        
        let data;
        let parseError = null;
        try {
            data = safeJsonParse(rawGeminiResponse);
        } catch (e) {
            parseError = e;
        }

        res.status(200).json({
            success: true,
            steps: {
                step1_input: { title, university, faculty, department, level, doctorName, students, citationStyle },
                step2_prompt: prompt,
                step3_rawGeminiResponse: rawGeminiResponse,
                step4_parsedData: data,
                step5_parseError: parseError
            }
        });

    } catch (error: any) {
        console.error("Error in generateResearchDebug:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
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

🛑 قوانين لا تقبل الاختراق (Anti-Error Rules):
1. الرد يجب أن يكون JSON صالحاً (Valid JSON) حصراً.
2. المنهجية: يجب أن تحتوي الخطة على ${sectionsCount} مباحث، وكل مبحث يحتوي على ${demandsPerSection} مطالب.
3. المراجع (globalSources): يجب توليد من 5 إلى 8 مصادر "حقيقية أو منطقية جداً" تشمل (كتب، مقالات علمية، مذكرات ماجستير/دكتوراه، ونصوص قانونية جزائرية إن وُجدت).
4. التنسيق: استخدام نظام شيكاغو (Chicago Style) الصارم في كتابة المراجع.

🔬 منطق التهميش (Footnote Logic):
- التمهيد (opening) والخلاصة (closing) للمطلب: يمنع وضع تهميش فيهما (لأنهما يعبران عن شخصية الباحث).
- النقاط الفرعية (subPoints): يجب أن تحتوي كل نقطة على تهميشها الخاص المدمج في حقل "footnote".
- قاعدة التهميش المتكرر:
    * الظهور الأول: (الاسم اللقب، عنوان المرجع، المدينة: الدار، السنة، ص X).
    * تكرار مباشر: (المرجع نفسه، ص Y).
    * تكرار غير مباشر: (الاسم اللقب، المرجع السابق، ص Z).

المطلوب إرجاع هذا الهيكل بدقة متناهية:
{
  "title": "${title}",
  "problemStatement": "صياغة إشكالية مركزية معقدة بأسلوب تساؤلي تنتهي بـ ؟",
  "sources": [
    { "id": "ref_1", "text": "اللقب، الاسم. عنوان الكتاب/المقال. المدينة: دار النشر/المجلة، السنة." }
  ],
  "plan": [
    { "title": "مقدمة", "type": "introduction" },
    {
      "title": "المبحث الأول: [عنوان فخم]",
      "type": "section",
      "demands": [
        {
          "title": "المطلب الأول: [عنوان دقيق]",
          "structure": {
            "opening": "توجيه لكتابة تمهيد سردي يربط المطلب بالمبحث (بدون تهميش)",
            "subPoints": [
              {
                "point": "الفكرة التحليلية الأولى",
                "footnote": "نص التهميش الكامل المنسق حسب قاعدة شيكاغو والتكرار"
              },
              {
                "point": "الفكرة التحليلية الثانية",
                "footnote": "..."
              },
              {
                "point": "الفكرة التحليلية الثالثة",
                "footnote": "..."
              }
            ],
            "closing": "توجيه لكتابة خلاصة استنتاجية للمطلب (بدون تهميش)"
          }
        }
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
       // داخل دالة التسطيح (Flattening)
responseData.plan.forEach((item: any) => {
    if (item.type === 'section') {
        finalPlan.push({ id: `item_${order}`, title: item.title, type: 'section', order: order++, canEdit: true });
        
        item.demands?.forEach((demand: any) => {
            finalPlan.push({
                id: `item_${order}`,
                title: demand.title,
                type: 'demand',
                // نمرر البيانات المهيكلة كاملة لكي نستخدمها في المرحلة الثانية (التوليد الكثيف)
                subPoints: demand.structure.subPoints || [],
                openingDirective: demand.structure.opening,
                closingDirective: demand.structure.closing,
                order: order++,
                canEdit: true
            });
        });
    } else {
        // باقي الأنواع (مقدمة، خاتمة، مراجع)
        finalPlan.push({ id: `item_${order}`, title: item.title, type: item.type, order: order++, canEdit: true });
    }
});

        const globalSources = Array.isArray(responseData.sources) 
            ? responseData.sources.map((s: any, index: number) => ({
                id: s.id || `ref_${index + 1}`,
                text: s.text || s
            }))
            : [];
            
        const newResearch = new Research({
            creatorId: user.id, title, university, faculty, department, level, doctorName,
            students: Array.isArray(students) ? students : [students],
            methodology: { problemStatement: responseData.problemStatement, approach: 'تحليلي', globalSources: globalSources },
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

        res.json({ message: "بدأت عملية التوليد، انتظر اكتمال الملف", researchId: id });

        let previousContext = "";
        const sourcesList = research.methodology?.globalSources?.map((s: any) => `${s.id}: ${s.text}`).join('\n') || "";
        
        for (let item of research.plan) {
            await delay(1500);

            if (item.status === 'completed' && item.content && item.content.length > 100) {
                previousContext = item.content.slice(-150);
                continue;
            }

            await Research.updateOne(
                { _id: id, "plan.id": item.id },
                { $set: { "plan.$.status": 'generating' } }
            );

            let prompt = "";
            const systemRole = `أنت باحث أكاديمي جزائري محترف، تكتب مثل طالب مجتهد أو دكتور يعد بحثه.
القواعد الصارمة التي يجب الالتزام بها 100%:
1. اكتب أسلوب سردي مسترسل، فقرات مترابطة وكثيفة.
2. ممنوع منعاً باتاً: استخدام نقاط، قوائم، أو رموز.
3. التهميش: استخدم حصراً الوسم {{footnote: SOURCE_ID}} فقط، واربطه بـ globalSources.
   مثال: {{footnote: ref_1}}
4. لا تُفرط: 3-4 تهميشات كحد أقصى لكل مطلب.
5. الطول: 1500 حرف على الأقل لكل مطلب أو مبحث.
6. الاتجاه: من اليمين إلى اليسار (RTL).
7. لا تضف عناوين داخل النص - العنوان يضاف برمجياً.`;

            if (item.type === 'introduction') {
                prompt = `العنوان الرئيسي للبحث: "${research.title}"
الإشكالية البحثية: "${research.methodology?.problemStatement}"
السياق الأكاديمي: كلية ${research.faculty || "غير محدد"}، قسم ${research.department || "غير محدد"}
العنصر الحالي: "${item.title}" (نوع: ${item.type})
المراجع المتاحة:
${sourcesList}
سياق القسم السابق للربط المنطقي: "...${previousContext}"
المطلوب: اكتب مقدمة بحثية (200 كلمة على الأقل) للبحث: "${research.title}".
يجب أن تنتهي المقدمة ب الإشكالية: "${research.methodology?.problemStatement}" (بخط عريض).`;
            } 
            else if (item.type === 'demand') {
                const suggestedFootnotesText = item.suggestedFootnotes 
                    ? JSON.stringify(item.suggestedFootnotes) 
                    : '[]';
                prompt = `العنوان الرئيسي للبحث: "${research.title}"
الإشكالية البحثية: "${research.methodology?.problemStatement}"
العنصر الحالي الذي نريد توليده الآن:
- العنوان: "${item.title}"
- النوع: ${item.type}
- النقاط الفرعية (subPoints) التي يجب تغطيتها: [${item.subPoints?.join("، ") || "توسع في شرح العنوان سياقياً"}]
- التهميشات المقترحة لهذا العنصر: [${suggestedFootnotesText}]
المراجع المتاحة (من globalSources):
${sourcesList}
سياق القسم السابق للربط المنطقي: "...${previousContext}"
المطلوب: اكتب محتوى تفصيلياً لهذا العنصر فقط، مع الالتزام الكامل بالقواعد، وربط التهميشات بالمراجع المقترحة.`;
            }
            else if (item.type === 'conclusion') {
                prompt = `العنوان الرئيسي للبحث: "${research.title}"
الإشكالية البحثية: "${research.methodology?.problemStatement}"
السياق الأقسام السابقة: "...${previousContext}"
المطلوب: اكتب خاتمة شاملة للبحث، يجب أن تجيب صراحة وبشكل مفصل على الإشكالية: "${research.methodology?.problemStatement}".`;
            }

            if (prompt) {
                try {
                    const model = getGeminiModel();
                    const result = await generateWithRetry(model, {
                        contents: [
                            { role: 'user', parts: [{ text: systemRole + "\n\n" + prompt }] }
                        ],
                        generationConfig: {
                            temperature: 0.6
                        }
                    });

                    let fullText = result.response.text() || "";

                    if (fullText.includes('</think>')) {
                        fullText = fullText.split('</think>').pop()?.trim() || fullText;
                    }

                    previousContext = fullText.slice(-150);

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
                await Research.updateOne(
                    { _id: id, "plan.id": item.id },
                    { $set: { "plan.$.status": 'completed' } }
                );
            }
        }

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

// ============================================================
// 📝 مولد المطلب الواحد مع التهميش الأوتوماتيكي
// ============================================================
export const generateSingleDemand = async (req: any, res: Response) => {
    try {
        const { 
            demandTitle, 
            topic, 
            subPoints, 
            sourceText 
        } = req.body;

        const user = req.user;
        const updatedUser = await deductPoints(user.id, 1);
        if (!updatedUser) return res.status(402).json({ message: 'لا توجد نقاط كافية' });

        // 1. توليد مصدر افتراضي أو استخدام المقدم
        const sourceId = "ref_1";
        const globalSources = [
            { id: sourceId, text: sourceText || "اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، 2025." }
        ];

        // 2. البرومبت الصارم للمحتوى مع التهميش
        const systemRole = `أنت باحث أكاديمي جزائري محترف، تكتب مثل طالب مجتهد أو دكتور يعد بحثه.
القواعد الصارمة التي يجب الالتزام بها 100%:
1. اكتب أسلوب سردي مسترسل، فقرات مترابطة وكثيفة.
2. ممنوع منعاً باتاً: استخدام نقاط، قوائم، أو رموز.
3. التهميش (الأهم): يجب إضافة الوسم {{footnote: ${sourceId}}} في النص مرة أو مرتين على الأقل!
   مثال صحيح: "كما أشار الباحث إلى أن هذا المفهوم حديث {{footnote: ${sourceId}}}."
   لا تُقم بكتابة التهميش بنفسك، استخدم فقط الوسم {{footnote: ${sourceId}}}.
4. الطول: 1000 حرف على الأقل.
5. الاتجاه: من اليمين إلى اليسار (RTL).
6. لا تضف عناوين داخل النص.`;

        const prompt = `الموضوع الرئيسي: "${topic}"
العنصر الحالي: "${demandTitle}"
النقاط الفرعية التي يجب تغطيتها: [${subPoints?.join("، ") || "توسع في شرح الموضوع بشكل عميق"}]
المرجع المتاح:
${sourceId}: ${globalSources[0].text}
المطلوب: اكتب محتوى تفصيلياً لهذا العنصر فقط، مع التهميش الأوتوماتيكي.`;

        const fullRequestToGemini = systemRole + "\n\n" + prompt;

        const model = getGeminiModel();
        const result = await generateWithRetry(model, {
            contents: [{ role: 'user', parts: [{ text: fullRequestToGemini }] }],
            generationConfig: { temperature: 0.7 }
        });

        const rawGeminiResponse = result.response.text() || "";
        let processedGeminiContent = rawGeminiResponse;
        if (processedGeminiContent.includes('</think>')) {
            processedGeminiContent = processedGeminiContent.split('</think>').pop()?.trim() || processedGeminiContent;
        }

        // 3. إنشاء خطة كاملة مع المقدمة، المطلب، الخاتمة، والمراجع
        const fullPlan = [
            {
                id: "item_intro",
                title: "مقدمة",
                type: "introduction",
                order: 1,
                status: "completed",
                content: `البحث الحالي يتناول موضوع "${topic}"، حيث يهدف إلى تحليل الجوانب المختلفة لهذا الموضوع وبيان أهميته في السياق الأكاديمي والعملي. تُعتبر دراسة هذا الموضوع ذات أهمية كبيرة لفهم الآليات والقوانين المتعلقة به، ويعتمد البحث على مجموعة من المصادر الأكاديمية الموثوقة لتحقيق أهدافه.`
            },
            {
                id: "item_1",
                title: demandTitle,
                type: "demand",
                order: 2,
                status: "completed",
                content: processedGeminiContent
            },
            {
                id: "item_conclusion",
                title: "خاتمة",
                type: "conclusion",
                order: 3,
                status: "completed",
                content: `من خلال ما سبق، يتضح أن موضوع "${topic}" يحتوي على جوانب عديدة ومتنوعة، وقد أثمرت الدراسة الحالية عن نتائج مهمة تُساهم في فهم أعمق لهذا الموضوع. توصي الدراسة بالتركيز على الجوانب التي تمت مناقشتها وإجراء دراسات مستقبلية لتوسيع نطاق المعرفة في هذا المجال.`
            },
            {
                id: "item_references",
                title: "قائمة المصادر والمراجع",
                type: "references",
                order: 4,
                status: "completed",
                content: globalSources.map(s => s.text).join('\n')
            }
        ];

        // 4. إنشاء كائن بيانات البحث الكامل
        const researchData = {
            title: demandTitle,
            university: "جامعة تجريبية",
            faculty: "الكلية التجريبية",
            department: "القسم التجريبي",
            doctorName: "د. التجريبي",
            students: ["طالب تجريبي"],
            methodology: { 
                problemStatement: "ما هو مفهوم " + topic + "؟", 
                globalSources: globalSources 
            },
            plan: fullPlan
        };

        // 5. توليد ملف الوورد
        const buffer = await generateWordDoc(researchData);

        // 5. إرجاع الرد
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(demandTitle)}.docx`);
        res.send(buffer);

    } catch (error: any) {
        console.error("Error in generateSingleDemand:", error);
        res.status(500).json({ message: error.message || 'حدث خطأ أثناء توليد المطلب' });
    }
};

// ============================================================
// 🐛 نسخة التصحيح (Debug) التي ترجع جميع الخطوات كـ JSON
// ============================================================
export const generateSingleDemandDebug = async (req: any, res: Response) => {
    try {
        const { 
            demandTitle, 
            topic, 
            subPoints, 
            sourceText 
        } = req.body;

        // 1. توليد مصدر افتراضي أو استخدام المقدم
        const sourceId = "ref_1";
        const globalSources = [
            { id: sourceId, text: sourceText || "اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، 2025." }
        ];

        // 2. البرومبت الصارم للمحتوى مع التهميش
        const systemRole = `أنت باحث أكاديمي جزائري محترف، تكتب مثل طالب مجتهد أو دكتور يعد بحثه.
القواعد الصارمة التي يجب الالتزام بها 100%:
1. اكتب أسلوب سردي مسترسل، فقرات مترابطة وكثيفة.
2. ممنوع منعاً باتاً: استخدام نقاط، قوائم، أو رموز.
3. التهميش (الأهم): يجب إضافة الوسم {{footnote: ${sourceId}}} في النص مرة أو مرتين على الأقل!
   مثال صحيح: "كما أشار الباحث إلى أن هذا المفهوم حديث {{footnote: ${sourceId}}}."
   لا تُقم بكتابة التهميش بنفسك، استخدم فقط الوسم {{footnote: ${sourceId}}}.
4. الطول: 1000 حرف على الأقل.
5. الاتجاه: من اليمين إلى اليسار (RTL).
6. لا تضف عناوين داخل النص.`;

        const prompt = `الموضوع الرئيسي: "${topic}"
العنصر الحالي: "${demandTitle}"
النقاط الفرعية التي يجب تغطيتها: [${subPoints?.join("، ") || "توسع في شرح الموضوع بشكل عميق"}]
المرجع المتاح:
${sourceId}: ${globalSources[0].text}
المطلوب: اكتب محتوى تفصيلياً لهذا العنصر فقط، مع التهميش الأوتوماتيكي.`;

        const fullRequestToGemini = systemRole + "\n\n" + prompt;

        const model = getGeminiModel();
        const result = await generateWithRetry(model, {
            contents: [{ role: 'user', parts: [{ text: fullRequestToGemini }] }],
            generationConfig: { temperature: 0.7 }
        });

        const rawGeminiResponse = result.response.text() || "";
        let processedGeminiContent = rawGeminiResponse;
        if (processedGeminiContent.includes('</think>')) {
            processedGeminiContent = processedGeminiContent.split('</think>').pop()?.trim() || processedGeminiContent;
        }

        // 3. إنشاء خطة كاملة مع المقدمة، المطلب، الخاتمة، والمراجع
        const fullPlan = [
            {
                id: "item_intro",
                title: "مقدمة",
                type: "introduction",
                order: 1,
                status: "completed",
                content: `البحث الحالي يتناول موضوع "${topic}"، حيث يهدف إلى تحليل الجوانب المختلفة لهذا الموضوع وبيان أهميته في السياق الأكاديمي والعملي. تُعتبر دراسة هذا الموضوع ذات أهمية كبيرة لفهم الآليات والقوانين المتعلقة به، ويعتمد البحث على مجموعة من المصادر الأكاديمية الموثوقة لتحقيق أهدافه.`
            },
            {
                id: "item_1",
                title: demandTitle,
                type: "demand",
                order: 2,
                status: "completed",
                content: processedGeminiContent
            },
            {
                id: "item_conclusion",
                title: "خاتمة",
                type: "conclusion",
                order: 3,
                status: "completed",
                content: `من خلال ما سبق، يتضح أن موضوع "${topic}" يحتوي على جوانب عديدة ومتنوعة، وقد أثمرت الدراسة الحالية عن نتائج مهمة تُساهم في فهم أعمق لهذا الموضوع. توصي الدراسة بالتركيز على الجوانب التي تمت مناقشتها وإجراء دراسات مستقبلية لتوسيع نطاق المعرفة في هذا المجال.`
            },
            {
                id: "item_references",
                title: "قائمة المصادر والمراجع",
                type: "references",
                order: 4,
                status: "completed",
                content: globalSources.map(s => s.text).join('\n')
            }
        ];

        // 4. إنشاء كائن بيانات البحث الكامل
        const researchData = {
            title: demandTitle,
            university: "جامعة تجريبية",
            faculty: "الكلية التجريبية",
            department: "القسم التجريبي",
            doctorName: "د. التجريبي",
            students: ["طالب تجريبي"],
            methodology: { 
                problemStatement: "ما هو مفهوم " + topic + "؟", 
                globalSources: globalSources 
            },
            plan: fullPlan
        };

        // إرجاع جميع الخطوات كـ JSON
        res.status(200).json({
            success: true,
            steps: {
                step1_input: { demandTitle, topic, subPoints, sourceText },
                step2_systemRole: systemRole,
                step3_userPrompt: prompt,
                step4_fullRequestToGemini: fullRequestToGemini,
                step5_rawGeminiResponse: rawGeminiResponse,
                step6_processedGeminiContent: processedGeminiContent,
                step7_fullPlan: fullPlan,
                step8_researchData: researchData
            }
        });

    } catch (error: any) {
        console.error("Error in generateSingleDemandDebug:", error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            stack: error.stack 
        });
    }
};

// ============================================================
// 🎯 Endpoint مخصص للمعالج الأكاديمي (Custom Wizard) بدون تسجيل في قاعدة البيانات
// ============================================================
export const generateCustomSimplePlan = async (req: any, res: Response) => {
    try {
        const { title, faculty, department } = req.body;
        const user = req.user;

        // نقاط اختيارية - يمكننا إضافة خصم النقاط لاحقاً أو تركها مجانية للتجربة
        let updatedUser = user;
        try {
            updatedUser = await deductPoints(user.id, 0); // صفر للتجربة الآن
        } catch(e) {}

        console.log(`🤖 إنشاء خطة لـ "${title}" في كلية ${faculty}...`);

        const prompt = `
أنت باحث أكاديمي متمرس ومحترف. مهمتك هي بناء هيكل بحثي شامل ومفصل لموضوع: "${title}".
السياق الأكاديمي: كلية ${faculty}، قسم ${department}.

🛑 قوانين لا تقبل الاختراق (Anti-Error Rules):
1. الرد يجب أن يكون JSON صالحاً (Valid JSON) حصراً.
2. المنهجية: يجب أن تحتوي الخطة على 2 مباحث، وكل مبحث يحتوي على 2 مطالب.
3. المراجع (sources): يجب توليد من 6 إلى 8 مصادر "حقيقية أو منطقية جداً" تشمل (كتب، مقالات علمية، مذكرات ماجستير/دكتوراه).
4. التنسيق: استخدام نظام شيكاغو (Chicago Style) الصارم في كتابة المراجع.
5. كل مطلب يجب أن يحتوي على: تمهيد (opening)، 3 نقاط فرعية (subPoints) مع تهميش لكل نقطة، وخاتمة (closing) للمطلب.

🔬 منطق التهميش (Footnote Logic):
- النقاط الفرعية (subPoints): يجب أن تحتوي كل نقطة على حقل "footnote" يحتوي على نص التهميش الكامل.
- قاعدة التهميش: (الاسم اللقب، عنوان المرجع، المدينة: الدار، السنة، ص X).

المطلوب إرجاع هذا الهيكل بدقة متناهية:
{
  "title": "${title}",
  "problemStatement": "صياغة إشكالية مركزية معقدة بأسلوب تساؤلي تنتهي بـ ؟",
  "sources": [
    { "id": "ref_1", "text": "اللقب، الاسم. عنوان الكتاب/المقال. المدينة: دار النشر/المجلة، السنة." }
  ],
  "chapters": [
    {
      "id": "1",
      "title": "المبحث الأول: [ضع عنوان فخم وملائم هنا]",
      "demands": [
        {
          "id": "1-1",
          "title": "المطلب الأول: [عنوان دقيق]",
          "opening": "تمهيد سردي يربط المطلب بالمبحث (بدون تهميش)",
          "subPoints": [
            { "point": "الفكرة التحليلية الأولى", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثانية", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثالثة", "footnote": "التهميش الكامل هنا" }
          ],
          "closing": "خلاصة استنتاجية للمطلب (بدون تهميش)"
        },
        {
          "id": "1-2",
          "title": "المطلب الثاني: [عنوان دقيق]",
          "opening": "تمهيد سردي يربط المطلب بالمبحث (بدون تهميش)",
          "subPoints": [
            { "point": "الفكرة التحليلية الأولى", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثانية", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثالثة", "footnote": "التهميش الكامل هنا" }
          ],
          "closing": "خلاصة استنتاجية للمطلب (بدون تهميش)"
        }
      ]
    },
    {
      "id": "2",
      "title": "المبحث الثاني: [ضع عنوان فخم وملائم هنا]",
      "demands": [
        {
          "id": "2-1",
          "title": "المطلب الأول: [عنوان دقيق]",
          "opening": "تمهيد سردي يربط المطلب بالمبحث (بدون تهميش)",
          "subPoints": [
            { "point": "الفكرة التحليلية الأولى", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثانية", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثالثة", "footnote": "التهميش الكامل هنا" }
          ],
          "closing": "خلاصة استنتاجية للمطلب (بدون تهميش)"
        },
        {
          "id": "2-2",
          "title": "المطلب الثاني: [عنوان دقيق]",
          "opening": "تمهيد سردي يربط المطلب بالمبحث (بدون تهميش)",
          "subPoints": [
            { "point": "الفكرة التحليلية الأولى", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثانية", "footnote": "التهميش الكامل هنا" },
            { "point": "الفكرة التحليلية الثالثة", "footnote": "التهميش الكامل هنا" }
          ],
          "closing": "خلاصة استنتاجية للمطلب (بدون تهميش)"
        }
      ]
    }
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
        console.log("📤 استجابة Gemini الأولى:", responseContent);
        
        if (!responseContent) return res.status(500).json({ message: 'فشل الحصول على رد من Gemini' });

        let responseData = JSON.parse(responseContent);

        // إذا لم يكن هناك "chapters"، نقوم بتحويل "plan" إلى "chapters"
        if (!responseData.chapters && responseData.plan) {
            const chapters: any[] = [];
            let chapterIndex = 1;
            let demandIndex = 1;
            let currentChapter: any = null;

            responseData.plan.forEach((item: any) => {
                if (item.type === 'section') {
                    if (currentChapter) {
                        chapters.push(currentChapter);
                    }
                    currentChapter = {
                        id: String(chapterIndex++),
                        title: item.title,
                        demands: []
                    };
                    demandIndex = 1;
                } else if (item.type === 'demand' && currentChapter) {
                    const demand = {
                        id: `${currentChapter.id}-${demandIndex++}`,
                        title: item.title,
                        opening: item.openingDirective || "تمهيد للمطلب",
                        subPoints: item.subPoints || [
                            { point: "نقطة 1", footnote: "مرجع 1" },
                            { point: "نقطة 2", footnote: "مرجع 2" },
                            { point: "نقطة 3", footnote: "مرجع 3" }
                        ],
                        closing: item.closingDirective || "خاتمة للمطلب"
                    };
                    currentChapter.demands.push(demand);
                }
            });

            if (currentChapter) chapters.push(currentChapter);
            responseData.chapters = chapters;
        }

        // التأكد من وجود كل الحقول المطلوبة
        if (!responseData.problemStatement) {
            responseData.problemStatement = `ما هي التحديات التي تواجه دراسة "${title}" في سياق ${department}؟`;
        }
        if (!responseData.sources) {
            responseData.sources = [
                { id: "ref_1", text: "الطار، فؤاد. القانون الإداري. القاهرة: منشورات جامعة القاهرة، 2023." },
                { id: "ref_2", text: "الطماوي، سليمان. مبادئ القانون الإداري. القاهرة: دار الفكر العربي، 2022." }
            ];
        }

        res.status(200).json({
            success: true,
            title: responseData.title,
            faculty,
            department,
            problemStatement: responseData.problemStatement,
            chapters: responseData.chapters,
            sources: responseData.sources,
            remainingPoints: updatedUser?.points
        });
        console.log("✅ تم إرسال الخطة بنجاح!");

    } catch (error: any) {
        console.error("❌ خطأ في generateCustomSimplePlan:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'حدث خطأ في إنشاء الخطة' 
        });
    }
};