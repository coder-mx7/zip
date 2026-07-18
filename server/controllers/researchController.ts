import { Response } from 'express';
import { Research } from '../models/Research.js';
import { generateWordDoc } from '../utils/wordGenerator.js';
import { deductPoints } from '../middleware/pointsMiddleware.js';
import { generateNarrative, generateStructured, getActiveProvider } from '../utils/aiProvider.js';

// دالة مساعدة للانتظار
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const MIN_GLOBAL_SOURCES = 12;
const DEFAULT_UNIVERSITY_LOGO = '/universities/default-university-logo.svg';

// ============================================================
// 🧰 أدوات تطبيع البيانات (نفس منطق الإصدار السابق، بلا تغيير جوهري)
// ============================================================
const normalizeSourceId = (value: any, index: number) => {
    const raw = String(value || `ref_${index + 1}`).trim();
    return /^ref_\d+$/i.test(raw) ? raw.toLowerCase() : `ref_${index + 1}`;
};

const normalizeGlobalSources = (sources: any[]): { id: string; text: string }[] => {
    if (!Array.isArray(sources)) return [];
    const seen = new Set<string>();
    const normalized = sources
        .map((source: any, index: number) => {
            const id = normalizeSourceId(source?.id, index);
            const text = String(source?.text || source || '').trim();
            if (!text || seen.has(id)) return null;
            seen.add(id);
            return { id, text };
        })
        .filter(Boolean) as { id: string; text: string }[];
    return normalized;
};

const normalizeSubPoints = (subPoints: any[], globalSources: { id: string; text: string }[]) => {
    const fallbackSourceIds = globalSources.map(source => source.id);
    return (Array.isArray(subPoints) ? subPoints : []).map((subPoint: any, index: number) => {
        const fallbackSourceId = fallbackSourceIds[index % Math.max(fallbackSourceIds.length, 1)] || 'ref_1';
        const sourceId = fallbackSourceIds.includes(subPoint?.sourceId)
            ? subPoint.sourceId
            : fallbackSourceId;
        return {
            point: String(subPoint?.point || `الفكرة التحليلية ${index + 1}`).trim(),
            sourceId,
            footnote: String(subPoint?.footnote || '').trim()
        };
    });
};

const buildSuggestedFootnotes = (subPoints: { point: string; sourceId: string; footnote: string }[]) => {
    const unique = new Map<string, string>();
    subPoints.forEach(subPoint => {
        if (subPoint.sourceId && subPoint.footnote && !unique.has(subPoint.sourceId)) {
            unique.set(subPoint.sourceId, subPoint.footnote);
        }
    });
    return Array.from(unique.entries()).map(([sourceId, text]) => ({ sourceId, text }));
};

const formatSubPointsForPrompt = (subPoints: { point: string; sourceId: string; footnote: string }[]) => {
    if (!Array.isArray(subPoints) || subPoints.length === 0) {
        return 'لا توجد نقاط فرعية محددة، وسّع التحليل وفق عنوان المطلب فقط.';
    }
    return subPoints
        .map((subPoint, index) => `${index + 1}. ${subPoint.point} | المصدر الإلزامي: ${subPoint.sourceId} | التهميش المرجعي: ${subPoint.footnote}`)
        .join('\n');
};

// detect type helper (يبقى للتوافق مع الدوال القديمة إن استُخدمت)
function detectType(title: string): string {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('مقدمة')) return 'introduction';
    if (lowerTitle.includes('خاتمة')) return 'conclusion';
    if (lowerTitle.includes('مراجع')) return 'references';
    if (lowerTitle.includes('مبحث') || lowerTitle.includes('فصل')) return 'section';
    return 'demand';
}

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

