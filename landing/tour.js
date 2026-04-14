/* ================================================================
   iris. — Guided Tour Engine (shell)
   Fullscreen modal overlay. 8 chapters. Voice + visual + transcript.
   Exposes: window.startTour(), window.closeTour()

   Batch 3 delivers the SHELL: state machine, DOM, controls, rail,
   transcript, keyboard/accessibility — with placeholder chapter
   content driven by CHAPTERS below. Batch 4 will swap CHAPTERS with
   the final content, wire voice via /api/tts (reusing persistentAudio
   from iris-chat.js), and add chapter-specific visuals.
   ================================================================ */

(function() {
  'use strict';

  // ----------------------------------------------------------------
  // Chapter data. Placeholder bodies used in Batch 3 shell.
  // Batch 4 replaces each body with its real SVG/animation render call
  // and adds `voice` (TTS text) + `duration` (ms) per chapter.
  // ----------------------------------------------------------------
  // ----------------------------------------------------------------
  // DEMO BIBLE — voice script (exactly what TTS will speak), duration
  // (ms, allowing for breath pauses via prosody), backdrop wash (per
  // motion director), and shell title/body fallback text (visible
  // until Batch 5 replaces with chapter-specific SVG/motion scenes).
  //
  // Source: Demo Bible synthesis (Apr 2026). Cross-referenced by the
  // voice scriptwriter, motion director, narrative designer, and
  // persona specialist. Total target runtime: ~103s + transitions.
  // ----------------------------------------------------------------
  var CHAPTERS = [
    {
      id:'meet',  eye:'Chapter 1',
      title:"Hi. I'm iris.",
      body:"Named for the part of the eye that decides how much light to let in.",
      voice:"Hi. I'm iris. Named for the part of the eye that decides how much light to let in. That's my job here, too.",
      wash:{ primary:'rgba(245,155,60,.14)', secondary:'rgba(255,209,0,.06)' },
      duration:10000,
      content:[
        '<div class="ch1-layout">',
        '  <div class="ch1-wordmark prism">iris.</div>',
        '  <div class="ch1-eye">Named for the part of the eye that decides how much light to let in.</div>',
        '</div>'
      ].join('')
    },
    {
      id:'gap',  eye:'Chapter 2 · The Gap',
      title:'The help is there. The connection isn\'t.',
      body:'1.5 million Canadians live with sight loss. Fewer than one in a hundred ever finds CNIB.',
      voice:"One and a half million Canadians live with sight loss. Fewer than one percent ever find CNIB. The help has always been here. The connection hasn't. That's the gap I was built to close.",
      wash:{ primary:'rgba(90,200,255,.10)', secondary:'rgba(123,104,255,.04)' },
      duration:15000,
      content:[
        '<div class="ch2-layout">',
        '  <div class="ch2-eye">Canadians living with sight loss</div>',
        '  <div class="ch2-stat"><span class="ch2-stat-digits">1,500,000</span></div>',
        '  <div class="ch2-rule"></div>',
        '  <div class="ch2-reveal">',
        '    <span class="ch2-reveal-n">fewer than</span>',
        '    <span class="ch2-reveal-nbig">1 in 100</span>',
        '    <span class="ch2-reveal-t">ever find their way in</span>',
        '  </div>',
        '</div>'
      ].join('')
    },
    {
      id:'framework',  eye:'Chapter 3 · The Framework',
      title:'Three stages. Three audiences. One loop.',
      body:'Acquire, engage, retain — applied to clients, volunteers, and partners.',
      voice:"Three stages. Acquire. Engage. Retain. Three audiences. Clients. Volunteers. Partners. One relationship layer, holding all of it together. Let me show you how it moves.",
      wash:{ primary:'rgba(255,180,60,.09)', secondary:'rgba(255,209,0,.04)' },
      duration:12000,
      content:[
        '<div class="ch3-layout" aria-hidden="true">',
        '  <svg class="ch3-loop" viewBox="0 0 400 400">',
        '    <defs>',
        '      <linearGradient id="ch3grad" x1="0" y1="0" x2="1" y2="1">',
        '        <stop offset="0" stop-color="#F59B3C"/>',
        '        <stop offset="0.5" stop-color="#E87CA0"/>',
        '        <stop offset="1" stop-color="#B57BFF"/>',
        '      </linearGradient>',
        '    </defs>',
        '    <circle class="ch3-loop-ring" cx="200" cy="200" r="180" fill="none" stroke="url(#ch3grad)" stroke-width="1.2" stroke-linecap="round"/>',
        '  </svg>',
        '  <span class="ch3-label ch3-label--acquire"><span class="ch3-n">01</span> Acquire</span>',
        '  <span class="ch3-label ch3-label--engage"><span class="ch3-n">02</span> Engage</span>',
        '  <span class="ch3-label ch3-label--retain"><span class="ch3-n">03</span> Retain</span>',
        '  <span class="ch3-audiences">Clients &middot; Volunteers &middot; Partners</span>',
        '</div>'
      ].join('')
    },
    {
      id:'clients',  eye:'Chapter 4 · Clients',
      title:'Meet Margaret.',
      body:'68. Newly diagnosed. Found iris. through a QR in her doctor\'s waiting room.',
      voice:"Margaret is sixty-eight. Two months ago her ophthalmologist said the words: macular degeneration. She scanned a QR code in the waiting room. That's where she found me. We talked. Three weeks later, she had a plan. And she wasn't alone anymore.",
      wash:{ primary:'rgba(245,155,60,.14)', secondary:'rgba(255,209,0,.05)' },
      duration:18000,
      content:[
        '<div class="ch4-layout">',
        '  <div class="ch4-meta">',
        '    <span class="ch4-name">Margaret</span>',
        '    <span class="ch4-sep">&middot;</span>',
        '    <span>68</span>',
        '    <span class="ch4-sep">&middot;</span>',
        '    <span>Sudbury, ON</span>',
        '  </div>',
        '  <div class="ch4-composite">Composite &mdash; drawn from real member journeys</div>',
        '  <div class="ch4-diagnosis">Recently diagnosed &mdash; macular degeneration</div>',
        '  <blockquote class="ch4-quote">',
        '    <span class="ch4-mark" aria-hidden="true">&ldquo;</span>',
        '    I don\'t know who to tell.',
        '  </blockquote>',
        '  <div class="ch4-source">',
        '    <svg class="ch4-qr" viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="22" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="2" y="22" width="8" height="8" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="5" width="2" height="2" fill="currentColor"/><rect x="25" y="5" width="2" height="2" fill="currentColor"/><rect x="5" y="25" width="2" height="2" fill="currentColor"/><rect x="14" y="4" width="2" height="2" fill="currentColor"/><rect x="18" y="6" width="2" height="2" fill="currentColor"/><rect x="14" y="14" width="2" height="2" fill="currentColor"/><rect x="18" y="18" width="2" height="2" fill="currentColor"/><rect x="22" y="14" width="2" height="2" fill="currentColor"/><rect x="14" y="22" width="2" height="2" fill="currentColor"/></svg>',
        '    <span>Scanned in her ophthalmologist\'s waiting room</span>',
        '  </div>',
        '</div>'
      ].join('')
    },
    {
      id:'volunteers',  eye:'Chapter 5 · Volunteers',
      title:'"Would you help someone just starting?"',
      body:'Six months later, I asked Margaret one question. She said yes before I finished asking.',
      voice:"Six months later, I asked Margaret one question. Would you help someone just starting? She said yes before I finished asking. Now she mentors three new members. The person who needed a hand is the hand someone else reaches for.",
      wash:{ primary:'rgba(232,124,160,.12)', secondary:'rgba(181,123,255,.05)' },
      duration:18000,
      content:[
        '<div class="ch5-layout">',
        '  <div class="ch5-time">Six months later.</div>',
        '  <blockquote class="ch5-q">',
        '    <span class="ch5-q-author">iris. asked</span>',
        '    <span class="ch5-q-text">&ldquo;Would you help someone just starting?&rdquo;</span>',
        '  </blockquote>',
        '  <div class="ch5-a">',
        '    <span class="ch5-a-text">yes.</span>',
        '    <span class="ch5-a-author">&mdash; Margaret</span>',
        '  </div>',
        '  <div class="ch5-status">',
        '    <span class="ch5-status-count">3</span>',
        '    <span class="ch5-status-t">new members she now mentors</span>',
        '  </div>',
        '</div>'
      ].join('')
    },
    {
      id:'partners',  eye:'Chapter 6 · Partners',
      title:'The clinic is now part of the network.',
      body:'Margaret\'s clinic sends a new member to iris. every week. Partners get a live view.',
      voice:"Margaret's clinic now sends a new member to me every week. Their ophthalmologist sees who reached out, who followed through, who found their footing. Partners get a live view. CNIB grows from the outside in. One waiting room at a time.",
      wash:{ primary:'rgba(90,200,255,.10)', secondary:'rgba(45,212,191,.05)' },
      duration:18000,
      content:[
        '<div class="ch6-layout">',
        '  <div class="ch6-eye">Partner &mdash; Sudbury Eye Centre</div>',
        '  <div class="ch6-clinic">',
        '    <svg class="ch6-clinic-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V9l9-6 9 6v12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 21v-7h6v7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="6" x2="12" y2="6.01" stroke="currentColor" stroke-width="2"/></svg>',
        '    <div class="ch6-clinic-name">Ophthalmology &middot; Sudbury, ON</div>',
        '  </div>',
        '  <div class="ch6-counter">',
        '    <span class="ch6-counter-n" data-count-to="38" data-count-dur="3000" data-count-delay="3500">0</span>',
        '    <div class="ch6-counter-meta">',
        '      <span class="ch6-counter-t">members referred to iris.</span>',
        '      <span class="ch6-counter-sub">projected &middot; illustrative</span>',
        '    </div>',
        '  </div>',
        '  <div class="ch6-live">',
        '    <span class="ch6-live-dot"></span>',
        '    <span>Partners see who reached out, who followed through, who found their footing.</span>',
        '  </div>',
        '</div>'
      ].join('')
    },
    {
      id:'loop',  eye:'Chapter 7 · The Loop',
      title:'The community regenerates itself.',
      body:'Client becomes volunteer. Volunteer becomes advocate. Advocate becomes partner.',
      voice:"Client becomes volunteer. Volunteer becomes advocate. Advocate becomes partner. Partner brings more clients. The community doesn't just grow. It regenerates itself.",
      wash:{ primary:'rgba(181,123,255,.12)', secondary:'rgba(255,209,0,.06)' },
      duration:12000,
      content:[
        '<div class="ch7-layout" aria-hidden="true">',
        '  <div class="ch7-flywheel">',
        '    <svg class="ch7-arcs" viewBox="0 0 520 520">',
        '      <defs>',
        '        <linearGradient id="ch7grad" x1="0" y1="0" x2="1" y2="1">',
        '          <stop offset="0" stop-color="#FFD100"/>',
        '          <stop offset="0.33" stop-color="#E87CA0"/>',
        '          <stop offset="0.66" stop-color="#B57BFF"/>',
        '          <stop offset="1" stop-color="#5AC8FF"/>',
        '        </linearGradient>',
        '      </defs>',
        '      <circle class="ch7-ring" cx="260" cy="260" r="220" fill="none" stroke="url(#ch7grad)" stroke-width="1.3" stroke-linecap="round"/>',
        '    </svg>',
        '    <div class="ch7-node ch7-node--n"><span class="ch7-node-n">01</span><span>Client</span></div>',
        '    <div class="ch7-node ch7-node--e"><span class="ch7-node-n">02</span><span>Volunteer</span></div>',
        '    <div class="ch7-node ch7-node--s"><span class="ch7-node-n">03</span><span>Advocate</span></div>',
        '    <div class="ch7-node ch7-node--w"><span class="ch7-node-n">04</span><span>Partner</span></div>',
        '  </div>',
        '  <div class="ch7-climax">It regenerates itself.</div>',
        '</div>'
      ].join('')
    },
    {
      id:'ask',  eye:'Chapter 8 · Your turn',
      title:'Ask iris. anything about the infrastructure.',
      body:"That's how I work. Now — what would you like to know?",
      voice:"That's how I work. Now — ask me anything about the infrastructure.",
      wash:{ primary:'rgba(255,180,60,.09)', secondary:'rgba(181,123,255,.05)' },
      duration:0,
      endChapter:true,
      content:[
        '<div class="ch8-layout">',
        '  <div class="ch8-intro">That\'s how I work.</div>',
        '  <div class="ch8-prompt">Now, ask me anything.</div>',
        '  <div class="ch8-cta">',
        '    <button type="button" class="btn btn-p ch8-primary" onclick="closeTour();setTimeout(function(){openChat(\'infrastructure\')||openChat(\'general\')},400)">',
        '      <span>Ask iris. anything</span>',
        '      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
        '    </button>',
        '    <button type="button" class="ch8-secondary" onclick="tourReplay()">',
        '      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
        '      <span>Replay the tour</span>',
        '    </button>',
        '  </div>',
        '  <div class="ch8-foot">Powered by CNIB</div>',
        '</div>'
      ].join('')
    },
  ];

  // ----------------------------------------------------------------
  // Build the tour DOM once, on first call. Kept in a closure so the
  // tour doesn't bloat initial page paint.
  // ----------------------------------------------------------------
  var root, sceneInner, transcript, rail, btnPrev, btnNext, btnPause, btnClose, btnTranscript, backdrop;
  var current = -1;
  var isPaused = false;
  var isOpen = false;
  var advanceTimer = null;
  var lastFocusBeforeTour = null;

  // ----------------------------------------------------------------
  // TTS — persistent <audio> element pattern (mobile-Safari safe).
  // Same approach as iris-chat.js:110-112 but isolated to the tour
  // so it doesn't collide with the live-chat voice queue.
  // ----------------------------------------------------------------
  var tourAudio = new Audio();
  tourAudio.playsInline = true;
  tourAudio.setAttribute('playsinline', '');
  tourAudio.preload = 'auto';
  tourAudio.addEventListener('ended', function(){
    if (root) root.classList.remove('speaking');
  });
  tourAudio.addEventListener('pause', function(){
    if (root) root.classList.remove('speaking');
  });

  var audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    // Silent audio trick: play a 0-duration clip during the user
    // gesture that opened the tour. Unlocks future programmatic plays
    // on iOS Safari. Same pattern iris-chat.js uses.
    try {
      tourAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
      tourAudio.volume = 0;
      var p = tourAudio.play();
      if (p && p.then) p.then(function(){ tourAudio.volume = 1; audioUnlocked = true; }).catch(function(){});
      else { tourAudio.volume = 1; audioUnlocked = true; }
    } catch (_) {}
  }

  // Per-chapter URL cache so we don't re-fetch on replay.
  var chapterAudioCache = Object.create(null);
  // AbortController per chapter so a skip/close cancels in-flight fetches.
  var currentAudioCtrl = null;

  function fetchChapterAudio(i) {
    var ch = CHAPTERS[i];
    if (!ch || !ch.voice) return Promise.resolve(null);
    if (chapterAudioCache[ch.id]) return Promise.resolve(chapterAudioCache[ch.id]);
    var ctrl = new AbortController();
    currentAudioCtrl = ctrl;
    return fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: ch.voice, voice: 'iris' }),
      signal: ctrl.signal,
    })
      .then(function(res){ if (!res.ok) throw new Error('TTS ' + res.status); return res.blob(); })
      .then(function(blob){
        var url = URL.createObjectURL(blob);
        chapterAudioCache[ch.id] = url;
        return url;
      })
      .catch(function(err){
        // Silent failure — transcript still shown, tour still advances.
        console.warn('[tour] tts fetch failed:', err && err.message);
        return null;
      });
  }

  function playChapterAudio(i) {
    var ch = CHAPTERS[i];
    if (!ch || !ch.voice) return;
    fetchChapterAudio(i).then(function(url){
      // Only play if this chapter is still the current one.
      if (current !== i || isPaused || !url) return;
      try {
        tourAudio.src = url;
        var p = tourAudio.play();
        if (p && p.then) {
          p.then(function(){ if (root) root.classList.add('speaking'); })
           .catch(function(err){
             console.warn('[tour] audio play failed:', err && err.message);
             if (root) root.classList.remove('speaking');
           });
        } else {
          if (root) root.classList.add('speaking');
        }
      } catch (e) {
        console.warn('[tour] audio play threw:', e && e.message);
      }
    });
    // Pre-fetch next chapter's audio while current plays.
    if (CHAPTERS[i + 1]) fetchChapterAudio(i + 1);
  }

  function stopChapterAudio() {
    try { tourAudio.pause(); tourAudio.currentTime = 0; } catch (_) {}
    if (root) root.classList.remove('speaking');
    if (currentAudioCtrl) { try { currentAudioCtrl.abort(); } catch (_) {} currentAudioCtrl = null; }
  }

  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'tour';
    root.id = 'tour';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'iris. guided tour');

    root.innerHTML = [
      '<div class="tour-backdrop" aria-hidden="true"></div>',
      '<div class="tour-speaking-badge" aria-hidden="true">',
      '  <span class="tour-speaking-bars"><span></span><span></span><span></span><span></span></span>',
      '  <span>iris. is speaking</span>',
      '</div>',
      '<div class="tour-mute-hint" aria-hidden="true">',
      '  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
      '  <span>Best with sound on</span>',
      '</div>',
      '<div class="tour-top">',
      '  <button class="tour-btn" id="tourTranscriptBtn" aria-label="Toggle transcript" aria-pressed="false">',
      '    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="14" y2="14"/></svg>',
      '  </button>',
      '  <button class="tour-btn" id="tourCloseBtn" aria-label="Close tour">',
      '    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </button>',
      '</div>',
      '<div class="tour-sr" id="tourSrAnnounce" aria-live="assertive" aria-atomic="true" role="status"></div>',
      '<div class="tour-scene">',
      '  <div class="tour-iris" id="tourIris" aria-hidden="true">',
      '    <svg viewBox="0 0 400 400">',
      '      <circle class="im-r im-r1" cx="200" cy="200" r="195"/>',
      '      <circle class="im-r im-r1" cx="200" cy="200" r="170"/>',
      '      <circle class="im-r im-r2" cx="200" cy="200" r="140"/>',
      '      <circle class="im-r im-r2" cx="200" cy="200" r="112"/>',
      '      <circle class="im-r im-r3" cx="200" cy="200" r="86"/>',
      '      <circle class="im-r im-r4" cx="200" cy="200" r="62"/>',
      '      <circle class="im-r im-r5" cx="200" cy="200" r="42"/>',
      '      <circle class="im-p" cx="200" cy="200" r="18"/>',
      '    </svg>',
      '  </div>',
      '  <div class="tour-scene-inner" id="tourSceneInner" aria-live="polite"></div>',
      '</div>',
      '<div class="tour-transcript" id="tourTranscript" aria-live="polite"></div>',
      '<div class="tour-controls">',
      '  <nav class="tour-nav" aria-label="Tour controls">',
      '    <button class="tour-btn" id="tourPrev" aria-label="Previous chapter">',
      '      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
      '    </button>',
      '    <button class="tour-btn tour-btn--play" id="tourPause" aria-label="Pause">',
      '      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" id="tourPauseIcon"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>',
      '    </button>',
      '    <button class="tour-btn" id="tourNext" aria-label="Next chapter">',
      '      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
      '    </button>',
      '  </nav>',
      '  <ol class="tour-rail" role="tablist" id="tourRail" aria-label="Chapter progress"></ol>',
      '</div>'
    ].join('');

    document.body.appendChild(root);

    sceneInner    = root.querySelector('#tourSceneInner');
    transcript    = root.querySelector('#tourTranscript');
    rail          = root.querySelector('#tourRail');
    btnPrev       = root.querySelector('#tourPrev');
    btnNext       = root.querySelector('#tourNext');
    btnPause      = root.querySelector('#tourPause');
    btnClose      = root.querySelector('#tourCloseBtn');
    btnTranscript = root.querySelector('#tourTranscriptBtn');
    backdrop      = root.querySelector('.tour-backdrop');

    // Build rail
    CHAPTERS.forEach(function(ch, i) {
      var li = document.createElement('li');
      li.style.listStyle = 'none';
      var dot = document.createElement('button');
      dot.className = 'tour-rail-dot';
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Jump to ' + ch.eye);
      dot.dataset.index = String(i);
      dot.addEventListener('click', function() { goTo(parseInt(dot.dataset.index, 10)); });
      li.appendChild(dot);
      rail.appendChild(li);
    });

    // Controls
    btnPrev.addEventListener('click', function(){ goTo(Math.max(0, current - 1)); });
    btnNext.addEventListener('click', function(){ goTo(Math.min(CHAPTERS.length - 1, current + 1)); });
    btnPause.addEventListener('click', togglePause);
    btnClose.addEventListener('click', close);
    btnTranscript.addEventListener('click', function() {
      var on = !root.classList.contains('transcript-on');
      root.classList.toggle('transcript-on', on);
      btnTranscript.setAttribute('aria-pressed', String(on));
      btnTranscript.classList.toggle('tour-btn--active', on);
    });

    // Keyboard
    document.addEventListener('keydown', function(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(CHAPTERS.length - 1, current + 1)); return; }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(Math.max(0, current - 1)); return; }
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePause(); return; }
    });
  }

  // ----------------------------------------------------------------
  // Rendering + state transitions
  // ----------------------------------------------------------------
  function renderChapter(i) {
    var ch = CHAPTERS[i];
    if (!ch) return;

    // Apply backdrop wash
    backdrop.style.setProperty('--tour-wash-primary', ch.wash.primary);
    backdrop.style.setProperty('--tour-wash-secondary', ch.wash.secondary);

    // Toggle per-chapter class on the tour root so CSS can choreograph the
    // iris mark + chapter-specific visuals. Remove prior ch-* class first.
    var prior = Array.prototype.filter.call(root.classList, function(c){ return c.indexOf('ch-') === 0; });
    prior.forEach(function(c){ root.classList.remove(c); });
    root.classList.add('ch-' + ch.id);

    // Scene content. Cross-fade: existing blocks transition to 'exit'
    // state, the new block enters at the same time. Old blocks get
    // removed after the exit transition (~550ms) so the DOM stays tidy.
    Array.prototype.forEach.call(sceneInner.querySelectorAll('.tour-chapter'), function(old) {
      if (old.dataset.state === 'exit') return;
      old.dataset.state = 'exit';
      setTimeout(function() { if (old.parentNode) old.parentNode.removeChild(old); }, 600);
    });

    var block = document.createElement('div');
    block.className = 'tour-chapter';
    block.dataset.state = 'enter';
    if (ch.content) {
      block.innerHTML = ch.content;
    } else {
      block.innerHTML = [
        '<p class="tour-chapter-eye">' + ch.eye + '</p>',
        '<h2 class="tour-chapter-title">' + ch.title + '</h2>',
        '<p class="tour-chapter-body">' + ch.body + '</p>'
      ].join('');
    }
    sceneInner.appendChild(block);
    // Allow transition to fire
    requestAnimationFrame(function() { block.dataset.state = 'active'; });

    // Kick off any count-up animations in this chapter's content.
    // Elements opt in via data-count-to (target int) and optional
    // data-count-dur (ms) / data-count-delay (ms).
    block.querySelectorAll('[data-count-to]').forEach(function(el) {
      var target = parseInt(el.dataset.countTo, 10);
      var dur    = parseInt(el.dataset.countDur || '2500', 10);
      var delay  = parseInt(el.dataset.countDelay || '0', 10);
      setTimeout(function() {
        var start = performance.now();
        function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target.toLocaleString();
        }
        requestAnimationFrame(step);
      }, delay);
    });

    // Transcript: exact voice line (what iris. is saying). Only visible
    // when user has toggled the transcript panel on.
    transcript.textContent = ch.voice || ch.body;

    // Update rail states
    rail.querySelectorAll('.tour-rail-dot').forEach(function(d, idx) {
      if (idx < i) d.dataset.state = 'past';
      else if (idx === i) d.dataset.state = 'current';
      else d.removeAttribute('data-state');
      d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });

    // Announce chapter change to screen readers (separate live region
    // so content re-layout doesn't swallow the announcement).
    var sr = document.getElementById('tourSrAnnounce');
    if (sr) sr.textContent = ch.eye + '. ' + ch.title + '. ' + (ch.voice || ch.body || '');
  }

  function goTo(i) {
    if (i < 0 || i >= CHAPTERS.length) return;
    stopChapterAudio();
    current = i;
    renderChapter(i);
    if (!isPaused) playChapterAudio(i);
    scheduleAdvance();
  }

  function scheduleAdvance() {
    if (advanceTimer) clearTimeout(advanceTimer);
    if (isPaused) return;
    var ch = CHAPTERS[current];
    if (!ch || ch.endChapter) return; // Last chapter waits for user action
    advanceTimer = setTimeout(function() {
      if (current < CHAPTERS.length - 1) goTo(current + 1);
    }, ch.duration + 1200); // 1.2s pause between chapters (per plan)
  }

  function togglePause() {
    isPaused = !isPaused;
    btnPause.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
    btnPause.querySelector('svg').innerHTML = isPaused
      ? '<polygon points="6 4 20 12 6 20 6 4"/>'
      : '<rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/>';
    if (isPaused) {
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      try { tourAudio.pause(); } catch (_) {}
    } else {
      scheduleAdvance();
      // Resume current chapter's voice from where it left off.
      try {
        var p = tourAudio.play();
        if (p && p.catch) p.catch(function(){});
      } catch (_) {}
    }
  }

  function open() {
    build();
    if (isOpen) return;
    // Unlock audio playback during the user gesture that started the tour
    // (the "See how" click). Required for iOS Safari TTS.
    unlockAudio();
    lastFocusBeforeTour = document.activeElement;
    isOpen = true;
    isPaused = false;
    root.classList.add('open');
    // Transcript on by default — captions keep up with narration from
    // the first chapter, visible whether or not audio is playing.
    root.classList.add('transcript-on');
    if (btnTranscript) {
      btnTranscript.setAttribute('aria-pressed', 'true');
      btnTranscript.classList.add('tour-btn--active');
    }
    document.body.style.overflow = 'hidden';
    setTimeout(function() { btnPause.focus(); }, 120);
    goTo(0);
  }

  function close() {
    if (!isOpen) return;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    stopChapterAudio();
    isOpen = false;
    root.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusBeforeTour && lastFocusBeforeTour.focus) {
      try { lastFocusBeforeTour.focus(); } catch (_) {}
    }
    // Landing post-tour state hook (Batch 7 will expand this)
    document.body.classList.add('tour-completed');
  }

  // --------------------------------------------------------------
  // Mouse parallax — subtle cursor-tracking for chapter content + iris.
  // Desktop only. Reduced-motion + touch devices skip. Lerp for smoothness.
  // Writes --px (-0.5 to 0.5) and --py (-0.5 to 0.5) onto .tour root.
  // CSS reads those vars on .tour-chapter and .tour-iris for depth layers.
  // --------------------------------------------------------------
  var parallaxReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var parallaxTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!parallaxReduced && !parallaxTouch) {
    var tpx = 0, tpy = 0, cpx = 0, cpy = 0;
    window.addEventListener('mousemove', function(e) {
      if (!isOpen || !root) return;
      var r = root.getBoundingClientRect();
      tpx = ((e.clientX - r.left) / r.width - 0.5);   // -0.5 .. 0.5
      tpy = ((e.clientY - r.top)  / r.height - 0.5);
    }, { passive: true });
    (function parallaxTick() {
      if (root) {
        cpx += (tpx - cpx) * 0.06;
        cpy += (tpy - cpy) * 0.06;
        root.style.setProperty('--px', cpx.toFixed(4));
        root.style.setProperty('--py', cpy.toFixed(4));
      }
      requestAnimationFrame(parallaxTick);
    })();
  }

  // Public API — override the stub defined in index.html
  window.startTour = open;
  window.closeTour = close;
  window.tourReplay = function() { isPaused = false; goTo(0); };
})();
