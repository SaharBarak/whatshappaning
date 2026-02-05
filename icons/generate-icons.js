/**
 * PWA Icon Generator
 * Run with Node.js to generate PNG icons from SVG
 * Usage: node generate-icons.js
 * 
 * Requires: npm install sharp
 * Or manually create icons using an image editor
 */

const fs = require('fs');
const path = require('path');

// SVG template for the icon
const createSVG = (size, maskable = false) => {
  const padding = maskable ? size * 0.1 : 0;
  const innerSize = size - (padding * 2);
  const center = size / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a1a2e"/>
      <stop offset="100%" style="stop-color:#0a0a0f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#00d4ff"/>
      <stop offset="100%" style="stop-color:#7c3aed"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.15}"/>
  
  <!-- Cosmic ring -->
  <circle cx="${center}" cy="${center}" r="${innerSize * 0.35}" 
          fill="none" stroke="url(#accent)" stroke-width="${size * 0.02}" opacity="0.5"/>
  
  <!-- Inner ring -->
  <circle cx="${center}" cy="${center}" r="${innerSize * 0.25}" 
          fill="none" stroke="url(#accent)" stroke-width="${size * 0.015}" opacity="0.7"/>
  
  <!-- Center dot -->
  <circle cx="${center}" cy="${center}" r="${innerSize * 0.08}" fill="url(#accent)"/>
  
  <!-- Orbital dots -->
  <circle cx="${center}" cy="${center - innerSize * 0.35}" r="${innerSize * 0.03}" fill="#00d4ff"/>
  <circle cx="${center + innerSize * 0.3}" cy="${center + innerSize * 0.17}" r="${innerSize * 0.025}" fill="#7c3aed"/>
  <circle cx="${center - innerSize * 0.3}" cy="${center + innerSize * 0.17}" r="${innerSize * 0.025}" fill="#00d4ff" opacity="0.7"/>
  
  <!-- Data lines -->
  <line x1="${center - innerSize * 0.15}" y1="${center + innerSize * 0.35}" 
        x2="${center - innerSize * 0.05}" y2="${center + innerSize * 0.35}" 
        stroke="#00d4ff" stroke-width="${size * 0.01}" opacity="0.6"/>
  <line x1="${center}" y1="${center + innerSize * 0.35}" 
        x2="${center + innerSize * 0.15}" y2="${center + innerSize * 0.35}" 
        stroke="#7c3aed" stroke-width="${size * 0.01}" opacity="0.6"/>
</svg>`;
};

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

// Generate SVG files
const iconsDir = __dirname;

console.log('Generating PWA icons...');

sizes.forEach(size => {
  const svg = createSVG(size, false);
  const filename = path.join(iconsDir, `icon-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created: icon-${size}.svg`);
});

maskableSizes.forEach(size => {
  const svg = createSVG(size, true);
  const filename = path.join(iconsDir, `icon-maskable-${size}.svg`);
  fs.writeFileSync(filename, svg);
  console.log(`Created: icon-maskable-${size}.svg`);
});

console.log(`
SVG icons generated! To convert to PNG:

Option 1: Use sharp (Node.js)
  npm install sharp
  Then modify this script to use sharp for conversion

Option 2: Use ImageMagick
  for f in *.svg; do convert "$f" "\${f%.svg}.png"; done

Option 3: Use online converter
  Upload SVGs to cloudconvert.com or similar

Option 4: Use browser + canvas
  Open each SVG in browser, capture as PNG
`);
