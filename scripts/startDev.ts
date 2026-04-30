#!/usr/bin/env node

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const MONGODB_CHECK_TIMEOUT = 10000;

async function isMongoDBRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('netstat -ano | findstr ":27017"');
    return stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function startMongoDBIfNeeded(): Promise<void> {
  const isRunning = await isMongoDBRunning();
  
  if (isRunning) {
    console.log('✅ MongoDB is already running');
    return;
  }

  console.log('🔄 Starting MongoDB...');
  
  const mongoPath = 'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe';
  spawn(mongoPath, ['--dbpath', 'C:\\data\\db'], {
    detached: true,
    stdio: 'ignore',
  }).unref();

  // Wait for MongoDB to start
  let attempts = 0;
  while (attempts < 20) {
    const running = await isMongoDBRunning();
    if (running) {
      console.log('✅ MongoDB started successfully');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  console.error('❌ MongoDB failed to start');
  process.exit(1);
}

async function main() {
  try {
    await startMongoDBIfNeeded();
    
    console.log('\n🚀 Starting development servers...\n');
    
    // Start both server and client
    spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
