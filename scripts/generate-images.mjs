#!/usr/bin/env node
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';

const inputDir = 'assets/images/projects';
const targets = ['.png','.jpg','.jpeg'];

async function walk(dir){
  const out=[]; const entries = await readdir(dir, {withFileTypes:true});
  for(const e of entries){
    const full = join(dir,e.name);
    if(e.isDirectory()) out.push(...await walk(full)); else out.push(full);
  }
  return out;
}

function derived(file, ext){ return file+ext; }

(async()=>{
  const files = (await walk(inputDir)).filter(f=>targets.includes(extname(f).toLowerCase()));
  for(const f of files){
    const base = basename(f);
    try {
      const img = sharp(f);
      // Full size
      await img.clone().webp({quality:82}).toFile(f+'.webp');
      await img.clone().avif({cqLevel:28, speed:6}).toFile(f+'.avif');
      // Responsive variants
      const meta = await img.metadata();
      const widths = [320, 640];
      for(const w of widths){
        if(meta.width && meta.width < w) continue; // não upscaling
        await img.clone().resize({width:w}).webp({quality:80}).toFile(f+`-${w}.webp`);
        await img.clone().resize({width:w}).avif({cqLevel:30,speed:6}).toFile(f+`-${w}.avif`);
      }
      console.log('Converted + variants', base);
    } catch(e){ console.warn('Skip', base, e.message); }
  }
})();
