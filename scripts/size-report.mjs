#!/usr/bin/env node
/**
 * size-report.mjs
 * Gera relatório de tamanhos: arquivos fonte relevantes vs artefatos em dist.
 * - Lista JS, CSS, imagens (png/jpg/webp/avif) e totaliza.
 * - Exibe gzip estimado (aprox) usando compressão zlib nível 6.
 */
import { readdir, stat } from 'fs/promises';
import { createGzip } from 'zlib';
import { createReadStream } from 'fs';
import { extname, join } from 'path';

const DIST = 'dist';
const INCLUDE_EXT = new Set(['.js','.css','.png','.jpg','.jpeg','.webp','.avif','.svg']);

async function walk(dir, list=[]) {
  const entries = await readdir(dir, {withFileTypes:true});
  for(const e of entries){
    const full = join(dir,e.name);
    if(e.isDirectory()) await walk(full,list); else list.push(full);
  }
  return list;
}

function format(bytes){ if(bytes<1024) return bytes+' B'; const kb=bytes/1024; if(kb<1024) return kb.toFixed(1)+' KB'; return (kb/1024).toFixed(2)+' MB'; }

async function gzipSize(file){
  return new Promise(res=>{
    const gz = createGzip({level:6});
    let size=0; gz.on('data',c=>size+=c.length); gz.on('end',()=>res(size));
    createReadStream(file).pipe(gz);
  }).catch(()=>0);
}

async function run(){
  const files = (await walk(DIST)).filter(f=>INCLUDE_EXT.has(extname(f).toLowerCase()));
  const rows=[]; let total=0; let totalGz=0;
  for(const f of files){
    const s = await stat(f); total+=s.size; const gz = await gzipSize(f); totalGz+=gz;
    rows.push({file:f.replace(/^dist\\?/,'dist/'), size:s.size, sizeHuman:format(s.size), gzip:gz, gzipHuman:format(gz)});
  }
  rows.sort((a,b)=>b.size-a.size);
  console.table(rows.map(r=>({file:r.file,size:r.sizeHuman,gzip:r.gzipHuman})));
  console.log('\nTotals => raw:', format(total), ' gzip~:', format(totalGz));
}
run();
