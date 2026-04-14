/* ================================================================
   iris. — System Demonstration · Scene renderers
   Each scene gets a render(stage, scene) function registered on
   window.demoSceneRenderers.{id}. demo.js invokes the matching
   renderer; falls back to placeholder card if a scene has no
   renderer yet.

   Phase A3 ships Scene 1 (intro) + Scene 11 (Ask iris.) so the
   demo has a real beginning + end. Phases B-D add middle scenes.
   ================================================================ */
(function() {
  'use strict';

  window.demoSceneRenderers = window.demoSceneRenderers || {};
  var data = window.demoData || {};

  // ================================================================
  // Scene 1 — "What is iris."
  // Prismatic wordmark, chromatic iris mark, one-line intro.
  // Caption follows what iris. is about to say (voice wiring in Phase E).
  // ================================================================
  window.demoSceneRenderers.intro = function(stage) {
    stage.innerHTML = [
      '<div class="s1-layout">',
      '  <div class="s1-mark" aria-hidden="true">',
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
      '  <h1 class="s1-wordmark prism">iris.</h1>',
      '  <p class="s1-lede">CNIB\u2019s engagement infrastructure.</p>',
      '  <p class="s1-sub">Acquire, engage, and retain \u2014 clients, volunteers, and partners \u2014 through one relationship layer.</p>',
      '</div>'
    ].join('');
  };

  // ================================================================
  // Scene 11 — "Ask iris. anything"
  // Lands after the tour. Offers the infrastructure chat + replay.
  // Clicking the primary CTA closes the demo and opens iris-chat.js
  // in scenarios.infrastructure mode (system prompt built in Batch 7b).
  // ================================================================
  window.demoSceneRenderers.ask = function(stage) {
    stage.innerHTML = [
      '<div class="s11-layout">',
      '  <div class="s11-mark" aria-hidden="true">',
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
      '  <p class="s11-intro">That\u2019s how I work.</p>',
      '  <h2 class="s11-prompt">Now, ask me anything.</h2>',
      '  <div class="s11-cta">',
      '    <button type="button" class="s11-primary" onclick="closeDemo();setTimeout(function(){(window.openChat&&openChat(\'infrastructure\'))||(window.openChat&&openChat(\'general\'))},380)">',
      '      <span>Ask iris. anything</span>',
      '      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>',
      '    </button>',
      '    <button type="button" class="s11-secondary" onclick="demoGoTo(0)">',
      '      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>',
      '      <span>Replay the demo</span>',
      '    </button>',
      '  </div>',
      '  <p class="s11-foot">Powered by CNIB</p>',
      '</div>'
    ].join('');
  };

})();
