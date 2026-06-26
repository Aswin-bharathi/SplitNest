import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve('public');
const svg = fs.readFileSync(path.join(root, 'icon.svg'));

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }
];

for (const { name, size } of sizes) {
  await sharp(svg).resize(size, size).png().toFile(path.join(root, name));
  console.log(`Generated ${name}`);
}
