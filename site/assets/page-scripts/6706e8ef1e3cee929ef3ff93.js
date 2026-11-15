
    // Inline data (exactly as provided; no rewording)
    const RELEASES = [
      {"date":"2026-02-05","maker":"Kuaishou (Kling AI)","model":"Kling 3.0 (Video 3.0 and Video 3.0 Omni)","type":"video","summary":"Video models with native multilingual audio and clips up to 15 seconds; early access for Ultra subscribers first.","source_url":"https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-30-model-ushering-era-where-everyone-can-be","source_title":"Kling AI Launches 3.0 Model, Ushering in an Era Where Everyone Can Be a Director | Kuaishou Technology"},
      {"date":"2026-02-16","maker":"Alibaba (Qwen)","model":"Qwen3.5 (Qwen3.5-397B-A17B)","type":"open-weight multimodal","summary":"Open-weight vision-language MoE, 397B total and 17B active parameters, Apache 2.0; smaller sizes followed.","source_url":"https://github.com/QwenLM/Qwen3.5","source_title":"QwenLM GitHub repository (README news log; repo now redirects to QwenLM/Qwen3.8)"},
      {"date":"2026-02-19","maker":"Google","model":"Gemini 3.1 Pro","type":"multimodal","summary":"Upgraded reasoning model released in preview to developers and in the Gemini app; Google reports 77.1% on ARC-AGI-2.","source_url":"https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-pro/","source_title":"Gemini 3.1 Pro: A smarter model for your most complex tasks"},
      {"date":"2026-02-26","maker":"Google","model":"Nano Banana 2 (Gemini 3.1 Flash Image)","type":"image","summary":"Image generation and editing model at Flash speed, 512px to 4K output; rolled out in Gemini, Search and the API.","source_url":"https://blog.google/innovation-and-ai/technology/ai/nano-banana-2/","source_title":"Nano Banana 2: Combining Pro capabilities with lightning-fast speed"},
      {"date":"2026-03-16","maker":"Mistral AI","model":"Mistral Small 4","type":"open-weight multimodal","summary":"Apache 2.0 MoE (119B total, 6B active) combining reasoning, image input and agentic coding in one model.","source_url":"https://mistral.ai/news/mistral-small-4/","source_title":"Introducing Mistral Small 4 | Mistral AI"},
      {"date":"2026-04-08","maker":"Meta (Meta Superintelligence Labs)","model":"Muse Spark","type":"multimodal","summary":"First Muse model: a multimodal reasoning model in meta.ai and the Meta AI app, with a private API preview.","source_url":"https://ai.meta.com/blog/introducing-muse-spark-msl/","source_title":"Introducing Muse Spark: Scaling Towards Personal Superintelligence"},
      {"date":"2026-04-23","maker":"OpenAI","model":"GPT-5.5","type":"language","summary":"New flagship rolled out in ChatGPT and Codex for paid plans, with GPT-5.5 Pro; API access followed on 24 April.","source_url":"https://openai.com/index/introducing-gpt-5-5/","source_title":"Introducing GPT-5.5 | OpenAI"},
      {"date":"2026-04-24","maker":"DeepSeek","model":"DeepSeek-V4 Preview (V4-Pro and V4-Flash)","type":"open-weight language","summary":"Open-weight preview: V4-Pro (1.6T total, 49B active) and V4-Flash (284B, 13B active), 1M-token context by default.","source_url":"https://api-docs.deepseek.com/updates","source_title":"Change Log | DeepSeek API Docs"},
      {"date":"2026-05-19","maker":"Google","model":"Gemini 3.5 Flash","type":"multimodal","summary":"First Gemini 3.5 model, generally available at launch and made the default in the Gemini app and AI Mode in Search.","source_url":"https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-5/","source_title":"Gemini 3.5: frontier intelligence with action"},
      {"date":"2026-06-09","maker":"Anthropic","model":"Claude Fable 5","type":"language","summary":"Mythos-class model released for general use; access was suspended on 12 June and restored on 1 July.","source_url":"https://www.anthropic.com/news/claude-fable-5-mythos-5","source_title":"Claude Fable 5 and Claude Mythos 5 | Anthropic"},
      {"date":"2026-07-09","maker":"OpenAI","model":"GPT-5.6 (Sol, Terra, Luna)","type":"language","summary":"Three-tier family made generally available in ChatGPT, Codex and the API after a limited preview from 26 June.","source_url":"https://openai.com/index/gpt-5-6/","source_title":"GPT-5.6: Frontier intelligence that scales with your ambition | OpenAI"},
      {"date":"2026-07-16","maker":"xAI (SpaceXSI)","model":"Grok 4.5","type":"language","summary":"Model for coding, agents and knowledge work, released to the API and Cursor; Grok consumer apps followed on 23 July.","source_url":"https://x.ai/news/grok-4-5","source_title":"Introducing Grok 4.5 | SpaceXSI"},
      {"date":"2026-07-16","maker":"Moonshot AI","model":"Kimi K3","type":"open-weight multimodal","summary":"2.8T-parameter MoE with native vision and 1M-token context; API launch first, full weights published on 27 July.","source_url":"https://www.kimi.ai/blog/kimi-k3","source_title":"Kimi K3 Tech Blog: Open Frontier Intelligence"},
      {"date":"2026-07-24","maker":"Anthropic","model":"Claude Opus 5","type":"language","summary":"New Opus model and default on Claude Max; Anthropic says it comes close to Claude Fable 5 at half the price.","source_url":"https://www.anthropic.com/news/claude-opus-5","source_title":"Introducing Claude Opus 5 | Anthropic"},
      {"date":"2026-09-03","maker":"OpenAI","model":"GPT-6 Astra","type":"multimodal","summary":"First GPT-6 model, rolled out to limited organisations first, then paid ChatGPT plans and the API over following days.","source_url":"https://openai.com/index/gpt-6-astra/","source_title":"GPT-6 Astra: A new generation of intelligence | OpenAI"},
      {"date":"2026-09-09","maker":"Suno","model":"Suno v6 (v6, v6-wild, v6-mini)","type":"music","summary":"New music model generation in three variants, developed with partners including Warner Music Group, BMG and Believe.","source_url":"https://www.suno.com/blog/introducing-v6","source_title":"Suno | Introducing v6"},
      {"date":"2026-09-22","maker":"Anthropic","model":"Claude Opus 5.5","type":"language","summary":"First Claude 5.5 model; priced at $4/$20 per million tokens, 20% below Opus 5, and available on all major clouds.","source_url":"https://www.anthropic.com/claude-opus-5-5","source_title":"Introducing Claude Opus 5.5 | Anthropic"},
      {"date":"2026-09-28","maker":"ElevenLabs","model":"Eleven v4 and Eleven v4 Turbo","type":"audio","summary":"Text-to-speech models on a new architecture with 90+ languages; Turbo variant targets about 100 ms median latency.","source_url":"https://elevenlabs.io/blog/eleven-v4","source_title":"Eleven v4: Our most expressive text-to-speech AI model yet"},
      {"date":"2026-10-06","maker":"Mistral AI","model":"Mistral Large 4 (public preview)","type":"open-weight multimodal (weights pending)","summary":"1T-parameter multimodal MoE (52B active) in public preview via API; Mistral says open weights follow by end of October.","source_url":"https://mistral.ai/news/mistral-large-4/","source_title":"Introducing Mistral Large 4 | Mistral"},
      {"date":"2026-10-13","maker":"Google","model":"Gemini 4 Argon","type":"multimodal","summary":"First Gemini 4 model, made generally available via the API and to paid Gemini app users after a 30 Sept cyber preview.","source_url":"https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/","source_title":"Gemini 4 Argon: Built to solve your hardest problems"}
    ];

    // Derived type chips (from provided 'type' strings)
    const CHIP_ORDER = ["language","multimodal","open-weight","image","video","audio","music"];

    function normaliseTypes(typeStr) {
      const s = (typeStr || "").toLowerCase();
      const tags = new Set();
      for (const key of CHIP_ORDER) {
        if (s.includes(key)) tags.add(key);
      }
      return Array.from(tags);
    }

    function formatDate(d) {
      const dt = (d instanceof Date) ? d : new Date(String(d));
      return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    }

    // Build month rail (Jan..Dec); mark months that have entries
    function buildMonths(container, entries) {
      container.innerHTML = '';
      const monthsWith = new Set(entries.map(e => new Date(e.date).getUTCMonth())); // 0-11
      const labels = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      labels.forEach((label, i) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = 'month';
        el.textContent = label;
        el.dataset.idx = String(i);
        el.dataset.has = monthsWith.has(i) ? '1' : '0';
        el.addEventListener('click', () => {
          // find first entry in that month (chronological order)
          const idx = entries.findIndex(e => new Date(e.date).getUTCMonth() === i);
          if (idx >= 0) focusIndex(idx, true);
          updateMonthActive(i);
        });
        container.appendChild(el);
      });
      function updateMonthActive(activeMonth) {
        [...container.children].forEach(ch => ch.classList.toggle('active', Number(ch.dataset.idx) === activeMonth));
      }
      return updateMonthActive;
    }

    // Render chips
    function buildChips(container, onToggle) {
      container.innerHTML = '';
      CHIP_ORDER.forEach(key => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = key;
        b.dataset.key = key;
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => onToggle(key, b));
        container.appendChild(b);
      });
    }

    // Render timeline list
    function buildList(container, entries) {
      container.innerHTML = entries.map((e, i) => {
        const tags = normaliseTypes(e.type);
        const tagBadges = [e.type].map(t => `<span class="badge" title="${e.type}">${t}</span>`).join('');
        return `
          <li class="card" data-idx="${i}" data-month="${new Date(e.date).getUTCMonth()}" data-tags="${tags.join(',')}">
            <div class="meta"><span class="date">${formatDate(e.date)}</span>${tagBadges}</div>
            <div class="model">${e.model}</div>
            <div class="maker">${e.maker}</div>
            <div class="summary">${e.summary}</div>
            <div class="src">Source: <a href="${e.source_url}" target="_blank" rel="noopener">${e.source_title || 'Link'}</a></div>
          </li>`;
      }).join('');
    }

    // State
    let all = RELEASES.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
    let filtered = all.slice();
    let activeIdx = 0;
    const activeChips = new Set();
    const listEl = document.getElementById('list');
    const monthsEl = document.getElementById('months');
    const chipsEl = document.getElementById('chips');
    const timelineEl = document.getElementById('timeline');
    const posEl = document.getElementById('pos');
    const totalEl = document.getElementById('total');
    const progressFill = document.getElementById('progressFill');
    // Controls (declare early so focusIndex can use them)
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const updateMonthActive = buildMonths(monthsEl, all);
    buildChips(chipsEl, (key, btn) => {
      if (activeChips.has(key)) {
        activeChips.delete(key);
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        activeChips.add(key);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
      applyFilters();
    });

    function applyFilters() {
      if (activeChips.size === 0) {
        filtered = all.slice();
      } else {
        const need = Array.from(activeChips);
        filtered = all.filter(e => {
          const tags = normaliseTypes(e.type);
          return need.every(x => tags.includes(x));
        });
      }
      // Rebuild list with filtered order (still chronological)
      buildList(listEl, filtered);
      totalEl.textContent = String(filtered.length);
      // Reset index to first visible
      activeIdx = 0;
      focusIndex(activeIdx, false);
      // Highlight month
      const m = filtered.length ? new Date(filtered[0].date).getUTCMonth() : -1;
      updateMonthActive(m);
    }

    function setActiveIndex(idx) {
      if (idx < 0 || idx >= filtered.length) return;
      activeIdx = idx;
      const cards = listEl.querySelectorAll('.card');
      cards.forEach(el => el.classList.remove('active'));
      const el = listEl.querySelector(`.card[data-idx="${idx}"]`);
      if (el) el.classList.add('active');
      posEl.textContent = String(idx + 1);
      const pct = filtered.length ? Math.round((idx) / (filtered.length - 1) * 100) : 0;
      progressFill.style.width = filtered.length === 1 ? '100%' : pct + '%';
      const month = filtered.length ? new Date(filtered[idx].date).getUTCMonth() : -1;
      updateMonthActive(month);
      // Disable/enable buttons on ends
      prevBtn.disabled = (idx <= 0);
      nextBtn.disabled = (idx >= filtered.length - 1);
    }

    function focusIndex(idx, smooth) {
      if (idx < 0 || idx >= filtered.length) return;
      setActiveIndex(idx);
      const el = listEl.querySelector(`.card[data-idx="${idx}"]`);
      if (el) {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start', inline: 'nearest' });
      }
    }

    function step(dir) {
      const next = Math.min(Math.max(activeIdx + dir, 0), filtered.length - 1);
      if (next !== activeIdx) focusIndex(next, true);
    }

    // Init render
    buildList(listEl, filtered);
    totalEl.textContent = String(filtered.length);
    focusIndex(0, false);

    // Controls
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    });

    // If user scrolls manually, update active index/progress to nearest visible card
    let scrollTimer = null;
    timelineEl.addEventListener('scroll', () => {
      if (scrollTimer) cancelAnimationFrame(scrollTimer);
      scrollTimer = requestAnimationFrame(() => {
        const cards = [...listEl.querySelectorAll('.card')];
        if (!cards.length) return;
        // If scrolled to (or within 2px of) the bottom, force-select the last entry
        const nearBottom = Math.ceil(timelineEl.scrollTop + timelineEl.clientHeight) >= (timelineEl.scrollHeight - 2);
        let best = nearBottom ? (filtered.length - 1) : 0;
        if (!nearBottom) {
          let bestTop = Infinity;
          const cont = timelineEl.getBoundingClientRect();
          cards.forEach((c, i) => {
            const rect = c.getBoundingClientRect();
            const top = Math.abs(rect.top - cont.top - 10);
            if (top < bestTop) { bestTop = top; best = i; }
          });
        }
        // Only update visual state; do not scroll (prevents scroll snapping/jitter)
        setActiveIndex(best);
      });
    }, { passive: true });
  