// ============================================================
// 🧭 دور المهندس الأكاديمي (System) + الهيكل المطلوب (User)
// نفصل بوضوح بين "توجيه الأسلوب/القواعد" و"متطلبات بنية JSON"
// (يعمل حرفياً مع Claude عبر حقل system، ويُدمج تلقائياً مع Gemini).
// ============================================================
const buildArchitectSystemRole = () => `أنت باحث أكاديمي جزائري متمرّس ومحترف، متخصّص في بناء الهياكل البحثية الجامعية وفق المنهجية الجزائرية ونظام التهميش الشيكاغي.

🛑 قوانين لا تقبل الاختراق:
1. الرد يجب أن يكون JSON صالحاً (Valid JSON) حصراً، دون أي نص خارجه.
2. يمنع منعاً باتاً اختراع أي تهميش خارج قائمة المصادر المولّدة في حقل "sources".
3. كل مصدر في "sources" يجب أن يملك id فريداً بصيغة ref_1, ref_2, ref_3 ... بالتسلسل.
4. استخدم نظام شيكاغو (Chicago Style) الصارم في كتابة المراجع.

🔬 منطق التهميش:
- التمهيد (opening) والخلاصة (closing) للمطلب: يمنع وضع تهميش فيهما (لأنهما يعبّران عن شخصية الباحث).
- كل نقطة فرعية (subPoint) يجب أن تحتوي على:
   * "point": الفكرة التحليلية نفسها.
   * "sourceId": معرّف مصدر موجود حصراً داخل "sources".
   * "footnote": نص تهميش كامل مشتق حصراً من ذلك المصدر نفسه.
- ممنوع استخدام أي sourceId غير موجود في "sources".
- قاعدة التهميش المتكرر:
    * الظهور الأول: (الاسم اللقب، عنوان المرجع، المدينة: الدار، السنة، ص X).
    * تكرار مباشر: (المرجع نفسه، ص Y).
    * تكرار غير مباشر: (الاسم اللقب، المرجع السابق، ص Z).`;

