# TeachByte - Product Specification

## Vision

TeachByte is a mobile learning app where kids (ages 6-12) learn by **teaching** AI characters. Instead of quizzing kids, the app flips the dynamic: a cast of curious AI agents ask questions, and the kid explains concepts to them. Research consistently shows that teaching is one of the most effective forms of learning. Each daily session is 10-15 minutes.

## Platform Targets

### MVP (Initial Release)
- **iOS**: iPhone and iPad. iPad gets responsive layouts (wider chat, side-by-side on parent dashboard) — not just a stretched phone UI.
- **Android**: Phones and tablets. Same responsive approach.

The app uses NativeWind responsive breakpoints (`sm`, `md`, `lg`) to adapt layouts. Chat screens max out at 672px width on tablets (centered). Parent dashboard uses a 2-column grid on tablets.

## Product Principles

1. **Teaching is learning.** The core mechanic is always: the kid explains, the AI listens and asks follow-ups.
2. **Curiosity-driven, not curriculum-driven.** Topics come from what interests the kid, not from a syllabus.
3. **Characters, not chatbots.** Each agent has a distinct personality that kids build a relationship with over time.
4. **10 minutes of magic.** Sessions are short, focused, and leave the kid wanting more.
5. **Parents see progress, not surveillance.** Parents get insight into what their kid learned, not transcripts.

---

## Target State Architecture

### Layer 1: Client Layer (React Native / Expo)

The mobile app running on iOS and Android.

**Components:**

- **Chat UI**: The primary interaction surface. Supports text input and (future) voice input. Displays agent messages with character-specific styling (avatar, name, color theme). Supports rich content: inline images, simple diagrams, multiple-choice buttons for younger kids.
- **Character UI**: Visual representation of the current agent. Animated avatar with emotional states (confused, excited, grateful, thinking). Transitions between agents are animated to feel like a handoff, not a page change.
- **Lesson View**: Micro-lesson display for when the Explorer agent presents a quick topic primer before the teaching session. Supports text, images, and simple interactive elements (tap to reveal, drag to sort).
- **Parent Dashboard**: Separate authenticated view for parents. Shows: topics learned, streak data, time spent, mastery progression, agent interaction history (summarized, not transcripts). Weekly email digest option.
- **Session Flow Controller**: Client-side state machine managing the daily session flow. Handles transitions between agents, progress animations, streak celebrations, and session completion.

### Layer 2: Orchestration Layer

The brain of the system. Runs server-side. Decides what happens in each session.

**Components:**

- **Coach Agent**: The orchestrator. Not a specialist -- its job is to greet the kid, assess today's session plan, route to the right specialist agent, manage transitions, and close out the session with a summary. It maintains the "big picture" of the kid's learning journey. The Coach reads from the student profile and learning history to make routing decisions. It does NOT teach content directly.
- **Session Manager**: Manages the state machine for a single session. Tracks which agents have been active, time elapsed, session goals, and whether the session should wrap up. Enforces the 10-15 minute target. Handles interruptions (kid closes app mid-session) gracefully with state persistence.
- **Progress Tracker**: Aggregates learning signals from specialist agents. Tracks: topics attempted, mastery level per topic, teaching quality scores (clarity, completeness, patience), streak data, engagement patterns. Feeds into the Coach's session planning and the parent dashboard.
- **Difficulty Calibrator**: Adapts the complexity of topics and questions based on the kid's age, demonstrated knowledge, and engagement signals. If a kid is breezing through, it pushes harder. If they are struggling, it simplifies. Operates across all specialist agents -- the calibration is shared, not per-agent.

### Layer 3: Specialist Agent Layer

The "faculty." Each agent has a distinct personality, expertise, and pedagogical approach. All agents receive assembled context from Layer 4 -- they do not fetch their own context.

**Agents:**

- **Teaching Buddy (MVP)**: The core teach-to-learn agent. Personality: curious, a bit goofy, genuinely confused. It asks the kid to explain a concept and responds with follow-up questions that reveal understanding gaps. Different buddy variants (future): a logical robot, a creative artist, an adventurous explorer. Each variant has a different "confusion profile" that forces different explanation styles.
- **Explorer (v2)**: The curiosity engine. Surfaces fascinating questions and "did you know" hooks. Generates micro-lesson content that feeds into teaching sessions. Tracks which topics the kid engages with to adapt future suggestions. Personality: wide-eyed, enthusiastic, loves connections between topics.
- **Challenger (v2)**: The problem-solver. Presents real-world math and logic scenarios. Personality: playful, slightly competitive, encouraging. Knows when to back off if frustration is detected. Adjusts difficulty in real time.
- **Storyteller (v3)**: The reading companion. Discusses books the kid is reading, asks Socratic questions about characters and themes, and generates short custom stories that embed recently learned concepts. Personality: warm, imaginative, loves asking "what do you think happens next?"

**Agent Behavioral Contract (all agents must follow):**

