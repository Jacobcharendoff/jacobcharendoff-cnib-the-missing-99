/* ================================================================
   iris. — System Demonstration v3
   Replaces the auto-play tour with a viewer-driven, scene-based
   interactive walkthrough. ~4–5 minutes default playback; viewer
   can pause / scrub / drill-in at will.

   Files in this system:
     demo.js         — engine (this file)
     demo.css        — styles (companion)
     demo-data.js    — measurement framework + Margaret timeline
                       (Phase A2; loaded if present, defaults inline)
     iris-chat.js    — reused for persistentAudio + scenarios.margaret
                       (dual-voice in Scene 2) + infrastructure Q&A
                       (powers Scene 11)

   Public API (overrides any prior startTour stub):
     window.startTour() / window.startDemo()  — open the demo
     window.closeDemo()                       — close
     window.demoGoTo(i)                       — jump to scene i
   ================================================================ */
(function() {
  'use strict';

  // -------------------------------------------------------------------
  // Scene catalog. Per-scene render functions live in their own modules
  // (added in Phase B onward). For Phase A skeleton, scenes show their
  // label + a placeholder card so the engine walks end-to-end.
  // -------------------------------------------------------------------
  var SCENES = [
    { id:'intro',       label:'What is iris.',          duration:15000 },
    { id:'acquire',     label:'Acquire a client',       duration:45000 },
    { id:'engage',      label:'Engage + handoff',       duration:30000 },
    { id:'retain',      label:'Retain a client',        duration:25000 },
    { id:'readiness',   label:'Volunteer ask',          duration:30000 },
    { id:'volonboard',  label:'Volunteer onboarding',   duration:20000 },
    { id:'partneracq',  label:'Partner acquisition',    duration:30000 },
    { id:'partnerdash', label:'Partner dashboard',      duration:40000 },
    { id:'loop',        label:'The loop',               duration:30000 },
    { id:'scoreboard',  label:'Scoreboard',             duration:20000 },
    { id:'ask',         label:'Ask iris. anything',     duration:0, endScene:true }
  ];

  // -------------------------------------------------------------------
  // Engine state
  // -------------------------------------------------------------------
  var root, sceneStage, sceneEye, sceneTitle, sceneBody, btnClose, progress;
  var current = -1;
  var isOpen = false;
  var isPaused = false;
  var advanceTimer = null;
  var lastFocus = null;
  var sceneGen = 0;  // Monotonic generation counter — bumped on every goTo().
                     // Scene renderers capture their gen at mount. Dispatches
                     // carry their gen. The engine ignores stale dispatches.

  // -------------------------------------------------------------------
  // Build the demo DOM once, lazily on first open.
  // -------------------------------------------------------------------
  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'demo';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'iris. system demonstration');
    root.innerHTML = [
      '<div class="demo-backdrop" aria-hidden="true"></div>',
      '<header class="demo-top">',
      '  <div class="demo-meta">',
      '    <span class="demo-meta-eye" id="demoSceneEye">Scene</span>',
      '    <span class="demo-meta-pos" id="demoScenePos">1 / ' + SCENES.length + '</span>',
      '  </div>',
      '  <button type="button" class="demo-btn demo-close" id="demoClose" aria-label="Close demo">',
      '    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '  </button>',
      '</header>',
      '<main class="demo-stage" id="demoStage" aria-live="polite"></main>',
      '<div class="demo-loading" id="demoLoading" aria-live="polite">',
      '  <div class="demo-loading-inner">',
      '    <div class="demo-loading-mark" aria-hidden="true">',
      '      <svg viewBox="0 0 200 200">',
      '        <circle class="dl-r dl-r1" cx="100" cy="100" r="94"/>',
      '        <circle class="dl-r dl-r2" cx="100" cy="100" r="72"/>',
      '        <circle class="dl-r dl-r3" cx="100" cy="100" r="48"/>',
      '        <circle class="dl-p"  cx="100" cy="100" r="12"/>',
      '      </svg>',
      '    </div>',
      '    <p class="demo-loading-eye">iris.</p>',
      '    <p class="demo-loading-title">Getting your walkthrough ready</p>',
      '    <div class="demo-loading-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">',
      '      <span class="demo-loading-fill" id="demoLoadingFill"></span>',
      '    </div>',
      '    <p class="demo-loading-meta" id="demoLoadingMeta">Preloading voice\u2026</p>',
      '  </div>',
      '</div>',
      '<div class="demo-progress" id="demoProgress" aria-hidden="true"><span class="demo-progress-bar"></span></div>'
    ].join('');
    document.body.appendChild(root);

    sceneStage = root.querySelector('#demoStage');
    sceneEye   = root.querySelector('#demoSceneEye');
    btnClose   = root.querySelector('#demoClose');
    progress   = root.querySelector('#demoProgress');

    // No footer controls — it's a film, not a slide deck. Close button
    // (top-right) + Esc keyboard shortcut are the only viewer controls.
    // Keyboard arrows still scrub for internal QA.

    btnClose.addEventListener('click', close);
    document.addEventListener('keydown', function(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(SCENES.length - 1, current + 1)); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(Math.max(0, current - 1)); }
      else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePause(); }
    });

    // Scene-completion signal. Renderers dispatch 'demo:scene-done' with
    // { detail: { gen } } — engine only advances if gen matches current.
    // Stale dispatches from torn-down scenes are silently dropped.
    document.addEventListener('demo:scene-done', function(e) {
      if (!isOpen || isPaused) return;
      var dispatchGen = e && e.detail && e.detail.gen;
      if (dispatchGen !== sceneGen) return; // stale — ignore
      var s = SCENES[current];
      if (!s || s.endScene) return;
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
      var next = current + 1;
      if (next < SCENES.length) goTo(next);
    });
  }

  // -------------------------------------------------------------------
  // Scene rendering — Phase A skeleton uses a placeholder card per scene.
  // Phase B onward replaces these with per-scene render functions, which
  // can be registered on window.demoSceneRenderers[id] = function(stage).
  // -------------------------------------------------------------------
  function renderScene(i) {
    var s = SCENES[i];
    if (!s) return;

    sceneEye.textContent = s.label;
    root.querySelector('#demoScenePos').textContent = (i+1) + ' / ' + SCENES.length;

    // Apply a per-scene class on root for CSS to choreograph backdrop, iris mark etc.
    Array.prototype.filter.call(root.classList, function(c){ return c.indexOf('s-') === 0; })
      .forEach(function(c){ root.classList.remove(c); });
    root.classList.add('s-' + s.id);

    // Cross-fade old scene out, new in
    Array.prototype.forEach.call(sceneStage.querySelectorAll('.demo-scene'), function(old) {
      if (old.dataset.state === 'exit') return;
      old.dataset.state = 'exit';
      setTimeout(function() { if (old.parentNode) old.parentNode.removeChild(old); }, 600);
    });

    var block = document.createElement('div');
    block.className = 'demo-scene';
    block.dataset.state = 'enter';
    block.dataset.sceneId = s.id;

    var renderer = window.demoSceneRenderers && window.demoSceneRenderers[s.id];
    if (typeof renderer === 'function') {
      renderer(block, s);
    } else {
      // Phase A placeholder
      block.innerHTML = [
        '<div class="demo-placeholder">',
        '  <p class="demo-placeholder-eye">Scene ' + (i+1) + ' — ' + s.id + '</p>',
        '  <h2 class="demo-placeholder-title">' + s.label + '</h2>',
        '  <p class="demo-placeholder-body">Scene content arrives in a later batch. The shell walks you through every scene so the engine is testable end-to-end.</p>',
        '</div>'
      ].join('');
    }

    sceneStage.appendChild(block);
    requestAnimationFrame(function() { block.dataset.state = 'active'; });

    // Update rail dot states
    // (Rail dots removed — guided journey, not slide deck)
  }

  function goTo(i) {
    if (i < 0 || i >= SCENES.length) return;
    // Bump generation SYNCHRONOUSLY so any in-flight .then() callbacks
    // in the outgoing scene see a stale gen and bail before dispatching
    // demo:scene-done. This is the primary guard against double-advance.
    sceneGen++;
    // Teardown signal — scene renderers flip their local `cancelled` flag
    // synchronously, BEFORE we call tour.stop(). Without this, stop()'s
    // audio.pause() triggers onpause → cleanup() → promise resolves →
    // .then() sees cancelled=false (DOMNodeRemoved hasn't fired) → stale
    // dispatchEvent → engine advances AGAIN. Scenes skip, audio bleeds.
    document.dispatchEvent(new CustomEvent('demo:scene-teardown', {
      detail: { gen: sceneGen }
    }));
    if (window.irisTour && typeof window.irisTour.stop === 'function') {
      try { window.irisTour.stop(); } catch(e) {}
    }
    current = i;
    renderScene(i);
    scheduleAdvance();
  }

  function scheduleAdvance() {
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    if (isPaused) return;
    var s = SCENES[current];
    if (!s || s.endScene) return;
    // Safety fallback: fires if the scene's orchestration never dispatches
    // 'demo:scene-done' (e.g. voice unavailable, placeholder scene, or a
    // renderer bug). Orchestrated scenes dispatch the event when narration
    // completes and will cancel this timer before it fires.
    // Durations in SCENES[] are the fallback display times for each scene.
    var fallback = s.duration || 30000;
    advanceTimer = setTimeout(function() {
      if (isOpen && !isPaused && current < SCENES.length - 1) goTo(current + 1);
    }, fallback);
  }

  function togglePause() {
    // Pause button removed from UI; Space key still toggles internal state
    // for QA. No visible icon to swap.
    isPaused = !isPaused;
    if (isPaused) {
      if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    } else {
      scheduleAdvance();
    }
  }

  function open() {
    build();
    if (isOpen) return;
    lastFocus = document.activeElement;
    isOpen = true;
    isPaused = false;
    root.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(function() { if (btnClose) btnClose.focus(); }, 120);

    // Show loading screen; run preload; then fade out + mount Scene 1.
    // If preloader is missing (script-load race), fall through to Scene 1
    // so we never block behind a missing dep.
    var loading = root.querySelector('#demoLoading');
    var fill    = root.querySelector('#demoLoadingFill');
    var meta    = root.querySelector('#demoLoadingMeta');

    function hideLoadingAndStart() {
      if (loading) {
        loading.classList.add('is-hidden');
        setTimeout(function() { if (loading.parentNode) loading.style.display = 'none'; }, 650);
      }
      goTo(0);
    }

    if (typeof window.demoPreload !== 'function') {
      if (loading) loading.style.display = 'none';
      goTo(0);
      return;
    }

    // Preload with progress reporting. Minimum 900ms show-time so the
    // loading state reads as deliberate, not a flicker, even on a warm
    // cache or instant resolve.
    var start = Date.now();
    var MIN_SHOW_MS = 900;
    window.demoPreload(function(p) {
      if (fill && p.total) {
        var pct = Math.round(100 * p.loaded / p.total);
        fill.style.width = pct + '%';
        loading.querySelector('.demo-loading-bar').setAttribute('aria-valuenow', String(pct));
      }
      if (meta) meta.textContent = 'Preloading voice \u2014 ' + p.loaded + ' of ' + p.total;
    }).then(function() {
      if (meta) meta.textContent = 'Ready.';
      var elapsed = Date.now() - start;
      var wait = Math.max(0, MIN_SHOW_MS - elapsed);
      setTimeout(hideLoadingAndStart, wait);
    }).catch(function() {
      // Never block on preload errors — show the tour anyway.
      hideLoadingAndStart();
    });
  }

  function close() {
    if (!isOpen) return;
    if (advanceTimer) { clearTimeout(advanceTimer); advanceTimer = null; }
    isOpen = false;
    root.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch(_){} }
    document.body.classList.add('demo-completed');
  }

  // Public API — overrides startTour stub from index.html and any prior tour.js
  window.demoSceneRenderers = window.demoSceneRenderers || {};
  window.startDemo = open;
  window.startTour = open; // alias so existing 'See how' button still works
  window.closeDemo = close;
  window.demoGoTo  = goTo;
  // Scene renderers call this at mount to capture their generation.
  // They include the gen in their demo:scene-done dispatches so the
  // engine can ignore stale signals from torn-down scenes.
  window.demoCurrentGen = function() { return sceneGen; };
})();
