(function () {
    // Per-letter split + random glitch scheduler per word
    const title = document.getElementById('hero-title');
    if (!title) return;

    // Debug controls and mode: enable with ?glitchDebug=1 or localStorage.glitchDebug=1; mode via ?glitchMode=low|med|high
    const QS = new URLSearchParams(location.search);
    const DEBUG = QS.has('glitchDebug') || (localStorage.getItem('glitchDebug') === '1');
    const dlog = (...args)=>{ if (DEBUG) console.log('[glitch]', ...args); };
    if (DEBUG) console.info('[glitch] debug mode ON');
    const MODE = (QS.get('glitchMode') || localStorage.getItem('glitchMode') || 'med').toLowerCase();
    if (DEBUG) dlog('mode:', MODE);

    function splitIntoGlyphs(el) {
        const accent = el.getAttribute('data-accent') || '1';
        const first = el.firstElementChild;
        const hasGlyphs = !!(first && first.classList && first.classList.contains('glyph'));
        if (hasGlyphs) return; // já está splitado corretamente
        const text = el.textContent || '';
        const frag = document.createDocumentFragment();
        for (const ch of text) {
            const span = document.createElement('span');
            span.className = 'glyph';
            span.setAttribute('data-accent', accent);
            span.textContent = ch;
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
        burstMax: 1420
    } : MODE === 'low' ? {
        GLITCH_MIN: 1400,
        GLITCH_MAX: 4600,
        JITTER: [-10,-8,-6,-4,-2,0,2,4,6,8,10],
        clusterProb: 0.35,
        flutterProb: 0.3,
        skewMax: 2.5,
        rotateMax: 1.6,
        scaleMax: 0.18,
        burstMin: 520,
        burstMax: 1060
    } : {
        GLITCH_MIN: 900,
        GLITCH_MAX: 3200,
        JITTER: [-16,-14,-12,-10,-8,-6,-4,-3,-2,-1,0,1,2,3,4,6,8,10,12,14,16],
        clusterProb: 0.55,
        flutterProb: 0.5,
        skewMax: 4.0,
        rotateMax: 2.5,
        scaleMax: 0.28,
        burstMin: 680,
        burstMax: 1360
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
            // Check current filter state
            if (word) {
                const styleFilter = word.style && word.style.filter;
                const compFilter = getComputedStyle(word).filter;
                dlog('filter(before): style=', styleFilter || '(none)', 'computed=', compFilter || '(none)');
            }
            if (word) {
                const c = parseInt(word.getAttribute('data-nr')||'0',10)+1;
                word.setAttribute('data-nr', String(c));
                word.classList.add('no-refract');
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
            g.style.setProperty('--gx', gx + 'px');
            g.style.setProperty('--gy', gy + 'px');
            g.style.setProperty('--gskx', sk + 'deg');
            g.style.setProperty('--gs', sc);
            g.style.setProperty('--grot', rot + 'deg');
            g.classList.add('glitch');
            // quick flash spike for perception
            g.classList.add('flash');
            setTimeout(()=> g.classList.remove('flash'), 140);
            if (DEBUG) dlog('values id=', gid, {gx,gy,sk,rot,sc});
            // Cluster: tente aplicar também nos dois vizinhos se existirem
            if (Math.random() < CFG.clusterProb) {
                const neighbors = [g.previousElementSibling, g.nextElementSibling].filter(n=>n && n.classList && n.classList.contains('glyph'));
                neighbors.forEach((sib, idx)=>{
                    const atten = 0.55 - idx*0.15; // vizinhos com intensidade decrescente
                    const gx2 = Math.sign(gx) * Math.max(1, Math.abs(gx)*atten);
                    const gy2 = Math.sign(gy) * Math.max(1, Math.abs(gy)*atten);
                    const sk2 = sk * atten;
                    const rot2 = rot * (atten*0.8);
                    sib.style.setProperty('--gx', (idx===0? -gx2: gx2) + 'px');
                    sib.style.setProperty('--gy', gy2 + 'px');
                    sib.style.setProperty('--gskx', (-sk2) + 'deg');
                    sib.style.setProperty('--gs', Math.max(1, sc - 0.08));
                    sib.style.setProperty('--grot', rot2 + 'deg');
                    sib.classList.add('glitch');
                    sib.classList.add('flash');
                    setTimeout(()=> sib.classList.remove('flash'), 140);
                    if (DEBUG) dlog('neighbor id=', gid, 'idx=', idx, {gx2,gy2,sk2,rot2});
                    setTimeout(() => {
                        sib.classList.remove('glitch');
                        sib.style.removeProperty('--gx');
                        sib.style.removeProperty('--gy');
                        sib.style.removeProperty('--gskx');
                        sib.style.removeProperty('--gs');
                        sib.style.removeProperty('--grot');
                    }, 520 + Math.random() * 520);
                });
            }
            // Flutter: pequenas variações dentro do mesmo burst
            if (Math.random() < CFG.flutterProb){
                const start = performance.now();
                const dur = 180 + Math.random()*220;
                function flutter(now){
                    const t = (now - start)/dur;
                    if (t >= 1) return;
                    const jig = (Math.random()*2-1) * 1.0;
                    g.style.setProperty('--gx', (gx + jig) + 'px');
                    requestAnimationFrame(flutter);
                }
                requestAnimationFrame(flutter);
            }
            // Longer burst window (more visible)
            const burstDur = CFG.burstMin + Math.random() * (CFG.burstMax - CFG.burstMin);
            setTimeout(() => {
                g.classList.remove('glitch');
                g.classList.remove('flash');
                g.style.removeProperty('--gx');
                g.style.removeProperty('--gy');
                g.style.removeProperty('--gskx');
                g.style.removeProperty('--gs');
                g.style.removeProperty('--grot');
                if (word){
                    const c = Math.max(0, (parseInt(word.getAttribute('data-nr')||'1',10) - 1));
                    if (c===0) { 
                        word.classList.remove('no-refract'); 
                        word.removeAttribute('data-nr'); 
                        if (DEBUG) {
                            const compAfter = getComputedStyle(word).filter;
                            dlog('filter(after-remove):', compAfter || '(none)');
                        }
                    }
                    else { word.setAttribute('data-nr', String(c)); }
                }
                scheduleGlyphGlitch(g); // reschedule
            }, burstDur);
        }, delay);
    }

    // Stagger per word: slight bias so each word has its own rhythm
    words.forEach((word, wi) => {
        const glyphs = word.querySelectorAll('.glyph');
        glyphs.forEach((g, i) => {
            // initial small random delay per glyph + per-word offset
            const baseDelay = wi * 150 + Math.random() * 200;
            if (!g.__glitchWired) g.__glitchWired = true;
            setTimeout(() => scheduleGlyphGlitch(g), baseDelay);
        });
    });

    // Expose to allow re-splitting after i18n text changes
    let __IS_SPLITTING = false;
    window.__heroSplitGlyphs = function () {
        if (__IS_SPLITTING) return;
        __IS_SPLITTING = true;
        EPOCH++; // invalidate previously scheduled timers
        if (DEBUG) dlog('epoch++ ->', EPOCH);
        const words = title.querySelectorAll('.gradient-word');
        words.forEach(splitIntoGlyphs);
        words.forEach((word, wi) => {
            word.querySelectorAll('.glyph').forEach((g) => {
                if (!g.__glitchWired) {
                    g.__glitchWired = true;
                    const baseDelay = wi * 150 + Math.random() * 200;
                    setTimeout(() => scheduleGlyphGlitch(g), baseDelay);
                }
            });
        });
        __IS_SPLITTING = false;
    };

    // Mutation observer to re-apply split if content changes (e.g., i18n reloads)
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
