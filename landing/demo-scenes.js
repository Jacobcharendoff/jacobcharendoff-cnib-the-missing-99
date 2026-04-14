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
  // Scene 4 — Retain (12 months in motion)
  // Timeline auto-advances through 6 check-in points. Engagement graph
  // fills on the right; LTV factors tick up as Margaret's journey compounds.
  // ================================================================
  window.demoSceneRenderers.retain = function(stage) {
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

  function animateCount(el, from, to, dur) {
    if (!el) return;
    var start = performance.now();
    function step(now) {
      var p = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(from + (to - from) * eased);
      el.textContent = v;
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

    // After score crosses, fire the chat exchange
    var chatTurns = [
      { speaker: 'iris',     text: 'Margaret \u2014 would you help someone just starting?', delay: 4500 },
      { speaker: 'margaret', text: 'yes.',                                                    delay: 9500 }
    ];
    chatTurns.forEach(function(t) {
      setTimeout(function() {
        if (!chatEl.parentNode) return;
        var b = document.createElement('div');
        b.className = 's5-bubble s5-bubble--' + (t.speaker === 'iris' ? 'iris' : 'user');
        b.innerHTML = '<span class="s5-bubble-who">' + (t.speaker === 'iris' ? 'iris.' : 'Margaret') + '</span><span class="s5-bubble-text"></span>';
        b.querySelector('.s5-bubble-text').textContent = t.text;
        chatEl.appendChild(b);
        requestAnimationFrame(function() { b.classList.add('show'); });
      }, t.delay);
    });

    // Success callout at the end
    setTimeout(function() {
      if (successEl.parentNode) successEl.classList.add('show');
    }, 14500);
  };

  // ================================================================
  // Scene 6 — Volunteer onboarding + activation (20s)
  // 4-stage horizontal flow from "yes" through first mentoring session.
  // SLAs per stage. Terminates in an activation card.
  // ================================================================
  window.demoSceneRenderers.volonboard = function(stage) {
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
