import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../server/models/User.js';

const MONGODB_URI = 'mongodb+srv://admin:CVB1203040@cluster0.rqyyhdj.mongodb.net/copysearch?appName=Cluster0';

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const email = 'test@admin.com';
    const password = 'admin';

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log('حساب المدير موجود مسبقاً:', email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      role: 'admin',
      name: 'مدير تجريبي',
      email: email,
      password: hashedPassword
    });

    console.log('✅ تم إنشاء حساب المدير بنجاح!');
    console.log(`📧 البريد الإلكتروني: ${email}`);
    console.log(`🔑 كلمة المرور: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('حدث خطأ:', error);
    process.exit(1);
  }
}

seedAdmin();
