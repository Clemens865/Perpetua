# PERPETUA - The Infinite Thought Engine

**Version:** 1.0.0
**Status:** 🚀 Active Development
**Started:** October 22, 2025
**Team:** Core Team

---

## 📖 Table of Contents

1. [Vision & Concept](#vision--concept)
2. [Core Philosophy](#core-philosophy)
3. [Current Status](#current-status)
4. [Quick Links](#quick-links)
5. [Project Structure](#project-structure)
6. [Getting Started](#getting-started)

---

## 🌟 Vision & Concept

### The One-Liner
**"Perpetua is Claude that never stops exploring your ideas."**

### What Is Perpetua?

Perpetua is a revolutionary AI-powered exploration engine that embodies Anthropic's "Keep X" campaign themes:
- **Keep Discovering** - Autonomous exploration of topics
- **Keep Chasing** - Finding deeper problems and questions
- **Keep Solving** - Generating solutions and prototypes
- **Keep Challenging** - Questioning assumptions and exploring alternatives
- **Keep Questioning** - Socratic dialogue and deeper inquiry
- **Keep Searching** - Continuous research and synthesis
- **Keep Imagining** - Creative ideation and "what if" scenarios
- **Keep Building** - Creating tangible artifacts and prototypes

### The Magic

Unlike traditional AI assistants where YOU do all the work and the AI just responds, **Perpetua runs autonomously**:

1. You give it a starting point (question, problem, curiosity, or just a word)
2. Perpetua enters an infinite exploration cycle
3. It continuously discovers, questions, solves, challenges, searches, imagines, and builds
4. You can steer, pause, or zoom into any insight
5. Come back to dozens of insights and real artifacts

**It's a perpetual motion machine for thought.**

---

## 🎯 Core Philosophy

### Design Principles

1. **Perpetual Motion** - The engine never truly stops; it builds momentum
2. **Infinite Depth** - You can zoom into any insight and start a new journey
3. **Autonomous Intelligence** - Runs on autopilot but always steerable
4. **Tangible Output** - Every journey produces real artifacts you can use
5. **Beautiful Simplicity** - Scandinavian design: minimal, functional, elegant

### User Experience Goals

- **Mesmerizing** - Watching Perpetua think should be captivating
- **Effortless** - Minimal input for maximum exploration
- **Trustworthy** - Always clear what Perpetua is doing and why
- **Productive** - Every journey yields usable results
- **Addictive** - Users want to start journey after journey

---

## 📊 Current Status

### Phase: **Core Experience** (Month 2 of 3)

**Current Milestone:** Page Generation & Journey Controls

**Progress:**
- [x] Concept defined and documented
- [x] Design system established (Scandinavian principles)
- [x] Project structure created
- [x] Roadmap and milestones defined
- [x] Development environment setup (Electron + React + TypeScript)
- [x] Claude SDK integration (Sonnet 4.5, Extended Thinking)
- [x] Basic UI shell (Journey creation, visualization)
- [x] Core exploration engine (8-stage cycle fully working)
- [x] Journey length controls (4/8/12/16 stages + manual mode)
- [x] Intelligent page generation (Claude-powered analysis)
- [x] Template system (Report with PDF, Presentation with HTML)
- [ ] Timeline & Mindmap templates
- [ ] Computer Use integration
- [ ] Auto-pilot mode

**Latest Completed (October 23, 2025):**
1. ✅ Journey length selection UI (Quick/Standard/Deep/Thorough/Manual)
2. ✅ ExplorationEngine respects maxStages and autoContinue settings
3. ✅ Report template with interactive navigation sidebar and PDF export
4. ✅ Presentation template with AI-generated slides and HTML download
5. ✅ ClaudePageAnalyzer service for intelligent content analysis
6. ✅ File-based page storage with version history

**Next Up:**
1. Complete presentation template generation with Claude
2. Implement Timeline template with D3.js
3. Implement Mindmap template with force-directed graph
4. Add page export options (standalone HTML, PDF)
5. Integrate Computer Use for web research stages

---

## 🔗 Quick Links

### Documentation
- [Roadmap](./ROADMAP.md) - Detailed 3-month build plan
- [Design System](./DESIGN-SYSTEM.md) - Scandinavian design principles and components
- [Architecture](./ARCHITECTURE.md) - Technical architecture and decisions
- [Milestones](./MILESTONES.md) - Progress tracking and achievements

### Development
- [Setup Guide](./docs/SETUP.md) - Development environment setup
- [Contributing](./docs/CONTRIBUTING.md) - How to contribute
- [API Documentation](./docs/API.md) - Claude SDK integration details

### Research
- [Anthropic Resources](./docs/ANTHROPIC.md) - Claude features and capabilities
- [Inspiration](./docs/INSPIRATION.md) - Design and UX inspiration
- [Competitive Analysis](./docs/COMPETITIVE.md) - Market research

---

## 📁 Project Structure

```
Perpetua/
├── docs/                    # Detailed documentation
│   ├── SETUP.md            # Development setup
│   ├── API.md              # API documentation
│   ├── ANTHROPIC.md        # Anthropic resources
│   └── CONTRIBUTING.md     # Contribution guidelines
│
├── design/                  # Design assets
│   ├── figma/              # Figma files
│   ├── assets/             # Icons, images, logos
│   └── mockups/            # UI mockups
│
├── src/                     # Source code
│   ├── main/               # Electron main process
│   ├── renderer/           # React frontend
│   ├── lib/                # Shared libraries
│   └── types/              # TypeScript types
│
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
│
├── scripts/                 # Build and utility scripts
├── .claude/                # Claude-Flow integration
├── PROJECT.md              # This file - main documentation
├── ROADMAP.md              # Build plan
├── DESIGN-SYSTEM.md        # Design guidelines
├── ARCHITECTURE.md         # Technical architecture
├── MILESTONES.md           # Progress tracking
└── package.json            # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Anthropic API key (Claude)
- Git
- Code editor (VS Code recommended)

### Quick Start

```bash
# Clone the repository
git clone [repository-url]
cd Odyssey

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Start development server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Development Workflow

1. Check [MILESTONES.md](./MILESTONES.md) for current sprint goals
2. Create feature branch: `git checkout -b feature/your-feature`
3. Follow [Design System](./DESIGN-SYSTEM.md) guidelines
4. Write tests for new features
5. Submit PR with clear description
6. Reference milestone and issue numbers

---

## 🎨 Design Philosophy

**Scandinavian Design Principles:**
- Minimalism - Only what's necessary
- Functionality - Form follows function
- Natural materials - Soft colors, organic shapes
- Light - Embrace whitespace and natural light
- Quality - Craftsmanship over quantity
- Sustainability - Timeless, not trendy

**UI/UX Approach:**
- Clean, uncluttered interfaces
- Soft, muted color palette
- Generous whitespace
- Smooth, purposeful animations
- Natural, intuitive interactions
- Typography-first design

---

## 🧠 Technical Philosophy

### Core Technologies

**Desktop Foundation:**
- Electron 28+ (desktop app framework)
- React 18 (UI components)
- TypeScript (type safety)
- Vite (build tool)

**Styling:**
- TailwindCSS (utility-first CSS)
- Framer Motion (animations)
- Radix UI (accessible components)

**State Management:**
- Zustand (global state)
- React Query (server state)
- Jotai (atomic state when needed)

**AI Integration:**
- Claude SDK (Extended Thinking, Computer Use, Artifacts)
- Prompt Caching (efficiency)
- MCP (extensibility)

**Data:**
- SQLite (local journey storage)
- IndexedDB (browser fallback)
- File system (artifact storage)

---

## 📈 Success Metrics

### North Star Metric
**Active Journeys Created Per Week**

This indicates:
- Users find value in starting explorations
- The experience is compelling enough to return
- The tool solves real problems

### Key Metrics

**Engagement:**
- Daily Active Users (DAU)
- Average journey duration
- Journeys completed vs abandoned
- Artifacts created per journey
- Return rate (D1, D7, D30)

**Quality:**
- User satisfaction (NPS)
- Journey completion rate
- Artifact usage rate
- Feature adoption

**Growth:**
- New signups per week
- Free to paid conversion
- Viral coefficient (shares/invites)
- Word-of-mouth mentions

---

## 🤝 Team & Collaboration

### Communication Channels
- GitHub Issues - Bug reports and feature requests
- GitHub Discussions - General discussion
- Discord - Real-time chat (when established)
- Weekly sync - Progress updates

### Decision Making
- **Architecture decisions** - Documented in ARCHITECTURE.md
- **Design decisions** - Documented in DESIGN-SYSTEM.md
- **Feature priorities** - Tracked in MILESTONES.md
- **Technical debt** - GitHub Issues with `tech-debt` label

---

## 📜 License

[To be determined]

---

## 🙏 Acknowledgments

### Inspiration
- **Anthropic** - For Claude and the "Keep X" campaign
- **Scandinavian Design** - For timeless design principles
- **The open source community** - For amazing tools and libraries

### Built With
- [Electron](https://electronjs.org) - Desktop framework
- [React](https://react.dev) - UI library
- [Claude](https://anthropic.com) - AI engine
- [TailwindCSS](https://tailwindcss.com) - Styling
- [Framer Motion](https://framer.com/motion) - Animations

---

## 📞 Contact

Project Maintainers: [Team info]
Issues: GitHub Issues
Discussions: GitHub Discussions

---

**Last Updated:** October 22, 2025
**Version:** 1.0.0
**Status:** 🚀 Active Development

---

**"Perpetua never stops. Neither should your curiosity."**
