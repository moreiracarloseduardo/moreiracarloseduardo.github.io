# Documentação Completa do Projeto

## Visão Geral
Site de portfólio estático otimizado para performance, acessibilidade e modularidade. Usa Vite para build, carregamento sob demanda de conteúdos técnicos (case studies), otimização automática de imagens (AVIF/WebP), extração de Critical CSS e placeholders LQIP.

## Stack & Dependências
- Build: Vite (^5.x)
- Otimização de imagens: sharp
- Critical CSS: critters (pós-build)
- Front-end libs incluídas (locais ou CDN):
  - Bootstrap (CSS/JS) & Popper (assets/plugins)
  - Prism.js (CDN) para highlight de código sob demanda
- Sem FontAwesome (substituído por sprite SVG interno)

## Estrutura de Pastas (principais)
```
assets/
  css/ styles.css
  js/ main.js, case-loader.js, i18n.js
  images/ projects/... (imagens fonte)
  plugins/ bootstrap, dark-mode-switch, etc.
 data/partials/ (candyworld.html, idletrain.html, icemelt.html)
scripts/ (generate-images.mjs, postbuild-picture.mjs, extract-critical.mjs, lqip-placeholders.mjs, size-report.mjs)
index.html
PERF_NOTES.md
DOCS.md
```

## Fluxo de Build
1. `npm run generate:images` (executado em prebuild) – gera `.webp` e `.avif` para cada `.png|.jpg` em `assets/images/projects`.
2. `vite build` – gera bundles em `dist/`.
3. `postbuild-picture.mjs` – percorre todos os `.html` em `dist` e envolve `<img>` em `<picture>` se variantes WebP/AVIF existirem.
4. `extract-critical.mjs` – extrai Critical CSS real via Critters e substitui `<style id="critical-css">` no HTML final.
5. `lqip-placeholders.mjs` – gera LQIP (base64 blur) e injeta em `<img>` (pode ser desativado com `NO_LQIP=1`).

## Scripts (package.json)
- `dev`: ambiente de desenvolvimento com Vite.
- `build`: pipeline completo (inclui prebuild e postbuild).
- `preview`: servidor de preview do Vite.
- `generate:images`: conversão AVIF/WebP via sharp.
- `postbuild` (interno): roda auto-picture + critical + lqip.
- `size:report`: relatório de tamanhos (JS/CSS/Imagens) + gzip estimado.
- `img:convert`: alternativa PowerShell (usa cwebp/avifenc se instalados globalmente).

## Variáveis de Ambiente
- `LQIP_WIDTH` (padrão 32) e `LQIP_QUALITY` (padrão 50) ajustam geração dos placeholders.
- `NO_LQIP=1` desativa etapa de placeholders.

### Exemplos
```
# Build sem LQIP
$env:NO_LQIP=1; npm run build

# LQIP maior e melhor qualidade
$env:LQIP_WIDTH=48; $env:LQIP_QUALITY=60; npm run build
```

## Carregamento Dinâmico (Case Studies)
- Cada `article.case-study` exceto TennisVR carrega conteúdo de `data/partials/<id>.html` somente ao expandir.
- Prefetch: ao passar o mouse ou focar no botão de expandir ocorre pré-carregamento assíncrono em idle.
- Split JS: módulo `case-loader.js` importado dinamicamente (code splitting do bundle principal).

## Acessibilidade
- Skip link `Skip to content`.
- Foco gerenciado após expansão de case (primeiro heading recebe foco).
- Live region `#live-region` para feedback de cópia de snippets.
- Atalho `Alt + C` abre painel de contraste persistente.
- Teclas Enter/Espaço em elementos com `role=button` simulam clique.

## Performance
Ver metas detalhadas em `PERF_NOTES.md`. Resumo implementado:
- Critical CSS real (Critters).
- Auto `<picture>` + AVIF/WebP.
- LQIP blur base64 + fade-in.
- Lazy load do conteúdo longo dos case studies.
- Preload da imagem de perfil (LCP provável) + fetchpriority.
- Sprite SVG inline evita requisições extras.
- Srcset responsivo (320w/640w + full) gerado no pós-build.
- Prefetch adaptativo de partials (rede lenta/dados economizados desativa).
- RUM (LCP, CLS, FID, INP, TTFB) com persistência local e endpoint configurável.

### RUM e Persistência Local
O script inline coleta: `LCP`, `CLS`, `FID`, `INP` (maior interação relevante), `TTFB` e armazena última série (até 5) em `localStorage.rum_history`. Também envia beacon para `/api/rum` (ajustável via `window.RUM_ENDPOINT`). INP filtrado para eventos: click, keydown, keyup, pointerup, pointerdown.

### Prefetch Adaptativo
Após o primeiro case expandido, partials restantes são pré-carregados respeitando:
- Data Saver / 2g: prefetch desativado.
- 3g: 1 parcial a cada 2000ms.
- 2g/saveData: nenhum prefetch.
- Rápida: ~800ms entre partials.
Uso de `requestIdleCallback` e cancelamento em `visibilitychange`.

