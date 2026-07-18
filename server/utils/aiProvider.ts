// ============================================================
// 🧠 طبقة مزوّد الذكاء الاصطناعي الموحّدة (Unified AI Provider Layer)
// ------------------------------------------------------------
// الهدف: فصل منطق "من يولّد النص" عن منطق "كيف نبني الخطة ونسطّحها ونحفظها".
// كل باقي الكود (التسطيح، التهميش، الحفظ في قاعدة البيانات، توليد Word)
// يستدعي هذه الدوال فقط، فلا يهمّه هل المزوّد Claude أم Gemini.
//
// 🔀 كيفية التبديل بين المزوّدين (بدون لمس أي منطق آخر):
//   - افتراضياً المزوّد هو Claude (حسب قرار المشروع).
//   - لتفعيل Gemini بدلاً منه: ضع في ملف .env
//        AI_PROVIDER=gemini
//   - Claude يحتاج: ANTHROPIC_API_KEY (ونموذج اختياري CLAUDE_MODEL)
//   - Gemini يحتاج: GEMINI_API_KEY (ونموذج اختياري GEMINI_MODEL)
//   المفاتيح تُحمَّل تحميلاً كسولاً (Lazy) فلا نتعطّل عند الإقلاع إن غاب مفتاح
//   المزوّد غير المستخدَم.
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';

export type AiProvider = 'claude' | 'gemini';

/** يحدّد المزوّد الحالي من متغيّر البيئة (Claude هو الافتراضي). */
export const getActiveProvider = (): AiProvider =>
    (process.env.AI_PROVIDER || 'claude').trim().toLowerCase() === 'gemini' ? 'gemini' : 'claude';

// دالة مساعدة للانتظار (تُستخدم في إعادة المحاولة)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ============================================================
// 🔎 تحليل JSON قوي: يحاول التحليل المباشر، ثم استخراج أول كتلة JSON من النص
// (يعالج حالة أن يلفّ النموذج الرد بأسوار ```json أو بنص تمهيدي)
// ============================================================
export const safeJsonParse = (text: string): any => {
    const cleaned = String(text || '')
        .replace(/^﻿/, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const match = cleaned.match(/[{[][\s\S]*[}\]]/);
        if (match) {
            try {
                return JSON.parse(match[0]);
            } catch {
                /* fallthrough */
            }
        }
        throw new Error('تعذّر تحليل JSON من رد نموذج الذكاء الاصطناعي');
    }
};

// ============================================================
// 🟣 Claude (Anthropic) عبر endpoint الرسمي /v1/messages
// ------------------------------------------------------------
// نستخدم HTTP المباشر (fetch المدمج في Node 18+) بدل SDK لتفادي إضافة
// اعتمادية جديدة، وتماشياً مع طلب استخدام endpoint الرسمي /v1/messages.
// ============================================================
const ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-opus-4-8';

let anthropicApiKey: string | null = null;
const getAnthropicKey = (): string => {
    if (!anthropicApiKey) {
        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) {
            throw new Error(
                '❌ مفتاح Claude API غير موجود!\n' +
                'أضفه في ملف .env:\nANTHROPIC_API_KEY=sk-ant-...'
            );
        }
        anthropicApiKey = key;
    }
    return anthropicApiKey;
};

interface ClaudeCallOptions {
    system: string;
    user: string;
    maxTokens?: number;
    /** لو true نضيف تلميحاً صريحاً بأن الرد يجب أن يكون JSON خالصاً */
    expectJson?: boolean;
}

/**
 * 📡 استدعاء Claude مع إعادة محاولة تلقائية على الأخطاء المؤقتة (429/5xx)
 * يعيد نص الرد السردي فقط (يجمع كتل text ويتجاهل كتل thinking إن وُجدت).
 */
