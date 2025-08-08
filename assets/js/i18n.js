(function(){
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'site_lang';
  const SUPPORTED = ['en','pt-BR'];
  const dictionaries = {};
  // Embedded dictionaries to work offline/local without fetch
  const EMBEDDED = {
    "en": {"nav":{"about":"About","projects":"Projects","experience":"Experience","contact":"Contact"},"header":{"darkMode":"Dark Mode","contactMe":"Contact Me"},"about":{"heading":"About Me","p1":"As a Game Developer, my passion lies in creating immersive experiences where game mechanics and narrative organically intertwine. My goal is for every interaction to be so intuitive that players grasp it naturally, allowing the emotion and intention behind the creation to be fully felt.","p2":"Beyond the technical aspects of game development, I am a storytelling enthusiast, dedicated to crafting engaging narratives, whether for personal exploration or as potential foundations for new game worlds. My curiosity leads me to be an avid reader, exploring everything from philosophy and history to fiction and science. I'm particularly fascinated by astrophysics, unraveling the mysteries of the universe, and I love spending time with my dogs. In my leisure time, I'm an eclectic gamer, with a special fondness for indie games, which I consider true gems in terms of innovation and creativity.","p3":"I'm seeking new opportunities to contribute to innovative projects, where my passion for creating games I'd love to play can flourish. My differential is the ability to simplify processes and act as a facilitator, always considering how my contributions can optimize teamwork and solve complex challenges. I'm a natural problem-solver and I love to refine every detail to ensure the best possible experience."},"projects":{"current":"Current Project","mobile":"Mobile Projects","other":"Other Projects","upcoming":{"ribbon":"Upcoming","title":"Every photo tells a story... and hides a secret.","desc":"I'm brewing up something chilling! A new horror game is in the early stages of development. Stay tuned, I'll share more details once a playable demo is ready."}},"other":{"tennis":{"desc":"Quest 2 game where players try to land the return inside the line. Developed using Unity and Meta Quest 2"},"rhythm":{"desc":"A game like Guitar Hero where you hit the notes as they come down the screen, you could play against other player or against an AI, developed using Unity for a renowned music festival."}},"experience":{"heading":"Work Experience","nex":{"title":"Game Developer","years":"(January 2024 – January 2025)","li1":"Designed and developed custom games for brands and events, including VR and AR games, rhythm games, memory games, marathon simulation, etc.","li2":"Leveraged advanced technologies such as interactive floors, facial recognition, augmented reality, and virtual reality."},"coruja":{"title":"Game Developer","years":"(March 2020 – May 2023)","li1":"Extensive experience in creating prototypes, overseeing the entire game development process from ideation to launch.","li2":"Implemented dynamic game mechanics and interactive systems using Unity and C#.","li3":"Debugged and optimized games performance."},"likin":{"title":"Front-End Developer","years":"(August 2017 – January 2020)","li1":"Developed and enhanced user-facing features and applications.","li2":"Integrated front-end interfaces with back-end systems and resolved performance issues.","li3":"Actively participated in Agile processes, including daily scrum meetings, reviews, and planning sessions."}},"aside":{"info":{"heading":"Basic Information","location":{"sr":"Location:"}},"skills":{"heading":"Skills","intro":"As a Game Developer, my expertise ranges from creative conception to technical implementation, with a focus on immersive and intuitive experiences. Below are some of my core technical skills and tools.","level":{"advanced":"Advanced","pro":"Pro","intermediate":"Intermediate"},"moreLinkedIn":"More on my LinkedIn"},"languages":{"heading":"Languages","portuguese":{"title":"Portuguese:","level":"Native Speaker"},"spanish":{"title":"Spanish:","level":"Native Speaker"},"english":{"title":"English:","level":"B2 (Upper Intermediate):"}},"credits":{"heading":"Credits"}},"footer":{"by":"Designed with love","for":"developers"},"buttons":{"viewDetails":"View details","collapse":"Collapse"}},
    "pt-BR": {"nav":{"about":"Sobre","projects":"Projetos","experience":"Experiência","contact":"Contato"},"header":{"darkMode":"Modo escuro","contactMe":"Fale comigo"},"about":{"heading":"Sobre mim","p1":"Como Game Developer, minha paixão está em criar experiências imersivas onde mecânicas e narrativa se entrelaçam organicamente. Meu objetivo é que cada interação seja tão intuitiva que o jogador a compreenda naturalmente, permitindo que a emoção e a intenção por trás da criação sejam plenamente sentidas.","p2":"Além do desenvolvimento técnico de jogos, sou entusiasta de storytelling, dedicado a construir narrativas envolventes, seja para exploração pessoal ou como base para novos mundos de jogos. Minha curiosidade me torna um leitor ávido, explorando desde filosofia e história até ficção e ciência. Tenho particular fascínio por astrofísica, desvendando os mistérios do universo, e adoro passar tempo com meus cães. No meu tempo livre, sou um gamer eclético, com carinho especial por jogos indie, que considero verdadeiras joias de inovação e criatividade.","p3":"Busco novas oportunidades para contribuir com projetos inovadores, onde minha paixão por criar os jogos que eu adoraria jogar possa florescer. Meu diferencial é a capacidade de simplificar processos e atuar como facilitador, sempre pensando em como minhas contribuições podem otimizar o trabalho em equipe e resolver desafios complexos. Sou um solucionador nato e adoro lapidar cada detalhe para garantir a melhor experiência possível."},"projects":{"current":"Projeto Atual","mobile":"Projetos Mobile","other":"Outros Projetos","upcoming":{"ribbon":"Em breve","title":"Toda foto conta uma história... e esconde um segredo.","desc":"Estou preparando algo de arrepiar! Um novo jogo de terror está nas fases iniciais de desenvolvimento. Fique de olho, vou compartilhar mais detalhes assim que uma demo jogável estiver pronta."}},"other":{"tennis":{"desc":"Jogo para Quest 2 onde os jogadores tentam devolver a bola dentro da linha. Desenvolvido usando Unity e Meta Quest 2"},"rhythm":{"desc":"Um jogo no estilo Guitar Hero, em que você acerta as notas conforme descem na tela. É possível jogar contra outro jogador ou contra uma IA, desenvolvido em Unity para um renomado festival de música."}},"experience":{"heading":"Experiência Profissional","nex":{"title":"Game Developer","years":"(Janeiro de 2024 – Janeiro de 2025)","li1":"Concepção e desenvolvimento de jogos sob medida para marcas e eventos, incluindo jogos em VR e AR, jogos de ritmo, memória, simulação de maratona, etc.","li2":"Uso de tecnologias avançadas como pisos interativos, reconhecimento facial, realidade aumentada e realidade virtual."},"coruja":{"title":"Game Developer","years":"(Março de 2020 – Maio de 2023)","li1":"Ampla experiência na criação de protótipos e condução de todo o processo de desenvolvimento de jogos, da ideação ao lançamento.","li2":"Implementação de mecânicas dinâmicas e sistemas interativos usando Unity e C#.","li3":"Depuração e otimização de performance de jogos."},"likin":{"title":"Front-End Developer","years":"(Agosto de 2017 – Janeiro de 2020)","li1":"Desenvolvimento e melhoria de funcionalidades e aplicações voltadas ao usuário.","li2":"Integração de interfaces front-end com sistemas back-end e resolução de problemas de performance.","li3":"Participação ativa em processos Ágeis, incluindo dailies, reviews e planejamentos."}},"aside":{"info":{"heading":"Informações Básicas","location":{"sr":"Localização:"}},"skills":{"heading":"Habilidades","intro":"Como Game Developer, minha expertise vai da concepção criativa à implementação técnica, com foco em experiências imersivas e intuitivas. Abaixo estão algumas das minhas principais habilidades e ferramentas.","level":{"advanced":"Avançado","pro":"Pro","intermediate":"Intermediário"},"moreLinkedIn":"Mais no meu LinkedIn"},"languages":{"heading":"Idiomas","portuguese":{"title":"Português:","level":"Fluente"},"spanish":{"title":"Espanhol:","level":"Fluente"},"english":{"title":"Inglês:","level":"B2 (Upper Intermediate):"}},"credits":{"heading":"Créditos"}},"footer":{"by":"Criado com carinho","for":"desenvolvedores"},"buttons":{"viewDetails":"Ver detalhes","collapse":"Recolher"}}
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
    if (EMBEDDED[code]) {
      dictionaries[code] = EMBEDDED[code];
      return dictionaries[code];
    }
    try {
      const url = `assets/i18n/${code}.json`;
      const res = await fetch(url);
      const json = await res.json();
      dictionaries[code] = json;
      return json;
    } catch (e) {
      console.warn('i18n: fetch failed, using embedded default', e);
      dictionaries[DEFAULT_LANG] = EMBEDDED[DEFAULT_LANG];
      return dictionaries[DEFAULT_LANG];
    }
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
    // Update dynamic labels like collapse buttons that toggle
    document.querySelectorAll('.toggle-details').forEach(btn => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const label = btn.querySelector('.label');
      if (label) label.textContent = expanded ? (tr(dict,'buttons.collapse') || 'Collapse') : (tr(dict,'buttons.viewDetails') || 'View details');
    });
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
