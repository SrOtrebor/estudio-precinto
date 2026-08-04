import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgPath = resolve(__dirname, '../src/assets/logo-precinto.svg');
const outPath = resolve(__dirname, '../src/assets/logo-precinto-excel.png');

const svgBuffer = readFileSync(svgPath);

// Convertir a PNG con fondo #1a3a2a (verde oscuro de marca) y tamaño generoso
await sharp(svgBuffer)
  .resize(480, 150, { fit: 'contain', background: { r: 10, g: 35, b: 25, alpha: 1 } })
  .flatten({ background: { r: 10, g: 35, b: 25 } })
  .png()
  .toFile(outPath);

console.log('✅ Logo convertido y guardado en:', outPath);
