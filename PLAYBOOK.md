# PLAYBOOK.md - TeachByte MVP Implementation Playbook

Each prompt below is designed to be fed to Claude Code in sequence. Each one builds on the previous. Do not skip steps. After each prompt, verify the output works before moving to the next.

---

## Prompt 1: Project Scaffolding

```
Read SPEC.md and CLAUDE.md. Set up the monorepo structure for TeachByte:

1. Initialize the root as a monorepo using npm workspaces.
2. Create a docker-compose.yml at the root with PostgreSQL (user: teachbyte, password: teachbyte, db: teachbyte, port 5432). This is used for ALL local development from this point forward.
3. Create the Expo app in apps/mobile/ using `npx create-expo-app` with TypeScript template and Expo Router.
   - Set `supportsTablet: true` in app.config.ts.
   - Install and configure NativeWind with responsive breakpoint support (sm, md, lg).
4. Create the Fastify backend in server/ with TypeScript, Prisma, and Vitest.
   - Register @fastify/cors (allow localhost:* in dev).
   - Add a health check route: GET /api/health.
5. Create the shared package in packages/shared/ for types and Zod schemas.
6. Install all dependencies listed in CLAUDE.md for each workspace.
7. Configure TypeScript strict mode in all three workspaces.
8. Create .env.example files for both server/ and apps/mobile/ with all required env vars documented.
9. Add a root package.json with scripts: `dev` (starts both), `dev:server`, `dev:mobile`, `db:up` (docker-compose up -d), `db:down`.
10. Verify: `npm run db:up` starts PostgreSQL, `npm run dev` starts both the Expo dev server and the Fastify server.
```

## Prompt 2: Shared Types and Schemas

```
Read SPEC.md data model section. In packages/shared/, create:

1. TypeScript interfaces for: Student, Parent, Session, Message, AgentInteraction, TeachingScore, Topic, StudentProgress, StreakData.
2. Zod schemas that match each interface for runtime validation.
3. Export everything from a clean index.ts.
4. API request/response types for each endpoint in SPEC.md.
5. Enum types for: AgentType, SessionStatus, TopicDomain, MasteryStatus.
6. Verify: import the shared package from both apps/mobile and server/ without errors.
```

## Prompt 3: Database Schema and Seed Data

```
Read SPEC.md data model and CLAUDE.md database conventions. In server/:

Prerequisite: PostgreSQL must be running (`npm run db:up` from root).

1. Write the Prisma schema (schema.prisma) matching the data model. Use snake_case for table/column names with camelCase mapping.
2. Create the initial migration.
3. Write seed data in server/src/seed/topics.ts with 25 science topics. Each topic needs: title, description, 3-5 key concepts, 2-3 common misconceptions, difficulty level (1-3), and age range. Topics should span: biology (photosynthesis, animal adaptations, human body), physics (gravity, light, sound, magnets), earth science (weather, volcanoes, water cycle), space (planets, stars, moon phases), chemistry basics (states of matter, mixtures).
4. Write a seed script that inserts topics and a test parent + student account. The test accounts are:
   - Parent: email=test@teachbyte.dev, name="Test Parent", id=a known UUID.
   - Student: name="Alex", age=9, gradeLevel=4, linked to test parent.
5. Run the migration and seed. Verify data was inserted correctly.
```

## Prompt 4: AI Gateway and Agent Framework

```
Read SPEC.md agent behavioral contract and CLAUDE.md agent prompt engineering section. In server/src/:

1. Create aiGateway.ts: a service that wraps the Anthropic SDK (`@anthropic-ai/sdk`). It should:
   - Accept an AIRequest (system prompt, messages, student context).
   - Call Claude API using model `claude-sonnet-4-20250514` (non-streaming for MVP — wait for full response).
   - Return the complete response text.
   - Handle errors with retry logic (1 retry, exponential backoff).
   - Enforce a max token limit per response (500 tokens for agent responses).
   - Log all requests with request ID, agent type, and token usage.
   - Support a `MOCK_AI=true` env var that returns canned responses instead of calling Claude (for tests and when no API key is available).

2. Create the agent interface in agents/types.ts:
   - AgentConfig: name, type, systemPromptTemplate, maxTurns.
   - AgentResponse: message content, learning signals (optional), session action (continue/transition/end).

3. Create agents/coach.ts: The Coach agent.
   - System prompt template following CLAUDE.md structure.
   - Three modes: greeting (start of session), topic_selection (present 2-3 topics), summary (end of session).
   - The greeting references the student's name, streak, and last session topic.
   - Topic selection pulls from recommended topics (not yet taught or low mastery).
   - Summary congratulates the kid and previews tomorrow.

4. Create agents/teachingBuddy.ts: The Teaching Buddy agent.
   - System prompt template with the curious, slightly confused personality.
   - Includes the topic's key concepts and common misconceptions.
   - Instructed to ask follow-up questions that probe understanding.
   - Instructed to express deliberate misunderstanding (from the misconceptions list) that the kid must correct.

5. Write unit tests for prompt template generation with sample student contexts.
```

