# ShaderToy - Hero Glitch Title (SDF/MSDF)

Este diretório contém um shader GLSL pronto para uso no ShaderToy que replica, de forma fiel, o efeito do título com glitch por letra + gradiente por “acento”.

Arquivos:
- `hero_glitch_sdf.glsl`: shader principal (copie o conteúdo para o editor do ShaderToy em `Image`).

## Canais do ShaderToy
- `iChannel0` (Obrigatório): atlas de fonte SDF ou MSDF em grid uniforme (padrão 16x6) cobrindo ASCII 32..126.
  - SDF mono: um canal (R), com distância assinada centrada em 0.5. 
  - MSDF: RGB. No topo do arquivo defina `#define USE_MSDF 1`.
- `iChannel1` (Obrigatório): textura 1xN onde cada pixel (R em 0..1) representa um código ASCII do texto (código/255).
  - Largura = número de caracteres (N). Altura = 1.
  - Ex.: para escrever " immersive experiences, seamless usability, and solid architecture" coloque o array de códigos ASCII correspondente.
- `iChannel2` (Opcional): textura 1xN com o “acento” por glyph (R em 0..1 mapeado para 1..4). 
  - Se ausente, o shader usa faixas de índices (constantes A1/A2/A3/A4) como fallback.

## Parâmetros de Layout
- `CELL_W`, `CELL_H`: tamanho da célula monoespaçada em pixels de tela.
- `BASELINE`: posição vertical da linha de base (0..1 da altura da tela).
- `GLYPH_SCALE`: escala dentro da célula para margem.

## Ajustes Visuais
- Paletas por acento: `pal1_a/b`, `pal2_a/b`, `pal3_a/b`, `pal4_a/b` — ajuste para bater com o site.
- Plano de fundo: `background()` com gradiente sutil similar ao site.
- Glitch: rate, jitter, skew, rotação, escala e flash configuráveis no topo.

## Como criar o atlas SDF/MSDF
- Use ferramentas como `msdf-bmfont`, `msdfgen` ou `bmfont` para gerar um atlas e métricas. 
- Para este shader, o atlas deve estar em grid uniforme (ex.: 16 colunas x 6 linhas). O índice do glyph é `(code - 32)`.
- Para monoespaçado, você não precisa de métricas; para proporcional, o shader precisaria de um canal adicional com offsets/advances.

## Como gerar a textura 1xN de texto (iChannel1)
1. Converta cada caractere do seu texto para código ASCII.
2. Para cada código, normalize em `[0,1]` dividindo por 255 e grave esse valor no canal R do pixel (G/B/A podem ser 0).
3. A largura da imagem deve ser exatamente N (quantidade de caracteres); altura 1.
   - Pode usar qualquer editor que permita escrever pixels precisos (ou gere via script).

## Dicas
- Se o texto estiver cortando nas bordas, ajuste `CELL_W/CELL_H` e/ou `GLYPH_SCALE`.
- Para cores mais próximas às do site, ajuste as paletas e o mapeamento vertical (no shader, `accentColor(accent, clamp(yIn,0,1))`).
- Chromatic aberration (`CHROMA`) é sutil para manter legibilidade; aumente com cuidado.

## Limitações
- O ShaderToy não aceita string dinâmica nativa; o texto vem da textura `iChannel1` ou editando constantes.
- Para MSDF, a suavização pode variar conforme o atlas; ajuste `sampleAlpha` se necessário.

Bom teste! Qualquer ajuste fino (paletas/acento/ranges) posso fazer junto com você.
