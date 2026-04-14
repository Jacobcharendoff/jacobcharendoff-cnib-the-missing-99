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
  var CHAPTERS = [
    { id:'meet',      eye:'Chapter 1', title:"Hello. I'm iris.",
      body:"Let me show you how CNIB reaches everyone it's built to serve.",
      wash:{ primary:'rgba(255,209,0,.12)', secondary:'rgba(255,159,64,.06)' }, duration:10000 },
    { id:'gap',       eye:'Chapter 2 · The Gap', title:'The help is there. The connection isn\'t.',
      body:'1.5 million Canadians live with sight loss. Fewer than one in a hundred is reached today.',
      wash:{ primary:'rgba(90,140,255,.10)', secondary:'rgba(123,104,255,.05)' }, duration:15000 },
    { id:'framework', eye:'Chapter 3 · The Framework', title:'Three stages. Three audiences. One loop.',
      body:'Acquire, engage, and retain — applied to clients, volunteers, and partners. The same system. Different conversations.',
      wash:{ primary:'rgba(255,180,60,.12)', secondary:'rgba(255,209,0,.06)' }, duration:12000 },
    { id:'clients',   eye:'Chapter 4 · Clients', title:'Meet Margaret.',
      body:'68. Newly diagnosed with macular degeneration. She found me through a QR in her doctor\'s waiting room. Three weeks later, she had a plan.',
      wash:{ primary:'rgba(245,155,60,.14)', secondary:'rgba(255,209,0,.06)' }, duration:18000 },
    { id:'volunteers',eye:'Chapter 5 · Volunteers', title:'"Would you help someone just starting?"',
      body:'Six months later, I asked Margaret that one question. Today she\'s a peer mentor for three new members.',
      wash:{ primary:'rgba(232,124,160,.12)', secondary:'rgba(181,123,255,.06)' }, duration:18000 },
    { id:'partners',  eye:'Chapter 6 · Partners', title:'The clinic is now part of the network.',
      body:'A QR in her doctor\'s waiting room sends a new member to me every week. CNIB grows from the outside in.',
      wash:{ primary:'rgba(90,207,255,.10)', secondary:'rgba(45,212,191,.06)' }, duration:18000 },
    { id:'loop',      eye:'Chapter 7 · The Loop', title:'The community regenerates itself.',
      body:'Client becomes volunteer. Volunteer becomes advocate. Advocate brings a partner. Partner brings more clients. That\'s the engine.',
      wash:{ primary:'rgba(181,123,255,.10)', secondary:'rgba(255,209,0,.06)' }, duration:12000 },
    { id:'ask',       eye:'Chapter 8 · Your turn', title:'Ask iris. anything about the infrastructure.',
      body:"That's how I work. Now — what would you like to know?",
      wash:{ primary:'rgba(255,180,60,.10)', secondary:'rgba(181,123,255,.06)' }, duration:0,
      endChapter:true },
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
      '<div class="tour-top">',
      '  <button class="tour-btn" id="tourTranscriptBtn" aria-label="Toggle transcript" aria-pressed="false">',
      '    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><line x1="7" y1="10" x2="17" y2="10"/><line x1="7" y1="14" x2="14" y2="14"/></svg>',
      '  </button>',
      '  <button class="tour-btn" id="tourCloseBtn" aria-label="Close tour">',
      '    <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </button>',
      '</div>',
      '<div class="tour-scene"><div class="tour-scene-inner" id="tourSceneInner" aria-live="polite"></div></div>',
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

    // Scene content (replace with chapter-specific visuals in Batch 5)
    sceneInner.innerHTML = '';
    var block = document.createElement('div');
    block.className = 'tour-chapter';
    block.dataset.state = 'enter';
    block.innerHTML = [
      '<p class="tour-chapter-eye">' + ch.eye + '</p>',
      '<h2 class="tour-chapter-title">' + ch.title + '</h2>',
      '<p class="tour-chapter-body">' + ch.body + '</p>'
    ].join('');
    sceneInner.appendChild(block);
    // Allow transition to fire
    requestAnimationFrame(function() { block.dataset.state = 'active'; });

    // Transcript (same text; Batch 4 will sync to voice)
    transcript.textContent = ch.body;

    // Update rail states
    rail.querySelectorAll('.tour-rail-dot').forEach(function(d, idx) {
      if (idx < i) d.dataset.state = 'past';
      else if (idx === i) d.dataset.state = 'current';
      else d.removeAttribute('data-state');
      d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
  }

  function goTo(i) {
    if (i < 0 || i >= CHAPTERS.length) return;
    current = i;
    renderChapter(i);
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
    } else {
      scheduleAdvance();
    }
  }

  function open() {
    build();
    if (isOpen) return;
    lastFocusBeforeTour = document.activeElement;
    isOpen = true;
    isPaused = false;
    root.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { btnPause.focus(); }, 120);
    goTo(0);
  }

  function close() {
    if (!isOpen) return;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    isOpen = false;
    root.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusBeforeTour && lastFocusBeforeTour.focus) {
      try { lastFocusBeforeTour.focus(); } catch (_) {}
    }
    // Landing post-tour state hook (Batch 7 will expand this)
    document.body.classList.add('tour-completed');
  }

  // Public API — override the stub defined in index.html
  window.startTour = open;
  window.closeTour = close;
})();
