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
      // Scene 1 — COLD OPEN. Set the stage. Tell the viewer what they're
      // about to watch, who the cast is, and what the payoff is. Without
      // this, scenes 2-10 land on a viewer with no orientation.
      intro: [
        {
          at: 'enter',
          text: "For the next four minutes you're going to watch something CNIB has been trying to build for a decade. One and a half million Canadians live with sight loss. Most of them have never met CNIB. Not because CNIB isn't there — because in the moment someone needs a hand, nobody is asking the right question. So CNIB built someone who does. Her name is iris. You'll meet her, you'll watch her help one person, one clinic, and one community, and you'll see how that single interaction compounds into an engine that reaches the next hundred thousand Canadians. We start with Margaret."
        }
      ],

      // Scene 2 — Margaret arrives. Live chat + iris matching. Narrator
      // sets up, gets OUT of the way for the dialogue, reflects once at
      // the end over the match panel.
      acquire: [
        {
          at: 'enter',
          text: "Margaret. Sixty-eight. Retired teacher in Sudbury. Eight weeks ago her eye doctor told her she has macular degeneration. She hasn't told her daughter. Her daughter — who lives in Vancouver — found CNIB and sent her a QR code. Margaret scanned it thirty seconds ago. Watch."
        },
        {
          at: 'afterVisual:matches',
          text: "Notice what iris just did. She didn't ask about symptoms. She asked about Margaret's people. And while she held Margaret in that moment, she was quietly matching her situation against seventy CNIB programs — not by keyword, by lived-experience fit. The top match isn't a program. It's a person in Sudbury who has walked this road."
        },
        {
          at: 'exit',
          text: "Margaret said yes. Twenty-three seconds from scan to first reply. What happens over the next seven days is where every referral system in healthcare catastrophically fails. Watch iris carry her."
        }
      ],

      // Scene 3 — Handoff week. Timeline visual. Narrator explains what
      // the viewer is looking at and why each SLA matters.
      engage: [
        {
          at: 'enter',
          text: "Seven days. Five handoffs. Zero dropped balls. Margaret never retells her story to a single person. iris briefs the coordinator. The coordinator calls within forty-eight hours. A peer mentor is matched by day five. Her first program session is on the calendar by day seven. Every step you see carries an SLA — a commitment iris makes to Margaret, on the record, measurable. This is what a warm handoff actually looks like."
        },
        {
          at: 'exit',
          text: "Day seven. Margaret is enrolled. Acquisition was the easy part. Now watch the hard part — what happens across the year that follows."
        }
      ],

      // Scene 4 — Retention timeline. Scrubbable 12-month view of Margaret.
      retain: [
        {
          at: 'enter',
          text: "Twelve months of iris being present in Margaret's life. Not spammy. Not performative. Showing up when something changes, stepping back when it doesn't. Drag the timeline — you'll see Margaret's engagement grow from one conversation into a full relationship with CNIB. By month three she called her daughter. By month six, her engagement score has crossed a threshold iris has been watching for."
        },
        {
          at: 'exit',
          text: "That threshold matters. It tells iris it's time to ask Margaret a different kind of question."
        }
      ],

      // Scene 5 — Readiness → volunteer ask. THE money scene.
      readiness: [
        {
          at: 'enter',
          text: "This is what separates iris from every other navigator tool. iris doesn't just match members to programs. She watches for the moment a member is ready to become something more. Six months of engagement. High responsiveness. Two programs completed. A self-signaled interest in helping others. Score crosses seventy-five. iris asks one question."
        },
        {
          at: 'exit',
          text: "Margaret just became the supply chain. One client in, one volunteer out. This is how the loop starts to form. But a loop needs partners too — the clinics that put iris in front of the next Margaret. Let's see that side."
        }
      ],

      // Scene 6 — Volunteer onboarding.
      volonboard: [
        {
          at: 'enter',
          text: "Margaret said yes, and iris didn't hand her a form and a six-week wait. Role match in fourteen days. Onboarding conversation in twenty-one. First mentorship in sixty. Three new members — just starting their own diagnoses — now know Margaret's name."
        },
        {
          at: 'exit',
          text: "That's one volunteer. Multiply by conversion rate, by partners, by years — and you get the flywheel. But first: how does iris meet a new clinic?"
        }
      ],

      // Scene 7 — Partner acquisition.
      partneracq: [
        {
          at: 'enter',
          text: "Sudbury Eye Centre — the clinic that put the QR code on the wall eight weeks ago. This is how iris brought them on. From first yes to first live referral in fourteen days. No sales cycle, no integration project. A printable, a portal, a staff orientation, a handshake. That's the whole sign-up."
        },
        {
          at: 'exit',
          text: "Fourteen days. One live referral — Margaret. Now watch what twelve months of iris working with this clinic looks like."
        }
      ],

      // Scene 8 — Partner dashboard. The dense data scene.
      partnerdash: [
        {
          at: 'enter',
          text: "Twelve months in. This is what Sudbury Eye Centre sees when they open their iris dashboard. Referrals made. Patients who had a real conversation. Concrete next steps booked. Members who became volunteers. Anonymized, PIPEDA-aligned, audited. This is what keeps a clinic director saying yes every year."
        },
        {
          at: 'exit',
          text: "Thirty-eight patients referred. Twenty-seven engaged. Four of them are now mentoring others. The clinic's patients got somewhere. That closes the loop."
        }
      ],

      // Scene 9 — The loop. The whole flywheel.
      loop: [
        {
          at: 'enter',
          text: "Here's the whole picture. One client — Margaret — acquired in year one. By year two she's a volunteer reaching three new members. The clinic that sent her is referring another twenty. By year three, a single seed has compounded into fifteen hundred engaged Canadians. Toggle to CNIB scale and the flywheel speaks for itself."
        },
        {
          at: 'exit',
          text: "This is why iris isn't a referral tool. It's an acquisition engine with retention built into it. Retention IS the acquisition engine."
        }
      ],

      // Scene 10 — The scoreboard. Commitments summary.
      scoreboard: [
        {
          at: 'enter',
          text: "Three audiences. One loop. Here's what iris commits to each of them, on the record, on-screen. If a single SLA misses, it shows up red in the dashboard. This is what a measurable navigator looks like — and this is the standard CNIB will be held to."
        },
        {
          at: 'exit',
          text: "That's iris. Now — anything you want to ask her? She's standing by."
        }
      ]
    }
  };

  window.demoData = DATA;
})();
