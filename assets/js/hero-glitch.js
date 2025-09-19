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
    const GLITCH_MIN = 1100; // ms between glitches
    const GLITCH_MAX = 4200; // ms
    const JITTER = [-10, -9, -8, -7, -6, -5, -3, -2, -1, 0, 1, 2, 3, 5, 6, 7, 8, 9, 10]; // px offsets

    function scheduleGlyphGlitch(g) {
        const delay = Math.random() * (GLITCH_MAX - GLITCH_MIN) + GLITCH_MIN;
        setTimeout(() => {
            // Random offsets
            const gx = JITTER[Math.floor(Math.random() * JITTER.length)] * (Math.random() < 0.5 ? 2 : 1);
            const gy = JITTER[Math.floor(Math.random() * JITTER.length)] * (Math.random() < 0.5 ? 2 : 1);
            const sk = (Math.random() < 0.7 ? (Math.random() * 2 - 1) * 4.0 : 0); // -4..4 deg
            const sc = (Math.random() < 0.6 ? (1 + Math.random() * 0.16) : 1); // stronger scale boost
            g.style.setProperty('--gx', gx + 'px');
            g.style.setProperty('--gy', gy + 'px');
            g.style.setProperty('--gskx', sk + 'deg');
            g.style.setProperty('--gs', sc);
            g.classList.add('glitch');
            // Longer burst window (more visible)
            setTimeout(() => {
                g.classList.remove('glitch');
                g.style.removeProperty('--gx');
                g.style.removeProperty('--gy');
                g.style.removeProperty('--gskx');
                g.style.removeProperty('--gs');
                scheduleGlyphGlitch(g); // reschedule
            }, 360 + Math.random() * 240);
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
