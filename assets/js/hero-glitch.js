(function () {
    // Per-letter split + random glitch scheduler per word
    const title = document.getElementById('hero-title');
    if (!title) return;

    function splitIntoGlyphs(el) {
        if (el.__splitDone) return; // idempotency
        const accent = el.getAttribute('data-accent') || '1';
        const text = el.textContent;
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
        el.__splitDone = true;
    }

    const words = Array.from(title.querySelectorAll('.gradient-word'));
    words.forEach(splitIntoGlyphs);

    const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) return;

    // Random glitch loop: each glyph glitches at its own cadence
    // Stronger and longer glitches
    const GLITCH_MIN = 900;  // ms between glitches
    const GLITCH_MAX = 3200; // ms
    const JITTER = [-16,-14,-12,-10,-8,-6,-4,-3,-2,-1,0,1,2,3,4,6,8,10,12,14,16]; // px offsets

    function scheduleGlyphGlitch(g) {
        const delay = Math.random() * (GLITCH_MAX - GLITCH_MIN) + GLITCH_MIN;
        setTimeout(() => {
            const word = g.closest('.gradient-word');
            if (word) {
                const c = parseInt(word.getAttribute('data-nr')||'0',10)+1;
                word.setAttribute('data-nr', String(c));
                word.classList.add('no-refract');
            }
            // Random offsets
            const gx = JITTER[Math.floor(Math.random() * JITTER.length)] * (Math.random() < 0.5 ? 2 : 1);
            const gy = JITTER[Math.floor(Math.random() * JITTER.length)] * (Math.random() < 0.5 ? 2 : 1);
            const sk = (Math.random() < 0.7 ? (Math.random() * 2 - 1) * 4.0 : 0); // -4..4 deg
            const sc = (Math.random() < 0.8 ? (1 + Math.random() * 0.28) : 1); // stronger scale boost
            const rot = (Math.random() < 0.7 ? (Math.random()*2-1) * 2.5 : 0); // -2.5..2.5 deg
            g.style.setProperty('--gx', gx + 'px');
            g.style.setProperty('--gy', gy + 'px');
            g.style.setProperty('--gskx', sk + 'deg');
            g.style.setProperty('--gs', sc);
            g.style.setProperty('--grot', rot + 'deg');
            g.classList.add('glitch');
            // Cluster: tente aplicar também nos dois vizinhos se existirem
            if (Math.random() < 0.55) {
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
            if (Math.random() < 0.5){
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
            setTimeout(() => {
                g.classList.remove('glitch');
                g.style.removeProperty('--gx');
                g.style.removeProperty('--gy');
                g.style.removeProperty('--gskx');
                g.style.removeProperty('--gs');
                g.style.removeProperty('--grot');
                if (word){
                    const c = Math.max(0, (parseInt(word.getAttribute('data-nr')||'1',10) - 1));
                    if (c===0) { word.classList.remove('no-refract'); word.removeAttribute('data-nr'); }
                    else { word.setAttribute('data-nr', String(c)); }
                }
                scheduleGlyphGlitch(g); // reschedule
            }, 680 + Math.random() * 680);
        }, delay);
    }

    // Stagger per word: slight bias so each word has its own rhythm
    words.forEach((word, wi) => {
        const glyphs = word.querySelectorAll('.glyph');
        glyphs.forEach((g, i) => {
            // initial small random delay per glyph + per-word offset
            const baseDelay = wi * 150 + Math.random() * 200;
            setTimeout(() => scheduleGlyphGlitch(g), baseDelay);
        });
    });

    // Expose to allow re-splitting after i18n text changes
    window.__heroSplitGlyphs = function () {
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
    };

    // Mutation observer to re-apply split if content changes (e.g., i18n reloads)
    try {
        let debTimer;
        const obs = new MutationObserver(() => {
            clearTimeout(debTimer);
            debTimer = setTimeout(() => {
                window.__heroSplitGlyphs && window.__heroSplitGlyphs();
            }, 60);
        });
        obs.observe(title, { childList: true, subtree: true, characterData: true });
    } catch (_) { }
})();
