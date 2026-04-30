import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, BookOpen, Users, History, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const adminLinks = [
    { name: 'إدارة الطلبة', path: '/admin', icon: Users },
  ];

  const studentLinks = [
    { name: 'توليد بحث جديد', path: '/student', icon: PlusCircle },
    { name: 'الأبحاث السابقة', path: '/student/history', icon: History },
  ];

  const shopLinks = [
    { name: 'توليد بحث جديد', path: '/shop', icon: PlusCircle },
    { name: 'الأبحاث السابقة', path: '/shop/history', icon: History },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'shop' ? shopLinks : studentLinks;

  return (
    <div className="min-h-screen flex bg-[var(--color-luxury-dark)] text-white overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: isSidebarOpen ? 0 : '100%' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="fixed inset-y-0 right-0 z-50 w-64 bg-[var(--color-luxury-purple)] border-l border-[var(--color-luxury-border)] lg:relative lg:translate-x-0 lg:flex lg:flex-col shadow-2xl"
        style={{ transform: 'translateX(0)' }} // Override motion for desktop
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--color-luxury-border)]">
          <div className="flex items-center text-[var(--color-gold-500)]">
            <BookOpen className="w-8 h-8 mr-2" />
            <span className="text-xl font-bold tracking-wider">CopySearch</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-[var(--color-luxury-border)]">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold-500)] flex items-center justify-center text-black font-bold text-lg">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-[var(--color-gold-400)]">{user?.role === 'admin' ? 'مدير النظام' : user?.role === 'shop' ? 'مكتبة' : 'طالب'}</p>
            </div>
          </div>
          {(user?.role === 'student' || user?.role === 'shop') && (
            <div className="mt-4 bg-black/30 rounded-lg p-3 border border-[var(--color-luxury-border)]">
              <p className="text-xs text-gray-400">الرصيد المتاح</p>
              <p className="text-lg font-bold text-[var(--color-gold-500)]">{user.points} نقطة</p>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-[var(--color-gold-500)] text-black shadow-lg shadow-gold-500/20'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ml-3 flex-shrink-0 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-white'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-luxury-border)]">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-3 text-sm font-medium text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="w-5 h-5 ml-3" />
            تسجيل الخروج
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="bg-[var(--color-luxury-dark)]/80 backdrop-blur-xl border-b border-[var(--color-luxury-border)] h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-gray-300 hover:text-white transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden flex items-center text-[var(--color-gold-500)]">
              <BookOpen className="w-6 h-6 ml-2" />
              <span className="text-lg font-bold tracking-wider">MX7SARECH</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {(user?.role === 'student' || user?.role === 'shop') && (
              <div className="flex items-center gap-2 bg-black/40 border border-[var(--color-gold-500)]/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                <span className="text-sm text-gray-300">الرصيد:</span>
                <span className="font-bold text-[var(--color-gold-500)]">{user.points}</span>
                <span className="text-xs text-[var(--color-gold-500)]">نقطة</span>
              </div>
            )}
            <button
              onClick={logout}
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-400/20"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--color-luxury-purple)] opacity-20 blur-[100px] pointer-events-none" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-5xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
