import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import { connectDB } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import adminRoutes from './server/routes/adminRoutes.js';
import researchRoutes from './server/routes/researchRoutes.js';
import { User } from './server/models/User.js';

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, '');

const startServer = async () => {
  try {
    const app = express();
    const PORT = process.env.PORT || 3001;

    console.log('⏳ Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB Connected.');

    // Seed Admin
    const seedAdmin = async () => {
      try {
        const adminEmail = 'admin@copysearch.dz';
        const adminExists = await User.findOne({ email: adminEmail });
        if (!adminExists) {
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await User.create({
            role: 'admin',
            name: 'المدير العام',
            email: adminEmail,
            password: hashedPassword,
            points: 9999
          });
          console.log('👤 Admin account seeded.');
        }
      } catch (err) {
        console.error('❌ Seed Admin Error:', err);
      }
    };
    await seedAdmin();

    // تفعيل CORS بشكل ديناميكي اعتمادًا على متغيرات البيئة وروابط Render الفعلية
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3001',
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      process.env.RENDER_EXTERNAL_URL,
    ]
      .flatMap(value => (value || '').split(','))
      .map(value => value.trim())
      .filter(Boolean)
      .map(normalizeOrigin);

    const allowAllCors = process.env.ALLOW_ALL_CORS === 'true';

    if (allowAllCors) {
      console.warn('⚠️ ALLOW_ALL_CORS=true - permitting all origins temporarily (use only for debugging)');
      app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }));
      app.options('*', cors());
    } else {
      // Build a set of allowed hostnames for a more permissive match (ignores protocol/port differences)
      const allowedHostnames = allowedOrigins
        .map(o => {
          try {
            return new URL(o).hostname;
          } catch (e) {
            return o.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
          }
        })
        .filter(Boolean);

      app.use(cors({
        origin: (origin: any, callback: any) => {
          // Allow requests with no Origin (curl, server-to-server, same-origin)
          console.log('➡️ CORS check - incoming origin:', origin);
          if (!origin) return callback(null, true);

          // Extract hostname from the incoming origin and compare
          let incomingHostname = origin;
          try {
            incomingHostname = new URL(origin).hostname;
          } catch (e) {
            incomingHostname = origin.replace(/^https?:\/\//, '').replace(/:\d+$/, '');
          }

          console.log('   allowedHostnames:', allowedHostnames);
          if (allowedHostnames.includes(incomingHostname)) {
            console.log('   ✅ Origin allowed (hostname match):', incomingHostname);
            return callback(null, true);
          }

          console.warn('   ❌ Origin not allowed (hostname mismatch):', incomingHostname);
          return callback(new Error(`Not allowed by CORS: ${origin}`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      }));
      app.options('*', cors());
    }

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Health check route for debugging
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
    });

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/research', researchRoutes);

    // Error handling middleware
    app.use((err: any, req: any, res: any, next: any) => {
      console.error('🔴 Server Error:', err);
      res.status(err.status || 500).json({
        error: err.message || 'حدث خطأ في السيرفر',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });

    // خدم ملفات الواجهة إذا كانت موجودة في مجلد `dist` سواء في وضع الإنتاج أو أثناء الاختبار
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
    } else {
      app.get('/', (req, res) => res.send('API is running...'));
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });

  } catch (error: any) {
    console.error('❌ CRITICAL STARTUP ERROR:', error.message);
    process.exit(1);
  }
};

startServer();
