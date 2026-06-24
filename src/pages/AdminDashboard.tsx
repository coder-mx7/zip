import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users, Store } from 'lucide-react';
import SidebarLayout from '../components/SidebarLayout';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState<'students' | 'shops' | 'researches'>('students');
  const [users, setUsers] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [researches, setResearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Student form
  const [newName, setNewName] = useState('');
  const [newPoints, setNewPoints] = useState(10);
  
  // Shop form
  const [newShopName, setNewShopName] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopPassword, setNewShopPassword] = useState('');
  const [newShopPoints, setNewShopPoints] = useState(50);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'students') {
        const res = await api.get('/api/admin/students');
        setUsers(res.data);
      } else if (activeTab === 'shops') {
        const res = await api.get('/api/admin/shops');
        setShops(res.data);
      } else if (activeTab === 'researches') {
        const res = await api.get('/api/admin/research');
        setResearches(res.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'حدث خطأ في جلب البيانات';
      console.error('❌ Fetch error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      await api.post('/api/admin/students', { name: newName, points: newPoints });
      setNewName('');
      setNewPoints(10);
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'حدث خطأ أثناء إنشاء الطالب';
      console.error('❌ Create student error:', errorMsg);
      alert(errorMsg);
    }
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newShopEmail || !newShopPassword) return;
    try {
      await api.post('/api/admin/shops', { 
        name: newShopName, 
        email: newShopEmail, 
        password: newShopPassword, 
        points: newShopPoints 
      });
      setNewShopName('');
      setNewShopEmail('');
      setNewShopPassword('');
      setNewShopPoints(50);
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'حدث خطأ أثناء إنشاء المكتبة';
      console.error('❌ Create shop error:', errorMsg);
      alert(errorMsg);
    }
  };

  const handleDeleteUser = async (id: string, role: 'student' | 'shop') => {
    if (!window.confirm(`هل أنت متأكد من حذف ${role === 'student' ? 'هذا الطالب' : 'هذه المكتبة'}؟ سيتم حذف جميع الأبحاث المرتبطة.`)) return;
    try {
      if (role === 'student') {
        await api.delete(`/api/admin/students/${id}`);
      } else {
        await api.delete(`/api/admin/shops/${id}`);
      }
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'حدث خطأ أثناء الحذف';
      console.error('❌ Delete error:', errorMsg);
      alert(errorMsg);
    }
  };

  const handleUpdatePoints = async (id: string, role: 'student' | 'shop') => {
    try {
      if (role === 'student') {
        await api.put(`/api/admin/students/${id}/points`, { points: editPoints });
      } else {
        await api.put(`/api/admin/shops/${id}/points`, { points: editPoints });
      }
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'حدث خطأ أثناء تحديث النقاط';
      console.error('❌ Update points error:', errorMsg);
      alert(errorMsg);
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            className={`flex-1 py-4 text-center font-bold text-lg border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'students'
                ? 'border-[var(--color-gold-500)] text-[var(--color-gold-500)] bg-white/5'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('students')}
          >
            <Users className="w-5 h-5" />
            إدارة الطلبة
          </button>
          <button
            className={`flex-1 py-4 text-center font-bold text-lg border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'shops'
                ? 'border-[var(--color-gold-500)] text-[var(--color-gold-500)] bg-white/5'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('shops')}
          >
            <Store className="w-5 h-5" />
            إدارة المكتبات
          </button>
          <button
            className={`flex-1 py-4 text-center font-bold text-lg border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'researches'
                ? 'border-[var(--color-gold-500)] text-[var(--color-gold-500)] bg-white/5'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('researches')}
          >
            <Check className="w-5 h-5" />
            الأبحاث المنجزة
          </button>
        </div>

        {activeTab === 'students' ? (
          <>
            <div className="bg-[var(--color-luxury-card)] shadow-xl border border-[var(--color-luxury-border)] rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Plus className="w-5 h-5 ml-2 text-[var(--color-gold-500)]" />
                إضافة طالب جديد
              </h3>
              <form onSubmit={handleCreateStudent} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-black/50 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all"
                    placeholder="الاسم الكامل للطالب"
                  />
                </div>
                <div className="w-full sm:w-40">
                  <input
                    type="number"
                    required
                    min="0"
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value))}
                    className="w-full bg-black/50 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all"
                    placeholder="النقاط"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-black bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] font-bold transition-all shadow-lg shadow-gold-500/20"
                >
                  إضافة
                </button>
              </form>
            </div>

            <div className="bg-[var(--color-luxury-card)] shadow-xl border border-[var(--color-luxury-border)] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--color-luxury-border)]">
                <h3 className="text-xl font-bold text-white">قائمة الطلبة</h3>
              </div>
              <div className="divide-y divide-[var(--color-luxury-border)]">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
                ) : users.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">لا يوجد طلبة مسجلين حالياً.</div>
                ) : (
                  users.map((student) => (
                    <div key={student._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-white truncate">{student.name}</p>
                        <p className="text-sm text-gray-400 flex items-center mt-2">
                          رمز الدخول:
                          <span className="font-mono bg-black/50 border border-[var(--color-luxury-border)] px-3 py-1 rounded-lg text-[var(--color-gold-500)] mr-3 tracking-widest" dir="ltr">
                            {student.token}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="flex items-center">
                          {editingId === student._id ? (
                            <div className="flex items-center space-x-2 space-x-reverse bg-black/50 p-1 rounded-lg border border-[var(--color-luxury-border)]">
                              <input
                                type="number"
                                min="0"
                                value={editPoints}
                                onChange={(e) => setEditPoints(parseInt(e.target.value))}
                                className="w-20 bg-transparent text-white text-center focus:outline-none"
                              />
                              <button onClick={() => handleUpdatePoints(student._id, 'student')} className="p-2 text-green-400 hover:bg-white/10 rounded-md transition-colors">
                                <Check className="w-5 h-5" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-white/10 rounded-md transition-colors">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-[var(--color-gold-500)]/10 text-[var(--color-gold-500)] border border-[var(--color-gold-500)]/20">
                                {student.points} نقطة
                              </span>
                              <button
                                onClick={() => {
                                  setEditingId(student._id);
                                  setEditPoints(student.points);
                                }}
                                className="p-2 text-gray-400 hover:text-[var(--color-gold-500)] hover:bg-white/5 rounded-lg transition-all"
                                title="تعديل النقاط"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteUser(student._id, 'student')}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                          title="حذف الطالب"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'shops' ? (
          <>
            <div className="bg-[var(--color-luxury-card)] shadow-xl border border-[var(--color-luxury-border)] rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Plus className="w-5 h-5 ml-2 text-[var(--color-gold-500)]" />
                إضافة مكتبة جديدة
              </h3>
              <form onSubmit={handleCreateShop} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1">
                  <input
                    type="text"
                    required
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    className="w-full bg-black/50 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all"
                    placeholder="اسم المكتبة"
                  />
                </div>
                <div className="lg:col-span-1">
                  <input
                    type="email"
                    required
                    value={newShopEmail}
                    onChange={(e) => setNewShopEmail(e.target.value)}
                    className="w-full bg-black/50 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all"
                    placeholder="البريد الإلكتروني"
                    dir="ltr"
                  />
                </div>
                <div className="lg:col-span-1">
                  <input
                    type="password"
                    required
                    value={newShopPassword}
                    onChange={(e) => setNewShopPassword(e.target.value)}
                    className="w-full bg-black/50 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all"
                    placeholder="كلمة المرور"
                    dir="ltr"
                  />
                </div>
                <div className="lg:col-span-1">
                  <input
                    type="number"
                    required
                    min="0"
                    value={newShopPoints}
                    onChange={(e) => setNewShopPoints(parseInt(e.target.value))}
                    className="w-full bg-black/50 border border-[var(--color-luxury-border)] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all"
                    placeholder="النقاط"
                  />
                </div>
                <div className="lg:col-span-1">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-xl text-black bg-[var(--color-gold-500)] hover:bg-[var(--color-gold-400)] font-bold transition-all shadow-lg shadow-gold-500/20"
                  >
                    إضافة
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-[var(--color-luxury-card)] shadow-xl border border-[var(--color-luxury-border)] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[var(--color-luxury-border)]">
                <h3 className="text-xl font-bold text-white">قائمة المكتبات</h3>
              </div>
              <div className="divide-y divide-[var(--color-luxury-border)]">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
                ) : shops.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">لا توجد مكتبات مسجلة حالياً.</div>
                ) : (
                  shops.map((shop) => (
                    <div key={shop._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-white truncate">{shop.name}</p>
                        <p className="text-sm text-gray-400 flex items-center mt-2">
                          البريد:
                          <span className="font-mono bg-black/50 border border-[var(--color-luxury-border)] px-3 py-1 rounded-lg text-[var(--color-gold-500)] mr-3" dir="ltr">
                            {shop.email}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 space-x-reverse">
                        <div className="flex items-center">
                          {editingId === shop._id ? (
                            <div className="flex items-center space-x-2 space-x-reverse bg-black/50 p-1 rounded-lg border border-[var(--color-luxury-border)]">
                              <input
                                type="number"
                                min="0"
                                value={editPoints}
                                onChange={(e) => setEditPoints(parseInt(e.target.value))}
                                className="w-20 bg-transparent text-white text-center focus:outline-none"
                              />
                              <button onClick={() => handleUpdatePoints(shop._id, 'shop')} className="p-2 text-green-400 hover:bg-white/10 rounded-md transition-colors">
                                <Check className="w-5 h-5" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-white/10 rounded-md transition-colors">
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-[var(--color-gold-500)]/10 text-[var(--color-gold-500)] border border-[var(--color-gold-500)]/20">
                                {shop.points} نقطة
                              </span>
                              <button
                                onClick={() => {
                                  setEditingId(shop._id);
                                  setEditPoints(shop.points);
                                }}
                                className="p-2 text-gray-400 hover:text-[var(--color-gold-500)] hover:bg-white/5 rounded-lg transition-all"
                                title="تعديل النقاط"
                              >
                                <Edit2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteUser(shop._id, 'shop')}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
                          title="حذف المكتبة"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[var(--color-luxury-card)] shadow-xl border border-[var(--color-luxury-border)] rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--color-luxury-border)]">
              <h3 className="text-xl font-bold text-white">الأبحاث المنجزة</h3>
            </div>
            <div className="divide-y divide-[var(--color-luxury-border)]">
              {loading ? (
                <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
              ) : researches.length === 0 ? (
                <div className="p-8 text-center text-gray-400">لا توجد أبحاث منجزة حالياً.</div>
              ) : (
                researches.map((research) => (
                  <div key={research._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-bold text-white truncate">{research.title}</p>
                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-400">
                        <span>الجامعة: {research.university}</span>
                        <span>الكلية: {research.faculty}</span>
                        <span>المستوى: {research.level}</span>
                        <span>المشرف: {research.doctorName}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-400">
                        الطلبة: {research.students.join('، ')}
                      </div>
                      <div className="mt-2 text-sm text-[var(--color-gold-500)]">
                        تم الإنشاء بواسطة: {research.creatorId?.name || 'مستخدم محذوف'} 
                        {research.creatorRole === 'shop' && ` (مكتبة: ${research.creatorId?.shopName || 'غير معروف'})`}
                        {' '}في {new Date(research.createdAt).toLocaleDateString('ar-DZ')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
