# iris. Engineering Specification

## Target Architecture

### Frontend (Next.js + React)
```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, metadata
│   ├── page.tsx                # Landing page (demo selection)
│   ├── demo/[persona]/page.tsx # Demo conversation view
│   └── api/
│       ├── chat/route.ts       # LLM proxy (Anthropic Claude)
│       └── tts/route.ts        # TTS proxy (ElevenLabs)
├── components/
│   ├── ui/                     # Shared UI primitives
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── Card.tsx
│   ├── landing/                # Landing page components
│   │   ├── Hero.tsx
│   │   ├── DemoCards.tsx
│   │   └── Footer.tsx
│   ├── conversation/           # Chat interface
│   │   ├── ChatWindow.tsx      # Main conversation container
│   │   ├── MessageBubble.tsx   # Individual message
│   │   ├── InputBar.tsx        # Text input + mic + send
│   │   ├── TypingIndicator.tsx
│   │   └── ConversationModal.tsx
│   └── voice/                  # Voice I/O
│       ├── VoiceProvider.tsx   # Context provider for voice state
│       ├── useSpeechToText.ts  # STT hook (Web Speech API)
│       └── useTextToSpeech.ts  # TTS hook (ElevenLabs)
├── lib/
│   ├── conversation-engine.ts  # Core conversation + matching logic
│   ├── persona-loader.ts       # Load persona configs
│   ├── tts-service.ts          # TTS with persistent audio, queue, interruption
│   ├── stt-service.ts          # STT with silence detection
│   └── types.ts                # Shared TypeScript types
├── data/
│   ├── personas/               # Demo persona definitions
│   │   ├── margaret.json
│   │   ├── david.json
│   │   └── priya.json
│   └── programs/               # CNIB program catalog
│       └── program-map.json
└── styles/
    └── globals.css             # Tailwind + CNIB design tokens
```

### Key Design Decisions

**Why Next.js:** Vercel-native, server components for API routes, excellent accessibility tooling, TypeScript first. The app is already on Vercel.

**Why NOT a separate backend (yet):** The demo doesn't need persistent sessions. The pilot will — but building a backend before validating the conversation engine is premature. Phase 2 adds a backend.

**Persistent Audio Pattern (CRITICAL):**
The TTS service MUST use a single Audio element created at page load. This is not optional — Mobile Safari blocks audio created after async boundaries.

```typescript
// tts-service.ts — singleton pattern
class TTSService {
  private audio: HTMLAudioElement;
  private unlocked: boolean = false;
  
  constructor() {
    this.audio = new Audio();
    this.audio.playsInline = true;
    this.audio.setAttribute('playsinline', '');
  }
  
  // Call this inside a user gesture handler (click, tap)
  unlock() {
    if (this.unlocked) return;
    this.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
    this.audio.volume = 0;
    this.audio.play().then(() => {
      this.audio.volume = 1;
      this.unlocked = true;
    }).catch(() => {});
  }
  
  // Play TTS — reuses the same element, never creates new Audio()
  async play(url: string): Promise<void> {
    this.audio.src = url;
    return this.audio.play();
  }
  
  stop() {
    this.audio.pause();
    this.audio.removeAttribute('src');
    this.audio.load();
  }
}

export const ttsService = new TTSService();
```

### Conversation Engine Design

The conversation engine wraps the LLM call with:
1. **System prompt** — persona context, CNIB program knowledge, voice principles, crisis protocols
2. **Conversation history** — full message array maintained in state
3. **Matching signals** — extracted from conversation (diagnosis, geography, needs, emotions)
4. **Program recommendations** — generated from matching signals against program catalog

```typescript
interface ConversationState {
  personaId: string;
  messages: Message[];
  memberProfile: Partial<MemberProfile>;
  matchedPrograms: Program[];
  emotionalState: 'initial' | 'distressed' | 'engaged' | 'hopeful';
  crisisDetected: boolean;
}

interface MemberProfile {
  diagnosis: string;
  province: string;
  city: string;
  ageRange: string;
  primaryConcern: string;
  emotionalStage: 'shock' | 'survival' | 'reconnection' | 'reclaiming' | 'contribution';
}
```

### API Routes

**`/api/chat` (POST)**
- Accepts: `{ messages: Message[], personaId: string }`
- Returns: `{ response: string, matchedPrograms?: Program[] }`
- Uses Claude with system prompt containing persona + program knowledge
- Includes crisis detection in system prompt

**`/api/tts` (POST)**
- Accepts: `{ text: string, voiceId?: string }`
- Returns: Audio stream (audio/mpeg)
- Proxies to ElevenLabs API
- Voice ID maps to persona (Margaret gets a different voice than David)

### Accessibility Requirements (WCAG 2.1 AA)
- All interactive elements keyboard accessible
- `role="dialog"` + `aria-modal="true"` on conversation modal
- Live region (`aria-live="polite"`) for new messages
- Screen reader announcements for state changes (recording, speaking, thinking)
- Focus management: trap focus in modal, return focus on close
- Minimum 4.5:1 contrast ratio (CNIB yellow on black exceeds this)
- `:focus-visible` outlines on all interactive elements
- `prefers-reduced-motion` respected for animations
- Touch targets minimum 44x44px

### Phase Plan

**Phase 1 — Demo Hardening (current sprint)**
Fix voice bug ✅, add accessibility ✅, clean up code ✅, deploy ✅

**Phase 2 — Component Architecture**
Split monolith into Next.js app. Extract components. Set up TypeScript. 
Maintain feature parity with current demo — nothing new, just better architecture.

**Phase 3 — Conversation Engine**
Build real matching logic. Integrate CNIB program catalog.
Member profile extraction from conversation. Smart recommendations.

**Phase 4 — Session Backend**
Persist conversations. Build member profiles over time.
Admin dashboard for CNIB staff. Analytics and reporting.

**Phase 5 — Pilot Ready**
Channel partner embed mode. Multi-language support (EN/FR minimum).
Load testing. Security audit. CNIB IT sign-off.
