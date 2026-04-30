import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../server/models/User.js';
import { connectDB } from '../server/config/db.js';

// ألوان للطباعة
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️ ${msg}${colors.reset}`),
};

const seedDatabase = async () => {
  try {
    console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}   🌱 بدء عملية البذر (Seeding) للبيانات${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

    // الاتصال بقاعدة البيانات
    log.info('جاري الاتصال بـ MongoDB...');
    await connectDB();
    log.success('تم الاتصال بـ MongoDB بنجاح!');

    // حذف جميع المستخدمين السابقين (لـ التطوير فقط)
    log.warning('جاري حذف المستخدمين السابقين...');
    await User.deleteMany({});
    log.success('تم حذف المستخدمين السابقين');

    // 1️⃣ إنشاء حساب المدير (Admin)
    log.info('\n📌 إنشاء حساب المدير (Admin)...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      role: 'admin',
      name: 'المدير العام',
      email: 'admin@copysearch.dz',
      password: adminPassword,
      points: 9999,
      createdAt: new Date(),
    });
    log.success(`تم إنشاء حساب المدير بنجاح!`);
    console.log(`   📧 البريد: admin@copysearch.dz`);
    console.log(`   🔐 كلمة المرور: admin123`);
    console.log(`   💰 النقاط: ${admin.points}`);
    console.log(`   🆔 ID: ${admin._id}\n`);

    // 2️⃣ إنشاء حساب الطالب (Student)
    log.info('📌 إنشاء حساب الطالب (Student)...');
    const studentToken = 'STUDENT2026';
    const student = await User.create({
      role: 'student',
      name: 'أحمد محمود',
      token: studentToken,
      points: 100,
      createdAt: new Date(),
    });
    log.success(`تم إنشاء حساب الطالب بنجاح!`);
    console.log(`   👤 الاسم: أحمد محمود`);
    console.log(`   🔐 رمز الدخول (Token): ${studentToken}`);
    console.log(`   💰 النقاط: ${student.points}`);
    console.log(`   🆔 ID: ${student._id}\n`);

    // 3️⃣ إنشاء حساب محل تجاري (Shop)
    log.info('📌 إنشاء حساب محل تجاري (Shop)...');
    const shopPassword = await bcrypt.hash('shop123', 10);
    const shop = await User.create({
      role: 'shop',
      name: 'مالك المكتبة',
      shopName: 'مكتبة النور للعلم',
      email: 'shop@copysearch.dz',
      password: shopPassword,
      points: 500,
      createdAt: new Date(),
    });
    log.success(`تم إنشاء حساب المكتبة بنجاح!`);
    console.log(`   📧 البريد: shop@copysearch.dz`);
    console.log(`   🏪 اسم المكتبة: مكتبة النور للعلم`);
    console.log(`   🔐 كلمة المرور: shop123`);
    console.log(`   💰 النقاط: ${shop.points}`);
    console.log(`   🆔 ID: ${shop._id}\n`);

    // طباعة ملخص
    console.log(`${colors.green}═══════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}   ✅ تم إنشاء جميع الحسابات بنجاح!${colors.reset}`);
    console.log(`${colors.green}═══════════════════════════════════════════${colors.reset}`);

    // طباعة بيانات الاختبار
    console.log(`\n${colors.blue}📋 بيانات الاختبار:${colors.reset}`);
    console.log(`\n${colors.yellow}1️⃣ تسجيل الدخول - المدير:${colors.reset}`);
    console.log(`   curl -X POST http://localhost:3001/api/auth/admin/login \\`);
    console.log(`   -H "Content-Type: application/json" \\`);
    console.log(`   -d '{"email":"admin@copysearch.dz","password":"admin123"}'`);

    console.log(`\n${colors.yellow}2️⃣ تسجيل الدخول - الطالب:${colors.reset}`);
    console.log(`   curl -X POST http://localhost:3001/api/auth/student/login \\`);
    console.log(`   -H "Content-Type: application/json" \\`);
    console.log(`   -d '{"token":"STUDENT2026"}'`);

    console.log(`\n${colors.yellow}3️⃣ تسجيل الدخول - المكتبة:${colors.reset}`);
    console.log(`   curl -X POST http://localhost:3001/api/auth/shop/login \\`);
    console.log(`   -H "Content-Type: application/json" \\`);
    console.log(`   -d '{"email":"shop@copysearch.dz","password":"shop123"}'`);

    console.log(`\n${colors.green}✨ يمكنك الآن بدء التطوير!${colors.reset}\n`);

    process.exit(0);
  } catch (error: any) {
    log.error(`فشل البذر: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
