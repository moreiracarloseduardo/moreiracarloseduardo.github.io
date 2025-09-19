"use strict";

// Bootstrap tooltips (guard if bootstrap missing)
try {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  [...tooltipTriggerList].forEach(el=>{ try { new bootstrap.Tooltip(el); } catch(_){} });
} catch(_) {}

// External widgets guarded (kept no-ops)
try { if (window.RSS && document.querySelector('#rss-feeds')) { /* disabled */ } } catch(_){ }
try { if (window.GitHubCalendar) new GitHubCalendar('#github-graph','IonicaBizau',{responsive:true}); } catch(_){ }
try { if (window.GitHubActivity) GitHubActivity.feed({username:'mdo',selector:'#ghfeed'}); } catch(_){ }

// i18n helper for snippet buttons
function getI18n(key,fallback){
  try {
    const code = localStorage.getItem('site_lang')||'en';
    const dict=(window.__i18nDicts&&window.__i18nDicts[code])||null;
    if(!dict) return fallback;
    return key.split('.').reduce((a,k)=>a&&a[k]!=null?a[k]:null, dict) ?? fallback;
  } catch { return fallback; }
}
const liveRegion = document.getElementById('live-region');

// Prefetch on hover for dedicated case pages
document.addEventListener('mouseover', e=>{
  const a = e.target.closest('a[data-prefetch="hover"]');
  if(!a || a.dataset.prefetched) return;
  a.dataset.prefetched = '1';
  try {
    const url = new URL(a.getAttribute('href'), location.href);
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url.href; l.as = 'document';
    document.head.appendChild(l);
  } catch(_){ }
}, {passive:true});

// Prefetch when link enters viewport
(function(){
  if(!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const a = entry.target;
        if(a.dataset.prefetched) return;
        a.dataset.prefetched='1';
        try {
          const url = new URL(a.getAttribute('href'), location.href);
          const l = document.createElement('link');
          l.rel='prefetch'; l.href=url.href; l.as='document'; document.head.appendChild(l);
        } catch(_){ }
        io.unobserve(a);
      }
    });
  }, {rootMargin: '200px 0px'});
  document.querySelectorAll('a[data-prefetch~="viewport"]').forEach(a=> io.observe(a));
})();

// Global keydown support for role=button (defensive)
document.addEventListener('keydown', e=>{
  if(e.target.matches('[role=button]') && !e.target.matches('button')){
    if(e.key==='Enter' || e.key===' '){ e.preventDefault(); e.target.click(); }
  }
});

// Snippet handlers
function bindSnippets(scope=document){
  scope.querySelectorAll('[data-snippet]').forEach(wrapper=>{
    if(wrapper.dataset.bound) return; wrapper.dataset.bound='1';
    const expandBtn = wrapper.querySelector('[data-expand]');
    const copyBtn = wrapper.querySelector('[data-copy]');
    if(expandBtn){
      expandBtn.addEventListener('click', ()=>{
        const exp = wrapper.classList.toggle('expanded');
        expandBtn.textContent = exp? getI18n('snippet.collapse','Collapse') : getI18n('snippet.expand','Expand');
        if(exp){ wrapper.style.maxHeight='none'; } else { wrapper.style.maxHeight=''; }
      });
    }
    if(copyBtn){
      copyBtn.addEventListener('click', ()=>{
        const code = wrapper.querySelector('pre code'); if(!code) return;
        try { navigator.clipboard.writeText(code.textContent.trim()); copyBtn.textContent=getI18n('snippet.copied','Copied!'); if(liveRegion) liveRegion.textContent=getI18n('snippet.copied','Copied!'); setTimeout(()=> copyBtn.textContent=getI18n('snippet.copy','Copy'),1600);} catch { copyBtn.textContent=getI18n('snippet.error','Error'); setTimeout(()=> copyBtn.textContent=getI18n('snippet.copy','Copy'),1600);} });
    }
  });
}

// Prism loader: ensure theme CSS is attached only once
let prismLoading = false;
let prismThemeLoaded = false;
function ensurePrism(){
  if(window.Prism) return;
  if(prismLoading) return;
  prismLoading = true;
  if(!prismThemeLoaded){
    const link = document.createElement('link');
    link.rel='stylesheet'; link.href='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css';
    document.head.appendChild(link);
    prismThemeLoaded = true;
  }
  const core = document.createElement('script');
  core.src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js';
  core.defer=true;
  core.onload=()=>{
    const auto = document.createElement('script');
    auto.src='https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js';
    auto.defer=true; 
    auto.onload = ()=>{ try { if(window.Prism) Prism.highlightAll(); } catch(_){} };
    document.head.appendChild(auto);
  };
  document.head.appendChild(core);
}

