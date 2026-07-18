
import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    PageBreak 
} from "docx";

// ============================================================
// 📊 نماذج البيانات (Interfaces)
// ============================================================
interface GlobalSource {
    id?: string;
    text?: string;
}

interface PlanItem {
    id: string;
    title?: string;
    type: string;
    order?: number;
    status?: string;
    content?: string;
    subPoints?: any[];
}

interface ResearchData {
    title?: string;
    university?: string;
    faculty?: string;
    department?: string;
    doctorName?: string;
    students?: string[];
    methodology?: {
        problemStatement?: string;
        globalSources?: GlobalSource[];
    };
    plan: PlanItem[];
}

// ============================================================
// 🔧 دالة استخراج وتحويل التهميشات من النص
// ============================================================
export function processFootnotes(text: string, sourcesMap: { [key: string]: string }) {
    const footnoteList: string[] = [];
    const footnoteCounterMap: { [key: string]: number } = {};
    let currentCounter = 1;

    const processedText = text.replace(/\{\{footnote: ([^}]+)\}\}/g, (_, sourceId) => {
        const sourceText = sourcesMap[sourceId] || "مرجع غير محدد";
        
        if (footnoteCounterMap[sourceText]) {
            return `[${footnoteCounterMap[sourceText]}]`;
        } else {
            footnoteCounterMap[sourceText] = currentCounter;
            footnoteList.push(sourceText);
            return `[${currentCounter++}]`;
        }
    });

    return { processedText, footnoteList };
}

