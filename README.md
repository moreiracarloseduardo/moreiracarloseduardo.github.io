# moreiracarloseduardo.github.io

[![Deploy to GitHub Pages](https://github.com/moreiracarloseduardo/moreiracarloseduardo.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/moreiracarloseduardo/moreiracarloseduardo.github.io/actions/workflows/deploy.yml)

Portfolio do Carlos Eduardo – publicado via GitHub Pages com build automático (Vite) usando GitHub Actions.

## Desenvolvimento local

- Requisitos: Node 18+ (recomendado 20)
- Instalar dependências e rodar:

```powershell
npm install
npm run dev
```

- Build de produção e preview local:

```powershell
npm run build
npm run preview
```

## Deploy automático (GitHub Pages)

Este repositório usa GitHub Actions para buildar e publicar o site a cada push na `main`.

1) Habilite GitHub Pages:
	- Repo → Settings → Pages → Build and deployment: `GitHub Actions`.

2) Workflow:
	- Arquivo: `.github/workflows/deploy.yml`
	- Faz `npm install`, `npm run build` e publica `dist` com as actions oficiais.

3) Publicar alterações:

```powershell
git add .
git commit -m "feat: conteúdo novo"
git push origin main
```

4) Acompanhar:
	- Aba Actions → ver jobs “Deploy to GitHub Pages”.
	- Site em: `https://moreiracarloseduardo.github.io`.

## Domínio customizado (opcional)

- Configure o domínio em Settings → Pages → Custom domain e ative `Enforce HTTPS`.
- Alternativamente, adicione um arquivo `CNAME` na raiz contendo o domínio (ex.: `www.seudominio.com`).

## Notas

- Não é necessário commitar a pasta `dist` (ela é gerada e publicada pelo CI).
- Se preferir builds totalmente reprodutíveis, commite `package-lock.json` e altere o step do workflow para `npm ci`.