const buildArchitectUserPrompt = (
    title: string,
    faculty: string,
    department: string,
    sectionsCount: number,
    demandsPerSection: number
) => `ابنِ هيكلاً بحثياً شاملاً ومفصّلاً لموضوع: "${title}".
السياق الأكاديمي: كلية ${faculty}، قسم ${department}.

المتطلبات:
- عدد المباحث: ${sectionsCount}، وكل مبحث يحتوي على ${demandsPerSection} مطالب.
- المصادر (sources): ${MIN_GLOBAL_SOURCES} مصدراً على الأقل (ويفضّل بين ${MIN_GLOBAL_SOURCES} و15)، تشمل كتباً ومقالات علمية ورسائل جامعية ونصوصاً قانونية أو تنظيمية جزائرية إن وُجدت.
- كل مطلب يحتوي على تمهيد (opening) بدون تهميش، و3 نقاط فرعية (subPoints) مع تهميش لكل نقطة، وخلاصة (closing) بدون تهميش.

أعد بدقة متناهية هذا الهيكل (schema صريح — التزم بأسماء الحقول وأنواعها كما هي):
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
              { "point": "الفكرة التحليلية الأولى", "sourceId": "ref_1", "footnote": "نص التهميش الكامل المنسّق حسب شيكاغو" },
              { "point": "الفكرة التحليلية الثانية", "sourceId": "ref_2", "footnote": "..." },
              { "point": "الفكرة التحليلية الثالثة", "sourceId": "ref_3", "footnote": "..." }
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

// ============================================================
// 🔎 تحقق بنيوي (Structural Validation) على رد النموذج قبل الحفظ
// يميّز بين أخطاء قاتلة (تستوجب إعادة المحاولة أو الفشل الصريح)
// وأخطاء مصادر (sourceId غير موجود) التي يمكن ترقيعها بالتطبيع مع تسجيل تحذير.
// ============================================================
function validatePlanStructure(
    responseData: any,
    globalSources: { id: string; text: string }[],
    sectionsCount: number,
    demandsPerSection: number
): { fatal: string[]; invalidSourceRefs: number } {
    const fatal: string[] = [];
    let invalidSourceRefs = 0;

    if (globalSources.length < MIN_GLOBAL_SOURCES) {
        fatal.push(`عدد المصادر ${globalSources.length} أقل من الحد الأدنى ${MIN_GLOBAL_SOURCES}`);
    }
    if (!Array.isArray(responseData?.plan)) {
        fatal.push('حقل plan غير موجود أو ليس مصفوفة');
        return { fatal, invalidSourceRefs };
    }

    const validIds = new Set(globalSources.map(s => s.id));
    const sections = responseData.plan.filter((it: any) => it?.type === 'section');
    if (sections.length < sectionsCount) {
        fatal.push(`عدد المباحث ${sections.length} أقل من المطلوب ${sectionsCount}`);
    }

    for (const section of sections) {
        const demands = Array.isArray(section?.demands) ? section.demands : [];
        if (demands.length < demandsPerSection) {
            fatal.push(`المبحث "${section?.title}" يحوي ${demands.length} مطالب فقط (المطلوب ${demandsPerSection})`);
        }
        for (const demand of demands) {
            const subPoints = demand?.structure?.subPoints;
            if (!Array.isArray(subPoints) || subPoints.length === 0) {
                fatal.push(`المطلب "${demand?.title}" بلا نقاط فرعية`);
                continue;
            }
            for (const sp of subPoints) {
                if (!validIds.has(String(sp?.sourceId || '').toLowerCase())) {
                    invalidSourceRefs++;
                }
            }
        }
    }

    return { fatal, invalidSourceRefs };
}

// ============================================================
// 🏗️ المصدر الوحيد للحقيقة: بناء الخطة المسطّحة المتوافقة
// (تُستخدم من قِبل /plan و/generate معاً — منطق موحّد لا يتكرر)
// ============================================================
async function buildResearchPlan(params: {
    title: string;
    faculty: string;
    department: string;
    sectionsCount?: number;
    demandsPerSection?: number;
}): Promise<{
    problemStatement: string;
    globalSources: { id: string; text: string }[];
    finalPlan: any[];
}> {
    const { title, faculty = 'غير محدد', department = 'غير محدد', sectionsCount = 2, demandsPerSection = 2 } = params;

    const system = buildArchitectSystemRole();
    const user = buildArchitectUserPrompt(title, faculty, department, sectionsCount, demandsPerSection);

    const maxAttempts = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const responseData = await generateStructured(system, user);
        const globalSources = normalizeGlobalSources(responseData?.sources);
        const { fatal, invalidSourceRefs } = validatePlanStructure(responseData, globalSources, sectionsCount, demandsPerSection);

        // أخطاء قاتلة: أعد المحاولة، وإن كانت آخر محاولة ارمِ خطأ واضحاً بدل الحفظ المكسور
        if (fatal.length > 0) {
            lastError = new Error(`فشل التحقق البنيوي للخطة: ${fatal.join(' | ')}`);
            console.warn(`⚠️ المحاولة ${attempt}/${maxAttempts}: ${lastError.message}`);
            if (attempt < maxAttempts) continue;
            throw lastError;
        }

        // مصادر مرجعية غير موجودة: أعد المحاولة، وفي آخر محاولة رقّع بالتطبيع مع تسجيل تحذير (لا صمت)
        if (invalidSourceRefs > 0 && attempt < maxAttempts) {
            lastError = new Error(`${invalidSourceRefs} نقطة فرعية تشير إلى مصدر خارج القائمة`);
            console.warn(`⚠️ المحاولة ${attempt}/${maxAttempts}: ${lastError.message} — إعادة المحاولة`);
            continue;
        }
        if (invalidSourceRefs > 0) {
            console.warn(`⚠️ تم ترقيع ${invalidSourceRefs} مرجع غير صالح عبر التطبيع (لم يُخترع مصدر جديد).`);
        }

        // ✅ التسطيح (Flattening) إلى الهيكل المتوافق مع wordGenerator وstartGeneration
        const finalPlan: any[] = [];
        let order = 1;

        finalPlan.push({
            id: `item_problem`,
            title: responseData.problemStatement,
            type: 'problem_statement',
            order: order++,
            canEdit: true,
            label: 'الإشكالية البحثية'
        });

        responseData.plan.forEach((item: any) => {
            if (item.type === 'section') {
                finalPlan.push({ id: `item_${order}`, title: item.title, type: 'section', order: order++, canEdit: true });
                (item.demands || []).forEach((demand: any) => {
                    const normalizedSubPoints = normalizeSubPoints(demand?.structure?.subPoints || [], globalSources);
                    finalPlan.push({
                        id: `item_${order}`,
                        title: demand.title,
                        type: 'demand',
                        subPoints: normalizedSubPoints,
                        openingDirective: demand?.structure?.opening || '',
                        closingDirective: demand?.structure?.closing || '',
                        suggestedFootnotes: buildSuggestedFootnotes(normalizedSubPoints),
                        order: order++,
                        canEdit: true
                    });
                });
            } else {
                // مقدمة / خاتمة / مراجع
                finalPlan.push({ id: `item_${order}`, title: item.title, type: item.type, order: order++, canEdit: true });
            }
        });

        return { problemStatement: responseData.problemStatement, globalSources, finalPlan };
    }

    throw lastError || new Error('فشل بناء الخطة');
}

// ============================================================
// 📚 بناء قائمة المصادر والمراجع برمجياً من globalSources
// (لا نستدعي الذكاء الاصطناعي لهذا القسم إطلاقاً — إصلاح البند 1)
// نُدرج المصادر المستخدَمة فعلاً في التهميشات، مرتّبة أبجدياً (عرف البيبليوغرافيا الأكاديمي).
// ============================================================
const FOOTNOTE_TAG = /\{\{footnote:\s*(ref_\d+)\}\}/gi;

function collectUsedSourceIds(plan: any[]): Set<string> {
    const used = new Set<string>();
    for (const item of plan) {
        // من وسوم التهميش داخل المحتوى المولّد
        const content = typeof item?.content === 'string' ? item.content : '';
        let match: RegExpExecArray | null;
        FOOTNOTE_TAG.lastIndex = 0;
        while ((match = FOOTNOTE_TAG.exec(content)) !== null) {
            used.add(match[1].toLowerCase());
        }
        // ومن النقاط الفرعية المهيكلة (ضمان التطابق مع التهميشات)
        if (Array.isArray(item?.subPoints)) {
            item.subPoints.forEach((sp: any) => {
                if (sp?.sourceId) used.add(String(sp.sourceId).toLowerCase());
            });
        }
    }
    return used;
}

function buildReferencesContent(globalSources: { id: string; text: string }[], plan: any[]): string {
    const used = collectUsedSourceIds(plan);
    const selected = used.size > 0
        ? globalSources.filter(s => used.has(s.id.toLowerCase()))
        : globalSources;
    const list = (selected.length > 0 ? selected : globalSources);
    // ترتيب أبجدي حسب نص المرجع (عرف قائمة المصادر والمراجع الأكاديمية)
    return [...list]
        .sort((a, b) => a.text.localeCompare(b.text, 'ar'))
        .map(s => s.text)
        .join('\n');
}

// ============================================================
// 🖋️ توجيه توليد المحتوى السردي (systemRole) — قواعد صارمة موحّدة
// ============================================================
const CONTENT_SYSTEM_ROLE = `أنت باحث أكاديمي جزائري محترف، تكتب مثل طالب مجتهد أو دكتور يعدّ بحثه.
القواعد الصارمة التي يجب الالتزام بها 100%:
1. اكتب بأسلوب سردي مسترسل، فقرات مترابطة وكثيفة.
2. ممنوع منعاً باتاً: استخدام نقاط، قوائم، أو رموز.
3. التهميش: استخدم حصراً الوسم {{footnote: SOURCE_ID}} فقط، واربطه بـ globalSources. مثال: {{footnote: ref_1}}
4. لا تُفرط: 3-4 تهميشات كحد أقصى لكل مطلب.
5. الطول: 1500 حرف على الأقل لكل مطلب أو مبحث.
6. الاتجاه: من اليمين إلى اليسار (RTL).
7. لا تضف عناوين داخل النص — العنوان يُضاف برمجياً.`;

// ============================================================
// ⚙️ المحرك السياقي: توليد محتوى كل عناصر خطة بحث محفوظ
// (يُستخدم من /generate كخلفية ومن /generate/:id — منطق موحّد)
// إصلاح البند 1: عنصر references يُبنى برمجياً (لا Gemini/Claude له).
// ============================================================
async function runGeneration(researchId: string): Promise<void> {
    const research = await Research.findById(researchId);
    if (!research) return;

    let previousContext = '';
    const globalSources = (research.methodology?.globalSources || []) as { id: string; text: string }[];
    const sourcesList = globalSources.map((s: any) => `${s.id}: ${s.text}`).join('\n');

    // نحتفظ بنسخة محلّية محدّثة من المحتوى لبناء المراجع في النهاية
    const localPlan = research.plan.map((it: any) => ({
        id: it.id,
        type: it.type,
        title: it.title,
        content: it.content || '',
        subPoints: it.subPoints || []
    }));

    const total = research.plan.length || 1;
    let done = 0;

    for (const item of research.plan) {
        // العناصر المكتملة مسبقاً (مثل مراجع مؤكّدة) نتخطاها
        if (item.status === 'completed' && item.content && item.content.length > 100) {
            previousContext = item.content.slice(-150);
            done++;
            continue;
        }

        await Research.updateOne(
            { _id: researchId, 'plan.id': item.id },
            { $set: { 'plan.$.status': 'generating' } }
        );

        try {
            let generated = '';

            if (item.type === 'references') {
                // 🧱 بناء برمجي مباشر من المصادر — لا استدعاء لأي نموذج
                generated = buildReferencesContent(globalSources, localPlan);
            } else if (item.type === 'section') {
                // المبحث عنوان فقط؛ لا محتوى سردي له (المحتوى في مطالبه)
                generated = '';
            } else if (item.type === 'problem_statement') {
                generated = ''; // الإشكالية تُعرض من العنوان في مولّد Word
            } else {
                const userPrompt = buildContentPrompt(item, research, sourcesList, previousContext);
                if (userPrompt) {
                    await delay(1200);
                    generated = await generateNarrative(CONTENT_SYSTEM_ROLE, userPrompt);
                    previousContext = generated.slice(-150);
                }
            }

            // حدّث النسخة المحلية (لبناء المراجع لاحقاً بما يطابق التهميشات)
            const local = localPlan.find(p => p.id === item.id);
            if (local) local.content = generated;

            await Research.updateOne(
                { _id: researchId, 'plan.id': item.id },
                { $set: { 'plan.$.content': generated, 'plan.$.status': 'completed' } }
            );
            console.log(`✅ اكتمل توليد: ${item.title}`);
        } catch (apiError) {
            console.error(`❌ خطأ في توليد "${item.title}":`, apiError);
            await Research.updateOne(
                { _id: researchId, 'plan.id': item.id },
                { $set: { 'plan.$.status': 'failed' } }
            );
        }

        done++;
        const progress = Math.min(95, 40 + Math.round((done / total) * 55));
        await Research.updateOne({ _id: researchId }, { $set: { 'status.progress': progress } });
    }

    await Research.findByIdAndUpdate(researchId, { 'status.stage': 'completed', 'status.progress': 100 });
}

/** يبني نص طلب توليد المحتوى للعنصر الحالي (يُمرّر كرسالة مستخدم). */
function buildContentPrompt(item: any, research: any, sourcesList: string, previousContext: string): string {
    if (item.type === 'introduction') {
        return `العنوان الرئيسي للبحث: "${research.title}"
