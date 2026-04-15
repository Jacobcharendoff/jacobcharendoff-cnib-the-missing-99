/* ================================================================
   iris. — System Demonstration · Audio preloader (Phase 1 / L1)

   One-shot parallel prefetch of every voice line the tour will play
   across Scenes 1-10. Runs on demo open, BEFORE Scene 1 mounts, so
   the rest of the tour plays from a warm cache with zero per-scene
   TTS fetch latency. This is the single largest perceived-smoothness
   improvement in the Phase 1 timeline-first refactor.

   Public API:
     window.demoPreload(onProgress) -> Promise
       onProgress({ loaded, total, currentText, voice })
       Resolves with { cache, failed[] } when every chunk finished
       or errored. The cache is also exposed at window.demoAudioCache.

   Cache format:
     window.demoAudioCache[key] = audioHandle  (same shape tour.play expects)
     key = voice + '::' + text

   The manifest is derived from window.demoData so editing a line in
   demo-data.js automatically updates the preload set — no drift.
   ================================================================ */
(function() {
  'use strict';

  function keyFor(voice, text) {
    return (voice || 'iris') + '::' + (text || '');
  }

  // Walk demoData to build the full { voice, text } manifest.
  // Order matches scene-by-scene playback order so the progress bar
  // feels like the tour itself loading in.
  function buildManifest(data) {
    var m = [];
    if (!data) return m;

    // Scene 1 — narrator intro
    var intro = (data.narratorBeats && data.narratorBeats.intro) || [];
    intro.forEach(function(b) { m.push({ voice:'narrator', text:b.text }); });

    // Scene 2 — narrator + dialogue (iris + margaret)
    var acquire = (data.narratorBeats && data.narratorBeats.acquire) || [];
    acquire.forEach(function(b) { m.push({ voice:'narrator', text:b.text }); });
    var firstChat = (data.margaret && data.margaret.firstChat) || [];
    firstChat.forEach(function(t) { m.push({ voice:t.voice || t.speaker || 'iris', text:t.text }); });

    // Scenes 3, 4, 6-10 — iris VO (one line each)
    var vo = data.irisVO || {};
    ['engage','retain','volonboard','partneracq','partnerdash','loop','scoreboard']
      .forEach(function(id) { if (vo[id]) m.push({ voice:'iris', text:vo[id] }); });

    // Scene 5 — readiness dialogue (kept inline; preload them too)
    m.push({ voice:'iris',     text:'Margaret \u2014 would you help someone just starting?' });
    m.push({ voice:'margaret', text:'yes.' });

    return m;
  }

  // De-dupe so we don't double-fetch identical text under the same voice.
  function dedupe(manifest) {
    var seen = {};
    var out = [];
    manifest.forEach(function(entry) {
      var k = keyFor(entry.voice, entry.text);
      if (!seen[k]) { seen[k] = true; out.push(entry); }
    });
    return out;
  }

  function preload(onProgress) {
    var tour = window.irisTour;
    var cache = window.demoAudioCache = (window.demoAudioCache || {});

    // Voice disabled or prefetch unavailable → nothing to do, resolve fast.
    // Scenes fall back to reading-time pacing, which is slow but coherent.
    if (!tour || typeof tour.prefetch !== 'function') {
      return Promise.resolve({ cache:cache, failed:[], skipped:'no-tour' });
    }
    if (typeof tour.isVoiceEnabled === 'function' && !tour.isVoiceEnabled()) {
      return Promise.resolve({ cache:cache, failed:[], skipped:'voice-disabled' });
    }

    var manifest = dedupe(buildManifest(window.demoData));
    var total = manifest.length;
    if (!total) return Promise.resolve({ cache:cache, failed:[] });

    var loaded = 0;
    var failed = [];

    function report(entry) {
      if (typeof onProgress !== 'function') return;
      try {
        onProgress({
          loaded: loaded,
          total:  total,
          currentText: entry && entry.text,
          voice: entry && entry.voice
        });
      } catch(e) {}
    }

    // Fire every prefetch in parallel. Each settles independently; we
    // report progress as each lands. Failed entries are recorded but do
    // not block resolution — scenes degrade gracefully to read-time pacing.
    var jobs = manifest.map(function(entry) {
      var k = keyFor(entry.voice, entry.text);
      if (cache[k]) { loaded++; report(entry); return Promise.resolve(); }
      return Promise.resolve(tour.prefetch(entry.text, entry.voice))
        .then(function(handle) {
          if (handle) cache[k] = handle;
          else failed.push(entry);
          loaded++;
          report(entry);
        })
        .catch(function(err) {
          failed.push({ voice:entry.voice, text:entry.text, error:err && err.message });
          loaded++;
          report(entry);
        });
    });

    return Promise.all(jobs).then(function() {
      return { cache:cache, failed:failed };
    });
  }

  // Look up a preloaded handle by voice+text. Scene renderers will call
  // this instead of tour.prefetch() so playback is instant when the
  // cache is warm. Returns null if not found (caller falls back to
  // on-demand prefetch).
  function getCached(voice, text) {
    var cache = window.demoAudioCache || {};
    return cache[keyFor(voice, text)] || null;
  }

  window.demoPreload = preload;
  window.demoPreloadGet = getCached;
})();
