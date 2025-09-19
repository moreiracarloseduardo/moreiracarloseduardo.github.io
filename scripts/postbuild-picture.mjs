#!/usr/bin/env node
/**
 * postbuild-picture.mjs
 * Envolve <img> em <picture> automaticamente quando encontrar versões .avif/.webp geradas pelo script generate-images.
 * Regras:
 *  - Processa todos os .html em dist/ recursivamente
 *  - Ignora imagens já dentro de <picture>
 *  - Mantém atributos width/height/alt/decoding/loading/fetchpriority
 *  - Adiciona data-auto-picture para idempotência (não reprocessar)
 *  - Suporta caminhos relativos (assets/images/...)
 */
import { readFile, writeFile, readdir } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join } from 'path';

const DIST_DIR = 'dist';
const FOLDERS = [
  'assets/images/projects',
  'assets/images',
  'assets/img'
];

async function getHtmlFiles(dir, out=[]) {
  const entries = await readdir(dir, {withFileTypes:true});
  for(const e of entries){
    const full = join(dir, e.name);
    if(e.isDirectory()) await getHtmlFiles(full,out);
    else if(/\.html$/i.test(e.name)) out.push(full);
  }
  return out;
}

function eligible(src){
  if(/\.svg$/i.test(src)) return false;
  return FOLDERS.some(f=>src.startsWith(f+'/'));
}

async function processFile(file){
  let html = await readFile(file,'utf8');
  if(/data-auto-picture/.test(html)) {
    // Pode haver outras imagens ainda não processadas, seguimos mesmo assim
  }
  const IMG_REGEX = /<img\b([^>]*?)>/g;
  let match; let out=''; let last=0; let converted=0;
  while((match = IMG_REGEX.exec(html))){
    const tag = match[0]; const attrs = match[1];
    const startPos = match.index; const context = html.slice(Math.max(0,startPos-200), startPos);
    if(/<picture[^>]*?>[^<]*$/i.test(context)) continue;
    const srcMatch = attrs.match(/\bsrc\s*=\s*"([^"]+)"/i); if(!srcMatch) continue;
    const src = srcMatch[1]; if(!eligible(src)) continue;
  const avif = src + '.avif'; const webp = src + '.webp';
  // Variantes responsivas
  const avif320 = src + '-320.avif';
  const avif640 = src + '-640.avif';
  const webp320 = src + '-320.webp';
  const webp640 = src + '-640.webp';
  if(!existsSync(avif) && !existsSync(webp)) continue;
    const keep = attrs.match(/(alt|width|height|loading|decoding|fetchpriority)="[^"]*"/gi) || [];
    const alt = attrs.match(/alt="[^"]*"/i) || ['alt=""'];
    function buildSrcSet(base, full, w320, w640){
      const parts=[]; if(existsSync(w320)) parts.push(`${w320} 320w`); if(existsSync(w640)) parts.push(`${w640} 640w`); parts.push(`${full} 800w`); return parts.join(', '); }
    const sources=[];
    if(existsSync(avif)){
      const srcsetAvif = buildSrcSet(src, avif, avif320, avif640);
      sources.push(`<source type="image/avif" srcset="${srcsetAvif}" sizes="(max-width:600px) 90vw, 480px">`);
    }
    if(existsSync(webp)){
      const srcsetWebp = buildSrcSet(src, webp, webp320, webp640);
      sources.push(`<source type="image/webp" srcset="${srcsetWebp}" sizes="(max-width:600px) 90vw, 480px">`);
    }
    const picture = `<picture data-auto-picture>\n  ${sources.join('\n  ')}\n  <img ${['src="'+(existsSync(webp320)? webp320: webp||avif||src)+'"', ...keep.filter(a=>!a.startsWith('alt=')), alt[0]].join(' ')} />\n</picture>`;
    out += html.slice(last, match.index) + picture; last = match.index + tag.length; converted++;
  }
  out += html.slice(last);
  if(converted){ await writeFile(file,out,'utf8'); console.log(`[auto-picture] ${file} => ${converted}`); }
  return converted;
}

async function run(){
  if(!existsSync(DIST_DIR)){ console.warn('[auto-picture] dist inexistente.'); return; }
  const htmlFiles = await getHtmlFiles(DIST_DIR);
  let total=0; for(const f of htmlFiles){ total += await processFile(f); }
  if(!total) console.log('[auto-picture] Nenhuma imagem elegível.'); else console.log(`[auto-picture] Total convertidas: ${total}`);
}

run();