function init(){
  bindSnippets();
  if(document.querySelector('[data-snippet]')) ensurePrism();
  try { if (window.renderHeroGradients) window.renderHeroGradients(); } catch(_){ }

  // Fancy modal open with glow pulse + optional view transition
  document.querySelectorAll('[data-modal-open]').forEach(btn=>{
    if(btn.dataset.bound) return; btn.dataset.bound='1';
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      const sel = btn.getAttribute('data-modal-open');
      const modalEl = document.querySelector(sel);
      if(!modalEl) return;
      btn.classList.add('glow-pulse'); setTimeout(()=> btn.classList.remove('glow-pulse'), 550);
      const open = ()=>{
        try { const m = new bootstrap.Modal(modalEl); m.show(); } catch(_){ modalEl.classList.add('show'); modalEl.style.display='block'; }
      };
      if(document.startViewTransition){ document.startViewTransition(open); } else { open(); }
    });
    // Enter key opens modal when focused
    btn.addEventListener('keydown', (ev)=>{
      if(ev.key==='Enter'){ ev.preventDefault(); btn.click(); }
    });
  });

  // Disabled: picture click previews removed as per request
  // document.querySelectorAll('.project-card picture[data-preview-open]').forEach(pic=>{
  //   if(pic.dataset.bound) return; pic.dataset.bound='1';
  //   pic.style.cursor='pointer';
  //   pic.addEventListener('click', ()=>{
  //     const sel = pic.getAttribute('data-preview-open');
  //     const modalEl = document.querySelector(sel);
  //     if(!modalEl) return;
  //     const open = ()=>{ try { new bootstrap.Modal(modalEl).show(); } catch(_){ modalEl.classList.add('show'); modalEl.style.display='block'; } };
  //     if(document.startViewTransition){ document.startViewTransition(open); } else { open(); }
  //   });
  // });

  // Populate experience modal with real content (clone from hidden section)
  try{
    const src = document.querySelector('#experience .content');
    const dst = document.querySelector('#modal-experience .modal-body .xp-grid');
    if(src && dst && !dst.dataset.filled){
      dst.dataset.filled='1';
      // Simple mapping: create items from lists/paragraphs if exist, else keep i18n placeholders
      const blocks = src.querySelectorAll('section,article,div,ul,ol');
      if(blocks.length){
        dst.innerHTML='';
        blocks.forEach(b=>{
          const item = document.createElement('article');
          item.className='xp-item';
          const h = b.querySelector('h3,h4,h5'); if(h){ const t=document.createElement('h6'); t.className='xp-title'; t.textContent=h.textContent; item.appendChild(t); }
          const ul = b.querySelector('ul'); if(ul){ const clone=ul.cloneNode(true); clone.className='xp-list'; item.appendChild(clone); }
          const ps = b.querySelectorAll('p'); if(ps.length){ const u=document.createElement('ul'); u.className='xp-list'; ps.forEach(p=>{ const li=document.createElement('li'); li.textContent=p.textContent; u.appendChild(li); }); item.appendChild(u); }
          dst.appendChild(item);
        });
      }
    }
  }catch(_){ }
}
// Helper para abrir modal com Bootstrap e fallback
function openModalEl(el){
  try { new bootstrap.Modal(el, {focus:true, backdrop:true}).show(); }
  catch { el.classList.add('show'); el.style.display='block'; document.body.classList.add('modal-open'); }
}