الإشكالية البحثية: "${research.methodology?.problemStatement}"
السياق الأكاديمي: كلية ${research.faculty || 'غير محدد'}، قسم ${research.department || 'غير محدد'}
العنصر الحالي: "${item.title}"
المراجع المتاحة:
${sourcesList}
سياق القسم السابق للربط المنطقي: "...${previousContext}"
المطلوب: اكتب مقدمة بحثية (200 كلمة على الأقل) للبحث: "${research.title}".
يجب أن تنتهي المقدمة بالإشكالية: "${research.methodology?.problemStatement}" (بخط عريض).`;
    }

    if (item.type === 'demand') {
        const suggestedFootnotesText = item.suggestedFootnotes ? JSON.stringify(item.suggestedFootnotes) : '[]';
        const formattedSubPoints = formatSubPointsForPrompt(item.subPoints || []);
        return `العنوان الرئيسي للبحث: "${research.title}"
الإشكالية البحثية: "${research.methodology?.problemStatement}"
العنصر الحالي الذي نريد توليده الآن:
- العنوان: "${item.title}"
- التمهيد المطلوب قبل التحليل: ${item.openingDirective || 'اكتب تمهيداً أكاديمياً قصيراً يهيّئ للمطلب بدون تهميش.'}
- النقاط الفرعية (subPoints) التي يجب تغطيتها حصراً:
${formattedSubPoints}
- الخلاصة المطلوبة في نهاية المطلب: ${item.closingDirective || 'اختم المطلب بخلاصة تحليلية موجزة بدون تهميش.'}
- التهميشات المقترحة لهذا العنصر: [${suggestedFootnotesText}]
المراجع المتاحة (من globalSources):
${sourcesList}
سياق القسم السابق للربط المنطقي: "...${previousContext}"
المطلوب: اكتب محتوى تفصيلياً لهذا العنصر فقط، مع الالتزام الكامل بالقواعد، وربط كل تهميش حصراً بالمصادر المذكورة أعلاه دون الخروج عنها.`;
    }

    if (item.type === 'conclusion') {
        return `العنوان الرئيسي للبحث: "${research.title}"
