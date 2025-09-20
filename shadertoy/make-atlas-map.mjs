#!/usr/bin/env node
// Converte o JSON do msdf-atlas-gen (empacotado) em um mapa 1xN RGBA (iChannel3)
// onde cada pixel = (u0,v0,u1,v1) por glyph index.
// Requer: atlas PNG (para saber dimensões), JSON com campos por glyph (x,y,w,h, code).
import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const atlasPath = process.argv[2] || 'shadertoy/font/atlas-msdf.png';
const jsonPath  = process.argv[3] || 'shadertoy/font/atlas-msdf.json';
const outPath   = process.argv[4] || 'shadertoy/atlas-map.png';

const atlasMeta = await sharp(atlasPath).metadata();
const W = atlasMeta.width, H = atlasMeta.height;
const json = JSON.parse(await readFile(jsonPath, 'utf8'));

// Detect formats
let glyphArray = null;
if (Array.isArray(json.glyphs)) glyphArray = json.glyphs;
else if (Array.isArray(json.chars)) glyphArray = json.chars;
else if (Array.isArray(json.characters)) glyphArray = json.characters;
else if (json.pages && json.pages[0] && Array.isArray(json.pages[0].chars)) glyphArray = json.pages[0].chars;

// Some exporters (like fonts.varg.dev) provide an object { characters: {"A":{...}, "B":{...}} }
let glyphObj = null;
if (!glyphArray && json.characters && typeof json.characters === 'object' && !Array.isArray(json.characters)) {
  glyphObj = json.characters;
}

if (!glyphArray && !glyphObj) throw new Error('Não encontrei glyphs no JSON (glyphs/chars/characters).');

// Map by ASCII code 0..255
const MAXC = 256;
const rects = new Array(MAXC).fill(null);

function pushGlyph(rec){
  const code = rec.code;
  const x = rec.x, y = rec.y, w = rec.w, h = rec.h;
  if (code==null || x==null || y==null || w==null || h==null) return;
  if (code<0 || code>=MAXC) return;
  // JSON normalmente usa origem no topo-esquerda; converter para UVs GL (origem inferior-esquerda)
  const u0 = x / W;
  const u1 = (x + w) / W;
  const vTop = y / H;
  const vBottom = (y + h) / H;
  const v1 = 1 - vTop;     // topo do retângulo -> v alto
  const v0 = 1 - vBottom;  // base do retângulo -> v baixo
  rects[code] = [u0,v0,u1,v1];
}

if (glyphArray) {
  for (const g of glyphArray){
    const code = (g.unicode != null) ? g.unicode : (g.id != null ? g.id : g.code);
    const x = g.x ?? g.atlas?.x ?? g.rect?.x;
    const y = g.y ?? g.atlas?.y ?? g.rect?.y;
    const w = g.w ?? g.width   ?? g.rect?.w ?? g.rect?.width;
    const h = g.h ?? g.height  ?? g.rect?.h ?? g.rect?.height;
    pushGlyph({code,x,y,w,h});
  }
} else if (glyphObj) {
  for (const k of Object.keys(glyphObj)){
    const g = glyphObj[k];
    const code = (k && k.length) ? k.codePointAt(0) : null;
    const x = g.x, y = g.y, w = g.width ?? g.w, h = g.height ?? g.h;
    pushGlyph({code,x,y,w,h});
  }
}

// Export 1x256 code-indexed map (R= u0, G= v0, B= u1, A= v1)
const outW = 256, outH = 1, channels = 4;
const data = Buffer.alloc(outW*outH*channels, 0);
for (let i=0;i<outW;i++){
  const r = rects[i] || [0,0,0,0];
  // Normalize to 0..255
  data[i*4+0] = Math.round(r[0]*255);
  data[i*4+1] = Math.round(r[1]*255);
  data[i*4+2] = Math.round(r[2]*255);
  data[i*4+3] = Math.round(r[3]*255);
}
await sharp(data, {raw:{width:outW,height:outH,channels}})
  .png({compressionLevel:9})
  .toFile(outPath);
console.log('OK: atlas map ->', outPath, ' (1x'+outW+')');
