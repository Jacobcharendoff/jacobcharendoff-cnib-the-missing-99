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
  var root, sceneStage, sceneEye, sceneTitle, sceneBody,
      btnPrev, btnNext, btnPause, btnClose, rail, progress;
  var current = -1;
  var isOpen = false;
  var isPaused = false;
  var advanceTimer = null;
  var lastFocus = null;

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
      '<footer class="demo-controls">',
      '  <button type="button" class="demo-btn" id="demoPrev" aria-label="Previous scene">',
      '    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
      '  </button>',
      '  <button type="button" class="demo-btn demo-btn--play" id="demoPause" aria-label="Pause">',
      '    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" id="demoPauseIcon" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>',
      '  </button>',
      '  <button type="button" class="demo-btn" id="demoNext" aria-label="Next scene">',
      '    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>',
      '  </button>',
      '  <ol class="demo-rail" id="demoRail" role="tablist" aria-label="Scene progress"></ol>',
      '</footer>',
      '<div class="demo-progress" id="demoProgress" aria-hidden="true"><span class="demo-progress-bar"></span></div>'
    ].join('');
    document.body.appendChild(root);

    sceneStage = root.querySelector('#demoStage');
    sceneEye   = root.querySelector('#demoSceneEye');
    btnPrev    = root.querySelector('#demoPrev');
    btnNext    = root.querySelector('#demoNext');
    btnPause   = root.querySelector('#demoPause');
    btnClose   = root.querySelector('#demoClose');
    rail       = root.querySelector('#demoRail');
    progress   = root.querySelector('#demoProgress');

    // Build progress rail (one dot per scene)
    SCENES.forEach(function(s, i) {
      var li = document.createElement('li');
      li.style.listStyle = 'none';
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'demo-rail-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Scene ' + (i+1) + ' — ' + s.label);
      dot.dataset.index = String(i);
      dot.addEventListener('click', function() { goTo(parseInt(dot.dataset.index, 10)); });
      li.appendChild(dot);
      rail.appendChild(li);
    });

    btnPrev.addEventListener('click', function() { goTo(Math.max(0, current - 1)); });
    btnNext.addEventListener('click', function() { goTo(Math.min(SCENES.length - 1, current + 1)); });
    btnPause.addEventListener('click', togglePause);
    btnClose.addEventListener('click', close);
    document.addEventListener('keydown', function(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(Math.min(SCENES.length - 1, current + 1)); }
      else if (e.key === 'ArrowLeft')  { e.preventDefault(); goTo(Math.max(0, current - 1)); }
      else if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePause(); }
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
    rail.querySelectorAll('.demo-rail-dot').forEach(function(d, idx) {
      if (idx < i) d.dataset.state = 'past';
      else if (idx === i) d.dataset.state = 'current';
      else d.removeAttribute('data-state');
      d.setAttribute('aria-selected', idx === i ? 'true' : 'false');
    });
  }

  function goTo(i) {
    if (i < 0 || i >= SCENES.length) return;
    // Hard-stop any in-flight audio BEFORE swapping scenes. Relying on
    // DOMNodeRemoved listeners inside scene renderers is unreliable
    // (the event is deprecated + fires asynchronously in some browsers),
    // which caused Scene 1's iris VO to bleed into Scene 2's narrator.
    // The engine knows when scenes change — it should drive the stop.
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
    if (!s || s.endScene || !s.duration) return; // last scene waits for user
    advanceTimer = setTimeout(function() {
      if (current < SCENES.length - 1) goTo(current + 1);
    }, s.duration);
  }

  function togglePause() {
    isPaused = !isPaused;
    btnPause.setAttribute('aria-label', isPaused ? 'Play' : 'Pause');
    var ic = btnPause.querySelector('svg');
    if (ic) ic.innerHTML = isPaused
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
    lastFocus = document.activeElement;
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
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch(_){} }
    document.body.classList.add('demo-completed');
  }

  // Public API — overrides startTour stub from index.html and any prior tour.js
  window.demoSceneRenderers = window.demoSceneRenderers || {};
  window.startDemo = open;
  window.startTour = open; // alias so existing 'See how' button still works
  window.closeDemo = close;
  window.demoGoTo  = goTo;
})();
