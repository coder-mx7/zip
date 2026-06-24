import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext<any>(null);

// إعداد الـ API base URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://zip-7x7y.onrender.com/';
const api = axios.create({
  baseURL: API_BASE,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // التحقق من الـ token عند بدء التطبيق
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          setError(null);
        }
      } catch (err: any) {
        console.error('❌ Auth initialization error:', err.message);
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setError(err.response?.data?.error || 'خطأ في تحميل بيانات المستخدم');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginAdmin = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await api.post('/api/auth/admin/login', { email, password });
      const { token, user: userData } = res.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      console.log('✅ Admin login successful');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'فشل تسجيل الدخول';
      console.error('❌ Admin login error:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const loginStudent = async (studentToken: string) => {
    try {
      setError(null);
      const res = await api.post('/api/auth/student/login', { token: studentToken });
      const { token, user: userData } = res.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      console.log('✅ Student login successful');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'فشل تسجيل الدخول';
      console.error('❌ Student login error:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const loginShop = async (email: string, password: string) => {
    try {
      setError(null);
      const res = await api.post('/api/auth/shop/login', { email, password });
      const { token, user: userData } = res.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      console.log('✅ Shop login successful');
      return { success: true };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'فشل تسجيل الدخول';
      console.error('❌ Shop login error:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
    console.log('✅ Logout successful');
  };

  const updatePoints = (points: number) => {
    setUser((prev: any) => ({ ...prev, points }));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      error, 
      loginAdmin, 
      loginStudent, 
      loginShop, 
      logout, 
      updatePoints,
      api 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
