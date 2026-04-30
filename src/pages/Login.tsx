import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BookOpen, User, Shield, Store } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'student' | 'shop' | 'admin'>('student');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginAdmin, loginStudent, loginShop } = useAuth();
  const navigate = useNavigate();

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginStudent(token);
      navigate('/student');
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleShopLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginShop(email, password);
      navigate('/shop');
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-gold-600)] rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="flex justify-center text-[var(--color-gold-500)]">
          <BookOpen size={56} strokeWidth={1.5} />
        </div>
        <h2 className="mt-6 text-center text-4xl font-extrabold text-white tracking-tight">
          CopySearch
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          منصة توليد الأبحاث الأكاديمية الاحترافية
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg relative z-10"
      >
        <div className="bg-white/[0.03] py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-3xl sm:px-10 border border-white/10 backdrop-blur-xl">
          <div className="flex border-b border-white/10 mb-8">
            <button
              className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'border-[var(--color-gold-500)] text-[var(--color-gold-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('student')}
            >
              <User className="w-4 h-4" />
              الطالب
            </button>
            <button
              className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'shop'
                  ? 'border-[var(--color-gold-500)] text-[var(--color-gold-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('shop')}
            >
              <Store className="w-4 h-4" />
              المكتبة
            </button>
            <button
              className={`flex-1 py-3 text-center font-bold text-sm border-b-2 transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'border-[var(--color-gold-500)] text-[var(--color-gold-500)]'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('admin')}
            >
              <Shield className="w-4 h-4" />
              المدير
            </button>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 bg-red-900/30 border border-red-500/50 rounded-xl p-4">
              <p className="text-sm text-red-400 text-center font-medium">{error}</p>
            </motion.div>
          )}

          {activeTab === 'student' && (
            <motion.form 
              key="student"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleStudentLogin} 
              className="space-y-6"
            >
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-300">
                  رمز الدخول (Token)
                </label>
                <div className="mt-2">
                  <input
                    id="token"
                    name="token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all sm:text-sm"
                    placeholder="أدخل الرمز المكون من 7 أحرف"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] text-sm font-bold text-black bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-gold-500)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === 'shop' && (
            <motion.form 
              key="shop"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleShopLogin} 
              className="space-y-6"
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  البريد الإلكتروني للمكتبة
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all sm:text-sm"
                    dir="ltr"
                    placeholder="shop@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  كلمة المرور
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all sm:text-sm"
                    dir="ltr"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] text-sm font-bold text-black bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-gold-500)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === 'admin' && (
            <motion.form 
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleAdminLogin} 
              className="space-y-6"
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  البريد الإلكتروني
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all sm:text-sm"
                    dir="ltr"
                    placeholder="admin@copysearch.dz"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  كلمة المرور
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:border-transparent transition-all sm:text-sm"
                    dir="ltr"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.3)] text-sm font-bold text-black bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-gold-500)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
