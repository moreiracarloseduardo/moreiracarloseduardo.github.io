#!/usr/bin/env node
import { mkdir, cp, stat } from 'fs/promises';
import { existsSync } from 'fs';

async function safeCopy(src, dest){
  if(!existsSync(src)) return;
  await mkdir(dest, {recursive:true});
  await cp(src, dest, {recursive:true});
  console.log('[copy-static] Copiado', src, '->', dest);
}

(async()=>{
  await safeCopy('assets/js','dist/assets/js');
  await safeCopy('assets/plugins','dist/assets/plugins');
  await safeCopy('assets/images','dist/assets/images');
  await safeCopy('assets/css','dist/assets/css');
  await safeCopy('assets/i18n','dist/assets/i18n');
  await safeCopy('case','dist/case');
  await safeCopy('data','dist/data');
})();