// ============================================================
// 📄 دالة إنشاء صفحة الغلاف
// ============================================================
export function createCoverPage(data: ResearchData): Paragraph[] {
    const FONT = "Sakkal Majalla";
    const PLACEHOLDER = "................";
    const currentYear = new Date().getFullYear();

    // بدائل نقطية أنيقة بدل ظهور "undefined" أو فراغات مكسورة
    const university = (data.university || "").trim() || "اسم الجامعة";
    const faculty = (data.faculty || "").trim();
    const department = (data.department || "").trim();
    // نبني سطر الكلية/القسم بمرونة حتى لو غاب أحدهما
    const facultyLine = [faculty, department].filter(Boolean).join("  -  ") || "الكلية - القسم";
    const students = (data.students || []).filter(s => s && s.trim());
    const studentsText = students.length ? students.join("  /  ") : PLACEHOLDER;
    const doctorText = (data.doctorName || "").trim() || PLACEHOLDER;
    const titleText = (data.title || "").trim() || "عنوان البحث";

    return [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 600, after: 300, line: 360 },
            children: [
                new TextRun({ text: "الجمهورية الجزائرية الديمقراطية الشعبية", bold: true, size: 32, font: FONT }),
                new TextRun({ text: "وزارة التعليم العالي والبحث العلمي", size: 28, font: FONT, break: 1 }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 300, after: 200, line: 360 },
            children: [
                new TextRun({ text: university, size: 30, bold: true, font: FONT }),
                new TextRun({ text: facultyLine, size: 26, font: FONT, break: 1 }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 1400, after: 200 },
            children: [
                new TextRun({ text: "تقرير بحث حول:", size: 30, italics: true, font: FONT }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 200, after: 1400, line: 400 },
            children: [
                new TextRun({ text: titleText, size: 48, bold: true, color: "2E74B5", font: FONT }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 800, after: 120, line: 360 },
            children: [
                new TextRun({ text: `إعداد الطلبة:  ${studentsText}`, size: 28, bold: true, font: FONT }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 120, after: 800, line: 360 },
            children: [
                new TextRun({ text: `تحت إشراف الدكتور:  ${doctorText}`, size: 28, bold: true, font: FONT }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            bidirectional: true,
            spacing: { before: 1200 },
            children: [
                new TextRun({ text: `السنة الجامعية:  ${currentYear} / ${currentYear + 1}`, size: 24, font: FONT }),
            ],
        }),
        new Paragraph({ children: [new PageBreak()] })
    ];
}

// ============================================================
// 📝 دالة إنشاء محتوى البحث مع التهميشات
// ============================================================
export function createResearchContent(data: ResearchData): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    const sourcesMap: { [key: string]: string } = {};
    
    if (data.methodology?.globalSources) {
        data.methodology.globalSources.forEach(source => {
            sourcesMap[source.id] = source.text;
        });
    }

    let allFootnotes: string[] = [];

    const sortedPlan = data.plan.sort((a, b) => (a.order || 0) - (b.order || 0));

    for (const item of sortedPlan) {
        if (['introduction', 'section', 'conclusion', 'references'].includes(item.type)) {
            if (item.type === 'section' || item.type === 'references') {
                paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
            }

            paragraphs.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                bidirectional: true,
                spacing: { before: 600, after: 400 },
                children: [
                    new TextRun({ 
                        text: item.title, 
                        bold: true, 
                        size: 32, 
                        font: "Sakkal Majalla",
                        color: "000000"
                    })
                ]
            }));
        } else if (item.type === 'demand') {
            paragraphs.push(new Paragraph({
                alignment: AlignmentType.RIGHT,
                bidirectional: true,
                spacing: { before: 400, after: 200 },
                children: [
                    new TextRun({ 
                        text: item.title, 
                        bold: true, 
                        size: 28, 
                        font: "Sakkal Majalla",
                        underline: {}
                    })
                ]
            }));
        }
        
        if (item.type === 'problem_statement') {
            paragraphs.push(new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 200, after: 200 },
                children: [
                    new TextRun({ text: "إشكالية البحث: ", bold: true, size: 28, font: "Sakkal Majalla" }),
                    new TextRun({ text: item.content || item.title, size: 28, italics: true, font: "Sakkal Majalla" }),
                ]
            }));
        }

        if (item.content && item.type !== 'references' && item.type !== 'section') {
            const { processedText, footnoteList } = processFootnotes(item.content, sourcesMap);
            allFootnotes = [...allFootnotes, ...footnoteList.filter(f => !allFootnotes.includes(f))];
            
            const textLines = processedText.split('\n');
            for (const line of textLines) {
                if (!line.trim()) continue;
                paragraphs.push(new Paragraph({
                    bidirectional: true,
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { line: 360, before: 120, after: 120 },
                    children: [new TextRun({ text: line.trim(), size: 28, font: "Sakkal Majalla" })]
                }));
            }
        }
        
        if (item.type === 'references' && item.content) {
            const sources = item.content.split('\n') || [];
            sources.forEach((src: string) => {
                if (src.trim()) {
                    paragraphs.push(new Paragraph({
                        bidirectional: true,
                        alignment: AlignmentType.RIGHT,
                        spacing: { before: 150 },
                        indent: { right: 400, hanging: 400 },
                        children: [new TextRun({ text: src.trim(), size: 26, font: "Sakkal Majalla" })]
                    }));
                }
            });
        }
    }

    // 📌 إضافة قسم التهميشات في النهاية دائماً
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { before: 600, after: 400 },
        children: [new TextRun({ 
            text: "التهميشات", 
            bold: true, 
            size: 36, 
            font: "Sakkal Majalla",
            color: "2E74B5" 
        })]
    }));

    if (allFootnotes.length > 0) {
        allFootnotes.forEach((footnoteText, index) => {
            paragraphs.push(new Paragraph({
                bidirectional: true,
                alignment: AlignmentType.RIGHT,
                spacing: { before: 120, after: 120 },
                indent: { right: 400 },
                children: [
                    new TextRun({ text: `[${index + 1}] `, bold: true, size: 26, font: "Sakkal Majalla" }),
                    new TextRun({ text: footnoteText, size: 26, font: "Sakkal Majalla" })
                ]
            }));
        });
    } else {
        // إضافة تهميش افتراضي إذا لم يكن هناك أي تهميشات
        const defaultSource = data.methodology?.globalSources?.[0];
        paragraphs.push(new Paragraph({
            bidirectional: true,
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 120 },
            indent: { right: 400 },
            children: [
                new TextRun({ text: "[1] ", bold: true, size: 26, font: "Sakkal Majalla" }),
                new TextRun({ text: defaultSource?.text || "اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، 2025.", size: 26, font: "Sakkal Majalla" })
            ]
        }));
    }

    return paragraphs;
}

// ============================================================
// 🎯 الدالة الرئيسية لتوليد ملف الوورد الكامل
// ============================================================
export async function generateAdvancedWordDoc(data: ResearchData): Promise<Buffer> {
    const coverPage = createCoverPage(data);
    const researchContent = createResearchContent(data);
    const allParagraphs = [...coverPage, ...researchContent];

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: "Sakkal Majalla", size: 28 },
                }
            }
        },
        sections: [{
            properties: {
                page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
            },
            children: allParagraphs,
        }],
    });

    return await Packer.toBuffer(doc);
}
