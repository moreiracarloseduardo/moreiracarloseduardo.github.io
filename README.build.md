# Build & Dev

## Requisitos
- Node.js 18+

## Instalar dependências
```powershell
npm install
```

## Ambiente de desenvolvimento
```powershell
npm run dev
```
Acesse o endereço exibido (default: http://localhost:5173).

## Build produção
```powershell
npm run build
```
Arquivos otimizados em `dist/`.

## Preview do build
```powershell
npm run preview
```

## Próximas otimizações possíveis
- Extrair Critical CSS (inline acima da dobra) e carregar restante async.
- Agrupar JS custom em único bundle minificado (Vite já minifica em build).
- Imagens: gerar variações WebP/AVIF e `srcset`.
- Split de JSON de case studies via dynamic import (code splitting).
