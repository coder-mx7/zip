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

    app.use(cors());
    app.use(express.json());

    // Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/research', researchRoutes);

    if (process.env.NODE_ENV === 'production') {
      const distPath = path.join(process.cwd(), 'dist');
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
