export async function loadPartial(article, bindSnippets){
  const id = article.dataset.case; if(!id) return;
  const code = (localStorage.getItem('site_lang') || document.documentElement.getAttribute('lang') || 'en');
  const lang = code && code.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
  async function fetchLocaleFirst(){
    const localized = `data/partials/${lang}/${id}.html`;
    try {
      const r1 = await fetch(localized);
      if(r1.ok) return r1.text();
    } catch(_){}
    const r2 = await fetch(`data/partials/${id}.html`);
    if(!r2.ok) throw new Error('Partial not found');
    return r2.text();
  }
  try {
    const html = await fetchLocaleFirst();
    const inner = article.querySelector('.case-body-inner');
    if(inner){
      inner.innerHTML = html;
      article.dataset.loaded='1';
      bindSnippets(inner);
      if(window.Prism) Prism.highlightAllUnder(inner);
    }
  } catch(e){ console.warn('[case-loader] Falha ao carregar', id, e); }
}
