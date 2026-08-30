import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sourceImage = 'C:/Users/hmjsa/.gemini/antigravity-ide/brain/6d3aaf70-22a5-40b4-b8fd-258fa29fa845/.user_uploaded/media_1788105105354.png';
const resDir = 'c:/xampp/htdocs/Android/app/src/main/res';

const iconSizes = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function generateIcons() {
  console.log('🖼️ Generating Android app icons from source image...');

  for (const { dir, size } of iconSizes) {
    const targetDir = path.join(resDir, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Square / Adaptive icon
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // Round icon (with circular mask)
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff" /></svg>`
    );

    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    console.log(`✓ Generated ${dir} (${size}x${size})`);
  }

  // Also generate 512x512 high-res store / web icons
  await sharp(sourceImage)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(resDir, 'drawable/ic_launcher_512.png'));

  // Also update public/logo.svg / icon if desired
  await sharp(sourceImage)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile('c:/xampp/htdocs/public/logo.png');

  console.log('🎉 All Android icons generated successfully!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
