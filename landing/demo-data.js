/* ================================================================
   iris. — System Demonstration · Data module
   Single source of truth for every SLA, metric, LTV figure, and
   mock data point rendered across the 11 scenes. Changing a number
   here updates the demo everywhere.

   All values are DEFAULTS per the Part 1 measurement framework.
   They are rendered as visibly-editable commitments — if CNIB ops
   want different numbers, we edit this file, not the scene code.

   Exposed on window.demoData so scene renderers can consume.
   ================================================================ */
(function() {
  'use strict';

  var DATA = {

    // =============================================================
    // PART 1 — Measurement framework (defaults; ratify with CNIB)
    // =============================================================

    // --- Client journey (newly diagnosed Canadian with sight loss) ---
    client: {
      sla: {
        firstReplySec:   30,     // iris. opens warm convo within 30s of scan/link
        programMatchTurns: 5,    // 2-3 programs with reasoning within 5 chat turns
        concreteStepDays:  7,    // member books next step within 7 days
        coordinatorHours: 48,    // human warm callback within 48h
        checkInDays:   [30, 90, 180, 365]  // retention cadence
      },
      success: {
        engagementCriterion: 'active touchpoint in last 90 days at 12-month mark',
        retentionAt24mProb: 0.84  // Margaret's example, illustrative
      },
      ltv: {
        horizonYears: 5,
        factors: [
          'Programs accessed',
          'Months engaged',
          'Peer connections made',
          'Downstream influence (referrals / volunteering)'
        ]
      },
      headline: "From diagnosis to a booked next step in under 7 days. From one encounter to a 5-year relationship that compounds."
    },

    // --- Volunteer journey ---
    volunteer: {
      sla: {
        invitationFromReadinessDays: 7,
        roleMatchDays: 14,
        onboardingConvDays: 21,
        firstEngagementDays: 60,
        impactReportCadence: 'monthly',
        checkInCadence:     'quarterly'
      },
      success: {
        retentionCriterion: 'at least one contribution per quarter at 12-month mark'
      },
      ltv: {
        horizonYears: 3,
        factors: [
          'Hours contributed',
          'Quality rating',
          'Members mentored or touched',
          'Advocacy conversions'
        ]
      },
      headline: "From client to mentor in 8–10 months. From mentor to advocate in 2–3 years. The community grows from within."
    },

    // --- Partner journey (ophthalmologist / clinic / counsellor) ---
    partner: {
      sla: {
        portalAccessHours:  48,   // partner portal + QR kit within 48h
        firstDeployDays:    14,   // QR in practice within 14d
        outcomeReportCadence: 'monthly',
        reviewCadence:       'quarterly',
        renewalCadence:      'annual'
      },
      success: {
        referralsFirst90d: 10,
        engagementRate:   0.60    // ≥60% referred patients had an iris. conversation
      },
      ltv: {
        horizonYears: 3,
        mode: 'mission-only',     // no financial rev share in the model
        factors: [
          'Patients referred',
          'Conversion rate',
          'Downstream volunteer / advocate catalysts',
          'Influence on peer partners'
        ]
      },
      headline: "From first QR to a live outcomes dashboard in 14 days. From one clinic to a regional referral network in 12 months."
    },

    // --- The loop (compounding mechanism) ---
    loop: {
      clientToVolunteerPct:   0.10,   // 10% over 24 months (low end of 10-15% range)
      volunteerToClientMult:    3,    // 3 new clients per active volunteer per year
      partnerToClientMult:     25,    // 20-50 range, mid
      velocityClientToVolMo:    9,    // 8-10 mo
      velocityVolToPartnerYr:  2.5,   // 2-3 yrs
      compounding: {
        year1Clients: 1000,
        year2Volunteers: 120,
        year2NewClients: 360,
        year3TotalEngaged: 1500
      },
      headline: "One client, met well once, becomes the supply chain. Retention is the acquisition engine."
    },

    // =============================================================
    // PART 2 — Scene-specific mock data
    // =============================================================

    // --- Margaret — canonical client scenario, drives Scenes 2-5 ---
    margaret: {
      name: 'Margaret',
      age: 68,
      location: 'Sudbury, ON',
      diagnosis: 'Macular degeneration',
      source: 'QR code · Sudbury Eye Centre waiting room',

      // Scene 2: the first conversation. 4-5 turn chat played as dual-voice.
      // Keeps consistency with iris-chat.js scenarios.margaret.script but
      // trimmed to fit Scene 2's 45-second slot.
      firstChat: [
        { speaker:'iris',     voice:'iris',     text:"Hi, I'm iris. I'm so glad you found me. What brought you here today?" },
        { speaker:'margaret', voice:'margaret', text:"My doctor said… macular degeneration. I don't know who to tell." },
        { speaker:'iris',     voice:'iris',     text:"Thank you for telling me. That's a lot to hold. Is there someone close to you who knows yet?" },
        { speaker:'margaret', voice:'margaret', text:"My daughter. In Vancouver. I haven't called her." },
        { speaker:'iris',     voice:'iris',     text:"Let's start there. I can help you think about that conversation — and connect you with someone local who's walked this path. Would that feel okay?" }
      ],

      // Scene 2 right-panel: iris.'s matching output after the conversation
      programMatches: [
        {
          name: 'Peer Support Group — Sudbury',
          reasoning: [
            'Geography: Sudbury-based group, bi-weekly',
            'Stage: new-diagnosis cohort currently accepting',
            'Emotional signal: isolation cue ("I haven\'t called her")'
          ],
          fitScore: 94
        },
        {
          name: 'Adjustment to Sight Loss (A2SL)',
          reasoning: [
            'Diagnosis: macular degeneration — high relevance',
            'Stage: newly diagnosed, within 3-month window',
            'Format: one-on-one coaching matches Margaret\'s pace'
          ],
          fitScore: 87
        }
      ],

      // Scene 3: the handoff timeline + SLA actuals
      handoffTimeline: [
        { day: 0,  label: 'iris. conversation',   detail: 'First chat complete. 2 programs matched.', slaTargetHrs: 0,  actualHrs: 0   },
        { day: 1,  label: 'Coordinator briefed',  detail: 'Summary sent: name, diagnosis, emotional tone, top match.', slaTargetHrs: 4,  actualHrs: 3.2 },
        { day: 2,  label: 'Warm callback',        detail: 'Local coordinator calls. Margaret picks up.', slaTargetHrs: 48, actualHrs: 41  },
        { day: 5,  label: 'Peer connection',      detail: 'Matched with a peer 18 months further along.', slaTargetHrs: 168, actualHrs: 120 },
        { day: 7,  label: 'First program session',detail: 'Enrolled + first session scheduled.',         slaTargetHrs: 168, actualHrs: 168 }
      ],

      // Scene 4: 12-month check-in timeline
      retentionTimeline: [
        { day:   0, label: 'Day 1',   event: 'Found iris.', engagementScore: 1  },
        { day:   7, label: 'Week 1',  event: 'First program session.',     engagementScore: 12 },
        { day:  30, label: '30 days', event: 'Check-in. Peer group 2x so far.', engagementScore: 28 },
        { day:  90, label: '3 months',event: 'Called her daughter. A2SL mid-way.', engagementScore: 48 },
        { day: 180, label: '6 months',event: 'iris. asks readiness question.',     engagementScore: 68 },
        { day: 365, label: '1 year',  event: 'Peer-mentoring 3 new members.',      engagementScore: 91 }
      ],

      // Scene 5: iris.'s readiness score at 6 months
      readiness: {
        score: 78,
        threshold: 75,
        factors: [
          { label: 'Months engaged',         value: 6,   weight: 0.20, contribution: 18 },
          { label: 'Check-in responsiveness', value: 'High (6/6)', weight: 0.20, contribution: 20 },
          { label: 'Program completion',     value: '2 of 2',     weight: 0.15, contribution: 15 },
          { label: 'Self-signaled interest', value: 'mentioned helping others',  weight: 0.20, contribution: 14 },
          { label: 'Life stability',         value: 'stable',      weight: 0.15, contribution: 8  },
          { label: 'Relevant skills',        value: 'retired teacher', weight: 0.10, contribution: 3  }
        ]
      }
    },

    // --- Sudbury Eye Centre — canonical partner scenario for Scenes 7-8 ---
    clinic: {
      name: 'Sudbury Eye Centre',
      type: 'Ophthalmology practice',
      location: 'Sudbury, ON',
      onboardingStages: [
        { label: 'Expressed interest',    slaHrs: 0,  actualHrs: 0,   status: 'complete' },
        { label: 'Portal access granted', slaHrs: 48, actualHrs: 22,  status: 'complete' },
        { label: 'QR + waiting-room kit', slaHrs: 120,actualHrs: 84,  status: 'complete' },
        { label: 'Staff orientation',     slaHrs: 240,actualHrs: 192, status: 'complete' },
        { label: 'First referral live',   slaHrs: 336,actualHrs: 216, status: 'complete' }
      ],

      // Scene 8: live dashboard counters after 12 months of operation
      dashboard: {
        refersTotal:     38,
        engagedTotal:    27,    // had an iris. conversation
        concreteStep:    18,    // booked a concrete next step
        becameVolunteer:  4,
        programCompletion: 0.67, // 67% of referred completed at least one program
        satisfaction:     4.2,   // out of 5

        // Outcome feed — illustrative anonymized status updates
        recentOutcomes: [
          { anonId:'M-82', status:'Peer mentor (2 mentees)',  time:'This month'      },
          { anonId:'K-44', status:'A2SL week 6',               time:'This month'      },
          { anonId:'J-61', status:'Enrolled Vision Mate',      time:'Last month'      },
          { anonId:'D-29', status:'First call with coordinator', time:'Last month'    }
        ],

        sla: {
          outcomeReportCadence: 'Monthly · on the 1st',
          clinicalResponseHrs:  24,
          dataProtection:       'PIPEDA-aligned · hashed identifiers · no PII leaves Vercel edge'
        },

        retention: {
          renewalDate:     'Q3 2026',
          expansionOffer:  'Add second practice + staff training',
          caseStudyInvite: 'Co-branded outcomes report for CNIB + Sudbury Eye Centre'
        }
      }
    },

    // --- Scoreboard headlines (Scene 10) ---
    scoreboard: {
      pillars: [
        {
          audience: 'Clients',
          slaRow:  [
            '30s first reply',
            '5-turn program match',
            '7-day concrete next step',
            '48h warm human handoff',
            '12-month retention'
          ],
          northStar: '5-year LTV — programs × months × peer connections × downstream influence'
        },
        {
          audience: 'Volunteers',
          slaRow:  [
            '7-day invitation from readiness',
            '14-day role match',
            '21-day onboarding',
            '60-day first engagement',
            'Quarterly cadence'
          ],
          northStar: '3-year LTV — hours × quality × members touched × advocacy'
        },
        {
          audience: 'Partners',
          slaRow:  [
            '48h portal access',
            '14-day first deploy',
            '90-day integration (10+ referrals)',
            'Monthly outcome reports',
            'Annual renewal + expansion'
          ],
          northStar: '3-year LTV — patients × conversion × downstream catalysts × peer influence'
        }
      ],
      loop: {
        convRate: '10%+ client→volunteer over 24 months',
        velocity: '8-10mo client→volunteer · 2-3yr volunteer→partner-catalyst',
        compounding: '1,000 clients in Y1 → 1,500+ engaged by Y3'
      }
    },

    // =============================================================
    // PART 3 — iris. voice-over scripts (DEPRECATED)
    // =============================================================
    // irisVO kept empty on purpose. The tour is now narrator-led.
    // iris speaks ONLY inside the live demo scenes (2 and 5) where
    // she's in conversation with Margaret. Every other scene is
    // narrated by the docent (ash voice) using narratorBeats below.
    // This gives the viewer a consistent guide across the whole tour
    // instead of 10 disconnected first-person monologues.
    irisVO: {},

    // =============================================================
    // PART 4 — Narrator beats (docent layer)
    // =============================================================
    // Beats interleave with each scene's visual choreography and
    // in-scene dialogue. A scene's beats fire in order; each beat has
    // an `at` field telling the renderer WHEN to play it relative to
    // the scene timeline:
    //   'enter'            — before any visuals settle (the hook)
    //   'afterTurn:N'      — after dialogue turn N finishes (commentary)
    //   'afterVisual:name' — after a named visual beat completes
    //   'exit'             — last, leading into the next scene
    //
    // Scene 2 ("Margaret's first conversation") is the exemplar.
    // v0 DRAFT — awaiting Angela review. Edits happen here; no engineering.
    narratorBeats: {
      // v2 script — EXECUTIVE product-demo voice. Third-person analytical
      // narrator (ash). Audience: CNIB exec, board, partner clinic leader,
      // institutional funder. Every scene answers one of three questions:
      //   WHAT is iris · HOW does it work · HOW is success measured
      //
      // Margaret is the demonstration case, not the protagonist. The
      // narrator uses her to show mechanism, then pulls out to numbers.
      // Read-aloud tested. Concrete SLA + funnel language throughout.

      // Scene 1 — WHAT IS IRIS.
      intro: [
        {
          at: 'enter',
          text: "This is iris. CNIB's engagement infrastructure for the 1.5 million Canadians living with sight loss. Today, less than one percent of that population is actively engaged with CNIB. iris is the system built to close that gap \u2014 across three audiences: clients, volunteers, and partner clinics. Over the next four minutes: what iris does, how it works, and how success is measured."
        }
      ],

      // Scene 2 — HOW ACQUISITION WORKS.
      acquire: [
        {
          at: 'enter',
          text: "Acquisition begins with a QR code in a partner clinic. A patient scans. iris opens a conversation within thirty seconds. Across five conversational turns, iris identifies diagnosis, geography, emotional state, and social support \u2014 then matches against seventy CNIB programs by lived-experience fit, not keywords. Sudbury Eye Centre. Margaret, sixty-eight, newly diagnosed with macular degeneration. Watch."
        },
        {
          at: 'afterVisual:matches',
          text: "Two program matches returned. Ninety-four percent fit on the Sudbury peer group. Eighty-seven on adjustment-to-sight-loss coaching. The matching engine weights geography, diagnosis stage, and emotional signal. SLAs: thirty-second first reply, program match within five turns. Margaret: both achieved."
        },
        {
          at: 'exit',
          text: "Program selected. Human handoff initiated. That is acquisition."
        }
      ],

      // Scene 3 — HOW ENGAGEMENT + HANDOFF WORKS.
      engage: [
        {
          at: 'enter',
          text: "From first conversation to first program session: seven days. Day one, iris briefs a human coordinator \u2014 diagnosis, emotional tone, program selection, the one detail that matters most. Day two, coordinator calls within the forty-eight-hour warm-handoff SLA. Day five, peer mentor matched on diagnosis and time-in-journey. Day seven, first program session on the calendar."
        },
        {
          at: 'exit',
          text: "Success criterion: concrete next step booked within seven days. Margaret: achieved."
        }
      ],

      // Scene 4 — HOW RETENTION WORKS.
      retain: [
        {
          at: 'enter',
          text: "Retention runs on a thirty, ninety, one-eighty, three-sixty-five day cadence \u2014 plus signal-triggered check-ins. iris watches engagement velocity, response latency, and sentiment shifts. At month three, Margaret reconnected with her daughter. At month six, iris flagged a signal change: two programs completed, rising responsiveness, self-signaled interest in helping others."
        },
        {
          at: 'exit',
          text: "Retention target: active touchpoint in last ninety days at the twelve-month mark. Margaret: eighty-four percent probability."
        }
      ],

      // Scene 5 — HOW THE LOOP STARTS (readiness score + ask).
      readiness: [
        {
          at: 'enter',
          text: "This is where iris differs from every referral tool on the market. It does not just match clients to programs. It scores each member on readiness to contribute \u2014 across six weighted signals: months engaged, check-in responsiveness, program completion, self-signaled intent, life stability, relevant skills. At a composite score of seventy-five, iris asks one question."
        },
        {
          at: 'exit',
          text: "Client-to-volunteer conversion target: ten to fifteen percent over twenty-four months. Margaret: converted at month seven. That is how retention becomes acquisition."
        }
      ],

      // Scene 6 — HOW VOLUNTEER ACTIVATION WORKS.
      volonboard: [
        {
          at: 'enter',
          text: "Volunteer activation SLAs: fourteen days to role match, twenty-one to onboarding conversation, sixty to first mentorship. iris matches volunteers to mentees on diagnosis, region, and time-in-journey. Margaret: matched to three newly-diagnosed members in Sudbury \u2014 each at an earlier stage of her same condition."
        },
        {
          at: 'exit',
          text: "Three new clients reached through one activated volunteer. That multiplier is how the flywheel begins to turn. Now: the partner side."
        }
      ],

      // Scene 7 — HOW PARTNER ACQUISITION WORKS.
      partneracq: [
        {
          at: 'enter',
          text: "Partner onboarding \u2014 ophthalmology clinic, hospital, counsellor, caregiver org \u2014 moves from first contact to first live referral in fourteen days. Day one: portal access within forty-eight hours. Day five: printable QR kit shipped. Day seven: staff orientation. Day fourteen: first patient scan. No integration project, no sales cycle, no per-seat license."
        },
        {
          at: 'exit',
          text: "Sudbury Eye Centre: onboarded in fourteen days. First live referral: Margaret."
        }
      ],

      // Scene 8 — HOW PARTNER MEASUREMENT WORKS.
      partnerdash: [
        {
          at: 'enter',
          text: "Twelve months in, the partner dashboard shows the full referral funnel per clinic. Aggregated, anonymized, PIPEDA-aligned, audited. Sudbury Eye Centre: thirty-eight patients referred. Twenty-seven had a real iris conversation. Eighteen booked a concrete next step. Four became volunteers. Sixty-seven percent program completion. Four-point-two member satisfaction."
        },
        {
          at: 'exit',
          text: "Every number is live, visible to the partner, auditable by CNIB. The renewal conversation writes itself."
        }
      ],

      // Scene 9 — HOW IT COMPOUNDS (the business case).
      loop: [
        {
          at: 'enter',
          text: "Here is the compounding math. Client-to-volunteer conversion: ten to fifteen percent over twenty-four months. Volunteer-to-new-client multiplier: three per year. Partner-to-new-client multiplier: twenty to fifty per year. At scale: one thousand clients acquired in year one projects to fifteen hundred engaged by year three \u2014 without additional acquisition spend."
        },
        {
          at: 'exit',
          text: "Retention is the acquisition engine."
        }
      ],

      // Scene 10 — HOW SUCCESS IS MEASURED.
      scoreboard: [
        {
          at: 'enter',
          text: "iris commits to fourteen SLAs across three audiences. Every one is measurable. Every one is live on every partner dashboard in real time. A missed SLA shows up red \u2014 to CNIB, to the partner, to the member. Transparency is the feature, not a report."
        },
        {
          at: 'exit',
          text: "That is iris. What would you like to ask it?"
        }
      ]
    }
  };

  window.demoData = DATA;
})();
