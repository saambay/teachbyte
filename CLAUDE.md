# CLAUDE.md - TeachByte Project Guide

## What is this project?

TeachByte is a mobile learning app where kids (ages 6-12) learn by teaching AI characters. Built with React Native / Expo (iOS + Android) and a Node.js backend. See SPEC.md for full product specification.

## Tech Stack

### Mobile App (Frontend)
- **Framework**: React Native with Expo (managed workflow)
- **Language**: TypeScript (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand (lightweight, no boilerplate)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Animations**: React Native Reanimated + Moti
- **HTTP Client**: Axios with interceptors for auth
- **Storage**: Expo SecureStore (tokens), AsyncStorage (preferences)

### Backend (API Server)
- **Runtime**: Node.js 20+
- **Framework**: Fastify (faster than Express, schema validation built in)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Firebase Auth (parent accounts, child profiles)
- **AI**: Anthropic Claude API (via official SDK `@anthropic-ai/sdk`)
- **Validation**: Zod schemas shared between client and server
- **Testing**: Vitest

### Infrastructure (MVP)
- **Backend hosting**: Railway or Render (simple, fast deploys)
- **Database**: Railway PostgreSQL or Supabase
- **File storage**: Not needed for MVP
- **CI/CD**: GitHub Actions

## Project Structure

```
teachbyte/
├── SPEC.md                    # Product specification (you are reading CLAUDE.md)
├── CLAUDE.md                  # This file - project conventions
├── PLAYBOOK.md                # Sequenced implementation prompts
│
├── apps/
│   └── mobile/                # React Native / Expo app
│       ├── app/               # Expo Router pages (file-based routing)
│       │   ├── (auth)/        # Auth screens (login, onboard)
│       │   ├── (app)/         # Main app screens (behind auth)
│       │   │   ├── session/   # Active session screens
│       │   │   ├── home/      # Home / topic selection
│       │   │   └── parent/    # Parent dashboard
│       │   └── _layout.tsx    # Root layout
│       ├── components/        # Shared UI components
│       │   ├── chat/          # Chat UI components (bubble, input, typing indicator)
│       │   ├── agents/        # Agent avatar, agent card
│       │   └── common/        # Buttons, cards, modals
│       ├── hooks/             # Custom React hooks
│       ├── stores/            # Zustand stores
│       │   ├── authStore.ts
│       │   ├── sessionStore.ts
│       │   └── progressStore.ts
│       ├── services/          # API client and service layer
│       │   ├── api.ts         # Axios instance with interceptors
│       │   ├── sessionService.ts
│       │   └── topicService.ts
│       ├── types/             # TypeScript types (shared with backend via package)
│       ├── constants/         # Colors, agent configs, app config
│       └── utils/             # Helpers, formatters
│
├── packages/
│   └── shared/                # Shared types and Zod schemas
│       ├── types/             # TypeScript interfaces (Student, Session, Topic, etc.)
│       └── schemas/           # Zod validation schemas
│
└── server/                    # Fastify backend
    ├── src/
    │   ├── routes/            # Fastify route handlers
    │   │   ├── sessions.ts
    │   │   ├── students.ts
    │   │   ├── topics.ts
    │   │   └── parent.ts
    │   ├── agents/            # Agent definitions and prompt templates
    │   │   ├── coach.ts       # Coach agent logic + system prompt
    │   │   ├── teachingBuddy.ts # Teaching Buddy agent logic + system prompt
    │   │   └── types.ts       # Agent interface and contracts
    │   ├── services/          # Business logic
    │   │   ├── sessionService.ts    # Session lifecycle management
    │   │   ├── contextAssembler.ts  # Context assembly for LLM calls
    │   │   ├── progressService.ts   # Progress tracking and scoring
    │   │   ├── aiGateway.ts         # LLM API abstraction
    │   │   └── guardrails.ts        # Content safety and filtering
    │   ├── db/                # Prisma schema and migrations
    │   │   └── schema.prisma
    │   ├── seed/              # Seed data (topics, sample content)
    │   │   └── topics.ts      # Initial 20-30 science topics
    │   └── index.ts           # Server entry point
    ├── tests/                 # Vitest test files
    └── prisma/                # Prisma config
```

## Coding Conventions

### General
- TypeScript strict mode everywhere. No `any` types. Use `unknown` and narrow.
- Prefer `const` over `let`. Never use `var`.
- Use named exports, not default exports (except React components in Expo Router pages).
- Error handling: never swallow errors silently. Log and re-throw or handle explicitly.
- No console.log in production code. Use a logger (pino on backend, structured logging).

### React Native / Frontend
- Functional components only. No class components.
- Use hooks for all state and side effects.
- Component files: PascalCase (e.g., `ChatBubble.tsx`).
- One component per file. Co-locate styles if small, extract if > 20 lines.
- Props interfaces defined in the same file, above the component.
- Use `React.memo` only when profiling shows it helps. Do not premature-optimize.

### Backend
- Route handlers are thin. Business logic lives in services.
- All route inputs validated with Zod schemas.
- Database access only through Prisma. No raw SQL unless absolutely necessary.
- Agent system prompts are version-controlled strings in the agents/ directory. Not in the database.
- AI Gateway handles all LLM communication. No direct Anthropic SDK calls outside aiGateway.ts.

### Naming
- Files: camelCase for utilities, PascalCase for components.
- Variables/functions: camelCase.
- Types/interfaces: PascalCase, no `I` prefix (use `Student` not `IStudent`).
- Constants: UPPER_SNAKE_CASE for true constants, camelCase for config objects.
- Database tables: snake_case (Prisma handles mapping).
- API routes: kebab-case paths, camelCase body fields.

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.
- Branch naming: `feat/session-flow`, `fix/streak-reset-bug`.
- Small, focused commits. One logical change per commit.

## Agent Prompt Engineering

### System Prompt Structure

Every agent system prompt follows this structure:

```
[Agent Identity]
You are {name}, a {description}. You are talking to a {age}-year-old student named {studentName}.

[Behavioral Rules]
- Keep responses to 2-4 sentences.
- Use language appropriate for a {age}-year-old.
- Never be condescending. Celebrate effort.
- {Agent-specific behavioral rules}

[Current Context]
Topic: {topicTitle}
Key concepts to cover: {keyConcepts}
Student's mastery level: {masteryLevel}
Session goal: {sessionGoal}

[Conversation History Summary]
{Last 3-5 sessions summarized in 1-2 sentences each}

[Task]
{What this agent should do in this specific interaction}
```

### Context Assembly Rules

1. **Student context is always injected.** Never let the LLM guess the student's age or level.
2. **Topic context includes misconceptions.** The Teaching Buddy needs to know what to "misunderstand."
3. **History is summarized, not raw.** Do not send full conversation transcripts. Send summaries.
4. **Guardrails are in the system prompt AND validated post-response.** Defense in depth.
5. **Token budget: system prompt should not exceed 1500 tokens.** Keep context lean.

## Key Patterns

### Session State Machine

```
IDLE -> STARTING -> COACH_GREETING -> TOPIC_SELECTION -> TEACHING -> COACH_SUMMARY -> COMPLETED
                                                              |
                                                              v
                                                          ABANDONED (if app closed)
```

The session state lives on the server. The client polls or uses SSE for state updates.

### Teaching Quality Scoring

After the teaching exchange (4-8 messages), the LLM evaluates the kid's explanation:

```typescript
// Appended to the last LLM call in the teaching exchange
const scoringPrompt = `
Based on the student's explanation of ${topic.title}, evaluate:
1. Clarity (1-5): Could someone else understand this explanation?
2. Completeness (1-5): Were these key concepts addressed: ${topic.keyConcepts.join(', ')}?
3. Engagement (1-5): Did the student actively respond to follow-ups and corrections?

Respond in JSON: { "clarity": N, "completeness": N, "engagement": N, "summary": "one sentence" }
`;
```

### Error Handling Strategy

- **LLM failures**: Retry once with exponential backoff. If still fails, the Coach says "Hmm, I got a bit confused. Let's try that again!" and retries with a simplified prompt.
- **Network errors (client)**: Show offline banner. Queue messages locally. Sync when reconnected.
- **Session state conflicts**: Server state is authoritative. Client reconciles on reconnect.

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://...
ANTHROPIC_API_KEY=sk-ant-...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
NODE_ENV=development
PORT=3000
LOG_LEVEL=info
```

### Mobile (.env)

```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
```

## Testing Strategy

### Backend
- Unit tests for services (contextAssembler, progressService, guardrails).
- Integration tests for session flow (start -> message -> complete lifecycle).
- Mock the Anthropic SDK in tests. Do not make real LLM calls in CI.
- Seed data available for all tests.

### Mobile
- Component tests for Chat UI (renders correctly, sends messages).
- Store tests for Zustand (state transitions, selectors).
- E2E tests deferred to post-MVP.

## Performance Targets

- LLM response time: < 3 seconds perceived (use streaming).
- App launch to interactive: < 2 seconds.
- Session start to first agent message: < 1.5 seconds.
- Message send to agent response: < 3 seconds (streaming starts immediately).

## Security Notes

- All LLM responses pass through guardrails before reaching the client.
- Student data is never sent to analytics. Only anonymized engagement metrics.
- Parent authentication required for all account management.
- Student profiles are scoped to their parent's account. No cross-account access.
- API rate limiting: 60 requests/minute per student, 200/minute per parent.
- LLM cost guardrail: max 50 API calls per session (prevents runaway loops).
