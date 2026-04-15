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
  // Priority = content the first two scenes need. Preload resolves as
  // soon as these land, so the viewer never waits for later-scene audio
  // to play the first one. Everything else continues streaming into the
  // cache during playback — by the time the viewer reaches Scene 3, its
  // audio has been ready for a while.
  var PRIORITY_SCENES = { intro: true, acquire: true };

  function buildManifest(data) {
    var m = [];
    if (!data) return m;
    var beats = data.narratorBeats || {};

    // Every scene's narrator beats — enter, afterVisual:*, exit.
    Object.keys(beats).forEach(function(sceneId) {
      var isPriority = !!PRIORITY_SCENES[sceneId];
      (beats[sceneId] || []).forEach(function(b) {
        if (b && b.text) m.push({ voice:'narrator', text:b.text, priority:isPriority });
      });
    });

    // Scene 2 — live dialogue (iris + margaret). ALL priority — these
    // play in Scene 2, the second scene the viewer reaches.
    var firstChat = (data.margaret && data.margaret.firstChat) || [];
    firstChat.forEach(function(t) {
      m.push({ voice:t.voice || t.speaker || 'iris', text:t.text, priority:true });
    });

    // Scene 5 — readiness dialogue (not priority, plays later).
    m.push({ voice:'iris',     text:'Margaret \u2014 would you help someone just starting?', priority:false });
    m.push({ voice:'margaret', text:'yes.', priority:false });

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
    var priorityCount = manifest.filter(function(e) { return e.priority; }).length;
    var total = manifest.length;
    if (!total) return Promise.resolve({ cache:cache, failed:[] });

    var loaded = 0;           // priority-scoped counter for UX
    var loadedPriority = 0;
    var failed = [];

    function report(entry) {
      if (typeof onProgress !== 'function') return;
      try {
        onProgress({
          loaded: loadedPriority,  // progress bar tracks priority only
          total:  priorityCount || total,
          currentText: entry && entry.text,
          voice: entry && entry.voice
        });
      } catch(e) {}
    }

    // Fire EVERY prefetch in parallel — including non-priority. But only
    // AWAIT the priority subset. Non-priority jobs keep running in the
    // background; by the time their scenes play, the audio is cached.
    var priorityJobs = [];
    manifest.forEach(function(entry) {
      var k = keyFor(entry.voice, entry.text);
      var job;
      if (cache[k]) {
        loaded++;
        if (entry.priority) { loadedPriority++; report(entry); }
        job = Promise.resolve();
      } else {
        job = Promise.resolve(tour.prefetch(entry.text, entry.voice))
          .then(function(handle) {
            if (handle) cache[k] = handle;
            else failed.push(entry);
            loaded++;
            if (entry.priority) { loadedPriority++; report(entry); }
          })
          .catch(function(err) {
            failed.push({ voice:entry.voice, text:entry.text, error:err && err.message });
            loaded++;
            if (entry.priority) { loadedPriority++; report(entry); }
          });
      }
      if (entry.priority) priorityJobs.push(job);
    });

    // Resolve as soon as priority subset is done. Non-priority jobs keep
    // running; their results populate window.demoAudioCache silently.
    return Promise.all(priorityJobs).then(function() {
      return { cache:cache, failed:failed, priorityOnly:true };
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
