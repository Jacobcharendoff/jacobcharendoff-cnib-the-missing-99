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
    // Scene 1 uses a narrator beat — NOT iris's first-person VO.
    // iris speaks as herself only inside live demo scenes (2, 5).
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

    // Narrator 'enter' beat — plays after the iris mark settles (800ms)
    var beats = (data.narratorBeats && data.narratorBeats.intro) || [];
    if (!beats.length) return;

    var tour = window.irisTour;
    var voiceReady = tour && typeof tour.prefetch === 'function' &&
                     typeof tour.play === 'function' &&
                     (typeof tour.isVoiceEnabled !== 'function' || tour.isVoiceEnabled());
    if (!voiceReady) return;

    var myGen = (window.demoCurrentGen && window.demoCurrentGen()) || 0;
    var cancelled = false;
    var onTeardown = function() {
      cancelled = true;
      document.removeEventListener('demo:scene-teardown', onTeardown);
    };
    document.addEventListener('demo:scene-teardown', onTeardown);

    (async function() {
      var beat = beats[0];
      var handle = await tour.prefetch(beat.text, 'narrator');
      if (cancelled) return;
      await new Promise(function(r){ setTimeout(r, 800); }); // let mark animate in
      if (cancelled) return;
      await tour.play(handle, beat.text);
      if (!cancelled) document.dispatchEvent(new CustomEvent('demo:scene-done', { detail: { gen: myGen } }));
    })();
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
      // Cold-open frame overlays the chat/match split while the narrator
      // sets the scene ("This is Margaret... her daughter sent a QR code...").
      // Hidden via .is-hidden right before iris says her first line.
      '  <div class="s2-coldopen" id="s2ColdOpen" aria-hidden="true">',
      '    <div class="s2-coldopen-card">',
      '      <div class="s2-coldopen-avatar">M</div>',
      '      <div class="s2-coldopen-name">Margaret</div>',
      '      <div class="s2-coldopen-meta">',
      '        <span><b>68</b> \u00b7 Sudbury, ON \u00b7 retired teacher</span>',
      '        <span>Diagnosed <b>macular degeneration</b> \u00b7 8 weeks ago</span>',
      '        <span>Hasn\u2019t told her daughter yet</span>',
      '      </div>',
      '      <div class="s2-coldopen-qr">Scanned CNIB QR \u00b7 30s ago</div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var log        = stage.querySelector('#s2ChatLog');
    var matchList  = stage.querySelector('#s2MatchList');
    var matchStat  = stage.querySelector('#s2MatchStatus');
    var slaActual  = stage.querySelector('#s2SlaActual');

    // ---- Docent orchestration: narrator beats interleaved with dialogue ----
    // Sequence:
    //   enter narrator   -> turn 0 (iris)   -> turn 1 (margaret)
    //   afterTurn:1      -> turn 2 (iris)   -> turn 3 (margaret)
    //   afterTurn:3      -> turn 4 (iris)   -> visual: match cards populate
    //   afterVisual:matches -> exit narrator -> bridge to Scene 3
    //
    // All audio is prefetched in parallel on scene mount (capped at 4s so
    // playback never blocks indefinitely). Every beat waits for the prior
    // one to finish — no overlapping voices. Cancellation fires on scene
    // teardown so audio can't bleed into the next scene.
    var beats = (data.narratorBeats && data.narratorBeats.acquire) || [];
    var beatByAt = {};
    beats.forEach(function(b) { beatByAt[b.at] = b; });

    var tour = window.irisTour;
    var voiceReady = tour && typeof tour.prefetch === 'function' &&
                     typeof tour.play === 'function' &&
                     (typeof tour.isVoiceEnabled !== 'function' || tour.isVoiceEnabled());

    var myGen = (window.demoCurrentGen && window.demoCurrentGen()) || 0;
    var cancelled = false;
    var onTeardown = function() {
      cancelled = true;
      document.removeEventListener('demo:scene-teardown', onTeardown);
    };
    document.addEventListener('demo:scene-teardown', onTeardown);

    function renderBubble(turn) {
      if (!log.parentNode) return null;
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
      return bubble;
    }

    function buildMatchCard(p) {
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
      return card;
    }

    function populateMatches() {
      // Returns a promise that resolves once every card has animated in.
      return new Promise(function(resolve) {
        var total = matches.length;
        if (!total || !matchList.parentNode) { resolve(); return; }
        matchStat.textContent = matches.length + ' programs matched';
        var landed = 0;
        matches.forEach(function(p, i) {
          setTimeout(function() {
            if (cancelled || !matchList.parentNode) { landed++; if (landed === total) resolve(); return; }
            var card = buildMatchCard(p);
            matchList.appendChild(card);
            requestAnimationFrame(function(){ card.classList.add('show'); });
            landed++;
            if (landed === total) setTimeout(resolve, 700);
          }, i * 800);
        });
      });
    }

    function playBeatFallback() {
      // No voice available (or iris-chat.js hasn't loaded). Hold the
      // cold-open frame for a beat so the viewer sees Margaret's setup,
      // then fade it out and run the old 4.8s/bubble visual pacing.
      setTimeout(function(){
        var coldOpen = stage.querySelector('#s2ColdOpen');
        if (coldOpen) coldOpen.classList.add('is-hidden');
      }, 3500);
      var i = 0;
      function next() {
        if (cancelled || !log.parentNode) return;
        if (i >= chatTurns.length) {
          matchStat.textContent = 'Narrowing\u2026';
          setTimeout(function(){
            if (!cancelled) populateMatches().then(function() {
              if (!cancelled) document.dispatchEvent(new CustomEvent('demo:scene-done', { detail: { gen: myGen } }));
            });
          }, 1200);
          return;
        }
        renderBubble(chatTurns[i]);
        if (i === 0) slaActual.textContent = '23 seconds';
        i++;
        setTimeout(next, 4800);
      }
      setTimeout(next, 4200);
    }

    // Helper that plays a beat (narrator OR dialogue) if the audio handle
    // is ready. Returns a promise. Safe on null handles — falls through to
    // reading-time pacing so nothing gets skipped silently.
    function playHandle(handle, fallbackText) {
      if (!voiceReady) return Promise.resolve();
      return tour.play(handle, fallbackText);
    }

    async function orchestrate() {
      if (!voiceReady) { playBeatFallback(); return; }

      // ---- Parallel prefetch of EVERY audio blob for this scene ----
      // Narrator beats + dialogue turns fire concurrently. Most arrive
      // within ~1-2s; we cap the hard wait at 4s so the scene doesn't
      // stall if one request is slow. Individual handles that arrive
      // later are still awaited in sequence below — they just won't
      // be instant the first time.
      var narratorHandles = {};
      var turnHandles = [];
      var pre = [];
      beats.forEach(function(b) {
        pre.push(tour.prefetch(b.text, 'narrator').then(function(h){ narratorHandles[b.at] = h; }));
      });
      chatTurns.forEach(function(t, i) {
        pre.push(tour.prefetch(t.text, t.voice || t.speaker || 'iris').then(function(h){ turnHandles[i] = h; }));
      });
      await Promise.race([
        Promise.all(pre),
        new Promise(function(resolve){ setTimeout(resolve, 2000); })
      ]);
      if (cancelled) return;

      // ---- Interleaved playback ----

      // 1. Entry narrator — 'This is Margaret...'
      //    While this plays, the cold-open card is visible: viewer sees
      //    Margaret's name, age, location, diagnosis, QR-scan pill —
      //    exactly what the narrator is describing. Visuals and script
      //    are in sync instead of a chat header showing while the
      //    narrator talks about a QR code.
      await playHandle(narratorHandles['enter'], beatByAt['enter'] && beatByAt['enter'].text);
      if (cancelled) return;

      // 2. Transition: hide the cold-open card, chat/match split reveals.
      //    Uses CSS fade-out on .is-hidden. 900ms transition runs in
      //    parallel with renderBubble so iris's first line doesn't feel
      //    like it starts in a vacuum.
      var coldOpen = stage.querySelector('#s2ColdOpen');
      if (coldOpen) coldOpen.classList.add('is-hidden');

      // 3. Full dialogue plays UNINTERRUPTED — 5 turns in sequence.
      //    Narrator stays out of the way while iris + Margaret talk.
      //    The SLA timer flips on turn 0; the match panel starts
      //    'Narrowing' quietly on turn 3 so the visual primes for
      //    the post-dialogue narrator beat without breaking the
      //    conversational flow.
      for (var ti = 0; ti < chatTurns.length; ti++) {
        var turn = chatTurns[ti];
        if (!turn) continue;
        renderBubble(turn);
        if (ti === 0) slaActual.textContent = '23 seconds';
        if (ti === 3) matchStat.textContent = 'Narrowing\u2026';
        await playHandle(turnHandles[ti], turn.text);
        if (cancelled) return;
      }

      // 3. Match cards populate — silent visual beat, narrator
      //    steps back in once they've settled.
      await populateMatches();
      if (cancelled) return;

      // 4. afterVisual:matches narrator — reflects on what just happened
      //    in the conversation AND names the top match. Combined the
      //    old afterTurn:1 + afterTurn:3 + afterVisual:matches into one
      //    longer post-scene reflection so dialogue can breathe.
      await playHandle(narratorHandles['afterVisual:matches'], beatByAt['afterVisual:matches'] && beatByAt['afterVisual:matches'].text);
      if (cancelled) return;

      // 5. Exit narrator — bridges to Scene 3
      await playHandle(narratorHandles['exit'], beatByAt['exit'] && beatByAt['exit'].text);
      if (!cancelled) document.dispatchEvent(new CustomEvent('demo:scene-done', { detail: { gen: myGen } }));
    }

    orchestrate();
  };

  // ================================================================
  // Scene 3 — Engage + handoff (7 days in motion)
  // Horizontal timeline of Margaret's first 7 days: iris. conversation →
  // coordinator brief → warm callback → peer connection → program session.
  // Each stage carries target-vs-actual SLA. Bottom callout = success signal.
  // ================================================================
  window.demoSceneRenderers.engage = function(stage) {
    playSceneVO(stage, 'engage', { delay: 600 });
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
  // Scene 4 — Retain (12 months in motion)
  // Timeline auto-advances through 6 check-in points. Engagement graph
  // fills on the right; LTV factors tick up as Margaret's journey compounds.
  // ================================================================
  window.demoSceneRenderers.retain = function(stage) {
    playSceneVO(stage, 'retain', { delay: 600 });
    var m = (data.margaret || {});
    var tl = m.retentionTimeline || [];
    var retention = (data.client && data.client.success) ? data.client.success.retentionAt24mProb : 0.84;

    stage.innerHTML = [
      '<div class="s4-layout">',
      '  <header class="s4-head">',
      '    <span class="s4-eye">12 months \u2014 iris. stays</span>',
      '    <h2 class="s4-title">Retention isn\u2019t a report. It\u2019s a relationship.</h2>',
      '  </header>',
      '  <div class="s4-split">',
      '    <ol class="s4-timeline" id="s4Timeline" aria-label="Retention timeline"></ol>',
      '    <aside class="s4-metrics">',
      '      <div class="s4-metric">',
      '        <span class="s4-metric-label">Engagement score</span>',
      '        <div class="s4-graph" aria-hidden="true"><svg viewBox="0 0 300 120" preserveAspectRatio="none"><path id="s4GraphPath" d="M 0 120" fill="none" stroke="url(#s4grad)" stroke-width="2.4" stroke-linecap="round"/><defs><linearGradient id="s4grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F59B3C"/><stop offset="1" stop-color="#FFD100"/></linearGradient></defs></svg></div>',
      '        <span class="s4-metric-now" id="s4Now">0</span>',
      '      </div>',
      '      <div class="s4-ltv">',
      '        <span class="s4-metric-label">LTV factors compounding</span>',
      '        <div class="s4-ltv-row"><span>Programs accessed</span>    <span id="s4LtvPrograms">0</span></div>',
      '        <div class="s4-ltv-row"><span>Months engaged</span>        <span id="s4LtvMonths">0</span></div>',
      '        <div class="s4-ltv-row"><span>Peer connections</span>      <span id="s4LtvPeers">0</span></div>',
      '        <div class="s4-ltv-row s4-ltv-row--hi"><span>Retention prob. at 24mo</span><span id="s4LtvProb">\u2014</span></div>',
      '      </div>',
      '    </aside>',
      '  </div>',
      '</div>'
    ].join('');

    var timelineEl = stage.querySelector('#s4Timeline');
    var nowEl      = stage.querySelector('#s4Now');
    var pathEl     = stage.querySelector('#s4GraphPath');
    var ltvPrograms = stage.querySelector('#s4LtvPrograms');
    var ltvMonths   = stage.querySelector('#s4LtvMonths');
    var ltvPeers    = stage.querySelector('#s4LtvPeers');
    var ltvProb     = stage.querySelector('#s4LtvProb');

    // LTV stages — simple table mapping timeline index -> running factors
    var ltvStages = [
      { programs: 0, months: 0,  peers: 0 },
      { programs: 1, months: 0,  peers: 1 },
      { programs: 1, months: 1,  peers: 2 },
      { programs: 2, months: 3,  peers: 3 },
      { programs: 2, months: 6,  peers: 4 },
      { programs: 3, months: 12, peers: 5 }
    ];

    // Build timeline nodes (dim at first)
    tl.forEach(function(node, i) {
      var li = document.createElement('li');
      li.className = 's4-node';
      li.dataset.index = String(i);
      li.innerHTML = [
        '<div class="s4-node-dot" aria-hidden="true"><span></span></div>',
        '<div class="s4-node-label"></div>',
        '<div class="s4-node-event"></div>'
      ].join('');
      li.querySelector('.s4-node-label').textContent = node.label;
      li.querySelector('.s4-node-event').textContent = node.event;
      timelineEl.appendChild(li);
    });

    // Auto-walk through the timeline, one node every 3.5s
    var intervalMs = 3500;
    function animatePath(toScore) {
      if (!pathEl) return;
      // Scale: x from 0..300, y inverted from score 0..100 -> 120..0
      var pts = tl.slice(0, lastLit + 1).map(function(n, idx) {
        var x = (idx / (tl.length - 1)) * 300;
        var y = 120 - (n.engagementScore / 100) * 120;
        return [x, y];
      });
      if (pts.length === 0) return;
      var d = pts.map(function(p, idx) { return (idx === 0 ? 'M ' : 'L ') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
      pathEl.setAttribute('d', d);
    }

    var lastLit = -1;
    tl.forEach(function(node, i) {
      setTimeout(function() {
        if (!timelineEl.parentNode) return;
        lastLit = i;
        // Light up the node
        var li = timelineEl.children[i];
        if (li) li.classList.add('is-lit');
        // Tick engagement score
        animateCount(nowEl, i === 0 ? 0 : tl[i-1].engagementScore, node.engagementScore, 900);
        // Redraw graph
        animatePath(node.engagementScore);
        // LTV factors
        var ltv = ltvStages[i] || ltvStages[ltvStages.length - 1];
        ltvPrograms.textContent = ltv.programs;
        ltvMonths.textContent   = ltv.months;
        ltvPeers.textContent    = ltv.peers;
        if (i === tl.length - 1) {
          ltvProb.textContent = Math.round(retention * 100) + '%';
          ltvProb.classList.add('is-on');
        }
      }, 400 + i * intervalMs);
    });
  };

  // Play a scene's narrator beats (enter → exit) through window.irisTour.
  // Replaces the old iris-first-person playSceneVO: the tour is now
  // narrator-led, so every scene that used to speak a single iris VO
  // line now plays a narrator enter beat on mount and a narrator exit
  // beat at the end — bridging into the next scene. Auto-cancels on
  // demo:scene-teardown. No-op if voice isn't available.
  //
  // Name kept as `playSceneVO` so all existing scene renderers keep
  // working — only the implementation changes.
  function playSceneVO(stage, sceneId, opts) {
    opts = opts || {};
    var delay = opts.delay != null ? opts.delay : 400;
    var beats = (data.narratorBeats && data.narratorBeats[sceneId]) || [];
    if (!beats.length) return;
    var tour = window.irisTour;
    if (!tour || typeof tour.speak !== 'function') return;
    if (typeof tour.isVoiceEnabled === 'function' && !tour.isVoiceEnabled()) return;

    var myGen = (window.demoCurrentGen && window.demoCurrentGen()) || 0;
    var cancelled = false;
    var onTeardown = function() {
      cancelled = true;
      document.removeEventListener('demo:scene-teardown', onTeardown);
    };
    document.addEventListener('demo:scene-teardown', onTeardown);

    // Sequence the beats: enter → (optional: afterVisual:*) → exit.
    // Between beats we insert a short breath so the viewer's eye can
    // catch up to the visual that was revealed during/after the beat.
    var enterBeat = null, exitBeat = null;
    beats.forEach(function(b) {
      if (b.at === 'enter') enterBeat = b;
      else if (b.at === 'exit') exitBeat = b;
    });

    setTimeout(function runSequence() {
      if (cancelled) return;
      var chain = Promise.resolve();
      if (enterBeat) {
        chain = chain.then(function() {
          if (cancelled) return;
          return tour.speak(enterBeat.text, 'narrator');
        });
      }
      if (exitBeat) {
        chain = chain.then(function() {
          if (cancelled) return;
          // 1.2s breath between enter narration and exit narration so
          // the visual moment in between lands before the next beat.
          return new Promise(function(r) { setTimeout(r, 1200); });
        }).then(function() {
          if (cancelled) return;
          return tour.speak(exitBeat.text, 'narrator');
        });
      }
      chain.then(function() {
        if (!cancelled) document.dispatchEvent(new CustomEvent('demo:scene-done', { detail: { gen: myGen } }));
      });
    }, delay);
  }

  function animateCount(el, from, to, dur, fmt) {
    if (!el) return;
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(from + (to - from) * eased);
      el.textContent = fmt ? fmt(v) : v;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ================================================================
  // Scene 5 — Readiness score + volunteer ask
  // Score bar animates 0 → 78, crosses threshold (75), iris. invitation
  // fires, Margaret says "yes", conversion counter ticks 11 → 12%.
  // The single most emotionally loaded scene in the demo.
  // ================================================================
  window.demoSceneRenderers.readiness = function(stage) {
    var m = (data.margaret || {});
    var r = (m.readiness || { score: 78, threshold: 75, factors: [] });
    var loop = (data.loop || {});
    var convPct = Math.round((loop.clientToVolunteerPct || 0.10) * 100);

    stage.innerHTML = [
      '<div class="s5-layout">',
      '  <header class="s5-head">',
      '    <span class="s5-eye">6 months in \u2014 iris. reads the room</span>',
      '    <h2 class="s5-title">Readiness, not recruitment.</h2>',
      '  </header>',
      '  <div class="s5-split">',
      '    <aside class="s5-score">',
      '      <div class="s5-score-label">Volunteer readiness score</div>',
      '      <div class="s5-score-bar" aria-hidden="true">',
      '        <div class="s5-score-fill" id="s5Fill"></div>',
      '        <div class="s5-score-threshold" id="s5Threshold" style="left:' + (r.threshold || 75) + '%">',
      '          <span>Threshold</span>',
      '          <span class="s5-th-num">' + (r.threshold || 75) + '</span>',
      '        </div>',
      '      </div>',
      '      <div class="s5-score-row">',
      '        <span class="s5-score-now" id="s5Now">0</span>',
      '        <span class="s5-score-verdict" id="s5Verdict">calculating\u2026</span>',
      '      </div>',
      '      <ul class="s5-factors" id="s5Factors"></ul>',
      '    </aside>',
      '    <section class="s5-exchange" aria-label="The invitation">',
      '      <div class="s5-exchange-chat" id="s5Chat"></div>',
      '      <div class="s5-success" id="s5Success" aria-hidden="true">',
      '        <div class="s5-success-head">',
      '          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      '          <span>Client &rarr; Volunteer conversion</span>',
      '        </div>',
      '        <div class="s5-success-body">',
      '          <span class="s5-success-n"><span id="s5ConvBefore">' + (convPct - 1) + '</span>% &rarr; <span id="s5ConvAfter">' + convPct + '</span>%</span>',
      '          <span class="s5-success-sub">Running conversion rate just ticked up by one.</span>',
      '        </div>',
      '      </div>',
      '    </section>',
      '  </div>',
      '</div>'
    ].join('');

    var fill = stage.querySelector('#s5Fill');
    var nowEl = stage.querySelector('#s5Now');
    var verdictEl = stage.querySelector('#s5Verdict');
    var factorsEl = stage.querySelector('#s5Factors');
    var chatEl = stage.querySelector('#s5Chat');
    var successEl = stage.querySelector('#s5Success');

    // Populate factors (hidden at first)
    (r.factors || []).forEach(function(f, i) {
      var li = document.createElement('li');
      li.className = 's5-factor';
      li.innerHTML = [
        '<span class="s5-factor-label"></span>',
        '<span class="s5-factor-val"></span>',
        '<span class="s5-factor-pts" data-to="' + f.contribution + '">0</span>'
      ].join('');
      li.querySelector('.s5-factor-label').textContent = f.label;
      li.querySelector('.s5-factor-val').textContent = f.value;
      factorsEl.appendChild(li);
    });

    // Animate score 0 → target
    setTimeout(function() {
      if (!fill.parentNode) return;
      var target = r.score || 78;
      var dur = 2000;
      var start = performance.now();
      function step(now) {
        if (!fill.parentNode) return;
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        var v = target * eased;
        fill.style.width = v.toFixed(2) + '%';
        nowEl.textContent = Math.round(v);
        // Factors light up in sequence as score passes their cumulative value
        var li = factorsEl.children;
        for (var i = 0; i < li.length; i++) {
          var ptEl = li[i].querySelector('.s5-factor-pts');
          var ptTo = parseInt(ptEl.dataset.to, 10) || 0;
          var thresh = ((i + 1) / li.length) * target;
          if (v >= thresh && !li[i].classList.contains('is-lit')) {
            li[i].classList.add('is-lit');
            animateCount(ptEl, 0, ptTo, 600);
          }
        }
        if (v >= (r.threshold || 75)) {
          verdictEl.textContent = 'Ready';
          verdictEl.className = 's5-score-verdict is-ready';
          fill.classList.add('over-threshold');
        }
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }, 900);

    // ---- Dual-voice exchange after the readiness score crosses ----
    // Same window.irisTour pipeline as Scene 2, two-turn version. The
    // success callout fires after Margaret's 'yes' so it always lands at
    // the emotional beat regardless of voice latency.
    var chatTurns = [
      { speaker: 'iris',     voice: 'iris',     text: 'Margaret \u2014 would you help someone just starting?' },
      { speaker: 'margaret', voice: 'margaret', text: 'yes.' }
    ];
    var tour    = window.irisTour;
    var voiceOn = tour && typeof tour.speak === 'function' &&
                  (typeof tour.isVoiceEnabled !== 'function' || tour.isVoiceEnabled());
    var myGen = (window.demoCurrentGen && window.demoCurrentGen()) || 0;
    var cancelled = false;
    var onTeardown = function() {
      cancelled = true;
      document.removeEventListener('demo:scene-teardown', onTeardown);
    };
    document.addEventListener('demo:scene-teardown', onTeardown);

    function showBubble(t) {
      if (!chatEl.parentNode) return;
      var b = document.createElement('div');
      b.className = 's5-bubble s5-bubble--' + (t.speaker === 'iris' ? 'iris' : 'user');
      b.innerHTML = '<span class="s5-bubble-who">' + (t.speaker === 'iris' ? 'iris.' : 'Margaret') + '</span><span class="s5-bubble-text"></span>';
      b.querySelector('.s5-bubble-text').textContent = t.text;
      chatEl.appendChild(b);
      requestAnimationFrame(function() { b.classList.add('show'); });
    }

    // Start the exchange just after the score fill completes (~2.1s
    // animation + 0.9s start delay = ~3s), matching the original
    // 4.5s feel but giving the score a clear moment to land first.
    setTimeout(function runExchange() {
      if (cancelled) return;
      var i = 0;
      function next() {
        if (cancelled || !chatEl.parentNode) return;
        if (i >= chatTurns.length) {
          if (successEl.parentNode) successEl.classList.add('show');
          return;
        }
        var t = chatTurns[i++];
        showBubble(t);
        if (voiceOn) {
          tour.speak(t.text, t.voice).then(function() { setTimeout(next, 600); });
        } else {
          // No voice — space turns so Margaret's 'yes' still feels earned
          setTimeout(next, i === 1 ? 3800 : 1500);
        }
      }
      next();
    }, 4500);
  };

  // ================================================================
  // Scene 6 — Volunteer onboarding + activation (20s)
  // 4-stage horizontal flow from "yes" through first mentoring session.
  // SLAs per stage. Terminates in an activation card.
  // ================================================================
  window.demoSceneRenderers.volonboard = function(stage) {
    playSceneVO(stage, 'volonboard', { delay: 600 });
    var vsla = (data.volunteer && data.volunteer.sla) || {};
    var steps = [
      { label: 'Yes',                detail: 'Readiness invitation accepted', slaLabel: 'Day 0',   target: 0                                       },
      { label: 'Role match',         detail: 'Peer Mentor \u00b7 Sudbury cohort', slaLabel: 'within ' + (vsla.roleMatchDays || 14) + 'd', target: vsla.roleMatchDays || 14, actual: 9 },
      { label: 'Onboarding',         detail: 'Conversation + orientation',    slaLabel: 'within ' + (vsla.onboardingConvDays || 21) + 'd', target: vsla.onboardingConvDays || 21, actual: 16 },
      { label: 'First engagement',   detail: 'Matched with first mentee',     slaLabel: 'within ' + (vsla.firstEngagementDays || 60) + 'd', target: vsla.firstEngagementDays || 60, actual: 41 }
    ];

    stage.innerHTML = [
      '<div class="s6-layout">',
      '  <header class="s6-head">',
      '    <span class="s6-eye">Volunteer arc \u2014 yes to active</span>',
      '    <h2 class="s6-title">No 20-page onboarding PDF.</h2>',
      '  </header>',
      '  <ol class="s6-flow" id="s6Flow"></ol>',
      '  <footer class="s6-activation" id="s6Activation" aria-hidden="true">',
      '    <div class="s6-activation-head">',
      '      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      '      <span>Margaret activated as peer mentor</span>',
      '    </div>',
      '    <div class="s6-activation-body">',
      '      <span class="s6-activation-n">3</span>',
      '      <span class="s6-activation-sub">new members matched to her this quarter</span>',
      '    </div>',
      '  </footer>',
      '</div>'
    ].join('');

    var flow = stage.querySelector('#s6Flow');
    var act  = stage.querySelector('#s6Activation');

    steps.forEach(function(s, i) {
      var li = document.createElement('li');
      var slaActualTxt = s.actual != null ? ('actual ' + s.actual + 'd') : 'now';
      li.className = 's6-step';
      li.innerHTML = [
        '<div class="s6-step-card">',
        '  <div class="s6-step-dot"><span></span></div>',
        '  <div class="s6-step-label"></div>',
        '  <div class="s6-step-detail"></div>',
        '  <div class="s6-step-sla"><span>' + s.slaLabel + '</span><span>' + slaActualTxt + '</span></div>',
        '</div>'
      ].join('');
      li.querySelector('.s6-step-label').textContent = s.label;
      li.querySelector('.s6-step-detail').textContent = s.detail;
      flow.appendChild(li);
      setTimeout(function() { li.classList.add('show'); }, 400 + i * 3000);
    });

    setTimeout(function() {
      if (act.parentNode) act.classList.add('show');
    }, 400 + steps.length * 3000 + 800);
  };

  // ================================================================
  // Scene 7 — Partner acquisition + onboarding (30s)
  // 5-stage card-stack flow from "expressed interest" through
  // "first referral live". Per-stage SLA actual vs target.
  // ================================================================
  window.demoSceneRenderers.partneracq = function(stage) {
    playSceneVO(stage, 'partneracq', { delay: 600 });
    var c = (data.clinic || {});
    var stages = c.onboardingStages || [];

    stage.innerHTML = [
      '<div class="s7-layout">',
      '  <header class="s7-head">',
      '    <span class="s7-eye">Partner acquisition \u2014 ' + (c.name || 'Sudbury Eye Centre') + '</span>',
      '    <h2 class="s7-title">From interest to first referral in under 10 days.</h2>',
      '  </header>',
      '  <ol class="s7-stack" id="s7Stack"></ol>',
      '  <footer class="s7-foot" id="s7Foot" aria-hidden="true">',
      '    <span class="s7-foot-pill">Onboarded</span>',
      '    <span class="s7-foot-text">Clinic live. First referral complete. Dashboard on.</span>',
      '  </footer>',
      '</div>'
    ].join('');

    var stackEl = stage.querySelector('#s7Stack');
    var footEl  = stage.querySelector('#s7Foot');

    stages.forEach(function(s, i) {
      var target = s.slaHrs || 0;
      var actual = s.actualHrs || 0;
      var met = actual <= target;
      var slaTxt = (target === 0) ? 'immediate' : ('target ' + fmtHrs(target) + ' \u00b7 actual ' + fmtHrs(actual));
      var li = document.createElement('li');
      li.className = 's7-card' + (met ? ' is-met' : ' is-miss');
      li.style.setProperty('--i', i);
      li.innerHTML = [
        '<div class="s7-card-num">0' + (i + 1) + '</div>',
        '<div class="s7-card-body">',
        '  <div class="s7-card-label"></div>',
        '  <div class="s7-card-sla">' + slaTxt + '</div>',
        '</div>',
        '<div class="s7-card-tick" aria-hidden="true">',
        '  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        '</div>'
      ].join('');
      li.querySelector('.s7-card-label').textContent = s.label;
      stackEl.appendChild(li);
      setTimeout(function() { li.classList.add('show'); }, 400 + i * 2400);
    });

    setTimeout(function() {
      if (footEl.parentNode) footEl.classList.add('show');
    }, 400 + stages.length * 2400 + 800);
  };

  // ================================================================
  // Scene 8 — Partner engagement + retention dashboard
  // The mock product surface. Live-ticking counters, conversion funnel,
  // recent-outcomes feed, SLA + retention panels. iris.'s institutional
  // face to a clinic partner, 12 months into the relationship.
  // ================================================================
  window.demoSceneRenderers.partnerdash = function(stage) {
    playSceneVO(stage, 'partnerdash', { delay: 600 });
    var c = (data.clinic || {});
    var dash = c.dashboard || {};

    stage.innerHTML = [
      '<div class="s8-layout">',
      '  <header class="s8-head">',
      '    <div class="s8-head-l">',
      '      <span class="s8-eye">Partner dashboard \u2014 live</span>',
      '      <h2 class="s8-title">What the clinic sees, every day.</h2>',
      '    </div>',
      '    <div class="s8-clinic">',
      '      <span class="s8-clinic-dot" aria-hidden="true"></span>',
      '      <span>' + (c.name || 'Sudbury Eye Centre') + ' \u00b7 month 12</span>',
      '    </div>',
      '  </header>',
      '  <div class="s8-grid">',
      '    <div class="s8-card s8-counters" id="s8Counters">',
      '      <div class="s8-counter">',
      '        <span class="s8-counter-label">Referred</span>',
      '        <span class="s8-counter-val" id="s8cRef">0</span>',
      '        <span class="s8-counter-hint">patients with iris. QR</span>',
      '      </div>',
      '      <div class="s8-counter">',
      '        <span class="s8-counter-label">Engaged</span>',
      '        <span class="s8-counter-val" id="s8cEng">0</span>',
      '        <span class="s8-counter-hint">had an iris. conversation</span>',
      '      </div>',
      '      <div class="s8-counter">',
      '        <span class="s8-counter-label">Booked next step</span>',
      '        <span class="s8-counter-val" id="s8cStep">0</span>',
      '        <span class="s8-counter-hint">program, peer, or callback</span>',
      '      </div>',
      '      <div class="s8-counter">',
      '        <span class="s8-counter-label">Became volunteer</span>',
      '        <span class="s8-counter-val" id="s8cVol">0</span>',
      '        <span class="s8-counter-hint">loop closed</span>',
      '      </div>',
      '    </div>',
      '    <div class="s8-card s8-funnel-wrap" id="s8Funnel">',
      '      <span class="s8-card-eye">Conversion funnel \u00b7 12 months</span>',
      '      <div class="s8-funnel" id="s8FunnelBars"></div>',
      '      <div class="s8-funnel-foot">',
      '        <span>Program completion</span>',
      '        <strong id="s8Compl">' + Math.round((dash.programCompletion || 0) * 100) + '%</strong>',
      '      </div>',
      '      <div class="s8-funnel-foot" style="border-top:none;padding-top:0;">',
      '        <span>Member satisfaction</span>',
      '        <strong>' + (dash.satisfaction || 4.2) + ' / 5</strong>',
      '      </div>',
      '    </div>',
      '    <div class="s8-card s8-outcomes" id="s8Outcomes">',
      '      <span class="s8-card-eye">Recent outcomes \u00b7 last 14 days</span>',
      '      <div class="s8-outcomes-list" id="s8OutList"></div>',
      '    </div>',
      '    <div class="s8-card s8-sla" id="s8Sla">',
      '      <span class="s8-card-eye">Service level \u2014 clinic SLA</span>',
      '      <div class="s8-sla-rows" id="s8SlaRows"></div>',
      '    </div>',
      '    <div class="s8-card s8-retention" id="s8Ret">',
      '      <div class="s8-ret-block">',
      '        <span class="s8-ret-head">Repeat engagement</span>',
      '        <span class="s8-ret-big is-pct" id="s8RetRepeat">0</span>',
      '        <span class="s8-ret-note">of engaged members come back within 30 days.</span>',
      '      </div>',
      '      <div class="s8-ret-block">',
      '        <span class="s8-ret-head">NPS \u00b7 trailing 90 days</span>',
      '        <svg class="s8-spark" id="s8Spark" viewBox="0 0 300 58" preserveAspectRatio="none" aria-hidden="true">',
      '          <defs><linearGradient id="s8SparkGrad" x1="0" y1="0" x2="0" y2="1">',
      '            <stop offset="0%" stop-color="rgba(90,200,255,.28)"/>',
      '            <stop offset="100%" stop-color="rgba(90,200,255,0)"/>',
      '          </linearGradient></defs>',
      '          <path class="s8-spark-area" id="s8SparkArea" d=""/>',
      '          <path class="s8-spark-path" id="s8SparkPath" d=""/>',
      '          <circle class="s8-spark-dot" id="s8SparkDot" r="3"/>',
      '        </svg>',
      '        <span class="s8-ret-note">Latest: <strong style="color:#fff;font-weight:500;" id="s8NpsNow">' + (dash.npsNow || 62) + '</strong> \u00b7 up from ' + (dash.npsStart || 41) + ' at launch.</span>',
      '      </div>',
      '      <div class="s8-ret-block">',
      '        <span class="s8-ret-head">Volunteer pipeline</span>',
      '        <div class="s8-pipe" id="s8Pipe"></div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var countersEl = stage.querySelector('#s8Counters');
    setTimeout(function(){ countersEl.classList.add('show'); }, 300);
    setTimeout(function(){ animateCount(stage.querySelector('#s8cRef'),  0, dash.refersTotal     || 38, 1200); }, 500);
    setTimeout(function(){ animateCount(stage.querySelector('#s8cEng'),  0, dash.engagedTotal    || 27, 1200); }, 700);
    setTimeout(function(){ animateCount(stage.querySelector('#s8cStep'), 0, dash.concreteStep    || 18, 1200); }, 900);
    setTimeout(function(){ animateCount(stage.querySelector('#s8cVol'),  0, dash.becameVolunteer ||  4, 1200); }, 1100);

    var funnel = [
      { label: 'Referred',    n: dash.refersTotal     || 38 },
      { label: 'Engaged',     n: dash.engagedTotal    || 27 },
      { label: 'Booked step', n: dash.concreteStep    || 18 },
      { label: 'Volunteer',   n: dash.becameVolunteer ||  4 }
    ];
    var max = funnel[0].n || 1;
    var fEl = stage.querySelector('#s8FunnelBars');
    var fCard = stage.querySelector('#s8Funnel');
    setTimeout(function(){ fCard.classList.add('show'); }, 500);
    funnel.forEach(function(f, i) {
      var row = document.createElement('div');
      row.className = 's8-funnel-step';
      row.innerHTML = [
        '<span class="s8-funnel-label"></span>',
        '<span class="s8-funnel-bar"><span class="s8-funnel-fill"></span></span>',
        '<span class="s8-funnel-num">0</span>'
      ].join('');
      row.querySelector('.s8-funnel-label').textContent = f.label;
      fEl.appendChild(row);
      var pct = (f.n / max) * 100;
      setTimeout(function() {
        row.querySelector('.s8-funnel-fill').style.width = pct + '%';
        animateCount(row.querySelector('.s8-funnel-num'), 0, f.n, 1200);
      }, 900 + i * 220);
    });

    // --- Recent outcomes feed (anonymized case IDs + status + relative time) ---
    // demo-data.js shape: { anonId, status, time }. Keep {id, when} as
    // tolerated aliases so older/future data shapes still render.
    var outcomes = dash.recentOutcomes || dash.outcomes || [
      { anonId: 'C-2041', status: 'Booked peer meetup in Sudbury',        time: '2h ago'    },
      { anonId: 'C-2039', status: 'Completed orientation + mobility intake', time: '5h ago' },
      { anonId: 'C-2037', status: 'Referred to low-vision OT',             time: 'yesterday' },
      { anonId: 'C-2034', status: 'Signed up: Braille basics cohort',      time: '2d ago'    },
      { anonId: 'C-2030', status: 'Became volunteer (phone friend)',       time: '4d ago'    }
    ];
    var outEl = stage.querySelector('#s8OutList');
    var outCard = stage.querySelector('#s8Outcomes');
    setTimeout(function(){ outCard.classList.add('show'); }, 700);
    outcomes.forEach(function(o, i) {
      var row = document.createElement('div');
      row.className = 's8-out';
      row.innerHTML = [
        '<span class="s8-out-id"></span>',
        '<span class="s8-out-status"></span>',
        '<span class="s8-out-time"></span>'
      ].join('');
      row.querySelector('.s8-out-id').textContent = o.anonId || o.id || '';
      row.querySelector('.s8-out-status').textContent = o.status || '';
      row.querySelector('.s8-out-time').textContent = o.time || o.when || '';
      outEl.appendChild(row);
      setTimeout(function(){ row.classList.add('show'); }, 1100 + i * 140);
    });

    // --- SLA panel (response time, privacy, escalation, reporting cadence) ---
    var sla = dash.sla || [
      { k: 'Median first response',    v: '34 seconds',           pill: false },
      { k: 'Crisis escalation path',   v: 'Live to CNIB on-call', pill: true  },
      { k: 'Data retention',           v: '90 days, then summary',pill: false },
      { k: 'Clinic report cadence',    v: 'Monthly + quarterly review', pill: false },
      { k: 'Uptime (rolling 90 days)', v: '99.94%',               pill: true  }
    ];
    var slaEl = stage.querySelector('#s8SlaRows');
    var slaCard = stage.querySelector('#s8Sla');
    setTimeout(function(){ slaCard.classList.add('show'); }, 900);
    sla.forEach(function(s) {
      var row = document.createElement('div');
      row.className = 's8-sla-row';
      row.innerHTML = [
        '<span class="s8-sla-label"></span>',
        '<span class="s8-sla-val' + (s.pill ? ' is-pill' : '') + '"></span>'
      ].join('');
      row.querySelector('.s8-sla-label').textContent = s.k;
      row.querySelector('.s8-sla-val').textContent = s.v;
      slaEl.appendChild(row);
    });

    // --- Retention card: repeat %, NPS sparkline, volunteer pipeline ---
    var retCard = stage.querySelector('#s8Ret');
    setTimeout(function(){ retCard.classList.add('show'); }, 1100);
    setTimeout(function(){
      animateCount(stage.querySelector('#s8RetRepeat'), 0, dash.repeatEngagement || 71, 1300);
    }, 1300);

    // NPS sparkline — build 12-point path from dash.npsSeries or synthesize one
    var series = dash.npsSeries || [41, 44, 46, 49, 52, 54, 55, 57, 58, 60, 61, (dash.npsNow || 62)];
    var W = 300, H = 58, pad = 4;
    var minV = Math.min.apply(null, series) - 4;
    var maxV = Math.max.apply(null, series) + 4;
    var range = Math.max(1, maxV - minV);
    var step = (W - pad * 2) / (series.length - 1);
    var pts = series.map(function(v, i) {
      var x = pad + i * step;
      var y = H - pad - ((v - minV) / range) * (H - pad * 2);
      return [x, y];
    });
    var line = 'M' + pts.map(function(p){ return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
    var area = line + ' L' + pts[pts.length-1][0].toFixed(1) + ',' + (H - pad) +
               ' L' + pts[0][0].toFixed(1) + ',' + (H - pad) + ' Z';
    var sparkPath = stage.querySelector('#s8SparkPath');
    var sparkArea = stage.querySelector('#s8SparkArea');
    var sparkDot  = stage.querySelector('#s8SparkDot');
    var sparkSvg  = stage.querySelector('#s8Spark');
    sparkPath.setAttribute('d', line);
    sparkArea.setAttribute('d', area);
    sparkDot.setAttribute('cx', pts[pts.length-1][0].toFixed(1));
    sparkDot.setAttribute('cy', pts[pts.length-1][1].toFixed(1));
    // Recompute dash length to fit the actual path
    try {
      var len = sparkPath.getTotalLength();
      sparkPath.style.strokeDasharray = len;
      sparkPath.style.strokeDashoffset = len;
    } catch (e) { /* jsdom / no-op */ }
    setTimeout(function(){ sparkSvg.classList.add('drawn'); }, 1500);

    // Volunteer pipeline (recruitment → training → active → lead)
    var pipe = dash.pipeline || [
      { label: 'Interest',  n: 11 },
      { label: 'Training',  n:  7 },
      { label: 'Active',    n:  4 },
      { label: 'Peer lead', n:  2 }
    ];
    var pipeMax = Math.max.apply(null, pipe.map(function(p){ return p.n; })) || 1;
    var pipeEl = stage.querySelector('#s8Pipe');
    pipe.forEach(function(p, i) {
      var row = document.createElement('div');
      row.className = 's8-pipe-row';
      row.innerHTML = [
        '<span></span>',
        '<span class="s8-pipe-bar"><span class="s8-pipe-fill"></span></span>',
        '<span class="s8-pipe-num">0</span>'
      ].join('');
      row.children[0].textContent = p.label;
      pipeEl.appendChild(row);
      setTimeout(function(){
        row.querySelector('.s8-pipe-fill').style.width = (p.n / pipeMax * 100) + '%';
        animateCount(row.querySelector('.s8-pipe-num'), 0, p.n, 900);
      }, 1500 + i * 140);
    });
  };

  // ================================================================
  // Scene 9 — "The loop" (compounding flywheel)
  // Three nodes in a circle — Client -> Volunteer -> Partner-catalyst
  // -> Client — connected by animated cyan arcs. A moving pulse
  // rides each arc to show direction of flow. The right side carries
  // the compounding math (C3b, next batch).
  // ================================================================
  window.demoSceneRenderers.loop = function(stage) {
    playSceneVO(stage, 'loop', { delay: 600 });
    // `data` at module scope = window.demoData. loop lives at top level.
    var loop = (data && data.loop) || {};
    var comp = loop.compounding || {
      year1Clients:     1000,
      year2Volunteers:   120,
      year2NewClients:   360,
      year3TotalEngaged: 1500
    };
    // Node geometry (viewBox 400x400)
    // Wheel centre (200,200), radius ~140. Nodes sit ON the ring at
    // 12 / 4 / 8 o'clock (angles -90, 30, 150 deg).
    stage.innerHTML = [
      '<div class="s9-layout">',
      '  <div class="s9-wheel" id="s9Wheel" aria-hidden="true">',
      '    <svg viewBox="0 0 400 400">',
      '      <circle class="s9-ring" cx="200" cy="200" r="140"/>',
      // Three arcs forming the ring in segments between node anchors.
      // Node centres sit at angles -90, 30, 150. Arcs shrink slightly
      // on both ends so they don't overlap the node circles.
      '      <path class="s9-arc" id="s9Arc1" d="M 255,115 A 140,140 0 0 1 305,310"/>',
      '      <path class="s9-arc" id="s9Arc2" d="M 270,320 A 140,140 0 0 1 130,320"/>',
      '      <path class="s9-arc" id="s9Arc3" d="M 95,310 A 140,140 0 0 1 145,115"/>',
      // Pulses that ride each arc along offset-path
      '      <circle class="s9-pulse" r="4" style="offset-path: path(\'M 255,115 A 140,140 0 0 1 305,310\');animation-delay:0s;"/>',
      '      <circle class="s9-pulse" r="4" style="offset-path: path(\'M 270,320 A 140,140 0 0 1 130,320\');animation-delay:2s;"/>',
      '      <circle class="s9-pulse" r="4" style="offset-path: path(\'M 95,310 A 140,140 0 0 1 145,115\');animation-delay:4s;"/>',
      '    </svg>',
      '    <div class="s9-node n1">',
      '      <span class="s9-node-label">Client</span>',
      '      <span class="s9-node-value" id="s9n1">0</span>',
      '      <span class="s9-node-note">met well, once</span>',
      '    </div>',
      '    <div class="s9-node n2">',
      '      <span class="s9-node-label">Volunteer</span>',
      '      <span class="s9-node-value" id="s9n2">0%</span>',
      '      <span class="s9-node-note">convert within 24 mo</span>',
      '    </div>',
      '    <div class="s9-node n3">',
      '      <span class="s9-node-label">Catalyst</span>',
      '      <span class="s9-node-value" id="s9n3">0\u00d7</span>',
      '      <span class="s9-node-note">new clients / volunteer / yr</span>',
      '    </div>',
      '  </div>',
      '  <div class="s9-right">',
      '    <span class="s9-eye">The loop</span>',
      '    <h3 class="s9-title">One client, <em>met well once</em>, becomes the supply chain.</h3>',
      '    <div class="s9-math" id="s9Math">',
      '      <div class="s9-year y1">',
      '        <span class="s9-year-dot">Y1</span>',
      '        <div class="s9-year-head">Seed cohort</div>',
      '        <div class="s9-year-big"><span id="s9y1">0</span><span class="s9-unit">clients met well</span></div>',
      '        <div class="s9-year-eq">from a single clinic, first 12 months</div>',
      '      </div>',
      '      <div class="s9-year y2">',
      '        <span class="s9-year-dot">Y2</span>',
      '        <div class="s9-year-head">Client \u2192 Volunteer \u2192 Client</div>',
      '        <div class="s9-year-big"><span id="s9y2v">0</span><span class="s9-unit">volunteers \u00b7 <span id="s9y2c">0</span> new clients</span></div>',
      '        <div class="s9-year-eq"><b>1,000</b> \u00d7 <b>10%</b> = 120 \u00b7 <b>120</b> \u00d7 <b>3</b> = 360</div>',
      '      </div>',
      '      <div class="s9-year y3">',
      '        <span class="s9-year-dot">Y3</span>',
      '        <div class="s9-year-head">Compounding</div>',
      '        <div class="s9-year-big"><span id="s9y3">0</span><span class="s9-unit">members engaged, one clinic</span></div>',
      '        <div class="s9-year-eq">same budget. Retention became the acquisition engine.</div>',
      '      </div>',
      '    </div>',
      '    <div class="s9-headline" id="s9Headline">',
      '      <b>Retention is the acquisition engine.</b> Every client met well becomes a volunteer, a peer, a referral path back to the next client. The loop pays for itself.',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    var wheel = stage.querySelector('#s9Wheel');
    setTimeout(function(){ wheel.classList.add('drawn'); }, 200);

    // Node counters pull from loop data w/ sensible fallbacks
    var pct  = Math.round((loop.clientToVolunteerPct   || 0.10) * 100);  // 10%
    var mult = loop.volunteerToClientMult || 3;                          // 3x
    setTimeout(function(){
      animateCount(stage.querySelector('#s9n1'), 0, 1000, 1400, function(v){
        return v.toLocaleString();
      });
    }, 600);
    setTimeout(function(){
      animateCount(stage.querySelector('#s9n2'), 0, pct, 1200, function(v){ return v + '%'; });
    }, 900);
    setTimeout(function(){
      animateCount(stage.querySelector('#s9n3'), 0, mult, 1000, function(v){ return v + '\u00d7'; });
    }, 1200);

    // --- Compounding math: stepped reveal with per-year count-ups ---
    var math = stage.querySelector('#s9Math');
    var fmtComma = function(v){ return v.toLocaleString(); };
    setTimeout(function(){ math.classList.add('drawn'); }, 1600);
    setTimeout(function(){
      animateCount(stage.querySelector('#s9y1'), 0, comp.year1Clients, 1100, fmtComma);
    }, 1800);
    setTimeout(function(){
      animateCount(stage.querySelector('#s9y2v'), 0, comp.year2Volunteers, 900, fmtComma);
      animateCount(stage.querySelector('#s9y2c'), 0, comp.year2NewClients, 1100, fmtComma);
    }, 2500);
    setTimeout(function(){
      animateCount(stage.querySelector('#s9y3'), 0, comp.year3TotalEngaged, 1400, function(v){
        return v.toLocaleString() + '+';
      });
    }, 3300);
  };

  // ================================================================
  // Scene 10 — Scoreboard
  // Three pillars (Clients / Volunteers / Partners), each with a
  // 5-step SLA timeline + north-star LTV card. Bottom strip surfaces
  // the loop headlines (conv rate, velocity, compounding).
  // ================================================================
  window.demoSceneRenderers.scoreboard = function(stage) {
    playSceneVO(stage, 'scoreboard', { delay: 600 });
    // `data` at module scope = window.demoData. scoreboard is top-level.
    var board = (data && data.scoreboard) || {};
    var pillars = board.pillars || [];
    var loopStats = board.loop || {};

    // Fallback pillar set (keeps scene renderable if demoData missing)
    if (!pillars.length) {
      pillars = [
        { audience:'Clients',    slaRow:[], northStar:'' },
        { audience:'Volunteers', slaRow:[], northStar:'' },
        { audience:'Partners',   slaRow:[], northStar:'' }
      ];
    }

    var cols = pillars.map(function(p, idx) {
      var steps = (p.slaRow || []).map(function(s) {
        return [
          '<div class="s10-sla-step">',
          '  <span class="s10-sla-tick"></span>',
          '  <span class="s10-sla-text"></span>',
          '</div>'
        ].join('');
      }).join('');
      return [
        '<div class="s10-col c' + (idx + 1) + '">',
        '  <div class="s10-col-head">',
        '    <span class="s10-col-name"></span>',
        '    <span class="s10-col-badge">SLA</span>',
        '  </div>',
        '  <div class="s10-sla">' + steps + '</div>',
        '  <div class="s10-star">',
        '    <span class="s10-star-eye">North star</span>',
        '    <span class="s10-star-text"></span>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    stage.innerHTML = [
      '<div class="s10-layout">',
      '  <div class="s10-head">',
      '    <h3>The scoreboard \u2014 <em>three audiences, one loop</em></h3>',
      '    <span class="s10-head-sub">SLA \u00b7 North star \u00b7 Compounding</span>',
      '  </div>',
      '  <div class="s10-grid">' + cols + '</div>',
      '  <div class="s10-loop" id="s10Loop">',
      '    <div class="s10-loop-cell">',
      '      <span class="s10-loop-k">Conversion</span>',
      '      <span class="s10-loop-v" id="s10lConv"></span>',
      '    </div>',
      '    <div class="s10-loop-cell">',
      '      <span class="s10-loop-k">Velocity</span>',
      '      <span class="s10-loop-v" id="s10lVel"></span>',
      '    </div>',
      '    <div class="s10-loop-cell">',
      '      <span class="s10-loop-k">Compounding</span>',
      '      <span class="s10-loop-v" id="s10lComp"></span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('');

    // Populate per-column content safely (textContent, no innerHTML)
    var colEls = stage.querySelectorAll('.s10-col');
    pillars.forEach(function(p, idx) {
      var col = colEls[idx];
      col.querySelector('.s10-col-name').textContent = p.audience || '';
      var stepEls = col.querySelectorAll('.s10-sla-step');
      (p.slaRow || []).forEach(function(s, i) {
        if (stepEls[i]) stepEls[i].querySelector('.s10-sla-text').textContent = s;
      });
      col.querySelector('.s10-star-text').textContent = p.northStar || '';
      // Reveal column, then light SLA ticks one-by-one
      setTimeout(function(){ col.classList.add('show'); }, 120 + idx * 180);
      (p.slaRow || []).forEach(function(_, i) {
        var stepEl = stepEls[i];
        if (!stepEl) return;
        setTimeout(function(){ stepEl.classList.add('on'); },
                   500 + idx * 180 + i * 180);
      });
    });

    stage.querySelector('#s10lConv').textContent = loopStats.convRate   || '';
    stage.querySelector('#s10lVel').textContent  = loopStats.velocity   || '';
    stage.querySelector('#s10lComp').textContent = loopStats.compounding || '';

    var loopEl = stage.querySelector('#s10Loop');
    setTimeout(function(){ loopEl.classList.add('show'); }, 1700);
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
