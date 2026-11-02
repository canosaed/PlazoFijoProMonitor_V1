const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const publicDir = path.join(__dirname, '../public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // 1. 192x192
  await sharp(svgBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 12, g: 45, b: 72, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  // 2. 512x512
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 12, g: 45, b: 72, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  // 3. Maskable 512x512
  await sharp(svgBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 12, g: 45, b: 72, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'maskable-icon-512x512.png'));

  // 4. Apple Touch Icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 12, g: 45, b: 72, alpha: 1 } })
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('PWA Icons generated successfully in public/');
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
