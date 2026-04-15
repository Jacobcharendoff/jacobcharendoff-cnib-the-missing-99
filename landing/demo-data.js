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
      // v3 script — authored in Cowork, ratified by Jacob, saved to
      // .claude/docs/DEMO-SCRIPT.md. Ported verbatim. No rewriting.
      // Third-person analytical narrator (ash). ~4 minutes total.

      // Scene 1 — intro
      intro: [
        {
          at: 'enter',
          text: "One point five million Canadians live with sight loss. Fewer than one percent are engaged with CNIB. The programs exist. Finding them has always taken work. This is iris. CNIB's operating system for engagement. Three audiences move through her. Clients find their next step. Volunteers find their role. Partner clinics find a referral path that works. Every one of them comes in through the same door. Every one of them is accounted for. iris turns a directory into a system. She turns the missing ninety-nine percent into a measurable operation. iris. let more in."
        }
      ],

      // Scene 2 — acquire
      acquire: [
        {
          at: 'enter',
          text: "Meet Margaret. Sixty-eight. Retired teacher in Sudbury. Diagnosed with macular degeneration last Tuesday. Her daughter in Vancouver sent her a QR code. Margaret scanned it in the waiting room at Sudbury Eye Centre. First reply from iris: twenty-three seconds."
        },
        {
          at: 'afterVisual:matches',
          text: "Five turns. Two matches. Sudbury Peer Group. Ninety-four percent fit. Adjustment-to-Sight-Loss Coaching. Eighty-seven percent. Matched on geography, diagnosis stage, and emotional signal. No search. No form. No wait."
        },
        {
          at: 'exit',
          text: "Finding her program took under two minutes. The next seven days do the harder work."
        }
      ],

      // Scene 3 — engage
      engage: [
        {
          at: 'enter',
          text: "The seven-day handoff runs on a clock. Day one: coordinator briefed. Day two: warm callback. Day five: peer mentor matched. Someone eighteen months further along. Day seven: first program session booked. Every step carries an SLA. Every miss is logged."
        },
        {
          at: 'exit',
          text: "By day seven, Margaret isn't a referral. She's a client."
        }
      ],

      // Scene 4 — retain
      retain: [
        {
          at: 'enter',
          text: "Retention isn't a feeling. It's a scrubbable timeline. Day seven. Day thirty. Day ninety. Day one-eighty. Day three-sixty-five. Engagement score moves from one to ninety-one. Month three, Margaret calls her daughter. Month six, her responses start carrying new signals. Month twelve, she's still here. Still engaged. Still measured."
        },
        {
          at: 'exit',
          text: "Those signals mean something specific."
        }
      ],

      // Scene 5 — readiness
      readiness: [
        {
          at: 'enter',
          text: "iris watches for readiness. Six weighted factors feed one score. Months engaged. Check-in responsiveness. Program completion. Self-signaled intent. Life stability. Relevant skills. Margaret crosses seventy-five. iris asks the question."
        },
        {
          at: 'exit',
          text: "Margaret was a client twelve months ago. Now she's a volunteer. That's the loop."
        }
      ],

      // Scene 6 — volonboard
      volonboard: [
        {
          at: 'enter',
          text: "Volunteers run on the same rails. Fourteen days to role match. Twenty-one days to orientation. Sixty days to first mentorship. One volunteer reaches three new clients a year. The infrastructure doesn't change. The audience does."
        },
        {
          at: 'exit',
          text: "Partners come in through the same front door."
        }
      ],

      // Scene 7 — partneracq
      partneracq: [
        {
          at: 'enter',
          text: "Sudbury Eye Centre came in as a partner. Portal access, forty-eight hours. QR kit shipped, day five. Staff orientation, day seven. First live referral, day fourteen. Two weeks from signed to sending patients."
        },
        {
          at: 'exit',
          text: "Two weeks in, every referral is visible."
        }
      ],

      // Scene 8 — partnerdash
      partnerdash: [
        {
          at: 'enter',
          text: "This is what Sudbury sees at month twelve. Thirty-eight patients referred. Twenty-seven engaged in conversation. Eighteen booked a next step. Four became volunteers. Program completion: sixty-seven percent. Satisfaction: four point two out of five. No spreadsheet. No follow-up call. No guessing."
        },
        {
          at: 'exit',
          text: "One partner. Twelve months. Now watch what happens."
        }
      ],

      // Scene 9 — loop
      loop: [
        {
          at: 'enter',
          text: "One thousand clients in year one. Ten to fifteen percent become volunteers within twenty-four months. Each volunteer reaches three new clients a year. Each partner brings twenty to fifty. Year three: fifteen hundred engaged. Same infrastructure. The output isn't linear. It's compounding. Retention is the acquisition engine."
        }
      ],

      // Scene 10 — scoreboard
      scoreboard: [
        {
          at: 'enter',
          text: "Fourteen SLAs. Three audiences. One operating system. Every number on this grid is measured. Every miss is logged. Every recovery is tracked. The ninety-nine percent was never a funding problem. It was an operations problem. iris is the operations. And she's live."
        },
        {
          at: 'exit',
          text: "Ask her anything."
        }
      ]
    }
  };

  window.demoData = DATA;
})();