## Prompt 5: Context Assembly Service

```
Read SPEC.md context assembly layer and CLAUDE.md context assembly rules. In server/src/services/:

1. Create contextAssembler.ts that:
   - Takes a student ID, session ID, and agent type.
   - Queries the database for: student profile, current topic, recent progress (last 5 topics), current session messages, streak data.
   - Assembles the system prompt by filling in the agent's template with this context.
   - Summarizes conversation history (not raw messages -- generate a 1-2 sentence summary of prior sessions).
   - Returns the fully assembled AIRequest ready for the AI Gateway.
   - Enforces the 1500-token budget for system prompts (truncate history if needed).

2. Create guardrails.ts that:
   - Validates LLM responses before they reach the client.
   - Checks for: inappropriate content keywords, response length (reject if > 200 words), off-topic detection (basic keyword matching against current topic).
   - Returns { safe: boolean, filteredContent?: string, reason?: string }.

3. Write unit tests for context assembly with mocked database responses.
4. Write unit tests for guardrails with sample LLM outputs (safe and unsafe).
```

## Prompt 6: Session Lifecycle API

```
Read SPEC.md session state machine and API design. In server/src/:

1. Create services/sessionService.ts implementing the session state machine:
   - startSession(studentId): Creates session, triggers Coach greeting, returns session ID + first message.
   - sendMessage(sessionId, content): Routes message to the active agent, gets response, returns agent message.
   - completeSession(sessionId): Triggers Coach summary, calculates teaching score, updates progress and streak.
   - State transitions: IDLE -> STARTING -> COACH_GREETING -> TOPIC_SELECTION -> TEACHING -> COACH_SUMMARY -> COMPLETED.
   - Handle ABANDONED state (session open > 30 minutes with no activity).

2. Create auth middleware in middleware/auth.ts:
   - In development (NODE_ENV=development): accept `x-dev-user-id` header OR validate JWT signed with JWT_SECRET.
   - Add a POST /api/auth/dev-login route that accepts { parentId } and returns a signed JWT. Only available in development.
   - In production: validate Firebase ID token via Firebase Admin SDK.
   - Attach the authenticated parent ID to the request context.
   - Student endpoints should verify the student belongs to the authenticated parent.

3. Create route handlers in routes/sessions.ts:
   - POST /api/sessions/start - starts session, returns greeting.
   - POST /api/sessions/:id/message - sends message, returns agent response (regular JSON response, not streaming — client shows typing indicator while waiting).
   - POST /api/sessions/:id/complete - completes session.
   - GET /api/sessions/:id - gets session state and history.
   - GET /api/sessions/history/:studentId - paginated session history.

3. Create services/progressService.ts:
   - updateProgress(sessionId): After session completion, update StudentProgress and StreakData.
   - getRecommendedTopics(studentId): Return 3 topics (mix of new and review).
   - calculateTeachingScore(sessionId): Use the LLM to evaluate the teaching exchange.

4. Wire up routes in the Fastify server entry point.
5. Write integration tests for the full session lifecycle (start -> 6 messages -> complete).
```

## Prompt 7: Student and Topic APIs

```
Read SPEC.md student and topic endpoints. In server/src/:

1. Create routes/students.ts:
   - GET /api/students/:id - returns student profile.
   - PUT /api/students/:id - updates profile (name, age, grade).
   - GET /api/students/:id/progress - returns all topic progress.
   - GET /api/students/:id/streak - returns streak data.

2. Create routes/topics.ts:
   - GET /api/topics - list all topics (filterable by domain, difficulty, age range).
   - GET /api/topics/:id - get single topic.
   - GET /api/topics/recommended/:studentId - delegates to progressService.getRecommendedTopics.

3. Create routes/parent.ts:
   - GET /api/parent/dashboard/:studentId - returns: recent sessions (last 7), topic progress summary, streak data, total time this week.
   - PUT /api/parent/settings - update notification preferences.

4. Add Zod request validation to all routes using shared schemas.
5. Write tests for each endpoint.
```

## Prompt 8: Mobile App - Auth and Navigation

