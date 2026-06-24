import React, { useState, useEffect } from 'react';
import { Download, History } from 'lucide-react';
import { saveAs } from 'file-saver';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';

export default function StudentHistory() {
  const { api } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setError(null);
      const res = await api.get('/api/research/history');
      setHistory(res.data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'حدث خطأ في جلب السجل';
      console.error('❌ Fetch history error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownload = async (id: string, researchTitle: string) => {
    try {
      const res = await api.get(`/api/research/${id}/word`, {
        responseType: 'blob'
      });
      saveAs(res.data, `${researchTitle}.docx`);
      console.log('✅ File downloaded successfully');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'حدث خطأ أثناء تحميل الملف';
      console.error('❌ Download error:', errorMsg);
      alert(errorMsg);
    }
  };

  return (
    <SidebarLayout>
      <div className="bg-[var(--color-luxury-card)] shadow-2xl border border-[var(--color-luxury-border)] rounded-2xl overflow-hidden">
        <div className="px-6 py-8 border-b border-[var(--color-luxury-border)]">
          <h3 className="text-2xl font-bold text-white flex items-center">
            <History className="w-6 h-6 ml-3 text-[var(--color-gold-500)]" />
            سجل الأبحاث السابقة
          </h3>
        </div>
        <div className="divide-y divide-[var(--color-luxury-border)]">
          {loadingHistory ? (
            <div className="p-10 text-center text-gray-400">جاري التحميل...</div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center text-gray-400">لا توجد أبحاث سابقة.</div>
          ) : (
            history.map((item) => (
              <div key={item._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-white truncate">{item.title}</p>
                  <p className="text-sm text-gray-400 mt-2 flex items-center gap-3">
                    <span className="bg-black/50 px-2 py-1 rounded-md border border-[var(--color-luxury-border)]">
                      {new Date(item.createdAt).toLocaleDateString('ar-DZ')}
                    </span>
                    <span className="bg-black/50 px-2 py-1 rounded-md border border-[var(--color-luxury-border)]">
                      {item.university}
                    </span>
                    <span className="bg-black/50 px-2 py-1 rounded-md border border-[var(--color-luxury-border)]">
                      {item.faculty}
                    </span>
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleDownload(item._id, item.title)}
                    className="inline-flex items-center px-4 py-2 border border-[var(--color-gold-500)]/30 shadow-sm text-sm font-bold rounded-xl text-[var(--color-gold-500)] bg-[var(--color-gold-500)]/10 hover:bg-[var(--color-gold-500)] hover:text-black focus:outline-none transition-all"
                  >
                    <Download className="w-5 h-5 ml-2" />
                    تحميل Word
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
