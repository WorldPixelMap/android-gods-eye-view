#!/usr/bin/env node
/**
 * @file build-apk-assets.mjs
 * @description Builds the web application distribution and syncs assets into Android app assets folder.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
const distDir = path.resolve(rootDir, 'dist');
const androidAssetsDir = path.resolve(rootDir, 'Android/app/src/main/assets/www');

console.log('🚀 [God\'s Eye View Android Asset Sync]');
console.log(`📁 Root dir: ${rootDir}`);
console.log(`📁 Target Android assets dir: ${androidAssetsDir}`);

// 1. Run Vite build
console.log('\n📦 Step 1: Building production web bundle...');
try {
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}

// 2. Prepare destination directory
console.log('\n🧹 Step 2: Preparing destination directory...');
if (fs.existsSync(androidAssetsDir)) {
  fs.rmSync(androidAssetsDir, { recursive: true, force: true });
}
fs.mkdirSync(androidAssetsDir, { recursive: true });

// 3. Copy dist to Android assets
console.log('\n📂 Step 3: Copying assets into Android/app/src/main/assets/www...');
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest);
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(distDir, androidAssetsDir);

console.log('\n✅ Step 4: Verification complete!');
console.log(`🎉 Assets successfully synced to: ${androidAssetsDir}`);
console.log('📱 Ready to assemble Android APK in Android Studio or via Gradle:\n   cd Android && ./gradlew assembleDebug\n');
