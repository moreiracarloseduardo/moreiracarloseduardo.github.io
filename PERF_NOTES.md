# Performance, Arquitetura e Estado do Projeto

Este documento consolida metas de performance, funcionalidades implementadas, estrutura do projeto, pipeline de build e o estado atual (incluindo pendências conhecidas, especialmente responsividade em telas pequenas nas páginas de Case Study).

---

## Metas de Performance (Mobile/Desktop)
- LCP < 2.0s (3G rápido / aparelho mid-tier)
- CLS < 0.02
- TTI < 2.5s
- Total JS executável < 170 KB (gzip) / < 420 KB (transfer)
- Imagens críticas ≤ 100 KB cada (após AVIF/WebP) ou com streaming progressivo
- CSS bloqueante de render < 7 KB (inline critical)

### Implementação Voltada à Performance
- Critical CSS automático com `critters` no pós-build (substitui bloco manual).
- Envelopamento automático de imagens com `<picture>` (AVIF/WebP) via script pós-build.
- Geração de AVIF/WebP com `sharp` (script `generate:images`).
- LQIP base64 (blur 32px, configurável via `LQIP_WIDTH`/`LQIP_QUALITY`).
- Sprite SVG de ícones para reduzir requisições externas.
- Prefetch de rotas (hover/viewport) para Case Studies.
- Prism.js em autoload apenas quando snippets são detectados.

---

## Funcionalidades Implementadas no Site
- Tema dark-only com tokens de design (cores, raios, sombras, espaçamentos) e acentos magenta/ciano.
- Hero com título em gradiente renderizado por canvas (robusto em Chromium e mobile), com re-render após i18n.
- Navegação com View Transitions API quando disponível.
- Prefetch de links (hover/viewport) para casos.
- Páginas dedicadas de Case Study: TennisVR, CandyWorld, IdleTrain, Ice Melt (SEO, OpenGraph, Twitter, JSON‑LD Article).
- I18n (EN/PT‑BR) para navegação, CTA, cards e partes dos cases.
- Grid de projetos responsivo (4→1 colunas), cartões com mídia padronizada e badges.
- Modais temáticas (About/Experience) com animação pop elástica, brilho/blur backdrop e atalho Enter.
- Remoção das prévias em modal ao clicar nas imagens dos cards (cards levam para a página do case).
- Integração Prism (autoload) para trechos de código nas páginas de Case.

---

## Estado Atual da Responsividade (IMPORTANTE)

Apesar dos ajustes aplicados, ainda existem problemas visíveis em telas pequenas, principalmente nas páginas dos Case Studies:

1) Navbar
- Em determinadas larguras, a largura/altura aparente não acompanha o container, dando a impressão de “maior/menor que a tela”.
- A correção parcial incluiu padronizar `.navbar .container { max-width: 1280px; width: 100% }` e resets de overflow, mas ainda requer calibração de padding/altura em breakpoints específicos.

2) Case Study (TennisVR, CandyWorld, IdleTrain, Ice Melt)
- Títulos, subtítulos e parágrafos receberam `clamp(...)`, porém há cenários onde o recálculo não reflete o esperado (especialmente em dispositivos estreitos com zoom/text scaling do OS).
- O layout (toc + conteúdo) já quebra para 1 coluna ≤ 992px, mas alguns elementos ainda não refluem da forma ideal (gaps/padding e tipografia precisam de refinamento adicional).
- GIF sobre a imagem hero agora respeita a proporção de arquivo, porém pode encobrir regiões relevantes dependendo do case; requer offsets por case.

3) Overflow/escala
- Foram adicionados resets para evitar overflow horizontal (`box-sizing: border-box` + `overflow-x: hidden`) e imagens são fluídas (`max-width:100%; height:auto`). Mesmo assim, blocos de código extensos precisam de validação em todos os cases.

Resumo: as páginas de Case Study “funcionam”, mas não estão com a responsividade final/afinada para todos os tamanhos de tela. É necessário um passe dedicado de QA com breakpoints específicos (360/390/414/768/820/1024) e ajustes finos por case.

### Plano de Correção (proposto)
1. Navbar: garantir consistência de altura/padding por breakpoint; validar toggler e largura do brand (≤ 360px).
2. Tipografia: reduzir clamps mínimos em títulos e subtítulos em ≤ 380px; ajustar line‑height.
3. TOC: opção recolhível (accordion) em mobile para liberar área de leitura.
4. GIF hero por case: `max-width` e offset vertical custom por página.
5. Snippets: `overflow-x:auto` já aplicado; revisar margens laterais em mobile.