الإشكالية البحثية: "${research.methodology?.problemStatement}"
سياق الأقسام السابقة: "...${previousContext}"
المطلوب: اكتب خاتمة شاملة للبحث، يجب أن تجيب صراحة وبشكل مفصّل على الإشكالية: "${research.methodology?.problemStatement}".`;
    }

    return '';
}

// ============================================================
// ⭐ /plan — إنشاء الإشكالية + الخطة الكاملة (المسار المعتمد للخطة المبدئية)
// ============================================================
export const generatePlan = async (req: any, res: Response) => {
    try {
        const { title, university, faculty, department, level, doctorName, students, sectionsCount = 2, demandsPerSection = 2 } = req.body;
        const user = req.user;

        const updatedUser = await deductPoints(user.id, 3);
        if (!updatedUser) return res.status(402).json({ message: 'لا توجد نقاط كافية' });

        const { problemStatement, globalSources, finalPlan } = await buildResearchPlan({
            title, faculty, department, sectionsCount, demandsPerSection
        });

        const newResearch = new Research({
            creatorId: user.id, title, university, faculty, department, level, doctorName,
            students: Array.isArray(students) ? students : [students],
            universityLogo: DEFAULT_UNIVERSITY_LOGO,
            methodology: { problemStatement, approach: 'تحليلي', globalSources },
            plan: finalPlan,
            status: { stage: 'plan_approval', progress: 30 }
        });

        await newResearch.save();

        res.status(201).json({
            _id: newResearch._id, title, faculty, department,
            problemStatement: { text: problemStatement, canEdit: true },
            plan: finalPlan.map(item => ({
                id: item.id, order: item.order, title: item.title, type: item.type, label: getItemLabel(item.type), canEdit: item.canEdit
            })),
            pointsDeducted: 3, remainingPoints: updatedUser?.points, status: 'plan_ready',
            provider: getActiveProvider(),
            message: '✅ تم إنشاء الخطة الكاملة والمراجع المبدئية بنجاح'
        });
    } catch (error: any) {
        console.error('❌ خطأ في generatePlan:', error);
        res.status(500).json({ message: error.message || 'حدث خطأ في إنشاء الخطة' });
    }
};

// ============================================================
// ⭐ /generate — المسار المعتمد الوحيد بنقرة واحدة (StudentDashboard)
// يبني الخطة المسطّحة (نفس منطق generatePlan) ثم يبدأ التوليد في الخلفية.
// يعيد _id فوراً؛ الفرونت يستطلع /status/:id ثم يحمّل الملف.
// ============================================================
export const generateResearch = async (req: any, res: Response) => {
    try {
        const { title, university, faculty, department, level, doctorName, students, sectionsCount = 2, demandsPerSection = 2 } = req.body;
        const user = req.user;

        const updatedUser = await deductPoints(user.id, 10);
        if (!updatedUser) {
            return res.status(402).json({ message: 'لا توجد نقاط كافية لتوليد بحث جديد' });
        }

        // 1) بناء الخطة المسطّحة المتوافقة (نفس مصدر الحقيقة)
        const { problemStatement, globalSources, finalPlan } = await buildResearchPlan({
            title, faculty, department, sectionsCount, demandsPerSection
        });

        // 2) حفظ البحث بحالة "قيد التوليد"
        const newResearch = new Research({
            creatorId: user.id, title, university, faculty, department, level, doctorName,
            students: Array.isArray(students) ? students.filter((s: string) => s && s.trim()) : [students],
            universityLogo: DEFAULT_UNIVERSITY_LOGO,
            methodology: { problemStatement, approach: 'تحليلي', globalSources },
            plan: finalPlan,
            status: { stage: 'generating', progress: 30 }
        });
        await newResearch.save();

        // 3) الرد فوراً (لتفادي مهلة HTTP لأن التوليد قد يستغرق دقيقة أو أكثر)
        res.status(201).json({
            _id: newResearch._id,
            title: newResearch.title,
            pointsDeducted: 10,
            remainingPoints: updatedUser.points,
            newPoints: updatedUser.points,
            status: 'generating',
            provider: getActiveProvider(),
            message: '✅ بدأ توليد البحث. تابع الحالة عبر /status/:id ثم حمّل الملف.'
        });

        // 4) تشغيل التوليد في الخلفية (لا ننتظره داخل الطلب)
        runGeneration(String(newResearch._id)).catch(err =>
            console.error('❌ خطأ حرج في التوليد الخلفي:', err)
        );
    } catch (error: any) {
        console.error('Error in generateResearch:', error);
        if (!res.headersSent) res.status(500).json({ message: error.message });
    }
};

// ============================================================
// ⭐ /plan/confirm — تأكيد الخطة (يرفض أي عنصر بلا type صريح — إصلاح البند 2)
// ============================================================
export const confirmPlan = async (req: any, res: Response) => {
    try {
        const { researchId, finalPlan } = req.body;
        const user = req.user;

        if (!researchId || !Array.isArray(finalPlan)) {
            return res.status(400).json({
                message: '❌ البيانات المرسلة غير صحيحة. يجب توفير researchId و finalPlan (مصفوفة)',
                received: { researchId: typeof researchId, finalPlan: typeof finalPlan }
            });
        }

        const research = await Research.findById(researchId);
        if (!research) return res.status(404).json({ message: 'البحث غير موجود' });

        // 🚫 لا type افتراضي بصمت: نرفض بخطأ واضح إن كان أي عنصر بلا type صريح
        const validTypes = ['introduction', 'section', 'demand', 'conclusion', 'references', 'problem_statement'];
        for (let i = 0; i < finalPlan.length; i++) {
            const item = finalPlan[i];
            const originalItem = research.plan.find(p => p.id === item.id);
            const resolvedType = item.type || originalItem?.type;
            if (!resolvedType || !validTypes.includes(resolvedType)) {
                return res.status(400).json({
                    message: `❌ العنصر plan[${i}] (id=${item.id ?? 'غير محدد'}) بلا type صريح صالح. الأنواع المسموحة: ${validTypes.join(', ')}`,
                    index: i
                });
            }
        }

        const updatedUser = await deductPoints(user.id, 2);

        const safePlan = finalPlan.map((item: any, index: number) => {
            const originalItem = research.plan.find(p => p.id === item.id);
            const isCompleted = originalItem?.status === 'completed';
            const cleanedContent = isCompleted
                ? sanitizeContent(originalItem.content)
                : sanitizeContent(item.content || '');

            return {
                id: item.id,
                title: item.title || originalItem?.title || '',
                type: item.type || originalItem?.type, // مضمون الوجود بعد التحقق أعلاه
                content: cleanedContent,
                status: isCompleted ? 'completed' : (item.status || 'pending'),
                subPoints: item.subPoints || originalItem?.subPoints || [],
                openingDirective: item.openingDirective || originalItem?.openingDirective || '',
                closingDirective: item.closingDirective || originalItem?.closingDirective || '',
                suggestedFootnotes: item.suggestedFootnotes || originalItem?.suggestedFootnotes || [],
                order: item.order !== undefined ? item.order : index,
                canEdit: item.canEdit !== undefined ? item.canEdit : true
            };
        });

        const updatedResearch = await Research.findByIdAndUpdate(
            researchId,
            { $set: { plan: safePlan, 'status.stage': 'generating', 'status.progress': 40 } },
            { new: true, runValidators: true }
        );

        res.json({
            message: '✅ تم تأكيد الخطة بأمان',
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
// ⭐ /generate/:id — تشغيل المحرك السياقي على بحث محفوظ (بعد confirmPlan)
// ============================================================
export const startGeneration = async (req: any, res: Response) => {
    const { id } = req.params;
    try {
        const research = await Research.findById(id);
        if (!research) return res.status(404).json({ message: 'البحث غير موجود' });

        res.json({ message: 'بدأت عملية التوليد، تابع الحالة عبر /status/:id', researchId: id });

        runGeneration(id).catch(err => console.error('Critical Generation Error:', err));
    } catch (error) {
        console.error('Critical Generation Error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'فشل بدء التوليد' });
    }
};

// ============================================================
// الدوال المساعدة العامة (الحالة، السجل، التحميل)
// ============================================================
export const getResearchStatus = async (req: any, res: Response) => {
    try {
        const research = await Research.findById(req.params.id);
        if (!research) return res.status(404).json({ message: 'البحث غير موجود' });
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
        if (!research) return res.status(404).json({ message: 'البحث غير موجود' });

        const buffer = await generateWordDoc(research);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(research.title)}.docx`);
        res.send(buffer);

        await Research.findByIdAndUpdate(id, {
            'status.stage': 'completed',
            $inc: { 'metadata.downloadCount': 1 }
        });
    } catch (error: any) {
        console.error('Error in downloadWord:', error);
        res.status(500).json({ message: error.message });
    }
};

