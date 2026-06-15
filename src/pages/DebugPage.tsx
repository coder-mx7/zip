
import React, { useState } from 'react';
import axios from 'axios';
import { Loader2, FileText, Plus, Trash2, GraduationCap, School, BookOpen } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';

type Mode = 'single' | 'full';

export default function DebugPage() {
  const [mode, setMode] = useState<Mode>('single');

  // Single Demand State
  const [demandTitle, setDemandTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subPoints, setSubPoints] = useState<string[]>(['']);
  const [sourceText, setSourceText] = useState('اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، 2025.');

  // Full Research State
  const [fullTitle, setFullTitle] = useState('');
  const [fullUniversity, setFullUniversity] = useState('');
  const [fullFaculty, setFullFaculty] = useState('الحقوق');
  const [fullDepartment, setFullDepartment] = useState('');
  const [fullLevel, setFullLevel] = useState('ليسانس');
  const [fullDoctorName, setFullDoctorName] = useState('');
  const [fullStudents, setFullStudents] = useState<string[]>(['']);
  const [fullCitationStyle, setFullCitationStyle] = useState('APA');

  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [error, setError] = useState('');

  const handleAddSubPoint = () => setSubPoints([...subPoints, '']);
  const handleRemoveSubPoint = (index: number) => {
    if (subPoints.length > 1) setSubPoints(subPoints.filter((_, i) => i !== index));
  };
  const handleSubPointChange = (index: number, value: string) => {
    const newSubPoints = [...subPoints];
    newSubPoints[index] = value;
    setSubPoints(newSubPoints);
  };

  const handleAddStudent = () => setFullStudents([...fullStudents, '']);
  const handleRemoveStudent = (index: number) => {
    if (fullStudents.length > 1) setFullStudents(fullStudents.filter((_, i) => i !== index));
  };
  const handleStudentChange = (index: number, value: string) => {
    const newStudents = [...fullStudents];
    newStudents[index] = value;
    setFullStudents(newStudents);
  };

  const handleDebug = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setDebugData(null);

    try {
      if (mode === 'single') {
        const validSubPoints = subPoints.filter(s => s.trim() !== '');
        const res = await axios.post('/api/research/single-demand/debug', {
          demandTitle, topic, subPoints: validSubPoints, sourceText
        });
        setDebugData(res.data);
      } else {
        const validStudents = fullStudents.filter(s => s.trim() !== '');
        const res = await axios.post('/api/research/generate/debug', {
          title: fullTitle,
          university: fullUniversity,
          faculty: fullFaculty,
          department: fullDepartment,
          level: fullLevel,
          doctorName: fullDoctorName,
          students: validStudents,
          citationStyle: fullCitationStyle
        });
        setDebugData(res.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 p-8 bg-[var(--color-luxury-card)] border border-[var(--color-luxury-border)] rounded-2xl">
          <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <GraduationCap className="w-8 h-8 text-[var(--color-gold-500)]" />
            🐛 صفحة التصحيح (Debug)
          </h3>

          {/* Mode Selector */}
          <div className="mb-8 flex gap-4">
            <button
              type="button"
              onClick={() => { setMode('single'); setDebugData(null); setError(''); }}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                mode === 'single' 
                  ? 'bg-[var(--color-gold-500)] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                مولد المطلب الواحد
              </div>
            </button>
            <button
              type="button"
              onClick={() => { setMode('full'); setDebugData(null); setError(''); }}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                mode === 'full' 
                  ? 'bg-[var(--color-gold-500)] text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                مولد البحث الكامل
              </div>
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-red-900/20 border-r-4 border-red-500 rounded-lg p-4">
              <p className="text-sm text-red-400 font-bold">{error}</p>
            </div>
          )}

          <form onSubmit={handleDebug} className="space-y-6">
            {mode === 'single' ? (
              // Single Demand Form
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <FileText className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                    عنوان المطلب
                  </label>
                  <input
                    type="text"
                    required
                    value={demandTitle}
                    onChange={(e) => setDemandTitle(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    placeholder="مثال: المطلب الأول: مفهوم الحماية المستهلك"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <School className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                    الموضوع الرئيسي
                  </label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    placeholder="مثال: الحماية المستهلك في القانون الجزائري"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">النقاط الفرعية</label>
                    <button
                      type="button"
                      onClick={handleAddSubPoint}
                      className="flex items-center text-xs font-bold text-[var(--color-gold-500)] hover:text-white transition-colors bg-gold-500/10 px-3 py-1 rounded-full border border-[var(--color-gold-500)]/20"
                    >
                      <Plus className="w-3 h-3 ml-1" />
                      إضافة نقطة
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {subPoints.map((subPoint, index) => (
                      <div key={index} className="relative group">
                        <input
                          type="text"
                          value={subPoint}
                          onChange={(e) => handleSubPointChange(index, e.target.value)}
                          className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white pr-10 focus:ring-1 focus:ring-[var(--color-gold-500)] outline-none"
                          placeholder={`النقطة الفرعية ${index + 1}`}
                        />
                        {subPoints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSubPoint(index)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">المرجع (نظام شيكاغو)</label>
                  <textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    rows={3}
                    placeholder="مثال: احمد، محمد. قانون الحماية المستهلك. الجزائر: دار الشهاب، 2023."
                  />
                </div>
              </div>
            ) : (
              // Full Research Form
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <FileText className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                    عنوان البحث
                  </label>
                  <input
                    type="text"
                    required
                    value={fullTitle}
                    onChange={(e) => setFullTitle(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    placeholder="مثال: آليات حماية المستهلك في القانون الجزائري"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <School className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                    الجامعة
                  </label>
                  <input
                    type="text"
                    required
                    value={fullUniversity}
                    onChange={(e) => setFullUniversity(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    placeholder="مثال: جامعة الأغواط"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">الكلية</label>
                  <select
                    value={fullFaculty}
                    onChange={(e) => setFullFaculty(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                  >
                    {['الحقوق', 'العلوم السياسية', 'علم الاجتماع', 'علم النفس', 'التاريخ', 'الهندسة', 'العلوم الاقتصادية والتجارية', 'الآداب واللغات', 'العلوم الإسلامية', 'الإعلام والاتصال', 'العلوم الدقيقة', 'الطب والصيدلة'].map(f => (
                      <option key={f} value={f} className="bg-gray-900">{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">القسم</label>
                  <input
                    type="text"
                    required
                    value={fullDepartment}
                    onChange={(e) => setFullDepartment(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    placeholder="مثال: قسم القانون الخاص"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">المستوى</label>
                  <select
                    value={fullLevel}
                    onChange={(e) => setFullLevel(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                  >
                    <option value="ليسانس" className="bg-gray-900">ليسانس</option>
                    <option value="ماستر" className="bg-gray-900">ماستر</option>
                    <option value="دكتوراه" className="bg-gray-900">دكتوراه</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                    <GraduationCap className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                    اسم الدكتور المشرف
                  </label>
                  <input
                    type="text"
                    required
                    value={fullDoctorName}
                    onChange={(e) => setFullDoctorName(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                    placeholder="د. فلان بن فلان"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">طريقة التوثيق</label>
                  <select
                    value={fullCitationStyle}
                    onChange={(e) => setFullCitationStyle(e.target.value)}
                    className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                  >
                    <option value="APA" className="bg-gray-900">APA (7th Edition)</option>
                    <option value="Chicago" className="bg-gray-900">Chicago Style</option>
                    <option value="قانوني جزائري" className="bg-gray-900">قانوني (منهجية جزائرية)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-300">أسماء الطلبة</label>
                    <button
                      type="button"
                      onClick={handleAddStudent}
                      className="flex items-center text-xs font-bold text-[var(--color-gold-500)] hover:text-white transition-colors bg-gold-500/10 px-3 py-1 rounded-full border border-[var(--color-gold-500)]/20"
                    >
                      <Plus className="w-3 h-3 ml-1" />
                      إضافة طالب آخر
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fullStudents.map((student, index) => (
                      <div key={index} className="relative group">
                        <input
                          type="text"
                          value={student}
                          onChange={(e) => handleStudentChange(index, e.target.value)}
                          className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white pr-10 focus:ring-1 focus:ring-[var(--color-gold-500)] outline-none"
                          placeholder={`اسم الطالب ${index + 1}`}
                        />
                        {fullStudents.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(index)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-[var(--color-luxury-border)]">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto min-w-[220px] relative group overflow-hidden bg-[var(--color-gold-500)] disabled:bg-gray-600 py-4 px-10 rounded-xl text-black font-black text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 ml-3 animate-spin" />
                    جاري التشغيل...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    تشغيل التصحيح الآن
                    <FileText className="w-6 h-6 mr-3" />
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {debugData && debugData.success && (
          <div className="space-y-8">
            {Object.entries(debugData.steps).map(([key, value]) => (
              <div key={key} className="p-6 bg-[var(--color-luxury-card)] border border-[var(--color-luxury-border)] rounded-2xl">
                <h4 className="text-xl font-bold text-[var(--color-gold-500)] mb-4">
                  ✅ {key.replace('step', 'الخطوة ').replace('_', ' ')}
                </h4>
                <pre className="whitespace-pre-wrap text-sm text-gray-300 bg-black/30 p-4 rounded-lg overflow-x-auto">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
