# PERPETUA - Development Roadmap

**Timeline:** 3 Months (12 Weeks)
**Start Date:** October 22, 2025
**Target Launch:** January 22, 2026

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Month 1: Foundation](#month-1-foundation-weeks-1-4)
3. [Month 2: Core Experience](#month-2-core-experience-weeks-5-8)
4. [Month 3: Polish & Launch](#month-3-polish--launch-weeks-9-12)
5. [Post-Launch](#post-launch-roadmap)

---

## 🎯 Overview

### Development Philosophy

**Build, Test, Iterate**
- Ship working features every week
- Test with real users early and often
- Quality over speed
- Focus on the core magic first

### Three Phases

```
MONTH 1: FOUNDATION
├─ Set up infrastructure
├─ Claude SDK integration
├─ Basic UI shell
└─ Proof of concept: Single cycle

MONTH 2: CORE EXPERIENCE
├─ Full 8-stage cycle
├─ Beautiful stream UI
├─ Artifact creation
└─ Journey controls

MONTH 3: POLISH & LAUNCH
├─ Auto-pilot mode
├─ Advanced features
├─ Beta testing
└─ Public launch
```

---

## 📅 MONTH 1: Foundation (Weeks 1-4)

**Goal:** Build the core engine and prove the concept works

### Week 1: Project Setup & Infrastructure

**Objectives:**
- [ ] Development environment configured
- [ ] Basic app shell running
- [ ] Claude SDK connected
- [ ] First test call successful

**Tasks:**

**Day 1-2: Project Initialization**
```bash
- Initialize Electron + Vite + React + TypeScript project
- Configure project structure
- Set up linting (ESLint) and formatting (Prettier)
- Configure TypeScript strict mode
- Set up Git repository and .gitignore
- Create package.json with all dependencies
```

**Day 3-4: Development Environment**
```bash
- Set up hot reload for development
- Configure Electron main + renderer processes
- Set up IPC communication between processes
- Create environment variable system
- Set up logging system (electron-log)
- Configure debugging in VS Code
```

**Day 5-7: Basic UI Shell**
```bash
- Create window management
- Build basic application layout
- Set up TailwindCSS with Scandinavian color palette
- Create first components (Window, Sidebar, Main)
- Add Framer Motion for animations
- Create basic routing/navigation
```

**Deliverable:** App launches with a clean, empty UI

---

### Week 2: Claude SDK Integration

**Objectives:**
- [ ] Claude SDK fully integrated
- [ ] Extended Thinking working
- [ ] Basic chat interface functional
- [ ] First exploration cycle complete

**Tasks:**

**Day 1-2: SDK Setup**
```typescript
- Install @anthropic-ai/sdk
- Create Claude service wrapper
- Implement API key management (encrypted storage)
- Set up prompt caching
- Create error handling system
- Test basic API calls
```

**Day 3-4: Extended Thinking Integration**
```typescript
- Implement Extended Thinking mode
- Create thinking progress indicator
- Handle streaming responses
- Store thinking logs
- Create thinking visualization
```

**Day 5-7: Basic Chat Interface**
```typescript
- Build chat UI component
- Implement message streaming
- Add user input handling
- Create message history
- Add copy/share functionality
- Style with Scandinavian design
```

**Deliverable:** You can ask Claude a question and see it think (Extended Thinking)

---

### Week 3: Core Exploration Engine

**Objectives:**
- [ ] 8-stage cycle architecture built
- [ ] First complete cycle working
- [ ] Basic stage visualization
- [ ] State management in place

**Tasks:**

**Day 1-3: Cycle Architecture**
```typescript
// Create the core engine

interface Stage {
  id: string;
  type: 'discovering' | 'chasing' | 'solving' |
        'challenging' | 'questioning' | 'searching' |
        'imagining' | 'building';
  status: 'pending' | 'running' | 'complete';
  prompt: string;
  result: any;
  artifacts: Artifact[];
}

class ExplorationEngine {
  - runCycle(input: string): Promise<Journey>
  - runStage(stage: Stage): Promise<StageResult>
  - transitionToNextStage(current: Stage): Stage
  - shouldContinue(): boolean
}
```

**Day 4-5: Stage Implementations**
```typescript
- Implement DISCOVERING stage (research)
- Implement CHASING stage (deeper questions)
- Implement SOLVING stage (solutions)
- Implement CHALLENGING stage (devil's advocate)
- Implement QUESTIONING stage (Socratic)
- Implement SEARCHING stage (web research)
- Implement IMAGINING stage (creative)
- Implement BUILDING stage (artifacts)
```

**Day 6-7: State Management**
```typescript
- Set up Zustand store
- Create journey state management
- Implement stage transitions
- Add journey history
- Create persistence layer
```

**Deliverable:** First complete 8-stage exploration cycle runs successfully

---

### Week 4: Data Layer & Stream UI

**Objectives:**
- [ ] SQLite database set up
- [ ] Journey persistence working
- [ ] Stream UI displaying stages
- [ ] Real-time updates

**Tasks:**

**Day 1-3: Database Setup**
```sql
-- SQLite schema

CREATE TABLE journeys (
  id TEXT PRIMARY KEY,
  input TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  settings JSON
);

CREATE TABLE stages (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  prompt TEXT,
  result JSON,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (journey_id) REFERENCES journeys(id)
);

CREATE TABLE artifacts (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSON,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (stage_id) REFERENCES stages(id)
);
```

**Day 4-7: Stream UI**
```typescript
- Create infinite scroll stream component
- Build stage card components
- Add real-time updates (live stages)
- Implement smooth animations (Framer Motion)
- Add loading states and skeletons
- Create beautiful Scandinavian styling
- Add auto-scroll to latest stage
```

**Deliverable:** You can see a journey running in a beautiful stream interface

**MONTH 1 MILESTONE:**
✅ Core engine works
✅ Basic UI is beautiful
✅ Can run complete exploration cycle
✅ Data persists locally

---

## 📅 MONTH 2: Core Experience (Weeks 5-8)

**Goal:** Build the full user experience and make it magical

### Week 5: Computer Use Integration

**Objectives:**
- [ ] Computer Use API integrated
- [ ] Autonomous web browsing working
- [ ] Research capabilities enhanced
- [ ] SEARCHING stage fully functional

**Tasks:**

**Day 1-3: Computer Use Setup**
```typescript
- Integrate Claude Computer Use API
- Set up browser automation (Puppeteer)
- Create web scraping utilities
- Implement rate limiting
- Add user consent flow
```

**Day 4-7: Research Enhancement**
```typescript
- Enhance SEARCHING stage with Computer Use
- Implement autonomous web navigation
- Create content extraction system
- Build citation tracking
- Add source verification
- Create research summaries
```

**Deliverable:** Perpetua can autonomously browse the web and gather research

---

### Week 6: Artifact System

**Objectives:**
- [ ] Artifact creation working
- [ ] Multiple artifact types supported
- [ ] Artifact viewer built
- [ ] Export functionality

**Tasks:**

**Day 1-2: Artifact Types**
```typescript
interface Artifact {
  id: string;
  type: 'document' | 'code' | 'visualization' |
        'mindmap' | 'prototype' | 'research-brief';
  title: string;
  content: any;
  metadata: {
    language?: string;
    framework?: string;
    dependencies?: string[];
  };
  createdAt: Date;
}

- Implement document artifacts (Markdown, rich text)
- Implement code artifacts (syntax highlighting)
- Implement visualization artifacts (charts, diagrams)
- Implement mind map artifacts
- Implement research brief artifacts
```

**Day 3-5: Artifact Viewer**
```typescript
- Create artifact panel/modal
- Build artifact renderers for each type
- Add syntax highlighting (Shiki)
- Create markdown renderer
- Add interactive visualizations
- Implement artifact editing
```

**Day 6-7: Export & Sharing**
```typescript
- Add export to file functionality
- Implement copy to clipboard
- Create shareable links (future)
- Add artifact versioning
- Build artifact gallery view
```

**Deliverable:** Artifacts are created, beautifully displayed, and exportable

---

### Week 7: Journey Controls & Interaction

**Objectives:**
- [ ] Control panel built
- [ ] Pause/resume working
- [ ] Journey steering implemented
- [ ] User can interact with running journey

**Tasks:**

**Day 1-3: Control Panel**
```typescript
- Create control panel UI (sidebar)
- Implement pause/resume functionality
- Add stop journey button
- Create journey speed controls
- Add manual stage trigger
- Build journey settings
```

**Day 4-5: Steering & Interaction**
```typescript
- Allow user to inject feedback at any stage
- Implement "go deeper on X" functionality
- Create constraint system
- Add question injection
- Build direction changing
```

**Day 6-7: Journey History**
```typescript
- Create journey list view
- Implement journey search
- Add journey tagging
- Create journey archiving
- Build journey restoration
```

**Deliverable:** Users can fully control and interact with running journeys

---

### Week 8: Visual Polish & Animations

**Objectives:**
- [ ] Beautiful Scandinavian design implemented
- [ ] Smooth animations everywhere
- [ ] Micro-interactions polished
- [ ] Delightful UX

**Tasks:**

**Day 1-2: Color System**
```typescript
// Scandinavian palette
const colors = {
  // Neutrals - soft grays and whites
  white: '#FAFAFA',
  gray: {
    50: '#F7F7F7',
    100: '#E1E1E1',
    200: '#CFCFCF',
    300: '#B1B1B1',
    400: '#9E9E9E',
    500: '#7E7E7E',
    600: '#626262',
    700: '#515151',
    800: '#3B3B3B',
    900: '#222222',
  },

  // Accent - soft blue (trust, calm)
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    300: '#93C5FD',
    500: '#3B82F6',
    700: '#1D4ED8',
  },

  // Nature - soft green (growth)
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
  },

  // Warm - soft amber (energy)
  amber: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
  },
}
```

**Day 3-4: Typography**
```typescript
// Clean, readable fonts
font-sans: 'Inter', system-ui, sans-serif
font-mono: 'JetBrains Mono', monospace

// Type scale
text-xs: 0.75rem
text-sm: 0.875rem
text-base: 1rem
text-lg: 1.125rem
text-xl: 1.25rem
text-2xl: 1.5rem
text-3xl: 1.875rem
text-4xl: 2.25rem
```

**Day 5-7: Animations & Micro-interactions**
```typescript
- Add smooth page transitions
- Implement stage card entrance animations
- Create loading state animations
- Add hover effects
- Build progress indicators
- Create success/error animations
- Add haptic feedback (future)
```

**Deliverable:** App looks and feels premium, Scandinavian, and delightful

**MONTH 2 MILESTONE:**
✅ Computer Use working
✅ Artifacts creating beautifully
✅ Full journey controls
✅ Stunning Scandinavian design

---

## 📅 MONTH 3: Polish & Launch (Weeks 9-12)

**Goal:** Add advanced features, polish everything, beta test, and launch

### Week 9: Auto-Pilot Mode

**Objectives:**
- [ ] Auto-pilot mode working
- [ ] Background processing
- [ ] Notification system
- [ ] Journey resumption

**Tasks:**

**Day 1-3: Auto-Pilot Engine**
```typescript
class AutoPilot {
  async run(journey: Journey, duration: number) {
    // Run for specified duration
    // Or until completion criteria met
    // Or until max stages reached

    while (shouldContinue(journey, duration)) {
      await runNextStage(journey);
      await wait(stageDelay);
    }

    notifyUser(journey);
  }

  shouldContinue(journey, duration) {
    return (
      elapsedTime < duration &&
      !journey.manualStop &&
      stages.length < maxStages
    );
  }
}
```

**Day 4-5: Background Processing**
```typescript
- Allow journeys to run while app is minimized
- Implement system tray notifications
- Add journey progress in tray
- Create "come back to X insights" notifications
```

**Day 6-7: Resumption & Recovery**
```typescript
- Save journey state constantly
- Implement crash recovery
- Add journey resumption after quit
- Create "pick up where you left off" feature
```

**Deliverable:** Users can start journey, minimize app, come back to results

---

### Week 10: Advanced Features

**Objectives:**
- [ ] Infinite zoom implemented
- [ ] Thought forks working
- [ ] Journey templates created
- [ ] Keyboard shortcuts

**Tasks:**

**Day 1-3: Infinite Zoom**
```typescript
- Click any insight to start new sub-journey
- Implement journey tree structure
- Create breadcrumb navigation
- Add zoom in/out animations
- Build journey hierarchy view
```

**Day 4-5: Thought Forks**
```typescript
- Allow forking at CHALLENGING stages
- Implement parallel journey execution
- Create fork visualization
- Add fork comparison view
- Build fork merging (future)
```

**Day 6-7: Templates & Shortcuts**
```typescript
// Journey templates
- "Deep Research" template
- "Problem Solving" template
- "Learning Path" template
- "Creative Exploration" template

// Keyboard shortcuts
Cmd+N: New journey
Cmd+P: Pause/resume
Cmd+K: Command palette
Cmd+F: Search journeys
Space: Pause/resume
↓/↑: Navigate stages
```

**Deliverable:** Power users can navigate and use Perpetua like pros

---

### Week 11: Beta Testing & Iteration

**Objectives:**
- [ ] Beta program launched
- [ ] 20+ beta testers onboarded
- [ ] Feedback collected
- [ ] Critical bugs fixed

**Tasks:**

**Day 1-2: Beta Preparation**
```typescript
- Create onboarding flow
- Write beta testing guide
- Set up feedback collection (forms, Discord)
- Create bug reporting template
- Build analytics (privacy-focused)
```

**Day 3-4: Beta Launch**
```typescript
- Recruit 20 beta testers
- Send invitations
- Onboard in cohorts of 5
- Host kickoff calls
- Create Discord community
```

**Day 5-7: Feedback & Iteration**
```typescript
- Daily check-ins with testers
- Collect feedback
- Prioritize bug fixes
- Implement quick wins
- Prepare for public launch
```

**Deliverable:** App is tested, bugs are fixed, users love it

---

### Week 12: Launch Preparation & Public Launch

**Objectives:**
- [ ] Landing page ready
- [ ] Marketing materials created
- [ ] Launch strategy executed
- [ ] Public launch successful

**Tasks:**

**Day 1-2: Landing Page**
```typescript
- Build landing page (with Perpetua!)
- Create demo video
- Write compelling copy
- Add waitlist/signup
- Set up analytics
```

**Day 3-4: Marketing Materials**
```typescript
- Product Hunt assets
- Twitter/X announcement thread
- Screenshots and GIFs
- Demo video
- Case studies from beta
```

**Day 5: Soft Launch**
```typescript
- Launch to existing audience
- Beta testers share
- Initial feedback
- Final bug fixes
```

**Day 6: Product Hunt Launch**
```typescript
- Post at 12:01am PST
- Engage with comments all day
- Share on social media
- Monitor feedback
- Goal: #1 Product of the Day
```

**Day 7: Hacker News & Broader Launch**
```typescript
- Post "Show HN: Perpetua"
- Share on Reddit (r/SideProject, r/InternetIsBeautiful)
- Reach out to tech journalists
- Celebrate! 🎉
```

**Deliverable:** Perpetua is live and gaining users!

**MONTH 3 MILESTONE:**
✅ Auto-pilot is magical
✅ Advanced features work
✅ Beta tested and polished
✅ Successfully launched

---

## 🚀 Post-Launch Roadmap

### Month 4: Growth & Iteration

**Focus:** User feedback, growth, stability

- Monitor usage and metrics
- Fix bugs and issues
- Implement most-requested features
- Optimize performance
- Improve onboarding based on data

### Month 5: Team & Collaboration

**Focus:** Multi-user features

- Shared journeys
- Collaborative steering
- Team workspaces
- Journey sharing and forking
- Public journey gallery

### Month 6: Platform & Ecosystem

**Focus:** Extensibility and integrations

- Plugin system
- Custom stage types
- Integration with other tools (Notion, etc.)
- API for developers
- Template marketplace

---

## 📊 Success Criteria

### Week-by-Week Goals

**Week 1:** App runs, looks clean
**Week 2:** Claude responds to questions
**Week 3:** First complete cycle runs
**Week 4:** Beautiful stream UI

**Week 5:** Autonomous web browsing works
**Week 6:** Artifacts are created and beautiful
**Week 7:** Full journey control
**Week 8:** Design is stunning

**Week 9:** Auto-pilot is mind-blowing
**Week 10:** Power features work
**Week 11:** Beta testers love it
**Week 12:** Successful launch

### Launch Goals

**Week 1 Post-Launch:**
- 5,000 website visits
- 500 signups
- 100 active users
- #1 on Product Hunt
- Front page of Hacker News

**Month 1 Post-Launch:**
- 1,000 active users
- 50 paying customers
- $1,000 MRR
- 500+ journeys created
- 5+ case studies/testimonials

---

## 🛠️ Development Practices

### Daily
- Commit code frequently
- Write tests for new features
- Update documentation
- Check progress against roadmap

### Weekly
- Review progress
- Adjust priorities if needed
- User testing (when applicable)
- Team sync (if team)

### Bi-Weekly
- Update milestones
- Review metrics
- Plan next sprint
- Demo progress

---

## 📝 Notes

### Flexibility
This roadmap is a guide, not a contract. We'll adjust based on:
- What we learn during development
- User feedback (beta and post-launch)
- Technical challenges
- Opportunities that emerge

### Prioritization
If we fall behind, we cut features, not quality:
1. Core 8-stage cycle (must have)
2. Beautiful UI (must have)
3. Auto-pilot mode (should have)
4. Advanced features (nice to have)

### Documentation
As we build, we document:
- Architecture decisions → ARCHITECTURE.md
- Design patterns → DESIGN-SYSTEM.md
- Progress → MILESTONES.md
- API changes → API.md

---

**Last Updated:** October 22, 2025
**Next Review:** Weekly

---

**"Ship fast, iterate faster, build something magical."** 🚀
