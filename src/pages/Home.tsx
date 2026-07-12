import React from 'react';
import { motion } from 'framer-motion'; // تأكد من تثبيت framer-motion
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Database, BrainCircuit, Search, ShieldCheck, 
  Sparkles, FileText, Globe, Zap, BookOpen, 
  Users, ArrowLeft 
} from 'lucide-react';

export default function Home() {
  // تم إضافة logout هنا لإصلاح الخطأ البرمجي
  const { user, logout } = useAuth();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[var(--color-gold-500)] selection:text-black overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-gold-400)] via-[var(--color-gold-500)] to-orange-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                <Search className="w-6 h-6 text-black" />
              </div>
              <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                linouch
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 bg-white/5 px-8 py-3 rounded-full border border-white/10">
              <a href="#features" className="text-sm font-bold text-gray-300 hover:text-[var(--color-gold-500)] transition-colors">المميزات</a>
              <Link to="/student" className="text-sm font-bold text-gray-300 hover:text-[var(--color-gold-500)] transition-colors">الدخول إلى البحوث</Link>
              <Link to="/student/history" className="text-sm font-bold text-gray-300 hover:text-[var(--color-gold-500)] transition-colors">السجل</Link>
              <a href="#contact" className="text-sm font-bold text-gray-300 hover:text-[var(--color-gold-500)] transition-colors">اتصل بنا</a>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {(user.role === 'student' || user.role === 'shop') && (
                    <div className="hidden sm:flex items-center gap-2 bg-black/40 border border-[var(--color-gold-500)]/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                      <span className="text-sm text-gray-300">الرصيد:</span>
                      <span className="font-bold text-[var(--color-gold-500)]">{user.points}</span>
                      <span className="text-xs text-[var(--color-gold-500)]">نقطة</span>
                    </div>
                  )}
                  <Link
                    to={user.role === 'admin' ? '/admin' : user.role === 'shop' ? '/shop' : '/student'}
                    className="px-6 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                  >
                    لوحة التحكم
                  </Link>
                  <button
                    onClick={logout}
                    className="hidden sm:flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-400/20"
                  >
                    خروج
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-6 py-2.5 rounded-full font-bold text-sm bg-gradient-to-r from-[var(--color-gold-400)] to-[var(--color-gold-600)] text-black hover:scale-105 transition-all shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden min-h-screen flex items-center">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[var(--color-gold-500)]/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-right">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[var(--color-gold-500)]/20 to-purple-500/20 border border-[var(--color-gold-500)]/30 mb-8 backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 text-[var(--color-gold-400)]" />
                <span className="text-sm font-bold text-white">ثورة في عالم البحث الأكاديمي</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[1.1]"
              >
                أبحاثك الأكاديمية <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-400)] via-[var(--color-gold-500)] to-orange-500">
                  بذكاء خارق
                </span>
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-xl md:text-2xl text-gray-300 mb-10 leading-relaxed font-medium"
              >
                منصة <strong className="text-white">MX7SARECH</strong> تعتمد على أضخم قواعد البيانات والمكتبات العالمية، لتقدم لك بحوثاً دقيقة، موثقة، ومنسقة في ثوانٍ معدودة.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-4"
              >
                {user && (user.role === 'student' || user.role === 'shop') && (
                  <Link
                    to="/create-plan"
                    className="w-full sm:w-auto px-10 py-5 rounded-full font-black text-xl bg-gradient-to-r from-[var(--color-gold-400)] via-[var(--color-gold-500)] to-orange-500 text-black hover:scale-105 transition-all shadow-[0_0_40px_rgba(234,179,8,0.6)] flex items-center justify-center gap-3 group"
                  >
                    🚀 إنشاء خطة بحثية مخصصة
                    <ArrowLeft className="w-7 h-7 group-hover:-translate-x-2 transition-transform" />
                  </Link>
                )}
                <Link
                  to={user ? (user.role === 'admin' ? '/admin' : '/student') : '/login'}
                  className="w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all flex items-center justify-center backdrop-blur-md"
                >
                  لوحة التحكم
                </Link>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--color-gold-500)]/30 via-purple-500/20 to-transparent rounded-[3rem] blur-3xl" />
              <div className="relative bg-black/40 border border-white/10 rounded-[3rem] p-4 backdrop-blur-2xl shadow-2xl overflow-hidden group">
                <img 
                  src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop" 
                  alt="AI Research Library" 
                  className="rounded-[2.5rem] w-full h-[600px] object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                />
                
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-6 top-32 bg-white/10 border border-white/20 p-5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 z-20"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-gold-400)] to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Database className="w-7 h-7 text-black" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">قواعد بيانات</p>
                    <p className="text-2xl font-black text-white">+50 مليون</p>
                  </div>
                </motion.div>

                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-6 bottom-32 bg-white/10 border border-white/20 p-5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-4 z-20"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 font-medium">سرعة التوليد</p>
                    <p className="text-2xl font-black text-white">أقل من دقيقة</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'طالب مستفيد', value: '+25,000', icon: Users },
              { label: 'بحث منجز', value: '+100K', icon: FileText },
              { label: 'جامعة مدعومة', value: '50+', icon: BookOpen },
              { label: 'مكتبة عالمية', value: '100+', icon: Globe },
            ].map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center"
              >
                <stat.icon className="w-8 h-8 text-[var(--color-gold-500)] mb-4 opacity-80" />
                <h4 className="text-4xl font-black text-white mb-2">{stat.value}</h4>
                <p className="text-gray-400 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.span {...fadeIn} className="text-[var(--color-gold-500)] font-bold tracking-wider uppercase text-sm mb-4 block">قدرات لا محدودة</motion.span>
            <motion.h2 {...fadeIn} className="text-4xl md:text-6xl font-black mb-6">
              لماذا يعتبر <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gold-400)] to-orange-500">MX7SARECH</span> الأفضل؟
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-right">
            {[
              { 
                title: "عقل إلكتروني جبار", 
                desc: "خوارزميات ذكاء اصطناعي مدربة على ملايين الأوراق البحثية، قادرة على فهم السياق وبراعة الصياغة.", 
                icon: BrainCircuit, 
                color: "from-[var(--color-gold-400)] to-orange-600" 
              },
              { 
                title: "محيط من البيانات", 
                desc: "وصول لحظي لأكبر المكتبات الرقمية والمجلات العلمية لاستخراج أدق المعلومات.", 
                icon: Database, 
                color: "from-purple-500 to-indigo-600" 
              },
              { 
                title: "دقة وتوثيق صارم", 
                desc: "تهميش تلقائي بأساليب (APA, Chicago) مع ضمان خلو البحث من الانتحال العلمي.", 
                icon: ShieldCheck, 
                color: "from-blue-400 to-cyan-600" 
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.03] border border-white/10 p-10 rounded-[2rem] hover:bg-white/[0.05] hover:border-[var(--color-gold-500)]/50 transition-all duration-500 group relative overflow-hidden"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-8 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed text-lg">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-white/10 bg-black pt-20 pb-10 text-right">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <span className="text-2xl font-black text-white mb-6 block">MX7SARECH</span>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                المنصة الأولى عربياً للبحث الأكاديمي الذكي. نجمع بين قوة الذكاء الاصطناعي وضخامة المكتبات العالمية.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">روابط سريعة</h4>
              <ul className="space-y-4 text-gray-400">
                <li><Link to="/student" className="hover:text-[var(--color-gold-500)]">الدخول للبحوث</Link></li>
                <li><Link to="/login" className="hover:text-[var(--color-gold-500)]">تسجيل الدخول</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">تواصل معنا</h4>
              <ul className="space-y-4 text-gray-400">
                <li>contact@mx7sarech.com</li>
                <li>الجزائر العاصمة</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-gray-500">
            <p>© 2026 MX7SARECH. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}