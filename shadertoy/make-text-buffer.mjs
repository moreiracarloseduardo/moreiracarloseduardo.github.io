#!/usr/bin/env node
// Gera PNG 1xN com códigos ASCII no canal R (0..255) para usar como iChannel1 no ShaderToy
import sharp from 'sharp';
import { writeFile } from 'fs/promises';

const text = process.argv.slice(2).join(' ') || 'Game Developer focused on immersive experiences, seamless usability, and solid architecture';
const codes = Array.from(text).map(c => c.charCodeAt(0) & 255);
const W = codes.length, H = 1, channels = 3; // RGB
const data = Buffer.alloc(W*H*channels, 0);
for (let x=0; x<W; x++) {
  data[x*3 + 0] = codes[x]; // R
}
await sharp(data, {raw:{width:W,height:H,channels}})
  .png({compressionLevel:9})
  .toFile('shadertoy/text-1xN.png');
console.log('OK:', W,'chars -> shadertoy/text-1xN.png');
