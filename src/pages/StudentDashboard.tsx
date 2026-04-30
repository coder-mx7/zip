import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FileText, Loader2, Plus, Trash2, GraduationCap, School, UserCheck } from 'lucide-react';
import { saveAs } from 'file-saver';
import SidebarLayout from '../components/SidebarLayout';

const FACULTIES = [
  'الحقوق',
  'العلوم السياسية',
  'علم الاجتماع',
  'علم النفس',
  'التاريخ',
  'الهندسة',
  'العلوم الاقتصادية والتجارية',
  'الآداب واللغات',
  'العلوم الإسلامية',
  'الإعلام والاتصال',
  'العلوم الدقيقة',
  'الطب والصيدلة'
];

export default function StudentDashboard() {
  const { user, updatePoints } = useAuth();
  
  // Form state
  const [title, setTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState(''); // حقل القسم الجديد
  const [doctorName, setDoctorName] = useState('');
  const [students, setStudents] = useState<string[]>(['']);
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [level, setLevel] = useState('ليسانس');
  const [citationStyle, setCitationStyle] = useState('APA');
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAddStudent = () => {
    setStudents([...students, '']);
  };

  const handleRemoveStudent = (index: number) => {
    if (students.length > 1) {
      setStudents(students.filter((_, i) => i !== index));
    }
  };

  const handleStudentChange = (index: number, value: string) => {
    const newStudents = [...students];
    newStudents[index] = value;
    setStudents(newStudents);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من الرصيد
    if (user.points <= 0) {
      setError('رصيد النقاط غير كافٍ لتوليد بحث جديد. يرجى شحن حسابك.');
      return;
    }
    
    // التحقق من الأسماء
    const validStudents = students.filter(s => s.trim() !== '');
    if (validStudents.length === 0) {
      setError('يرجى إدخال اسم طالب واحد على الأقل.');
      return;
    }
    
    setError('');
    setSuccess('');
    setGenerating(true);
    
    try {
      const res = await axios.post('/api/research/generate', {
        title,
        university,
        faculty,
        department, // إرسال القسم
        level,
        doctorName,
        students: validStudents,
        citationStyle,
        year: '2025/2026'
      });
      
      if (res.data) {
        // تحديث النقاط في الواجهة
        if (res.data.newPoints !== undefined) {
            updatePoints(res.data.newPoints);
        }
        
        setSuccess('تم توليد البحث وحفظه بنجاح! جاري إعداد ملف الوورد...');
        
        // تحميل الملف تلقائياً بعد التوليد
        await handleDownload(res.data._id, res.data.title);
        
        // إعادة تهيئة النموذج
        setTitle('');
        setUniversity('');
        setDepartment('');
        setDoctorName('');
        setStudents(['']);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'حدث خطأ أثناء الاتصال بالسيرفر.';
      setError(errorMsg);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (id: string, researchTitle: string) => {
    try {
      const res = await axios.get(`/api/research/download/${id}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([res.data], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      saveAs(blob, `${researchTitle}.docx`);
    } catch (err) {
      console.error('Download error:', err);
      setError('تم إنشاء البحث، لكن فشل التحميل التلقائي. يمكنك تحميله من سجل الأبحاث.');
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-4xl mx-auto bg-[var(--color-luxury-card)] shadow-2xl border border-[var(--color-luxury-border)] rounded-2xl overflow-hidden mb-10">
        <div className="px-6 py-8 sm:p-10">
          <header className="mb-10 text-center sm:text-right">
            <h3 className="text-3xl font-bold text-white flex items-center justify-center sm:justify-start gap-3">
              <GraduationCap className="w-8 h-8 text-[var(--color-gold-500)]" />
              منصة إعداد البحوث الأكاديمية
            </h3>
            <p className="mt-2 text-gray-400 text-sm">أدخل بيانات البحث بدقة للحصول على أفضل النتائج الأكاديمية والقانونية.</p>
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
            {/* القسم الأول: معلومات العنوان والجامعة */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                  <FileText className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                  عنوان البحث كاملاً
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-4 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none"
                  placeholder="مثال: آليات حماية المستهلك في القانون الجزائري"
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                  <School className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                  الجامعة / المركز الجامعي
                </label>
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] transition-all outline-none"
                  placeholder="مثال: جامعة الأغواط"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">الكلية</label>
                <select
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                >
                  {FACULTIES.map(f => <option key={f} value={f} className="bg-gray-900">{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">القسم / التخصص</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                  placeholder="مثال: قسم القانون الخاص"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">المستوى الدراسي</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                >
                  <option value="ليسانس" className="bg-gray-900">ليسانس</option>
                  <option value="ماستر" className="bg-gray-900">ماستر</option>
                  <option value="دكتوراه" className="bg-gray-900">دكتوراه</option>
                </select>
              </div>
            </div>

            <hr className="border-[var(--color-luxury-border)]" />

            {/* القسم الثاني: المشرف والطلبة */}
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-300 mb-2">
                  <UserCheck className="w-4 h-4 ml-2 text-[var(--color-gold-500)]" />
                  اسم الأستاذ المشرف
                </label>
                <input
                  type="text"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                  placeholder="د. فلان بن فلان"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">طريقة التوثيق (Citation)</label>
                <select
                  value={citationStyle}
                  onChange={(e) => setCitationStyle(e.target.value)}
                  className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                >
                  <option value="APA" className="bg-gray-900">APA (7th Edition)</option>
                  <option value="Chicago" className="bg-gray-900">Chicago Style</option>
                  <option value="قانوني جزائري" className="bg-gray-900">قانوني (منهجية جزائرية)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-300">أسماء الطلبة المشاركين في البحث</label>
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
                  {students.map((student, index) => (
                    <div key={index} className="relative group animate-in fade-in slide-in-from-top-2">
                      <input
                        type="text"
                        required
                        value={student}
                        onChange={(e) => handleStudentChange(index, e.target.value)}
                        className="w-full bg-black/40 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white pr-10 focus:ring-1 focus:ring-[var(--color-gold-500)] outline-none"
                        placeholder={`اسم الطالب ${index + 1}`}
                      />
                      {students.length > 1 && (
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

            {/* القسم الثالث: الإرسال */}
            <div className="pt-10 border-t border-[var(--color-luxury-border)] flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-400">تكلفة العملية المستقطعة:</span>
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
                    جاري التوليد الأكاديمي...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    توليد البحث الآن
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