// ============================================================
// 📝 مولّد المطلب الواحد (يستخدم المزوّد الموحّد الآن أيضاً)
// ============================================================
export const generateSingleDemand = async (req: any, res: Response) => {
    try {
        const { demandTitle, topic, subPoints, sourceText } = req.body;
        const user = req.user;
        const updatedUser = await deductPoints(user.id, 1);
        if (!updatedUser) return res.status(402).json({ message: 'لا توجد نقاط كافية' });

        const sourceId = 'ref_1';
        const globalSources = [
            { id: sourceId, text: sourceText || 'اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، 2025.' }
        ];

        const systemRole = `${CONTENT_SYSTEM_ROLE}
ملاحظة خاصة: يجب أن يظهر الوسم {{footnote: ${sourceId}}} في النص مرة أو مرتين على الأقل، ومنع كتابة نص التهميش يدوياً.`;

        const prompt = `الموضوع الرئيسي: "${topic}"
العنصر الحالي: "${demandTitle}"
النقاط الفرعية التي يجب تغطيتها: [${subPoints?.join('، ') || 'توسّع في شرح الموضوع بشكل عميق'}]
المرجع المتاح:
${sourceId}: ${globalSources[0].text}
المطلوب: اكتب محتوى تفصيلياً لهذا العنصر فقط، مع التهميش الأوتوماتيكي.`;

        const processedContent = await generateNarrative(systemRole, prompt);

        const fullPlan = [
            { id: 'item_intro', title: 'مقدمة', type: 'introduction', order: 1, status: 'completed', content: `البحث الحالي يتناول موضوع "${topic}"، حيث يهدف إلى تحليل الجوانب المختلفة لهذا الموضوع وبيان أهميته في السياق الأكاديمي والعملي.` },
            { id: 'item_1', title: demandTitle, type: 'demand', order: 2, status: 'completed', content: processedContent },
            { id: 'item_conclusion', title: 'خاتمة', type: 'conclusion', order: 3, status: 'completed', content: `من خلال ما سبق، يتضح أن موضوع "${topic}" يحتوي على جوانب عديدة ومتنوعة، وقد أثمرت الدراسة عن نتائج مهمة.` },
            { id: 'item_references', title: 'قائمة المصادر والمراجع', type: 'references', order: 4, status: 'completed', content: globalSources.map(s => s.text).join('\n') }
        ];

        const researchData = {
            title: demandTitle,
            university: 'جامعة تجريبية', faculty: 'الكلية التجريبية', department: 'القسم التجريبي',
            doctorName: 'د. التجريبي', students: ['طالب تجريبي'],
            methodology: { problemStatement: 'ما هو مفهوم ' + topic + '؟', globalSources },
            plan: fullPlan
        };

        const buffer = await generateWordDoc(researchData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(demandTitle)}.docx`);
        res.send(buffer);
    } catch (error: any) {
        console.error('Error in generateSingleDemand:', error);
        res.status(500).json({ message: error.message || 'حدث خطأ أثناء توليد المطلب' });
    }
};

// ============================================================
// 🐛 نسخة تصحيح مبسّطة: تُظهر الخطة المولّدة عبر المزوّد الحالي
// ============================================================
export const generateResearchDebug = async (req: any, res: Response) => {
    try {
        const { title, faculty = 'غير محدد', department = 'غير محدد', sectionsCount = 2, demandsPerSection = 2 } = req.body;
        const { problemStatement, globalSources, finalPlan } = await buildResearchPlan({
            title, faculty, department, sectionsCount, demandsPerSection
        });
        res.status(200).json({
            success: true,
            provider: getActiveProvider(),
            steps: {
                step1_input: { title, faculty, department },
                step2_problemStatement: problemStatement,
                step3_globalSourcesCount: globalSources.length,
                step4_flatPlan: finalPlan
            }
        });
    } catch (error: any) {
        console.error('Error in generateResearchDebug:', error);
        res.status(500).json({ success: false, error: error.message, stack: error.stack });
    }
};
