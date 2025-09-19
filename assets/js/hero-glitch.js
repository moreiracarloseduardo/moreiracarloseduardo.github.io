(function () {
    // Per-letter split + random glitch scheduler per word
    const title = document.getElementById('hero-title');
    if (!title) return;

    // Debug controls and mode: enable with ?glitchDebug=1 or localStorage.glitchDebug=1; mode via ?glitchMode=low|med|high
    const QS = new URLSearchParams(location.search);
    const DEBUG = QS.has('glitchDebug') || (localStorage.getItem('glitchDebug') === '1');
    const dlog = (...args)=>{ if (DEBUG) console.log('[glitch]', ...args); };
    if (DEBUG) console.info('[glitch] debug mode ON');
    const MODE = (QS.get('glitchMode') || localStorage.getItem('glitchMode') || 'low').toLowerCase();
    const SCHED = (QS.get('glitchSched') || localStorage.getItem('glitchSched') || 'word').toLowerCase();
    if (DEBUG) dlog('mode:', MODE);
    if (DEBUG) dlog('sched:', SCHED);
    // Bind mode to DOM so CSS can adapt visuals per mode
    try { title.setAttribute('data-glitch-mode', MODE); } catch(_) {}

    // Batched DOM writes to avoid layout thrashing
    const __writeQueue = [];
    let __writeScheduled = false;
    function __flushWrites(){
        const q = __writeQueue.splice(0);
        for (const fn of q){ try { fn(); } catch(_){} }
        __writeScheduled = false;
    }
    function enqueueWrite(fn){
        __writeQueue.push(fn);
        if (!__writeScheduled) {
            __writeScheduled = true;
            requestAnimationFrame(__flushWrites);
        }
    }
    function setStyles(el, kv){ enqueueWrite(()=>{ for (const k in kv) el.style.setProperty(k, kv[k]); }); }
    function removeStyles(el, props){ enqueueWrite(()=>{ props.forEach(p=> el.style.removeProperty(p)); }); }
    function addClasses(el, arr){ enqueueWrite(()=> el.classList.add(...arr)); }
    function removeClasses(el, arr){ enqueueWrite(()=> el.classList.remove(...arr)); }

    function splitIntoGlyphs(el) {
        const accent = el.getAttribute('data-accent') || '1';
        const first = el.firstElementChild;
        const hasGlyphs = !!(first && first.classList && first.classList.contains('glyph'));
        if (hasGlyphs) return; // já está splitado corretamente
        const raw = el.textContent || '';
        // Se houver espaço inicial/final, mova-o para fora do span para evitar desalinhamento visual
        let lead = raw.startsWith(' ');
        let trail = raw.endsWith(' ');
        const text = raw.trim();
        if (lead) el.insertAdjacentText('beforebegin', ' ');
        if (trail) el.insertAdjacentText('afterend', ' ');
        const frag = document.createDocumentFragment();
        for (const ch of text) {
            const span = document.createElement('span');
            span.className = 'glyph';
            span.setAttribute('data-accent', accent);
            // Preserve espacos internos como NBSP para não colapsar
            span.textContent = (ch === ' ') ? '\u00A0' : ch;
            frag.appendChild(span);
        }
        el.textContent = '';
        el.appendChild(frag);
    }

    const words = Array.from(title.querySelectorAll('.gradient-word'));
    words.forEach(splitIntoGlyphs);
    if (DEBUG) dlog('words:', words.length, 'glyphs:', title.querySelectorAll('.glyph').length);

    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return;

    // Mode config
    const CFG = MODE === 'high' ? {
        GLITCH_MIN: 600,
        GLITCH_MAX: 2200,
        JITTER: [-24,-20,-16,-14,-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12,14,16,20,24],
        clusterProb: 0.9,
        flutterProb: 0.7,
        skewMax: 5.0,
        rotateMax: 3.2,
        scaleMax: 0.36,
        burstMin: 820,
        burstMax: 1420,
        GLOBAL_MIN: 2200,
        GLOBAL_MAX: 4200,
        wordGlyphsMin: 3,
        wordGlyphsMax: 6
    } : MODE === 'low' ? {
        GLITCH_MIN: 1400,
        GLITCH_MAX: 4600,
        JITTER: [-10,-8,-6,-4,-2,0,2,4,6,8,10],
        clusterProb: 0.35,
        flutterProb: 0.0,
        skewMax: 2.5,
        rotateMax: 1.6,
        scaleMax: 0.18,
        burstMin: 520,
        burstMax: 900,
        GLOBAL_MIN: 6200,
        GLOBAL_MAX: 10000,
        wordGlyphsMin: 3,
        wordGlyphsMax: 3
    } : {
        GLITCH_MIN: 900,
        GLITCH_MAX: 3200,
        JITTER: [-16,-14,-12,-10,-8,-6,-4,-3,-2,-1,0,1,2,3,4,6,8,10,12,14,16],
        clusterProb: 0.55,
        flutterProb: 0.2,
        skewMax: 4.0,
        rotateMax: 2.5,
        scaleMax: 0.28,
        burstMin: 680,
        burstMax: 1360,
        GLOBAL_MIN: 3000,
        GLOBAL_MAX: 6000,
        wordGlyphsMin: 2,
        wordGlyphsMax: 4
    };

    const GLITCH_MIN = CFG.GLITCH_MIN;
    const GLITCH_MAX = CFG.GLITCH_MAX;
    const JITTER = CFG.JITTER;

    // Epoch to invalidate scheduled timeouts after DOM mutations (e.g., i18n swaps)
    let EPOCH = 0;
    let __glitchId = 0;
    function scheduleGlyphGlitch(g) {
        const delay = Math.random() * (GLITCH_MAX - GLITCH_MIN) + GLITCH_MIN;
        const gid = ++__glitchId;
        if (DEBUG) dlog('schedule id=', gid, 'delay=', Math.round(delay), 'ms');
        const myEpoch = EPOCH;
        setTimeout(() => {
            // Skip if epoch changed or element got detached
            if (myEpoch !== EPOCH) { if (DEBUG) dlog('skip id=', gid, 'reason=epoch-mismatch'); return; }
            if (!g || !g.isConnected || !title.contains(g)) { if (DEBUG) dlog('skip id=', gid, 'reason=stale-glyph'); return; }
            const word = g.closest('.gradient-word');
            const wordsNow = Array.from(title.querySelectorAll('.gradient-word'));
            const wi = wordsNow.indexOf(word);
            const gi = Array.from(word ? word.querySelectorAll('.glyph') : []).indexOf(g);
            if (DEBUG) dlog('start id=', gid, 'word#', wi, 'glyph#', gi, 'char="'+(g.textContent||'')+'"');
            // Check current filter state (apenas em debug para evitar layouts)
            if (DEBUG && word) {
                const styleFilter = word.style && word.style.filter;
                const compFilter = getComputedStyle(word).filter;
                dlog('filter(before): style=', styleFilter || '(none)', 'computed=', compFilter || '(none)');
            }
            if (word) {
                const c = parseInt(word.getAttribute('data-nr')||'0',10)+1;
                enqueueWrite(()=>{ word.setAttribute('data-nr', String(c)); });
                addClasses(word, ['no-refract']);
                if (DEBUG) {
                    dlog('no-refract applied id=', gid, 'refcount=', c);
                    const compAfter = getComputedStyle(word).filter;
                    dlog('filter(after-apply):', compAfter || '(none)');
                }
            }
            // Random offsets
            const gx = JITTER[Math.floor(Math.random() * JITTER.length)] * (Math.random() < 0.5 ? 2 : 1);
            const gy = JITTER[Math.floor(Math.random() * JITTER.length)] * (Math.random() < 0.5 ? 2 : 1);
            const sk = (Math.random() < 0.7 ? (Math.random() * 2 - 1) * CFG.skewMax : 0);
            const sc = (Math.random() < 0.8 ? (1 + Math.random() * CFG.scaleMax) : 1);
            const rot = (Math.random() < 0.7 ? (Math.random()*2-1) * CFG.rotateMax : 0);
            setStyles(g, {'--gx': gx+'px', '--gy': gy+'px', '--gskx': sk+'deg', '--gs': String(sc), '--grot': rot+'deg'});
            addClasses(g, ['glitch']);
            // quick flash spike for perception
            addClasses(g, ['flash']);
            setTimeout(()=> removeClasses(g, ['flash']), 140);
            if (DEBUG) dlog('values id=', gid, {gx,gy,sk,rot,sc});
            // Cluster (glyph mode only)
            if (SCHED === 'glyph' && Math.random() < CFG.clusterProb) {
                const neighbors = [g.previousElementSibling, g.nextElementSibling].filter(n=>n && n.classList && n.classList.contains('glyph'));
                neighbors.forEach((sib, idx)=>{
                    const atten = 0.55 - idx*0.15;
                    const gx2 = Math.sign(gx) * Math.max(1, Math.abs(gx)*atten);
                    const gy2 = Math.sign(gy) * Math.max(1, Math.abs(gy)*atten);
                    const sk2 = sk * atten;
                    const rot2 = rot * (atten*0.8);
                    setStyles(sib, {'--gx': (idx===0? -gx2: gx2)+'px', '--gy': gy2+'px', '--gskx': (-sk2)+'deg', '--gs': String(Math.max(1, sc-0.08)), '--grot': rot2+'deg'});
                    addClasses(sib, ['glitch','flash']);
                    setTimeout(()=> removeClasses(sib, ['flash']), 140);
                    if (DEBUG) dlog('neighbor id=', gid, 'idx=', idx, {gx2,gy2,sk2,rot2});
                    setTimeout(() => {
                        removeClasses(sib, ['glitch']);
                        removeStyles(sib, ['--gx','--gy','--gskx','--gs','--grot']);
                    }, 520 + Math.random() * 520);
                });
            }
            // Flutter (glyph mode only)
            if (SCHED === 'glyph' && Math.random() < CFG.flutterProb){
                const start = performance.now();
                const dur = 180 + Math.random()*220;
                function flutter(now){
                    const t = (now - start)/dur;
                    if (t >= 1) return;
                    const jig = (Math.random()*2-1) * 1.0;
                    setStyles(g, {'--gx': (gx + jig)+'px'});
                    requestAnimationFrame(flutter);
                }
                requestAnimationFrame(flutter);
            }
            const burstDur = CFG.burstMin + Math.random() * (CFG.burstMax - CFG.burstMin);
            setTimeout(() => {
                removeClasses(g, ['glitch','flash']);
                removeStyles(g, ['--gx','--gy','--gskx','--gs','--grot']);
                if (word){
                    const c = Math.max(0, (parseInt(word.getAttribute('data-nr')||'1',10) - 1));
                    if (c===0) {
                        removeClasses(word, ['no-refract']);
                        enqueueWrite(()=>{ try{ word.removeAttribute('data-nr'); }catch(_){} });
                        if (DEBUG) {
                            const compAfter = getComputedStyle(word).filter;
                            dlog('filter(after-remove):', compAfter || '(none)');
                        }
                    }
                    else { enqueueWrite(()=>{ word.setAttribute('data-nr', String(c)); }); }
                }
                if (SCHED === 'glyph') scheduleGlyphGlitch(g);
            }, burstDur);
        }, delay);
    }

    // Word-level scheduler
    function triggerWordGlitch(word){
        if (!word || !word.isConnected) return;
        const glyphs = Array.from(word.querySelectorAll('.glyph'));
        if (glyphs.length === 0) return;
        const kmin = CFG.wordGlyphsMin, kmax = CFG.wordGlyphsMax;
        const count = Math.min(glyphs.length, Math.max(1, Math.floor(kmin + Math.random()*(kmax - kmin + 1))));
        const chosen = new Set();
        while (chosen.size < count) chosen.add(glyphs[Math.floor(Math.random()*glyphs.length)]);
        const myId = ++__glitchId;
        if (DEBUG) dlog('word-burst id=', myId, 'wordIdx=', Array.from(title.querySelectorAll('.gradient-word')).indexOf(word), 'glyphs=', chosen.size);
    const c0 = parseInt(word.getAttribute('data-nr')||'0',10)+1;
    enqueueWrite(()=>{ word.setAttribute('data-nr', String(c0)); });
    addClasses(word, ['no-refract']);
        const dur = Math.round(CFG.burstMin + Math.random()*(CFG.burstMax - CFG.burstMin));
        chosen.forEach((g)=>{
            const gx = JITTER[Math.floor(Math.random() * JITTER.length)];
            const gy = JITTER[Math.floor(Math.random() * JITTER.length)];
            const sk = (Math.random() < 0.35 ? (Math.random() * 2 - 1) * Math.min(2.0, CFG.skewMax) : 0);
            const sc = (Math.random() < 0.35 ? (1 + Math.random() * Math.min(0.14, CFG.scaleMax)) : 1);
            const rot = (Math.random() < 0.35 ? (Math.random()*2-1) * Math.min(1.4, CFG.rotateMax) : 0);
            setStyles(g, {'--gx': gx+'px', '--gy': gy+'px', '--gskx': sk+'deg', '--gs': String(sc), '--grot': rot+'deg'});
            addClasses(g, ['glitch','flash']);
            setTimeout(()=> removeClasses(g, ['flash']), 100);
        });
        setTimeout(()=>{
            chosen.forEach((g)=>{
                removeClasses(g, ['glitch','flash']);
                removeStyles(g, ['--gx','--gy','--gskx','--gs','--grot']);
            });
            const c = Math.max(0, (parseInt(word.getAttribute('data-nr')||'1',10) - 1));
            if (c===0) { removeClasses(word, ['no-refract']); enqueueWrite(()=>{ try{ word.removeAttribute('data-nr'); }catch(_){} }); }
            else { enqueueWrite(()=>{ word.setAttribute('data-nr', String(c)); }); }
        }, dur);
    }

    let __globalTimer = null;
    let __lastWordIdx = -1;
    let __hoverIdx = -1;
    let __lastHoverBurst = 0;
    const HOVER_COOLDOWN = 3500; // ms
    function scheduleGlobalWordGlitch(nextDelay){
        if (__globalTimer) { clearTimeout(__globalTimer); __globalTimer = null; }
        const delay = (typeof nextDelay === 'number') ? nextDelay : (CFG.GLOBAL_MIN + Math.random()*(CFG.GLOBAL_MAX - CFG.GLOBAL_MIN));
        const myEpoch = EPOCH;
        __globalTimer = setTimeout(()=>{
            __globalTimer = null;
            if (myEpoch !== EPOCH) { if (DEBUG) dlog('global-skip reason=epoch-mismatch'); return scheduleGlobalWordGlitch(); }
            const wordsNow = Array.from(title.querySelectorAll('.gradient-word'));
            if (wordsNow.length === 0) return scheduleGlobalWordGlitch();
            // choose index different from last when possible
            let idx = Math.floor(Math.random()*wordsNow.length);
            if (wordsNow.length > 1 && idx === __lastWordIdx) {
                idx = (idx + 1 + Math.floor(Math.random()*(wordsNow.length-1))) % wordsNow.length;
            }
            __lastWordIdx = idx;
            triggerWordGlitch(wordsNow[idx]);
            scheduleGlobalWordGlitch();
        }, delay);
    }

    // Start scheduling
    if (SCHED === 'glyph') {
        words.forEach((word, wi) => {
            const glyphs = word.querySelectorAll('.glyph');
            glyphs.forEach((g, i) => {
                const baseDelay = wi * 150 + Math.random() * 200;
                if (!g.__glitchWired) g.__glitchWired = true;
                setTimeout(() => scheduleGlyphGlitch(g), baseDelay);
            });
        });
    } else {
        scheduleGlobalWordGlitch();
    }

    // Expose to allow re-splitting after i18n text changes
    let __IS_SPLITTING = false;
    window.__heroSplitGlyphs = function () {
        if (__IS_SPLITTING) return;
        __IS_SPLITTING = true;
        EPOCH++; // invalidate previously scheduled timers
        if (DEBUG) dlog('epoch++ ->', EPOCH);
        const words = title.querySelectorAll('.gradient-word');
        words.forEach(splitIntoGlyphs);
        if (SCHED === 'glyph') {
            words.forEach((word, wi) => {
                word.querySelectorAll('.glyph').forEach((g) => {
                    if (!g.__glitchWired) {
                        g.__glitchWired = true;
                        const baseDelay = wi * 150 + Math.random() * 200;
                        setTimeout(() => scheduleGlyphGlitch(g), baseDelay);
                    }
                });
            });
        } else {
            scheduleGlobalWordGlitch();
        }
        __IS_SPLITTING = false;
    };

    // Mutation observer
    try {
        let debTimer;
        const obs = new MutationObserver(() => {
            if (__IS_SPLITTING) return; // ignore own changes
            clearTimeout(debTimer);
            debTimer = setTimeout(() => {
                if (DEBUG) dlog('mutation observed → re-split glyphs');
                window.__heroSplitGlyphs && window.__heroSplitGlyphs();
            }, 60);
        });
        obs.observe(title, { childList: true, subtree: true, characterData: true });
    } catch (_) { }

    // Hover priority: dispara burst na palavra sob o cursor com cooldown
    title.addEventListener('pointermove', (e)=>{
        const w = e.target && e.target.closest && e.target.closest('.gradient-word');
        if (!w) { __hoverIdx = -1; return; }
        const wordsNow = Array.from(title.querySelectorAll('.gradient-word'));
        const idx = wordsNow.indexOf(w);
        __hoverIdx = idx;
        const now = performance.now();
        if (idx >= 0 && (now - __lastHoverBurst) > HOVER_COOLDOWN) {
            __lastHoverBurst = now;
            __lastWordIdx = idx; // evita repetição imediata após hover
            triggerWordGlitch(w);
            // Reagenda o global para mais tarde (bias para não competir com hover)
            scheduleGlobalWordGlitch(CFG.GLOBAL_MAX);
        }
    });
    title.addEventListener('pointerleave', ()=>{ __hoverIdx = -1; });

    // Manual test hook: trigger a visible burst now
    window.__heroGlitchBurstAll = function(){
        const gs = title.querySelectorAll('.glyph');
        gs.forEach((g)=>{
            g.classList.add('glitch','flash');
            g.style.setProperty('--gx','12px');
            g.style.setProperty('--gy','-8px');
        });
        setTimeout(()=>{
            gs.forEach((g)=>{
                g.classList.remove('glitch','flash');
                g.style.removeProperty('--gx');
                g.style.removeProperty('--gy');
            });
        }, 800);
    };
})();