// ---- Case Study Modal Loader ----
(function(){
  const CASES = {
    tennisvr: {
      id:'tennisvr',
      title: 'TennisVR – Precise Physics & Realistic Spin in VR',
      subtitle: 'Multi‑point proxy capsules + Magnus effect. Localized impact, predictable spin, and <0.3ms/frame cost.',
      tags: ['VR','Physics','Unity3D','Optimization'],
      cover: 'assets/images/projects/TennisVr.png',
      gif: 'assets/images/projects/tenisvr.gif'
    },
    candyworld: {
      id:'candyworld',
      title: 'CandyWorld – Dynamic Economy & Autonomous AI',
      subtitle: 'Idle management with automated production chain, autonomous helpers, and curve‑balanced progression.',
      tags: ['AI','Economy','Mobile','Systems'],
      cover: 'assets/images/projects/candy.jpg',
      gif: 'assets/images/projects/CandyWorld.gif'
    },
    idletrain: {
      id:'idletrain',
      title: 'IdleTrain – Procedural Bézier & Scalable Economy',
      subtitle: 'Procedural Bézier curves, 3→1 merge, scalable economy, and robust persistence.',
      tags: ['Procedural','Economy','Data'],
      cover: 'assets/images/projects/train.jpg',
      gif: 'assets/images/projects/IdleTrain.gif'
    },
    icemelt: {
      id:'icemelt',
      title: 'Ice Melt Race – Dynamic Shader & Segmented Physics',
      subtitle: 'Heatmap RenderTexture, melting shader, and optimized segmented cable physics with pooling.',
      tags: ['Shader','Physics','FX'],
      cover: 'assets/images/projects/ice.jpg',
      gif: 'assets/images/projects/IceMeltRope.gif'
    }
  };

  // Componente padronizado para montar case no modal
  const CaseModal = {
    el: () => document.getElementById('modal-case'),
    fields: () => ({
      title: document.getElementById('modal-case-title'),
      sub: document.getElementById('modal-case-sub'),
      tags: document.getElementById('modal-case-tags'),
      hero: document.getElementById('modal-case-hero'),
      content: document.getElementById('modal-case-content'),
    }),
    clear(){
      const {title, sub, tags, hero, content} = this.fields();
      if(title) title.textContent=''; if(sub) sub.textContent='';
      if(tags) tags.innerHTML=''; if(hero) hero.innerHTML=''; if(content) content.innerHTML='';
    },
    async render(meta, html){
      const {title, sub, tags, hero, content} = this.fields();
      title.textContent = meta.title;
      sub.textContent = meta.subtitle || '';
      // Hero
      const picture = document.createElement('picture');
      const avif = document.createElement('source'); avif.type='image/avif'; avif.srcset = meta.cover + '.avif';
      const webp = document.createElement('source'); webp.type='image/webp'; webp.srcset = meta.cover + '.webp';
      const img = document.createElement('img'); img.src = meta.cover; img.alt = meta.title; img.style='width:100%;height:auto'; img.loading='eager'; img.decoding='async';
      picture.appendChild(avif); picture.appendChild(webp); picture.appendChild(img);
      hero.appendChild(picture);
      if(meta.gif){ const gif=document.createElement('img'); gif.src=meta.gif; gif.alt=meta.title+' gif'; gif.loading='lazy'; gif.decoding='async'; gif.className='case-hero-gif'; hero.appendChild(gif); }
      // Tags
      (meta.tags||[]).forEach(t=>{ const s=document.createElement('span'); s.className='metric-badge'; s.textContent=t; tags.appendChild(s); });
      // Content
      content.innerHTML = html;
      // Snippets + Prism
      bindSnippets(content); ensurePrism(); if(window.Prism) Prism.highlightAllUnder(content);
    }
  };

  async function openCaseModal(id){
    const meta = CASES[id]; if(!meta) return;
    const modalEl = CaseModal.el();
    CaseModal.clear();
    CaseModal.fields().content.innerHTML = '<div class="text-muted">Loading…</div>';
    try {
      const code = (localStorage.getItem('site_lang') || document.documentElement.getAttribute('lang') || 'en');
      const lang = code && code.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
      let html = '';
      try {
        const r1 = await fetch(`data/partials/${lang}/${id}.html`);
        if (r1.ok) { html = await r1.text(); }
      } catch(_){ /* ignore */ }
      if(!html){
        const r2 = await fetch(`data/partials/${id}.html`);
        html = r2.ok ? await r2.text() : '<p class="text-danger">Failed to load content.</p>';
      }
      await CaseModal.render(meta, html);
      openModalEl(modalEl);
    } catch(e){
      try { CaseModal.fields().content.innerHTML = '<p class="text-danger">'+ (e&&e.message||'Error') +'</p>'; } catch(_){ }
    }
  }

  document.addEventListener('click', (e)=>{
    const link = e.target.closest('a[href^="case/"]');
    if(!link) return;
    e.preventDefault();
    const id = (link.getAttribute('href')||'').split('/')[1];
    if(!id) return;
    openCaseModal(id);
  }, true);
})();
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

// Limpeza garantida de backdrop e classes ao fechar qualquer modal
document.addEventListener('hidden.bs.modal', (e)=>{
  try {
    document.querySelectorAll('.modal-backdrop').forEach(el=>el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
  } catch(_){ }
});

// Robust scroll lock: fixa o body quando qualquer modal está aberta
(function(){
  let scrollTop = 0;
  function lock(){
    if(document.body.dataset.scrollLock==='1') return;
    scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollTop}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.dataset.scrollLock='1';
  }
  function unlock(){
    if(document.body.dataset.scrollLock!=='1') return;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.dataset.scrollLock='0';
    window.scrollTo(0, scrollTop);
  }
  document.addEventListener('show.bs.modal', lock);
  document.addEventListener('hidden.bs.modal', unlock);
})();