```yaml
behavioral_contract:
  language_level: "Adapted to student age. Simple sentences for 6-8, more complex for 9-12."
  response_length: "2-4 sentences max per turn. Kids lose attention on long responses."
  tone: "Warm, encouraging, never condescending. Celebrates effort, not just correctness."
  guardrails:
    - "Never discuss violence, adult content, or topics inappropriate for the age group."
    - "If the kid goes off-topic, gently redirect within 1-2 turns."
    - "Never contradict the kid harshly. Use 'Hmm, I thought it might be...' not 'That is wrong.'"
    - "If the kid seems frustrated, acknowledge it and simplify."
  teaching_signals:
    - "Track whether the kid's explanation was clear (could another person understand it?)."
    - "Track whether the explanation was complete (were key concepts covered?)."
    - "Track whether the kid corrected the agent's deliberate misunderstanding."
    - "Emit a structured learning_signal event after each teaching exchange."
```

### Layer 4: Context Assembly Layer

Assembles the right context for each agent interaction. This is the critical infrastructure layer. Each API call to the LLM needs a carefully constructed context window containing only what is relevant.

**Components:**

- **Student Profile Builder**: Assembles the current student's profile for injection into agent prompts. Includes: age, grade level, interests, learning style indicators, current mastery levels across topics, recent session history (last 3-5 sessions summarized), active streak data.
- **Topic Graph**: A knowledge graph of topics and their relationships. Used to: suggest related topics ("You taught about clouds -- lightning connects to that!"), track mastery across connected concepts, identify knowledge gaps, and generate the Explorer's topic suggestions. Topics have prerequisites, related concepts, and difficulty levels.
- **Guardrails Engine**: Applies safety and appropriateness filters to all AI interactions. Enforces: age-appropriate language, topic boundaries, response length limits, and content safety. Runs as a validation layer on both the assembled context (before LLM call) and the LLM response (before sending to client).
- **Prompt Template Manager**: Stores and versions the system prompts for each agent. Supports A/B testing of prompt variations. Templates are parameterized -- the context assembly layer fills in the student-specific and session-specific variables.

### Layer 5: Data and Persistence Layer

**Stores:**

- **User DB**: Student profiles, parent accounts, authentication data, account settings. Students are always linked to a parent account. No direct student sign-up.
- **Learning DB**: Session history, teaching quality scores, mastery progression, streak data, agent interaction summaries (not full transcripts -- summaries only for storage efficiency). Time-series data for progress tracking.
- **Content Store**: Topic definitions, micro-lesson content, topic graph relationships, difficulty metadata. Seeded with initial content, expandable over time. Structured as JSON documents for flexibility.
- **AI Gateway**: Abstraction layer over the LLM API. Handles: API key management, rate limiting, request queuing, response caching for common micro-lesson content, cost tracking per student, model version management. All LLM calls go through this gateway -- no direct API calls from agents.

### External Services

- **Claude API (Anthropic)**: Primary LLM provider. All agent interactions route through the AI Gateway.
- **Auth Provider**: Firebase Auth or similar. Supports parent email/password and social login. Students authenticate through their parent's account (child profiles under parent).
- **Analytics**: Mixpanel or similar. Tracks engagement, retention, session completion rates, feature usage. No PII in analytics.
- **Push Notifications**: For streak reminders and session prompts. Configurable by parents.

---

## MVP Scope

### What is in MVP

1. **Two agents: Coach + Teaching Buddy**
   - Coach handles session greeting, topic selection, and session summary.
   - Teaching Buddy runs the core teach-to-learn interaction.
   - No agent transitions within session (Coach -> Buddy -> Coach, that is it).

2. **Text-based interaction only**
   - No voice input/output in MVP.
   - Chat-style interface with agent avatar and name.

3. **Single domain: General Science**
   - 20-30 seed topics (photosynthesis, gravity, weather, animal adaptations, etc.).
   - Each topic has: a short description, 3-5 key concepts the kid should cover, and 2-3 common misconceptions the buddy can "have."
   - No topic graph connections yet (flat list, not a graph).

4. **Basic student profile**
   - Age/grade level (set by parent during onboarding).
   - Topics attempted and mastery level (simple: not started / in progress / mastered).
   - Session history (last 5 sessions).
   - Current streak count.

5. **Core teach-to-learn loop**
   - Coach presents 2-3 topic options.
   - Kid picks one.
   - Teaching Buddy says "I heard about [topic] and I don't get it. Can you explain?"
   - Kid explains over 4-8 message exchanges.
   - Buddy asks follow-up questions and expresses deliberate confusion.
   - Session ends with Coach summarizing what the kid taught.

6. **Streak tracking**
   - Daily streak counter.
   - Simple streak celebration UI (confetti, encouraging message).
   - Streak recovery: miss one day, streak pauses. Miss two, it resets.

7. **Minimal parent view**
   - List of topics the kid has worked on.
   - Current streak.
   - Time spent per session (last 7 days).
   - No weekly digest email in MVP.