## Deploy (GitHub Pages)
1. Build: `npm run build`.
2. Commit e push da pasta (o `dist/` pode ser publicado ou usar raiz com build integrado). Opções:
   - Publicar branch `gh-pages` com conteúdo de `dist/`.
   - Se o repositório já serve a raiz (user/organization site), copiar artefatos de `dist/` para root ou apontar Pages para `/`.
3. Configurar em Settings > Pages > Branch.

### Deploy Manual Automático ex (PowerShell)
```
npm run build
robocopy dist . /MIR /XF *.map
git add .
git commit -m "build: publish"
git push origin main
```
(Se usando user site `username.github.io`, a raiz já é servida.)

## Atualização de Ícones
- Adicionar novo `<symbol>` dentro do sprite em `index.html`.
- Usar `<svg class="icon"><use href="#id"/></svg>` no markup.

## Adicionando Novo Case Study
1. Criar `data/partials/novocase.html`.
2. Adicionar card resumido em featured e/ou bloco `#case-studies-more` (atributo `data-case="novocase"`).
3. Garantir que botões tenham `.btn-toggle-case`.

## Scripts Internos – Detalhes
### postbuild-picture.mjs
Transforma `<img>` em `<picture>` se versões `.avif` ou `.webp` existirem. Idempotente via `data-auto-picture`.
### extract-critical.mjs
Usa Critters com `preload: swap`. Substitui bloco existente `#critical-css`.
### lqip-placeholders.mjs
Gera base64 para cada imagem original (32px) e injeta `data-lqip`. Define classe `lqip` para blur inicial.
### generate-images.mjs
Percorre diretório de projetos e cria `.avif`/`.webp` com parâmetros fixos (qualidade 82 / avif cq 28 speed 6).
### size-report.mjs
Lista assets e estimativa gzip para vigilância de budget.

## Troubleshooting
| Sintoma | Causa | Solução |
|--------|-------|---------|
| Placeholders não aparecem | LQIP desativado | Remover `NO_LQIP` ou rebuild |
| Imagens não viram `<picture>` | AVIF/WebP ausentes | Rodar `npm run generate:images` antes do build |
| Conteúdo longo não carrega | Falha fetch parcial | Ver console; checar caminho `data/partials/<id>.html` |
| Syntax highlight não aparece | Prism não carregou antes do highlight | Ver rede (CDN) e reabrir case (expand/collapse) |
| Painel contraste não abre | Atalho não detectado | Confirmar `Alt + C` sem outros modificadores |

## Expansões Futuras (Sugestões)
- RUM (Real User Metrics) com envio de LCP/CLS para endpoint serverless.
- Cache preemptivo usando `IntersectionObserver` para partials próximos do viewport.
- Geração de variantes responsivas (srcset sizes) e compressão AVIF animada para GIFs.
- Inline de ícones críticos (subset do sprite removendo símbolos não usados).

## Notas de Subset de Fontes (Planejamento)
- Objetivo: reduzir payload de webfonts usando `text=` para subsets e formatos otimizados.
- Estratégias:
  - Google Fonts com `&text=` limitado às strings usadas no site (por idioma). Ex:
    - `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap&text=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789%20-–—_.,:;!@()[]{}
`
  - Split por locale: carregar subset `en` vs `pt-BR` ao trocar idioma (via `i18n.js`).
  - Self-host opcional: baixar TTF/OTF, gerar WOFF2 subset com ferramentas como `pyftsubset` (fonttools) ou `glyphhanger` e servir local.
- Pipeline sugerido:
  1. Levantar caracteres usados: extrair texto de `index.html` + JSONs `assets/i18n/*.json`.
  2. Gerar lista única de glyphs por locale.
  3. Produzir WOFF2 subset e ajustar `@font-face` em `styles.css` (pré-carregar apenas títulos se necessário).
- Comandos (exemplos):
  - Glyphhanger (Node)
    ```powershell
    npx glyphhanger --whitelist="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-–—_.,:;!@()[]{} áàãâéêíóôõúçÁÀÃÂÉÊÍÓÔÕÚÇ" --formats=woff2 --subset=./fonts/Montserrat.ttf --US_ASCII
    ```
  - fonttools (Python)
    ```powershell
    pyftsubset .\fonts\Montserrat.ttf --output-file=.\fonts\Montserrat-subset.woff2 --flavor=woff2 --layout-features='*' --unicodes='U+0020-007E,U+00A0-00FF'
    ```
- Boas práticas:
  - Usar apenas WOFF2 para navegadores modernos.
  - Pré-carregar somente a variante crítica (ex: display 700).
  - Evitar muitas variações de peso; 400/700 geralmente bastam.

## Licenças
- Template original (atribuição mantida no footer conforme requisito).
- Dependências mantêm suas licenças (Bootstrap, Prism, etc.).

---
Dúvidas adicionais: consulte também `PERF_NOTES.md` para metas de performance ou solicite um relatório de evolução.