```
Read CLAUDE.md mobile conventions. In apps/mobile/:

1. Set up Expo Router file-based routing:
   - (auth)/ group: login.tsx, onboard.tsx (set child name, age, grade).
   - (app)/ group: home.tsx, session/ folder, parent/ folder.
   - _layout.tsx: root layout with auth guard (redirect to login if not authenticated).

2. Set up auth with dual-mode support (controlled by EXPO_PUBLIC_AUTH_MODE env var):
   - "dev" mode (default for local development): calls POST /api/auth/dev-login with the test parent ID from seed data to get a JWT. Shows a simple "Dev Login" button instead of email/password form. No Firebase dependency.
   - "firebase" mode (production): Parent email/password sign-up and login via Firebase Auth.
   - Store auth token in SecureStore regardless of mode.
   - Create authStore.ts (Zustand) with: user, token, isAuthenticated, login(), logout(), onboard().

3. Set up the API client:
   - Axios instance in services/api.ts.
   - Request interceptor: attach auth token from SecureStore as Bearer token.
   - Response interceptor: handle 401 (redirect to login).
   - Base URL from EXPO_PUBLIC_API_URL env var.

4. Build the login screen: in dev mode show "Dev Login" button; in firebase mode show email + password form with sign up link.
5. Build the onboarding screen: child name, age (picker), grade level. Creates student profile via API.
6. All screens must use NativeWind responsive classes. Content on tablet should be centered with max-width, not stretched edge-to-edge.
7. Verify: can log in (dev mode), complete onboarding, and land on home screen.
```

## Prompt 9: Mobile App - Home Screen and Topic Selection

```
In apps/mobile/:

1. Build the home screen (app/(app)/home.tsx):
   - Shows the student's name and current streak (with flame icon or similar).
   - "Start today's session" button (prominent, centered).
   - Recent topics list (last 5, showing mastery status).
   - If streak is active, show encouraging message. If broken, show "Let's get back on track!"

2. Create Zustand stores:
   - sessionStore.ts: currentSession, messages, sessionStatus, startSession(), sendMessage(), completeSession().
   - progressStore.ts: topics, progress, streak, fetchProgress(), fetchStreak().

3. Create service layer:
   - sessionService.ts: wraps API calls for session endpoints.
   - topicService.ts: wraps API calls for topic endpoints.

4. Build the topic selection component:
   - Shown after Coach greeting.
   - Displays 2-3 topic cards with title and short description.
   - Kid taps a topic to select it.

5. All layouts must be responsive: on tablets (md: breakpoint), center content with max-width and use available space for larger topic cards / more visible recent topics.
6. Verify: home screen loads, shows streak, "Start session" triggers Coach greeting, topic cards appear.
```

## Prompt 10: Mobile App - Chat Interface

```
In apps/mobile/:

1. Build the chat interface (app/(app)/session/chat.tsx):
   - Message list: scrollable, auto-scrolls to bottom on new message.
   - Agent messages: left-aligned, with agent avatar and name above.
   - Student messages: right-aligned, different background color.
   - Typing indicator: animated dots when waiting for agent response.
   - Text input bar: text field + send button, pinned to bottom above keyboard.

2. Build chat components in components/chat/:
   - ChatBubble.tsx: renders a single message (agent or student variant).
   - ChatInput.tsx: text input with send button. Disabled while agent is responding.
   - TypingIndicator.tsx: three animated dots.
   - AgentHeader.tsx: agent avatar + name + personality tagline.

3. Integrate with sessionStore:
   - sendMessage() calls the API and waits for the JSON response (no streaming for MVP).
   - Show TypingIndicator while waiting for the response.
   - On response, add the agent message to the message list and scroll to bottom.

4. Handle session state transitions in the UI:
   - COACH_GREETING: show Coach avatar and greeting message.
   - TOPIC_SELECTION: show topic cards inline in the chat.
   - TEACHING: show Teaching Buddy avatar, enable free text input.
   - COACH_SUMMARY: show Coach avatar and summary. Show "Session Complete" button.

5. Chat container must be max-width 672px centered on tablets. Input bar spans full width but content area is constrained.
6. Verify: full chat flow works end to end. Coach greets, kid picks topic, buddy engages, session completes.
```

## Prompt 11: Mobile App - Session Completion and Streaks

