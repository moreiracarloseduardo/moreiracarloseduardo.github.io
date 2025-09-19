#!/usr/bin/env node
/**
 * Gera placeholders base64 blur (LQIP) para imagens em assets/images/projects.
 * - Cria miniaturas 32px de largura, converte para webp base64.
 * - Injeta data-lqip="..." no <img> correspondente dentro de dist/index.html.
 * - Adiciona classe 'lqip' e estilo inline background + transition.
 * - Script leve para fade-in: se não existir, injeta snippet.
 */
import sharp from 'sharp';
import { readdir, writeFile, readFile } from 'fs/promises';
import { statSync, existsSync } from 'fs';
import { join, extname } from 'path';

const SRC_DIR = 'assets/images/projects';
const DIST_HTML = 'dist/index.html';
const VALID = ['.png','.jpg','.jpeg'];

async function walk(dir, out=[]) {
  const items = await readdir(dir, {withFileTypes:true});
  for(const it of items){
    const full = join(dir,it.name);
    if(it.isDirectory()) await walk(full,out); else out.push(full);
  }
  return out;
}

const LQIP_WIDTH = parseInt(process.env.LQIP_WIDTH || '32',10);
const LQIP_QUALITY = parseInt(process.env.LQIP_QUALITY || '50',10);

async function genLqip(file){
  try {
    const buf = await sharp(file).resize({width:LQIP_WIDTH, withoutEnlargement:true}).webp({quality:LQIP_QUALITY}).toBuffer();
    return 'data:image/webp;base64,' + buf.toString('base64');
  } catch(e){ console.warn('[lqip] Falhou', file, e.message); return null; }
}

async function run(){
  if(process.env.NO_LQIP){
    console.log('[lqip] NO_LQIP definido - ignorando geração de placeholders.');
    return;
  }
  if(!existsSync(DIST_HTML)){ console.warn('[lqip] dist/index.html não encontrado. Rode build primeiro.'); return; }
  let html = await readFile(DIST_HTML,'utf8');
  const files = (await walk(SRC_DIR)).filter(f=>VALID.includes(extname(f).toLowerCase()));
  let count=0;
  for(const f of files){
    const lqip = await genLqip(f);
    if(!lqip) continue;
    const rel = f.replace(/\\/g,'/');
    // Substitui primeiro <img src="rel" ...> não processado ainda
  // Usa backreference ao delimitador de aspas capturado em grupo 2
  const regex = new RegExp(`<img([^>]*?)src=("|')${rel}(?:\\.avif|\\.webp)?\\2([^>]*)>`, 'i');
    // Tentativa fallback sem .avif|.webp (caso script picture já transformou)
    let m = html.match(regex);
    if(!m){
  const simple = new RegExp(`<img([^>]*?)src=("|')${rel}\\2([^>]*)>`, 'i');
      m = html.match(simple);
    }
    if(m){
      const tag = m[0];
      if(/data-lqip=/.test(tag)) continue;
      const enhanced = tag.replace('<img','<img data-lqip="'+lqip+'" class="lqip"');
      html = html.replace(tag, enhanced);
      count++;
    }
  }
  if(count){
    // Injeta estilo + script se não existe
    if(!/lqip-fade-style/.test(html)){
      html = html.replace('</head>', `<style id="lqip-fade-style">img.lqip{background:rgba(80,80,90,.18);filter:blur(12px);transition:filter .6s ease, background .6s ease;}img.lqip.loaded{filter:blur(0);background:transparent;}</style>\n</head>`);
    }
    if(!/lqip-init/.test(html)){
      html = html.replace('</body>', `<script id="lqip-init">(function(){document.querySelectorAll('img.lqip[data-lqip]').forEach(img=>{const tiny=img.getAttribute('data-lqip');if(tiny){img.style.backgroundImage='url('+tiny+')';img.style.backgroundSize='cover';}if(img.complete)img.classList.add('loaded');img.addEventListener('load',()=>img.classList.add('loaded'));});})();</script>\n</body>`);
    }
    await writeFile(DIST_HTML, html, 'utf8');
    console.log('[lqip] Placeholders adicionados em', count, 'imagens.');
  } else {
    console.log('[lqip] Nenhuma imagem processada.');
  }
}

run();
