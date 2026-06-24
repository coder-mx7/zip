
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Loader2, Plus, Trash2, GraduationCap, School, UserCheck } from 'lucide-react';
import { saveAs } from 'file-saver';
import SidebarLayout from '../components/SidebarLayout';

export default function SingleDemandPage() {
  const { user, updatePoints, api } = useAuth();
  
  const [demandTitle, setDemandTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subPoints, setSubPoints] = useState<string[]>(['']);
  const [sourceText, setSourceText] = useState('اللقب، الاسم. عنوان المرجع. المدينة: دار النشر، 2025.');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddSubPoint = () => {
    setSubPoints([...subPoints, '']);
  };

  const handleRemoveSubPoint = (index: number) => {
    if (subPoints.length > 1) {
      setSubPoints(subPoints.filter((_, i) => i !== index));
    }
  };

  const handleSubPointChange = (index: number, value: string) => {
    const newSubPoints = [...subPoints];
    newSubPoints[index] = value;
    setSubPoints(newSubPoints);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user.points <= 0) {
      setError('رصيد النقاط غير كافٍ. يرجى شحن حسابك.');
      return;
    }

    const validSubPoints = subPoints.filter(s => s.trim() !== '');
    
    setError('');
    setSuccess('');
    setGenerating(true);
    
    try {
      const res = await api.post('/api/research/single-demand', {
        demandTitle,
        topic,
        subPoints: validSubPoints,
        sourceText
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      saveAs(blob, `${demandTitle}.docx`);
      
      setSuccess('تم توليد المطلب وحفظه بنجاح!');
      console.log('✅ Single demand generated successfully');
      
      setDemandTitle('');
      setTopic('');
      setSubPoints(['']);
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'حدث خطأ أثناء الاتصال بالسيرفر.';
      setError(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto bg-[var(--color-luxury-card)] shadow-2xl border border-[var(--color-luxury-border)] rounded-2xl overflow-hidden mb-10">
        <div className="px-6 py-8 sm:p-10">
          <header className="mb-10 text-center sm:text-right">
            <h3 className="text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-3">
              <GraduationCap className="w-8 h-8 text-[var(--color-gold-500)]" />
              مولد المطلب الواحد مع التهميش
            </h3>
            <p className="mt-2 text-gray-400 text-sm">توليد محتوى لمطلب واحد مع تهميش أوتوماتيكي بصيغة وورد جاهز للطابعة!</p>
          </header>
          
          {error && (
            <div className="mb-8 bg-red-900/20 border-r-4 border-red-500 rounded-lg p-4 animate-pulse">
              <p className="text-sm text-red-400 font-bold">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-8 bg-green-900/20 border-r-4 border-green-500 rounded-lg p-4">
              <p className="text-sm text-green-400 font-bold">{success}</p>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
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
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none"
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
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none"
                  placeholder="مثال: الحماية المستهلك في القانون الجزائري"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-300">النقاط الفرعية التي يجب تغطيتها</label>
                  <button
                    type="button"
                    onClick={handleAddSubPoint}
                    className="flex items-center text-xs font-bold text-[var(--color-gold-500)] hover:text-white transition-colors bg-gold-500/10 px-3 py-1 rounded-full border border-[var(--color-gold-500)]/20"
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    إضافة نقطة فرعية
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subPoints.map((subPoint, index) => (
                    <div key={index} className="relative group animate-in fade-in slide-in-from-top-2">
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
                <label className="block text-sm font-medium text-gray-300 mb-2">المرجع الذي سيتم استخدامه في التهميش (نظام شيكاغو)</label>
                <textarea
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                  rows={3}
                  placeholder="مثال: احمد، محمد. قانون الحماية المستهلك. الجزائر: دار الشهاب، 2023."
                />
              </div>
            </div>

            <div className="pt-10 border-t border-[var(--color-luxury-border)] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">تكلفة العملية:</span>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="font-bold text-xl text-white">1.00 <span className="text-[var(--color-gold-500)] text-sm font-normal">نقطة ذكية</span></span>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={generating || (user && user.points <= 0)}
                className="w-full sm:w-auto min-w-[220px] relative group overflow-hidden bg-[var(--color-gold-500)] disabled:bg-gray-600 py-4 px-10 rounded-xl text-black font-black text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.3)]"
              >
                {generating ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 ml-3 animate-spin" />
                    جاري التوليد...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    توليد المطلب الآن
                    <FileText className="w-6 h-6 mr-3" />
                  </span>
                )}
                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  );
}
