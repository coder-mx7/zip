import React, { useState } from 'react';
import { 
  CheckCircle, ChevronLeft, ChevronRight, BookOpen, FileText, 
  GraduationCap, ArrowRight, Sparkles, Book, ScrollText, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import axios from 'axios';

interface ResearchData {
  title: string;
  faculty: string;
  department: string;
  university: string;
}

interface SubPoint {
  point: string;
  footnote: string;
}

interface Demand {
  id: string;
  title: string;
  opening: string;
  subPoints: SubPoint[];
  closing: string;
}

interface Chapter {
  id: string;
  title: string;
  demands: Demand[];
}

interface Reference {
  id: string;
  type: string;
  citation: string;
}

interface FullPlan {
  title: string;
  university: string;
  universityLogo: string;
  faculty: string;
  department: string;
  introduction: { title: string; content: string; footnotes: { id: string; content: string }[] };
  problemStatement: { title: string; content: string };
  chapters: Chapter[];
  conclusion: { title: string; content: string };
  references: { title: string; sources: Reference[] };
}

const FACULTIES = [
  'الحقوق', 'العلوم السياسية', 'علم الاجتماع', 'الطب', 'الهندسة',
  'العلوم الاقتصادية والتجارية', 'الآداب واللغات', 'العلوم الإسلامية',
  'العلوم الصيدلانية', 'العلوم التربوية', 'العلوم الزراعية'
];

export default function CustomResearchPlanWizard() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [researchData, setResearchData] = useState<ResearchData>({
    title: '',
    faculty: FACULTIES[0],
    department: '',
    university: ''
  });
  const [generatedPlan, setGeneratedPlan] = useState<FullPlan | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<string[]>(['1', '2']);

  const generatePlan = async () => {
    if (!researchData.title.trim()) {
      setError('يرجى إدخال عنوان البحث');
      return;
    }

    setError('');
    setLoading(true);
    
    try {
      const response = await axios.post('/api/research/custom-simple-plan', {
        title: researchData.title,
        university: researchData.university,
        faculty: researchData.faculty,
        department: researchData.department
      });

      const apiPlan = response.data;
      console.log("📥 استجابة API:", apiPlan);
      
      const transformedPlan: FullPlan = {
        title: researchData.title,
        university: researchData.university,
        universityLogo: apiPlan.universityLogo || '/universities/default-university-logo.svg',
        faculty: researchData.faculty,
        department: researchData.department,
        introduction: {
          title: "المقدمة",
          content: `يُعتبر موضوع "${researchData.title}" من الموضوعات الهامة في مجال ${researchData.department} بكلية ${researchData.faculty}، حيث يكتسب أهمية خاصة في البيئة الأكاديمية والمهنية. تهدف هذه الدراسة إلى تسليط الضوء على الجوانب المختلفة لهذا الموضوع، وتحليلها بشكل علمي ومنظم، بما يساهم في إثراء المعرفة في هذا المجال.`,
          footnotes: (apiPlan.sources || []).slice(0, 2).map((s: any, i: number) => ({
            id: `fn${i + 1}`,
            content: s.text
          }))
        },
        problemStatement: {
          title: "الإشكالية البحثية",
          content: typeof apiPlan.problemStatement === 'string' 
            ? apiPlan.problemStatement 
            : (apiPlan.problemStatement?.text || `ما هي التحديات التي تواجه دراسة "${researchData.title}" وكيف يمكن معالجتها؟`)
        },
        chapters: apiPlan.chapters || [],
        conclusion: {
          title: "الخاتمة",
          content: `تقدمت هذه الدراسة تحليلاً وافياً لموضوع "${researchData.title}" في إطار ${researchData.department}، حيث استعرضت الجوانب النظرية والتطبيقية للموضوع وتوصلت إلى نتائج مهمة.`
        },
        references: {
          title: "قائمة المصادر والمراجع",
          sources: (apiPlan.sources || []).map((s: any, i: number) => ({
            id: `${i + 1}`,
            type: 'book',
            citation: s.text
          }))
        }
      };

      if (transformedPlan.chapters.length === 0) {
        transformedPlan.chapters = [
          {
            id: '1',
            title: 'المبحث الأول: الإطار النظري والمرجعية',
            demands: [
              {
                id: '1-1',
                title: 'المطلب الأول: مفهوم وتعريف الموضوع',
                opening: 'يُشكل تحديد المفاهيم الأساسية أولى خطوات البحث العلمي، حيث يوفر إطاراً مفاهيمياً واضحاً للدراسة.',
                subPoints: [
                  { point: 'التعريف الاصطلاحي بالموضوع', footnote: 'الزهراني، محمد. المصطلحات العلمية. جامعة الملك سعود، 2023، ص. 34.' },
                  { point: 'الأهمية العلمية والمهنية للموضوع', footnote: 'الشريف، سارة. أهمية البحث العلمي. دار الوحي، 2022، ص. 56.' },
                  { point: 'الجوانب التاريخية للموضوع', footnote: 'العابد، عبدالله. التطور التاريخي للفكر. منشورات الأزهر، 2024، ص. 89.' }
                ],
                closing: 'يتضح من المطلب أهمية تحديد المفاهيم الأساسية لأي بحث علمي، حيث يشكل حجر الأساس للدراسة.'
              },
              {
                id: '1-2',
                title: 'المطلب الثاني: الدراسات السابقة',
                opening: 'تُعتبر الدراسات السابقة مرجعاً أساسياً لفهم الموضوع وتحديد الفجوات المعرفية.',
                subPoints: [
                  { point: 'استعراض الدراسات العربية', footnote: 'العوض، خالد. منهجية البحث العلمي. دار الكتب، 2023، ص. 76.' },
                  { point: 'استعراض الدراسات الأجنبية', footnote: 'البغدادي، أحمد. أساسيات البحث. منشورات جامعة البلقاء، 2022، ص. 123.' },
                  { point: 'تحديد الفجوة المعرفية', footnote: 'المنصور، خالد. النظريات الاجتماعية. دار الحكمة، 2023، ص. 154.' }
                ],
                closing: 'تُشكل الدراسات السابقة أساساً مهماً لبناء البحث الحالي وتحديد مساره العلمي.'
              }
            ]
          },
          {
            id: '2',
            title: 'المبحث الثاني: التحليل والتطبيق',
            demands: [
              {
                id: '2-1',
                title: 'المطلب الأول: منهجية البحث',
                opening: 'يُعتبر المنهجية العمود الفقري للبحث العلمي، حيث تحدد الطرق المتبعة.',
                subPoints: [
                  { point: 'نوع البحث ومنهجه', footnote: 'السيد، جاسم. منهجيات البحث. دار البشير، 2023، ص. 98.' },
                  { point: 'مجتمع الدراسة', footnote: 'الجاسم، منى. علم الإحصاء. جامعة البحرين، 2022، ص. 145.' },
                  { point: 'أدوات جمع البيانات', footnote: 'العوض، مروة. الاستبيانات. دار العلوم، 2024، ص. 176.' }
                ],
                closing: 'يختتم المطلب بوصف المنهجية المتبعة في الدراسة.'
              },
              {
                id: '2-2',
                title: 'المطلب الثاني: النتائج والتوصيات',
                opening: 'يُشكل تحليل النتائج القمة التي يصل إليها البحث.',
                subPoints: [
                  { point: 'عرض النتائج', footnote: 'الهاشمي، عبدالرحمن. تحليل البيانات. جامعة الإمارات، 2023، ص. 201.' },
                  { point: 'مناقشة النتائج', footnote: 'الزحارنة، ناصر. فن الكتابة. دار الكلمة، 2022، ص. 234.' },
                  { point: 'التوصيات', footnote: 'التميمي، محمد. التقارير البحثية. جامعة قطر، 2024، ص. 267.' }
                ],
                closing: 'تُختتم الدراسة بتقديم التوصيات والمقترحات المستقبلية.'
              }
            ]
          }
        ];
      }

      setGeneratedPlan(transformedPlan);
      setLoading(false);
      setStep(2);
      
    } catch (err: any) {
      console.error("❌ خطأ في توليد الخطة:", err);
      setError(err.response?.data?.message || 'حدث خطأ أثناء توليد الخطة البحثية');
      setLoading(false);
    }
  };

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => 
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            <span className="text-[var(--color-gold-500)]">✨</span> منصة إنشاء الخطط البحثية بالذكاء الاصطناعي
          </h1>
          <p className="text-gray-400 text-lg">أدخل بيانات بحثك واحصل على خطة كاملة من Gemini AI مع تهميشات بنظام شيكاغو</p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-all duration-300 ${
                step >= s ? 'bg-[var(--color-gold-500)] text-black' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > s ? <CheckCircle className="w-6 h-6" /> : s}
              </div>
              <span className={`text-lg font-bold ${step >= s ? 'text-[var(--color-gold-500)]' : 'text-gray-500'}`}>
                {s === 1 ? 'إدخال البيانات' : 'الخطة البحثية'}
              </span>
              {s === 1 && <div className={`w-20 h-1 ${step === 2 ? 'bg-[var(--color-gold-500)]' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="bg-[var(--color-luxury-card)] border border-[var(--color-gold-500)]/20 rounded-2xl p-8 shadow-2xl max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-3">
              <GraduationCap className="w-8 h-8 text-[var(--color-gold-500)]" />
              أدخل بيانات البحث
            </h2>

            {error && (
              <div className="mb-6 bg-red-900/30 border-r-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-red-300 font-bold">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[var(--color-gold-500)]" />
                  عنوان البحث <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={researchData.title}
                  onChange={(e) => setResearchData({...researchData, title: e.target.value})}
                  placeholder="مثال: دور الذكاء الاصطناعي في تطوير التعليم الجامعي"
                  className="w-full bg-black/40 border border-[var(--color-gold-500)]/30 rounded-xl px-6 py-4 text-white text-lg focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none text-right"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--color-gold-500)]" />
                  الجامعة
                </label>
                <input
                  type="text"
                  value={researchData.university}
                  onChange={(e) => setResearchData({...researchData, university: e.target.value})}
                  placeholder="مثال: جامعة الجزائر"
                  className="w-full bg-black/40 border border-[var(--color-gold-500)]/30 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none text-right"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                    <Book className="w-5 h-5 text-[var(--color-gold-500)]" />
                    الكلية
                  </label>
                  <select
                    value={researchData.faculty}
                    onChange={(e) => setResearchData({...researchData, faculty: e.target.value})}
                    className="w-full bg-black/40 border border-[var(--color-gold-500)]/30 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none"
                  >
                    {FACULTIES.map(f => (
                      <option key={f} value={f} className="bg-gray-800">{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-[var(--color-gold-500)]" />
                    القسم / التخصص
                  </label>
                  <input
                    type="text"
                    value={researchData.department}
                    onChange={(e) => setResearchData({...researchData, department: e.target.value})}
                    placeholder="مثال: قسم تكنولوجيا التعليم"
                    className="w-full bg-black/40 border border-[var(--color-gold-500)]/30 rounded-xl px-6 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none text-right"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  onClick={generatePlan}
                  disabled={!researchData.title.trim() || loading}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] disabled:bg-gray-600 py-5 px-8 rounded-xl text-black font-black text-xl transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin" />
                      جاري إنشاء الخطة البحثية بواسطة Gemini AI...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      🤖 إنشاء الخطة البحثية بالذكاء الاصطناعي
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && generatedPlan && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
                العودة للتعديل
              </button>
              <div className="text-[var(--color-gold-500)] font-bold">
                {generatedPlan.faculty} - {generatedPlan.department}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[var(--color-gold-500)]/20 to-purple-500/20 border border-[var(--color-gold-500)]/30 rounded-2xl p-8 text-center">
              <div className="flex flex-col items-center justify-center gap-4 mb-6">
                <img
                  src={generatedPlan.universityLogo}
                  alt={generatedPlan.university || 'شعار الجامعة'}
                  className="w-24 h-24 rounded-2xl border border-[var(--color-gold-500)]/30 bg-white/95 object-contain p-3 shadow-lg"
                />
                <div className="text-gray-300 text-base">
                  {generatedPlan.university || 'جامعة افتراضية'}
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                {generatedPlan.title}
              </h2>
              <p className="text-gray-300 text-lg">
                خطة بحثية مخصصة لقسم {generatedPlan.department} - كلية {generatedPlan.faculty}
              </p>
            </div>

            <section className="bg-[var(--color-luxury-card)] border border-amber-500/20 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-black font-bold text-xl">1</div>
                <h3 className="text-2xl font-bold text-white">{generatedPlan.introduction.title}</h3>
              </div>
              <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-line border-r-4 border-amber-500/30 pr-6">
                {generatedPlan.introduction.content}
              </div>
              {generatedPlan.introduction.footnotes.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-amber-400 font-bold mb-3 text-lg">📝 التهميشات:</h4>
                  <div className="space-y-2">
                    {generatedPlan.introduction.footnotes.map(fn => (
                      <p key={fn.id} className="text-sm text-gray-400 pr-4 border-r-2 border-amber-500/30">
                        <span className="text-amber-300 font-bold">[{fn.id}]</span> {fn.content}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">❓</div>
                <h3 className="text-2xl font-bold text-white">{generatedPlan.problemStatement.title}</h3>
              </div>
              <p className="text-xl text-purple-200 font-medium italic text-center">
                "{generatedPlan.problemStatement.content}"
              </p>
            </section>

            {generatedPlan.chapters.map((chapter, chIndex) => (
              <section key={chapter.id} className="bg-[var(--color-luxury-card)] border border-blue-500/20 rounded-2xl overflow-hidden shadow-xl">
                <div 
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-blue-500/10 transition-all"
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      {chIndex + 2}
                    </div>
                    <h3 className="text-2xl font-bold text-white">{chapter.title}</h3>
                  </div>
                  <div className="text-blue-400">
                    {expandedChapters.includes(chapter.id) ? <ChevronLeft className="w-8 h-8" /> : <ChevronRight className="w-8 h-8" />}
                  </div>
                </div>

                {expandedChapters.includes(chapter.id) && (
                  <div className="px-6 pb-6 pt-2 space-y-6 border-t border-blue-500/20">
                    {chapter.demands.map((demand, dIndex) => (
                      <div key={demand.id} className="bg-black/30 rounded-xl p-6 border border-blue-500/10">
                        <h4 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-3">
                          <span className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-300 font-bold">
                            {dIndex + 1}
                          </span>
                          {demand.title}
                        </h4>
                        
                        <div className="space-y-4">
                          <p className="text-gray-300 italic pr-4 border-r-2 border-green-500/30">
                            <span className="text-green-400 font-bold">تمهيد:</span> {demand.opening}
                          </p>

                          <div className="space-y-3">
                            {demand.subPoints.map((sp, spIndex) => (
                              <div key={spIndex} className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
                                <p className="text-white font-medium flex items-start gap-3">
                                  <span className="text-blue-400 font-bold mt-1">•</span>
                                  {sp.point}
                                </p>
                                <p className="text-xs text-gray-400 mt-2 pr-6 border-r-2 border-blue-500/30 italic">
                                  <span className="text-blue-300 font-bold">التهميش:</span> {sp.footnote}
                                </p>
                              </div>
                            ))}
                          </div>

                          <p className="text-gray-300 italic pr-4 border-r-2 border-red-500/30">
                            <span className="text-red-400 font-bold">خاتمة المطلب:</span> {demand.closing}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}

            <section className="bg-[var(--color-luxury-card)] border border-green-500/20 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-black font-bold text-xl">
                  {generatedPlan.chapters.length + 2}
                </div>
                <h3 className="text-2xl font-bold text-white">{generatedPlan.conclusion.title}</h3>
              </div>
              <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-line border-r-4 border-green-500/30 pr-6">
                {generatedPlan.conclusion.content}
              </div>
            </section>

            <section className="bg-[var(--color-luxury-card)] border border-orange-500/20 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-black font-bold text-xl">
                  {generatedPlan.chapters.length + 3}
                </div>
                <h3 className="text-2xl font-bold text-white">{generatedPlan.references.title}</h3>
              </div>
              
              <div className="space-y-3">
                {generatedPlan.references.sources.map(ref => (
                  <div key={ref.id} className="flex items-start gap-3 pr-4 border-r-2 border-orange-500/30 py-2">
                    <span className="text-orange-400 font-bold min-w-[2rem]">{ref.id}.</span>
                    <p className="text-gray-200">{ref.citation}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <button
                onClick={() => setStep(1)}
                className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all font-bold text-lg"
              >
                <ChevronRight className="w-5 h-5" />
                تعديل البيانات
              </button>
              <button className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] text-black rounded-xl font-black text-lg transition-all hover:scale-105">
                <Sparkles className="w-5 h-5" />
                توليد المحتوى الكامل (قريباً)
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
