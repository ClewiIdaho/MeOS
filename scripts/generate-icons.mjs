#!/usr/bin/env node
/**
 * Generates the MY.OS PWA icon set from a single SVG source.
 * Outputs PNG icons sized for the manifest + Apple touch icon.
 * Run via: npm run generate-icons
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'public', 'icons');

await mkdir(outDir, { recursive: true });

// Premium dark gradient mark for MY.OS.
// "M·OS" minimal sigil — a violet→amber arc cradling a dot, on the deep-indigo base.
function buildSvg({ size, maskable }) {
  const padding = maskable ? size * 0.18 : 0;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const arcRadius = innerSize * 0.32;
  const dotRadius = innerSize * 0.085;
  const cornerRadius = maskable ? 0 : size * 0.22;
  const bg = maskable
    ? `<rect x="0" y="0" width="${size}" height="${size}" fill="#0A0918"/>`
    : `<rect x="0" y="0" width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bg)"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1C1A38"/>
      <stop offset="100%" stop-color="#0A0918"/>
    </linearGradient>
    <linearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#B190FF"/>
      <stop offset="55%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#F59E0B"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="rgba(139, 92, 246, 0.55)"/>
      <stop offset="100%" stop-color="rgba(139, 92, 246, 0)"/>
    </radialGradient>
    <filter id="soften" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size * 0.012}"/>
    </filter>
  </defs>
  ${bg}
  <circle cx="${cx}" cy="${cy}" r="${innerSize * 0.45}" fill="url(#glow)"/>
  <g filter="url(#soften)" stroke-linecap="round" fill="none">
    <path d="M ${cx - arcRadius} ${cy + arcRadius * 0.2}
             A ${arcRadius} ${arcRadius} 0 1 1 ${cx + arcRadius} ${cy + arcRadius * 0.2}"
          stroke="url(#arc)" stroke-width="${innerSize * 0.075}"/>
  </g>
  <circle cx="${cx}" cy="${cy + arcRadius * 0.55}" r="${dotRadius}" fill="#F4F1FF"/>
</svg>`;
}

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const t of targets) {
  const svg = buildSvg({ size: t.size, maskable: t.maskable });
  const outPath = resolve(outDir, t.name);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`  ✓ ${t.name} (${t.size}×${t.size})`);
}

// Also write the source SVG as the favicon.
const faviconSvg = buildSvg({ size: 64, maskable: false });
await writeFile(resolve(root, 'public', 'favicon.svg'), faviconSvg, 'utf8');
console.log(`  ✓ favicon.svg`);

console.log('\nIcon set generated.');