```
In apps/mobile/:

1. Build the session completion screen (app/(app)/session/complete.tsx):
   - Teaching score display (stars or a simple progress visualization).
   - "What you taught today" summary from the Coach.
   - Streak celebration: if streak increased, show confetti animation (react-native-confetti-cannon or similar).
   - "Come back tomorrow!" message with streak count.
   - Button to return to home screen.

2. Implement streak logic:
   - On session completion, update streak via API.
   - Show streak status on home screen.
   - Handle streak states: active (used today), at risk (last session was yesterday), broken (missed 2+ days).

3. Add animations:
   - Confetti on streak milestone (every 5 days).
   - Score reveal animation (numbers counting up).
   - Smooth transition from chat to completion screen.

4. Verify: complete a session, see score and streak update, return to home, streak reflected.
```

## Prompt 12: Mobile App - Parent Dashboard

```
In apps/mobile/:

1. Build the parent dashboard (app/(app)/parent/dashboard.tsx):
   - Switch: parent view toggle in settings or a tab.
   - Weekly summary: sessions completed this week, total time, topics covered.
   - Topic progress: list of all attempted topics with mastery status (color-coded).
   - Streak history: current streak, longest streak.
   - Session list: last 7 sessions with topic, score, and date.

2. Build parent settings screen:
   - Notification toggle.
   - Session reminder time picker.
   - Child profile editor (name, age, grade).

3. On tablets (md: breakpoint), parent dashboard uses a 2-column grid layout: weekly summary + streak on left, session list + topic progress on right.
4. Verify: parent can see dashboard with real data after the child completes sessions.
```

## Prompt 13: Polish and Edge Cases

```
Review SPEC.md and CLAUDE.md for any gaps. Then:

1. Handle edge cases:
   - App closed mid-session: session state persists on server. On reopen, resume or offer to start fresh.
   - No internet: show offline message. Disable session start.
   - LLM error mid-session: Coach says "Hmm, let me think..." Retry once. If still fails, gracefully end session with partial credit.
   - Empty message: prevent sending. Show subtle validation.
   - Very long message: truncate to 500 characters with warning.

2. Improve UX:
   - Add skeleton loading states for home screen and dashboard.
   - Add pull-to-refresh on home screen.
   - Add haptic feedback on message send and session complete.
   - Ensure keyboard handling is smooth (KeyboardAvoidingView).

3. Add basic error tracking:
   - Catch and log unhandled errors.
   - Show friendly error messages, never raw error text.

4. Run all tests. Fix any failures.
5. Test on both iOS simulator and Android emulator.
```

## Prompt 14: Deployment Setup

```
Set up deployment for both backend and mobile:

1. Backend:
   - Create a Dockerfile for the Fastify server.
   - Update docker-compose.yml (already has PostgreSQL from Prompt 1) to also run the server container.
   - Configure Railway or Render deployment (railway.toml or render.yaml).
   - Set up environment variables for production.
   - Run Prisma migrations on deploy.

2. Mobile:
   - Configure EAS Build (Expo Application Services) for iOS and Android.
   - Create eas.json with development, preview, and production profiles.
   - Set up OTA updates with expo-updates.
   - Create app.config.ts with environment-based configuration.

3. Verify: backend deploys and responds to health check. Mobile app builds for both platforms.
```

---

## Post-MVP Prompts (Phase 2 Starters)

These are starting points for the next phase. Flesh them out when you are ready.

### Prompt 15: Explorer Agent
```
Read SPEC.md Explorer agent definition. Add the Explorer agent to the system:
1. Create agents/explorer.ts with the curiosity-driven personality.
2. Add micro-lesson content to topics (short explainer text + key visuals descriptions).
3. Update the session flow: Coach -> Explorer (micro-lesson) -> Teaching Buddy -> Coach.
4. Update the session state machine with EXPLORING state.
5. Update the mobile chat UI to render micro-lesson content (text + images).
```

### Prompt 16: Topic Graph
```
Read SPEC.md topic graph description. Implement topic relationships:
1. Add a TopicRelationship table (topicId, relatedTopicId, relationshipType: prerequisite | related | builds_on).
2. Seed relationships between existing topics.
3. Update getRecommendedTopics to use graph traversal (suggest topics connected to recently mastered ones).
4. Update Explorer to reference connections: "You taught about clouds -- did you know lightning is connected?"
```

### Prompt 17: Challenger Agent
```
Read SPEC.md Challenger agent definition. Add the Challenger:
1. Create agents/challenger.ts with the playful, competitive personality.
2. Create a ChallengeScenario type: real-world setup, question, expected approach, difficulty.
3. Seed 15-20 challenge scenarios tied to existing topics.
4. Add CHALLENGE state to the session flow (optional, 2-3 times per week).
5. Update scoring to include challenge performance.
```