async function callClaude(opts: ClaudeCallOptions, maxRetries = 3): Promise<string> {
    const apiKey = getAnthropicKey();

    // نفصل بوضوح بين "توجيه الأسلوب" (system) و"متطلبات JSON" (نضيفها لرسالة المستخدم)
    const userContent = opts.expectJson
        ? `${opts.user}\n\nمهم جداً: أعد كائن JSON صالحاً واحداً فقط دون أي نص خارجه ودون أسوار ترميز (\`\`\`).`
        : opts.user;

    const body: any = {
        model: CLAUDE_MODEL,
        max_tokens: opts.maxTokens ?? 4096,
        system: opts.system,
        messages: [{ role: 'user', content: userContent }],
    };

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(ANTHROPIC_ENDPOINT, {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errText = await response.text();
                // 429 و5xx قابلة لإعادة المحاولة، البقية أخطاء نهائية
                if ((response.status === 429 || response.status >= 500) && attempt < maxRetries - 1) {
                    const waitTime = (attempt + 1) * 4000;
                    console.warn(`⚠️ Claude ${response.status}: إعادة المحاولة بعد ${waitTime / 1000}ث...`);
                    await delay(waitTime);
                    continue;
                }
                throw new Error(`Claude API error ${response.status}: ${errText}`);
            }

            const data: any = await response.json();

            // safety classifier قد يرفض الطلب (HTTP 200 مع stop_reason=refusal)
            if (data.stop_reason === 'refusal') {
                throw new Error('🚫 رفض نموذج Claude توليد هذا المحتوى (refusal). راجع صياغة الطلب.');
            }

            const text = Array.isArray(data.content)
                ? data.content
                    .filter((block: any) => block?.type === 'text')
                    .map((block: any) => block.text)
                    .join('')
                    .trim()
                : '';

            if (!text) throw new Error('Claude أعاد رداً فارغاً');
            return text;
        } catch (error: any) {
            lastError = error;
            // أخطاء الشبكة قابلة لإعادة المحاولة
            if (attempt < maxRetries - 1 && /fetch failed|network|ECONN|ETIMEDOUT/i.test(error?.message || '')) {
                await delay((attempt + 1) * 4000);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// ============================================================
// 🔵 Gemini (Google) — يبقى كخيار احتياطي عبر متغيّر البيئة
// ============================================================
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let genAI: GoogleGenerativeAI | null = null;
const getGeminiModel = () => {
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
    return genAI.getGenerativeModel({ model: GEMINI_MODEL });
};

async function callGemini(opts: ClaudeCallOptions, maxRetries = 3): Promise<string> {
    const model = getGeminiModel();
    // Gemini لا يملك حقل system منفصلاً في هذا الاستخدام، فندمج التوجيه مع الطلب
    // (نفس السلوك السابق تماماً حفاظاً على التوافق)
    const fullPrompt = `${opts.system}\n\n${opts.user}`;

    let lastError: any;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                generationConfig: opts.expectJson
                    ? { responseMimeType: 'application/json', temperature: 0.7 }
                    : { temperature: 0.6 },
            } as any);

            let text = result.response.text() || '';
            if (text.includes('</think>')) {
                text = text.split('</think>').pop()?.trim() || text;
            }
            if (!text) throw new Error('Gemini أعاد رداً فارغاً');
            return text.trim();
        } catch (error: any) {
            lastError = error;
            if ((error.message?.includes('429') || error.message?.includes('Quota exceeded')) && attempt < maxRetries - 1) {
                const waitTime = (attempt + 1) * 5000;
                console.warn(`⚠️ Gemini quota: إعادة المحاولة بعد ${waitTime / 1000}ث...`);
                await delay(waitTime);
                continue;
            }
            throw error;
        }
    }
    throw lastError;
}

// ============================================================
// 🎯 الواجهة العامة الموحّدة — هذا ما يستدعيه بقية الكود
// ============================================================

/**
 * توليد نص سردي (للمقدمة/المطلب/الخاتمة).
 * @param system توجيه الأسلوب والقواعد الصارمة (systemRole)
 * @param user البيانات المتغيّرة للعنصر الحالي
 */
export async function generateNarrative(system: string, user: string, maxTokens = 4096): Promise<string> {
    const provider = getActiveProvider();
    const raw = provider === 'gemini'
        ? await callGemini({ system, user, maxTokens, expectJson: false })
        : await callClaude({ system, user, maxTokens, expectJson: false });

    // تنظيف موحّد: إزالة أي كتلة تفكير محتملة
    let text = raw;
    if (text.includes('</think>')) {
        text = text.split('</think>').pop()?.trim() || text;
    }
    return text.trim();
}

/**
 * توليد كائن JSON منظّم (لبناء الخطة والمصادر والنقاط الفرعية) وإعادته مُحلَّلاً.
 * يُلزم كل مزوّد بإخراج JSON صالح ثم يحلّله عبر safeJsonParse.
 * @param system توجيه دور المهندس الأكاديمي
 * @param user وصف الهيكل المطلوب مع الـ schema الصريح
 */
export async function generateStructured(system: string, user: string, maxTokens = 8192): Promise<any> {
    const provider = getActiveProvider();
    const raw = provider === 'gemini'
        ? await callGemini({ system, user, maxTokens, expectJson: true })
        : await callClaude({ system, user, maxTokens, expectJson: true });

    // سجل الرد الخام في وضع التطوير فقط لتسهيل تتبّع أي انحراف عن الـ schema
    if (process.env.NODE_ENV !== 'production') {
        console.log(`📤 [${provider}] رد الخطة الخام:`, String(raw).slice(0, 500));
    }

    return safeJsonParse(raw);
}
