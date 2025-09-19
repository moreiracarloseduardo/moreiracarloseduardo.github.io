(function(){
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'site_lang';
  const SUPPORTED = ['en','pt-BR'];
  const dictionaries = {};
  // Embedded dictionaries to work offline/local without fetch
  const EMBEDDED = {
  "en": {"nav":{"about":"About","projects":"Projects","experience":"Experience","contact":"Contact"},"header":{"darkMode":"Dark Mode","contactMe":"Contact Me"},"about":{"heading":"About Me"},"projects":{},"other":{},"experience":{},"aside":{},"footer":{"by":"Designed with love","for":"developers"},"buttons":{"viewDetails":"View details","collapse":"Collapse"},"snippet":{"expand":"Expand","collapse":"Collapse","copy":"Copy","copied":"Copied!","error":"Error"},"aria":{"case":{"expand":"Expand case study","collapse":"Collapse case study"}}},
  "pt-BR": {"nav":{"about":"Sobre","projects":"Projetos","experience":"Experiência","contact":"Contato"},"header":{"darkMode":"Modo escuro","contactMe":"Fale comigo"},"about":{"heading":"Sobre mim"},"projects":{},"other":{},"experience":{},"aside":{},"footer":{"by":"Criado com carinho","for":"desenvolvedores"},"buttons":{"viewDetails":"Ver detalhes","collapse":"Recolher"},"snippet":{"expand":"Expandir","collapse":"Recolher","copy":"Copiar","copied":"Copiado!","error":"Erro"},"aria":{"case":{"expand":"Expandir case study","collapse":"Recolher case study"}}}
  };
  // expose for inline fallback reads
  window.__i18nDicts = dictionaries;

  function setHtmlLang(code){
    document.documentElement.setAttribute('lang', code.startsWith('pt') ? 'pt-BR' : 'en');
    const og = document.querySelector('meta[property="og:locale"]');
    if (og) og.setAttribute('content', code.startsWith('pt') ? 'pt_BR' : 'en_US');
  }

  async function loadDict(code){
    if (dictionaries[code]) return dictionaries[code];
    const base = EMBEDDED[code] ? structuredClone(EMBEDDED[code]) : {};
    function deepMerge(target, src){
      for (const k in src){
        if (Object.prototype.toString.call(src[k]) === '[object Object]') {
          if (!target[k] || Object.prototype.toString.call(target[k]) !== '[object Object]') target[k] = {};
          deepMerge(target[k], src[k]);
        } else {
          target[k] = src[k];
        }
      }
      return target;
    }
    try {
      const url = `assets/i18n/${code}.json`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        dictionaries[code] = deepMerge(base, json);
      } else {
        dictionaries[code] = base; // fallback to embedded only
      }
    } catch (e) {
      console.warn('i18n: fetch failed, using embedded only', e);
      dictionaries[code] = base;
    }
    return dictionaries[code];
  }

  function tr(dict, key){
    return key.split('.').reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), dict) ?? null;
  }

  function applyTranslations(dict){
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = tr(dict, key);
      if (val == null) return;
      // Decide attribute vs text
      const attr = el.getAttribute('data-i18n-attr');
      if (attr) {
        el.setAttribute(attr, val);
      } else {
        el.textContent = val;
      }
    });
    // Refresh Bootstrap tooltips after changing titles
    if (window.bootstrap && bootstrap.Tooltip) {
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        try {
          const inst = bootstrap.Tooltip.getInstance(el);
          if (inst) { inst.dispose(); }
          new bootstrap.Tooltip(el);
        } catch { /* ignore */ }
      });
    }
    // Update dynamic labels for new case study toggle buttons
    document.querySelectorAll('.case-study .btn-toggle-case').forEach(btn => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.textContent = expanded ? (tr(dict,'buttons.collapse') || 'Collapse') : (tr(dict,'buttons.viewDetails') || 'View details');
      btn.setAttribute('aria-label', expanded ? (tr(dict,'aria.case.collapse')||'Collapse case study') : (tr(dict,'aria.case.expand')||'Expand case study'));
    });
    // Snippet buttons
    document.querySelectorAll('[data-snippet]').forEach(wrapper=>{
      const expanded = wrapper.classList.contains('expanded');
      const expandBtn = wrapper.querySelector('[data-expand]');
      const copyBtn = wrapper.querySelector('[data-copy]');
      if(expandBtn){
        expandBtn.textContent = expanded ? (tr(dict,'snippet.collapse')||'Collapse') : (tr(dict,'snippet.expand')||'Expand');
      }
      if(copyBtn){
        // Only reset if not in transient copied state (avoid overriding user feedback)
        if(copyBtn.textContent !== (tr(dict,'snippet.copied')||'Copied!')){
          copyBtn.textContent = tr(dict,'snippet.copy')||'Copy';
        }
      }
    });
    // Re-render hero gradient words after text changes
    try {
      if (window.renderHeroGradients) window.renderHeroGradients();
      if (window.__heroSplitGlyphs) window.__heroSplitGlyphs();
    } catch(_){}
  }

  async function setLanguage(code){
    if (!SUPPORTED.includes(code)) code = DEFAULT_LANG;
    const dict = await loadDict(code);
    applyTranslations(dict);
    localStorage.setItem(STORAGE_KEY, code);
    setHtmlLang(code);
    // Update selector badge
    const badge = document.getElementById('lang-current');
    if (badge) badge.textContent = code === 'pt-BR' ? 'PT' : 'EN';
  }

  function init(){
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = SUPPORTED.includes(saved) ? saved : DEFAULT_LANG;
    setLanguage(initial);

    // Wire dropdown
    document.querySelectorAll('[data-set-lang]').forEach(el => {
      el.addEventListener('click', () => setLanguage(el.getAttribute('data-set-lang')));
    });

    // Listen for collapse to update button labels with current locale
    document.querySelectorAll('.toggle-details').forEach((btn) => {
      const targetId = btn.getAttribute('data-bs-target');
      const collapseEl = document.querySelector(targetId);
      if (!collapseEl) return;
      collapseEl.addEventListener('show.bs.collapse', () => {
        const code = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
        const dict = dictionaries[code];
        const label = btn.querySelector('.label');
        if (dict && label) label.textContent = tr(dict,'buttons.collapse') || 'Collapse';
      });
      collapseEl.addEventListener('hide.bs.collapse', () => {
        const code = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG;
        const dict = dictionaries[code];
        const label = btn.querySelector('.label');
        if (dict && label) label.textContent = tr(dict,'buttons.viewDetails') || 'View details';
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
