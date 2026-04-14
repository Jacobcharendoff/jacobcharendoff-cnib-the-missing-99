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
  // Scene 2 — Acquire a client (Margaret arrives)
  // Live chat log (left) + iris.'s matching panel (right) + SLA timer.
  // Chat turns appear timed over ~25s; matches populate at ~30s.
  // Voice narration wired in Phase E; for now, bubble appearance alone.
  // ================================================================
  window.demoSceneRenderers.acquire = function(stage) {
    var m = (data.margaret || {});
    var chatTurns = m.firstChat || [];
    var matches   = m.programMatches || [];
    var src       = m.source || 'QR scan';

    stage.innerHTML = [
      '<div class="s2-layout">',
      '  <div class="s2-sla" aria-live="polite">',
      '    <span class="s2-sla-label">First reply</span>',
      '    <span class="s2-sla-target">Target &lt; 30s</span>',
      '    <span class="s2-sla-actual" id="s2SlaActual">&mdash;</span>',
      '  </div>',
      '  <div class="s2-split">',
      '    <section class="s2-chat" aria-label="iris. and Margaret live conversation">',
      '      <header class="s2-chat-head">',
      '        <span class="s2-chat-dot" aria-hidden="true"></span>',
      '        <span class="s2-chat-source">' + src + '</span>',
      '      </header>',
      '      <div class="s2-chat-log" id="s2ChatLog" aria-live="polite"></div>',
      '    </section>',
      '    <aside class="s2-matches" aria-label="iris. matching logic">',
      '      <div class="s2-matches-head">',
      '        <span class="s2-matches-eye">iris. is matching</span>',
      '        <span class="s2-matches-status" id="s2MatchStatus">Listening\u2026</span>',
      '      </div>',
      '      <div class="s2-matches-list" id="s2MatchList"></div>',
      '    </aside>',
      '  </div>',
      '</div>'
    ].join('');

    var log        = stage.querySelector('#s2ChatLog');
    var matchList  = stage.querySelector('#s2MatchList');
    var matchStat  = stage.querySelector('#s2MatchStatus');
    var slaActual  = stage.querySelector('#s2SlaActual');

    // Chat bubbles — appear one at a time, ~5s apart. Sync to voice
    // narration in Phase E.
    chatTurns.forEach(function(turn, i) {
      setTimeout(function() {
        if (!log.parentNode) return; // scene swapped
        var bubble = document.createElement('div');
        bubble.className = 's2-bubble s2-bubble--' + (turn.speaker === 'iris' ? 'iris' : 'user');
        bubble.innerHTML = [
          '<span class="s2-bubble-who">' + (turn.speaker === 'iris' ? 'iris.' : 'Margaret') + '</span>',
          '<span class="s2-bubble-text"></span>'
        ].join('');
        bubble.querySelector('.s2-bubble-text').textContent = turn.text;
        log.appendChild(bubble);
        requestAnimationFrame(function(){ bubble.classList.add('show'); });
        log.scrollTop = log.scrollHeight;
        if (i === 0) slaActual.textContent = '23 seconds';
      }, 400 + i * 5000);
    });

    // Matching status updates
    setTimeout(function() {
      if (matchStat.parentNode) matchStat.textContent = 'Narrowing\u2026';
    }, 16000);

    // Matches populate after chat
    setTimeout(function() {
      if (!matchList.parentNode) return;
      matchStat.textContent = matches.length + ' programs matched';
      matches.forEach(function(p, i) {
        setTimeout(function() {
          if (!matchList.parentNode) return;
          var card = document.createElement('div');
          card.className = 's2-match';
          card.innerHTML = [
            '<div class="s2-match-head">',
            '  <span class="s2-match-name"></span>',
            '  <span class="s2-match-score">' + p.fitScore + '<span class="s2-match-score-pct">% fit</span></span>',
            '</div>',
            '<ul class="s2-match-why"></ul>'
          ].join('');
          card.querySelector('.s2-match-name').textContent = p.name;
          var ul = card.querySelector('.s2-match-why');
          (p.reasoning || []).forEach(function(r) {
            var li = document.createElement('li');
            li.textContent = r;
            ul.appendChild(li);
          });
          matchList.appendChild(card);
          requestAnimationFrame(function(){ card.classList.add('show'); });
        }, i * 900);
      });
    }, 28000);
  };

  // ================================================================
  // Scene 3 — Engage + handoff (7 days in motion)
  // Horizontal timeline of Margaret's first 7 days: iris. conversation →
  // coordinator brief → warm callback → peer connection → program session.
  // Each stage carries target-vs-actual SLA. Bottom callout = success signal.
  // ================================================================
  window.demoSceneRenderers.engage = function(stage) {
    var m = (data.margaret || {});
    var tl = m.handoffTimeline || [];

    stage.innerHTML = [
      '<div class="s3-layout">',
      '  <header class="s3-head">',
      '    <span class="s3-eye">First 7 days \u2014 handoff in motion</span>',
      '    <h2 class="s3-title">A conversation that becomes a plan.</h2>',
      '  </header>',
      '  <ol class="s3-timeline" id="s3Timeline" aria-label="Handoff timeline"></ol>',
      '  <footer class="s3-success" id="s3Success" aria-hidden="true">',
      '    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      '    <span>Concrete next step booked within 7 days. 5 of 5 SLAs met.</span>',
      '  </footer>',
      '</div>'
    ].join('');

    var timelineEl = stage.querySelector('#s3Timeline');
    var successEl  = stage.querySelector('#s3Success');

    tl.forEach(function(step, i) {
      var met = (step.actualHrs || 0) <= (step.slaTargetHrs || Infinity);
      var slaText = step.slaTargetHrs
        ? ('target ' + fmtHrs(step.slaTargetHrs) + ' · actual ' + fmtHrs(step.actualHrs))
        : 'immediate';
      var li = document.createElement('li');
      li.className = 's3-step' + (met ? ' is-met' : ' is-miss');
      li.dataset.index = String(i);
      li.innerHTML = [
        '<div class="s3-step-dot" aria-hidden="true"><span></span></div>',
        '<div class="s3-step-day">Day ' + step.day + '</div>',
        '<div class="s3-step-label"></div>',
        '<div class="s3-step-detail"></div>',
        '<div class="s3-step-sla">' + slaText + '</div>'
      ].join('');
      li.querySelector('.s3-step-label').textContent = step.label;
      li.querySelector('.s3-step-detail').textContent = step.detail;
      timelineEl.appendChild(li);
      setTimeout(function() { li.classList.add('show'); }, 300 + i * 900);
    });

    setTimeout(function() {
      if (successEl.parentNode) successEl.classList.add('show');
    }, 300 + tl.length * 900 + 600);
  };

  function fmtHrs(h) {
    if (h == null || h === 0) return 'now';
    if (h < 24) return h + 'h';
    var d = Math.round(h / 24);
    return d + 'd';
  }

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
