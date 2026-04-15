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
      // v1 script — first-person iris voice, three-act structure.
      // See BRAND-SPEC + KNOWLEDGE-BASE. Read-aloud tested, <15 words/line.
      // Scenes 1-2 = Act 1 (Meet me). Scenes 3-5 = Act 2 (Margaret's year).
      // Scenes 6-10 = the partner + compounding story + closer to Scene 11.

      // ========== ACT 1 — MEET ME ==========

      // Scene 1 — iris introduces herself and teases the artifact.
      // Lands the wordmark + mark visuals. Ends with "let me show you"
      // so Scene 2 feels like the continuation, not a new scene.
      intro: [
        {
          at: 'enter',
          text: "I'm iris. I work for CNIB. I help Canadians living with sight loss find the programs, the people, and the support that's been built for them \u2014 most of which they've never heard of. Let me show you something small."
        }
      ],

      // Scene 2 — meet Margaret, live conversation, iris's matching logic.
      // Three beats: setup (who Margaret is) → reflection over match panel
      // (what iris just did and why) → close (the unit of value).
      acquire: [
        {
          at: 'enter',
          text: "Eight weeks ago, in a clinic in Sudbury, a woman named Margaret scanned a QR code from her waiting-room chair. Her daughter in Vancouver had sent it to her. Margaret is sixty-eight. A retired teacher. Recently diagnosed with macular degeneration. She hadn't told her daughter yet that she'd scanned it. Twenty-three seconds later, I said hello."
        },
        {
          at: 'afterVisual:matches',
          text: "I didn't ask about her symptoms. I asked about her people. That's most of what I do \u2014 I ask the question nobody else is in the room to ask. While I held that moment, I was matching her quietly in the background against every CNIB program available in her city. Not by keyword. By lived-experience fit. Two matches came back."
        },
        {
          at: 'exit',
          text: "I asked her which felt right. She picked one. And then I stayed. Which is the part that actually matters."
        }
      ],

      // ========== ACT 2 — A YEAR WITH MARGARET ==========

      // Scene 3 — the seven days of handoffs.
      engage: [
        {
          at: 'enter',
          text: "Then the seven days. Day one, I briefed a coordinator in Sudbury. Day two, that coordinator called her. Margaret picked up. Day five, she was matched with a peer \u2014 someone eighteen months further down the same road. Day seven, she was enrolled and on the calendar."
        },
        {
          at: 'exit',
          text: "She didn't have to retell her story. Not once."
        }
      ],

      // Scene 4 — the year. Engagement timeline. Stepping back when stable.
      retain: [
        {
          at: 'enter',
          text: "Then the year. I checked in at thirty days. At ninety. At six months. I wasn't performative about it. I showed up when something shifted, and I stepped back when it didn't. Month three, she called her daughter."
        },
        {
          at: 'exit',
          text: "Month six, something changed in my read of her."
        }
      ],

      // Scene 5 — readiness score + volunteer ask. Includes live dialogue.
      // Renderer plays enter → score animates → dialogue fires → exit.
      readiness: [
        {
          at: 'enter',
          text: "High responsiveness. Two programs completed. She'd mentioned, almost in passing, wanting to help someone else. Her readiness score crossed a line I'd been watching for. So I asked her one question."
        },
        {
          at: 'exit',
          text: "By month twelve, Margaret was mentoring three newly diagnosed Canadians in Sudbury. One of them was referred by the same clinic that hung her QR code."
        }
      ],

      // Scene 6 — volunteer onboarding (brief bridge into Act 3).
      // Operational detail kept tight; the value is in the transition.
      volonboard: [
        {
          at: 'enter',
          text: "One volunteer, onboarded. Role matched in fourteen days. First mentorship in sixty. Three newly-diagnosed members now know Margaret's name."
        },
        {
          at: 'exit',
          text: "That's one side of the loop. The other side is the clinic that sent her. Let me show you how I met them."
        }
      ],

      // ========== ACT 3 — WHY IT COMPOUNDS ==========

      // Scene 7 — partner acquisition.
      partneracq: [
        {
          at: 'enter',
          text: "That clinic is called Sudbury Eye Centre. They said yes to me in fourteen days. No sales cycle. A printable, a portal, a staff orientation, a handshake."
        },
        {
          at: 'exit',
          text: "Now watch what twelve months of working with me looks like."
        }
      ],

      // Scene 8 — partner dashboard. The four numbers that matter.
      partnerdash: [
        {
          at: 'enter',
          text: "Twelve months later, their dashboard reads like this. Thirty-eight patients referred. Twenty-seven had a real conversation with me. Eighteen took a concrete next step. Four became volunteers."
        },
        {
          at: 'exit',
          text: "That's one clinic. In one city. In one year."
        }
      ],

      // Scene 9 — the loop. Compounding visualization.
      loop: [
        {
          at: 'enter',
          text: "Now picture that across CNIB. One well-met client in year one becomes fifteen hundred engaged Canadians by year three. Not through more advertising. Through the loop."
        },
        {
          at: 'exit',
          text: "Retention is the acquisition engine."
        }
      ],

      // Scene 10 — closer. Hand off to the interactive Ask iris scene.
      scoreboard: [
        {
          at: 'enter',
          text: "Three audiences. One loop. Every commitment you've seen is mine to keep \u2014 measured, on the record, live on every partner dashboard."
        },
        {
          at: 'exit',
          text: "Now \u2014 anything you want to ask me?"
        }
      ]
    }
  };

  window.demoData = DATA;
})();
