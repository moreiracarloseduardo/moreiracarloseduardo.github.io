#!/usr/bin/env node
/**
 * extract-critical.mjs
 * Usa Critters para extrair critical CSS de dist/index.html + assets.
 * Estratégia:
 *  1. Carrega dist/index.html
 *  2. Injeta folha consolidada (já gerada pelo Vite) em memória e roda Critters.
 *  3. Substitui bloco <style id="critical-css"> existente pelo novo.
 *  4. Remove estilos redundantes inline se tamanho > 25KB (fallback para manter antigo se erro).
 */
import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import Critters from 'critters';
import { join } from 'path';

const DIST_HTML = 'dist/index.html';

async function run(){
  if(!existsSync(DIST_HTML)) { console.warn('[critical] dist/index.html não encontrado, pulando.'); return; }
  let html = await readFile(DIST_HTML,'utf8');
  // Encontrar primeiro <link ...styles.css ...>
  const linkMatch = html.match(/<link[^>]+href=("|')(.*?)assets\/css\/styles\.css\1[^>]*>/i);
  if(!linkMatch){ console.warn('[critical] Link para assets/css/styles.css não encontrado.'); }

  try {
    const critters = new Critters({
      path: 'dist',
      preload: 'swap',
      compress: true,
      pruneSource: false,
      reduceInlineStyles: true,
      logLevel: 'info'
    });
    const processed = await critters.process(html);
    // Extrair critical gerado (Critters injeta <style data-critical>)
    const styleMatch = processed.match(/<style[^>]*data-critical[^>]*>([\s\S]*?)<\/style>/);
    if(!styleMatch){ console.warn('[critical] Não foi possível localizar bloco critical gerado.'); return; }
    const criticalCss = styleMatch[0]
      .replace('data-critical','id="critical-css"');

    // Substituir bloco atual id="critical-css"
    if(/<style id="critical-css">[\s\S]*?<\/style>/.test(html)){
      html = html.replace(/<style id="critical-css">[\s\S]*?<\/style>/, criticalCss);
    } else {
      // Inserir antes do primeiro link stylesheet
      html = html.replace(/<link[^>]+href=("|')[^"']+styles\.css\1[^>]*>/i, criticalCss + '\n$&');
    }

    await writeFile(DIST_HTML, html, 'utf8');
    console.log('[critical] Critical CSS atualizado com sucesso.');
  } catch(e){
    console.error('[critical] Falha ao gerar critical:', e.message);
  }
}

run();