8. **Basic guardrails**
   - Age-appropriate language enforcement in system prompts.
   - Off-topic detection and gentle redirection.
   - Response length enforcement.
   - Content safety filtering on LLM responses.

### What is NOT in MVP

- Voice input/output.
- Explorer, Challenger, Storyteller agents.
- Topic graph (relationships between topics).
- Multiple Teaching Buddy variants (robot, artist, etc.).
- Micro-lesson content (kid just teaches from their own knowledge).
- Difficulty calibration (static difficulty based on age).
- Parent weekly email digest.
- Push notifications.
- A/B testing infrastructure.
- Analytics integration.
- Multi-language support.

---

## Data Model

### Student

```typescript
interface Student {
  id: string;
  parentId: string;
  name: string;
  age: number;
  gradeLevel: number;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Parent

```typescript
interface Parent {
  id: string;
  email: string;
  name: string;
  studentIds: string[];
  settings: ParentSettings;
  createdAt: Date;
}

interface ParentSettings {
  notificationsEnabled: boolean;
  dailySessionReminder: boolean;
  reminderTime?: string; // HH:MM format
}
```

### Session

```typescript
interface Session {
  id: string;
  studentId: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'abandoned';
  topicId: string;
  agentInteractions: AgentInteraction[];
  teachingScore?: TeachingScore;
  durationSeconds: number;
}

interface AgentInteraction {
  agentType: 'coach' | 'teaching_buddy' | 'explorer' | 'challenger' | 'storyteller';
  messages: Message[];
  startedAt: Date;
  endedAt: Date;
}

interface Message {
  id: string;
  role: 'student' | 'agent';
  content: string;
  timestamp: Date;
}

interface TeachingScore {
  clarity: number;      // 1-5: Could someone else understand the explanation?
  completeness: number; // 1-5: Were key concepts covered?
  engagement: number;   // 1-5: Did the kid stay engaged and respond to follow-ups?
  overall: number;      // Weighted average
}
```

### Topic

```typescript
interface Topic {
  id: string;
  title: string;
  domain: 'science' | 'math' | 'reading' | 'general';
  description: string;
  keyConcepts: string[];           // What the kid should cover when teaching
  commonMisconceptions: string[];  // What the buddy can "misunderstand"
  difficultyLevel: 1 | 2 | 3;     // 1=easy, 3=hard
  ageRange: { min: number; max: number };
  relatedTopicIds?: string[];      // Future: topic graph
}
```

### StudentProgress

```typescript
interface StudentProgress {
  studentId: string;
  topicId: string;
  status: 'not_started' | 'in_progress' | 'mastered';
  sessionsCompleted: number;
  bestTeachingScore?: TeachingScore;
  lastAttemptedAt?: Date;
}

interface StreakData {
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: Date;
  streakStatus: 'active' | 'paused' | 'broken';
}
```

---

## API Design

### Session Endpoints

```
POST   /api/sessions/start          Start a new session for a student
POST   /api/sessions/:id/message    Send a message within a session
POST   /api/sessions/:id/complete   Complete the current session
GET    /api/sessions/:id            Get session details
GET    /api/sessions/history/:studentId  Get session history
```

### Student Endpoints

```
GET    /api/students/:id            Get student profile
PUT    /api/students/:id            Update student profile
GET    /api/students/:id/progress   Get learning progress
GET    /api/students/:id/streak     Get streak data
```

### Topic Endpoints

```
GET    /api/topics                  List available topics
GET    /api/topics/:id              Get topic details
GET    /api/topics/recommended/:studentId  Get recommended topics for a student
```

### Parent Endpoints

```
GET    /api/parent/dashboard/:studentId   Get parent dashboard data
PUT    /api/parent/settings               Update parent settings
```

### AI Gateway (Internal)

```
POST   /api/ai/chat                 Send assembled context + message to LLM
```

The AI Gateway endpoint is internal only (called by the orchestration layer, never by the client). It accepts:

```typescript
interface AIRequest {
  agentType: string;
  systemPrompt: string;       // Fully assembled with student context
  conversationHistory: Message[];
  studentContext: {
    age: number;
    gradeLevel: number;
    currentTopic: Topic;
    recentProgress: StudentProgress[];
  };
}
```

---

## Implementation Phases

### Phase 1: MVP (this build)
Coach + Teaching Buddy, text chat, 20-30 science topics, basic progress tracking, streaks, minimal parent view.

### Phase 2: Explorer + Content
Add Explorer agent, micro-lesson content, topic recommendations based on interest signals, topic graph (basic connections).

### Phase 3: Challenger + Difficulty
Add Challenger agent, real-world problem scenarios, difficulty calibration system, improved progress analytics.

### Phase 4: Storyteller + Voice
Add Storyteller agent, book companion mode, voice input/output, multiple Teaching Buddy variants.

### Phase 5: Growth
Push notifications, weekly parent digests, A/B testing, multi-language support, content expansion beyond science.
