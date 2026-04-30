import { 
    Document, 
    Packer, 
    Paragraph, 
    TextRun, 
    AlignmentType, 
    HeadingLevel, 
    PageBreak
} from "docx";

export async function generateWordDoc(research: any): Promise<Buffer> {
    const paragraphs: Paragraph[] = [];

    // --- 1. صفحة الغلاف ---
    const coverPage = [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 800, after: 400 },
            children: [
                new TextRun({ text: "الجمهورية الجزائرية الديمقراطية الشعبية", bold: true, size: 32 }),
                new TextRun({ text: `\nوزارة التعليم العالي والبحث العلمي`, size: 28, break: 1 }),
                new TextRun({ text: `\n${research.university || "اسم الجامعة"}`, size: 28, bold: true, break: 1 }),
                new TextRun({ text: `\n${research.faculty || "الكلية"} - ${research.department || "القسم"}`, size: 26, break: 1 }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1200, after: 1200 },
            children: [
                new TextRun({ text: "تقرير بحث حول:", size: 32, italics: true }), // تم تصحيح italics
                new TextRun({ text: `\n${research.title}`, size: 48, bold: true, color: "2E74B5", break: 1 }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 1000 },
            children: [
                new TextRun({ text: `إعداد الطلبة: ${research.students?.join(' / ') || '................'}`, size: 28, bold: true }),
                new TextRun({ text: `\nتحت إشراف الدكتور: ${research.doctorName || '................'}`, size: 28, bold: true, break: 1 }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1500 },
            children: [
                new TextRun({ text: `السنة الجامعية: ${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`, size: 24 }),
            ],
        }),
        new Paragraph({ children: [new PageBreak()] })
    ];
    paragraphs.push(...coverPage);

    // --- 2. صفحة خطة البحث ---
    paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        spacing: { before: 400, after: 600 },
        children: [
            new TextRun({ text: "خطة البحث", bold: true, size: 36, font: "Sakkal Majalla", underline: {} })
        ],
    }));

    // تصفية وترتيب عناصر الخطة بشكل دقيق لمنع التكرار
    const planItems = research.plan
        .filter((item: any) => ['introduction', 'section', 'demand', 'conclusion', 'references'].includes(item.type))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    for (const item of planItems) {
        let textStyle = { size: 28, font: "Sakkal Majalla", bold: false };
        let indentValue = 0;

        if (item.type === 'section') {
            textStyle.bold = true;
            textStyle.size = 30;
            indentValue = 0;
        } else if (item.type === 'demand') {
            indentValue = 720; // إزاحة للمطالب
            textStyle.size = 26;
        } else {
            textStyle.bold = true;
            textStyle.size = 28;
        }

        paragraphs.push(new Paragraph({
            alignment: AlignmentType.RIGHT,
            bidirectional: true,
            spacing: { before: 240, after: 120 },
            indent: { right: indentValue },
            children: [
                new TextRun({ 
                    text: item.type === 'demand' ? `• ${item.title}` : item.title, 
                    ...textStyle 
                })
            ]
        }));
    }
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

    // --- 3. محتوى البحث ---
    const sortedPlan = research.plan.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

    for (const item of sortedPlan) {
        // العناوين الكبرى (مقدمة، مباحث، خاتمة، مراجع)
        if (['introduction', 'section', 'conclusion', 'references'].includes(item.type)) {
            // المباحث والمراجع تبدأ في صفحة جديدة
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
        }
        // المطالب (تظهر كعناوين جانبية غامقة)
        else if (item.type === 'demand') {
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
        
        // طباعة الإشكالية إذا كانت موجودة كعنصر مستقل
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

        // طباعة المحتوى
        if (item.content && item.type !== 'references' && item.type !== 'section') {
            const textLines = item.content.split('\n');
            for (const line of textLines) {
                if (!line.trim()) continue;
                paragraphs.push(new Paragraph({
                    bidirectional: true,
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { line: 360, before: 120, after: 120 },
                    children: [
                        new TextRun({ text: line.trim(), size: 28, font: "Sakkal Majalla" })
                    ],
                }));
            }
        }
        
        // معالجة خاصة للمراجع
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
            children: paragraphs,
        }],
    });

    return await Packer.toBuffer(doc);
}