---

## Pipeline de Build
1. `prebuild`: gera AVIF/WebP com `sharp`.
2. `vite build`.
3. `postbuild-picture.mjs`: envolve imagens com `<picture>` (AVIF/WebP).
4. `extract-critical.mjs`: extrai CSS crítico e in‑line.
5. `lqip-placeholders.mjs`: injeta placeholders blur + fade.

### Próximos Aprimoramentos (opcional)
- Code splitting adicional (hero vs case loader).
- Prefetch em hover com _partial HTML_ (pré-render ou hidratação leve).
- Caching forte (hash nos bundles padrão Vite, compatível com GitHub Pages).
- RUM (inline mínimo) para coletar `navigation` entries e enviar métricas anonimizadas.
- Preconnect/Preload condicionais só após interação.

### Auditoria Rápida (Checklist)
- [ ] Lighthouse Perf ≥ 90 (Mobile)
- [ ] LCP dentro da meta em 3 execuções consistentes
- [ ] Sem layout shift perceptível após interações iniciais
- [ ] Imagens no primeiro viewport (home) ≤ 500 KB total
- [ ] Sem erros de contraste no overlay a11y

### Como Regerar / Medir
```
npm run build
npx serve dist  # ou npm run preview
# DevTools > Lighthouse (mobile), rodar 3x e comparar
```

### Ajustes Rápidos
- LQIP: `export LQIP_WIDTH=40 LQIP_QUALITY=55` antes do build.
- Remover LQIP: comentar passo no postbuild (ou futura flag `NO_LQIP`).
- Critical: revisar opções em `extract-critical.mjs` (ex.: `pruneSource:true`).
- Bundle diff: `npx source-map-explorer dist/assets/*.js`.

---

## Estrutura de Pastas & Arquivos (atual)

```
.
├─ index.html
├─ README.md
├─ PERF_NOTES.md  # este documento
├─ omnisharp.json
├─ assets/
│  ├─ css/
│  │  └─ styles.css
│  ├─ js/
│  │  ├─ main.js
│  │  └─ i18n.js
│  ├─ i18n/
│  │  ├─ en.json
│  │  └─ pt-BR.json
│  ├─ images/
│  │  └─ projects/  # imagens e GIFs usados nos cards/cases
│  ├─ fontawesome/  # distribuição do FA (css/js/less/scss/metadata/...)
│  └─ plugins/
│     ├─ bootstrap/ (css/js)
│     ├─ popper.min.js
│     ├─ dark-mode-switch/ (...)
│     ├─ github-activity/ (...)
│     ├─ github-calendar/ (...)
│     └─ vanilla-rss/
├─ case/
│  ├─ tennisvr/
│  │  └─ index.html
│  ├─ candyworld/
│  │  └─ index.html
│  ├─ idletrain/
│  │  └─ index.html
│  └─ icemelt/
│     └─ index.html
├─ plugins/  # (se existir raiz)
├─ scss/     # fontes originais de estilos (se usados)
└─ dist/     # saída do build (se versionada)
```

Notas:
- O repositório também contém a distribuição completa do FontAwesome em `assets/fontawesome` (múltiplos formatos e metadados).
- Os cases possuem SEO/OG/JSON‑LD próprios e usam os mesmos tokens de design.

---

## Estado Recente de Implementações
- Remoção das modais de prévia dos projetos na home.
- Sobreposição do GIF centralizado sobre a imagem hero em todos os cases.
- Padronização do container máximo (1280px) e resets para overflow e box‑sizing.
- Adição de clamps tipográficos e media queries locais em todos os cases.

### Pendências Principais
- Responsividade fina da navbar (padding/altura por breakpoint) e do conteúdo dos cases (títulos, parágrafos, gaps, offsets do GIF) em telas pequenas.
- QA multiplataforma: iOS Safari/Chrome Android, tablets em retrato/paisagem, zoom do sistema, acessibilidade (Text Scaling).

---

## Próximas Ações Sugeridas
1) Passo dedicado de layout mobile (≤ 414 px) por case: ajustes de clamps, espaçamentos e offsets do GIF.
2) Navbar: padronizar alturas e paddings por breakpoint e validar toggler.
3) TOC recolhível em mobile para aumentar área de leitura.
4) Medição RUM leve para confirmar metas de LCP/TTI em dispositivos reais.
5) Split de JS por página (home vs cases) se o bundle se aproximar do teto definido.

