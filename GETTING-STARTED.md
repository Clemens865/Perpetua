# 🚀 Getting Started with Perpetua

Welcome to **Perpetua** - The Infinite Thought Engine!

This guide will help you navigate the project and understand what we're building.

---

## 🎯 Quick Overview

**What is Perpetua?**
> An AI-powered exploration engine that embodies Anthropic's "Keep X" campaign themes. Give it any question or curiosity, and watch as it autonomously discovers, questions, solves, challenges, searches, imagines, and builds — endlessly.

**Current Status:** Foundation Phase (Week 1)
**Target Launch:** January 22, 2026

---

## 📚 Essential Reading (In Order)

### 1. Start Here
**[README.md](./README.md)** - 5 min read
- What Perpetua is and why it's special
- Core features and capabilities
- Quick technology overview

### 2. Understand the Vision
**[PROJECT.md](./PROJECT.md)** - 10 min read
- Complete project overview
- Philosophy and principles
- Success metrics and goals

### 3. See the Plan
**[ROADMAP.md](./ROADMAP.md)** - 15 min read
- Detailed 3-month build plan
- Week-by-week breakdown
- Feature priorities

### 4. Learn the Design
**[DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)** - 15 min read
- Scandinavian design principles
- Color palette and typography
- Component guidelines
- Animation standards

### 5. Understand the Tech
**[ARCHITECTURE.md](./ARCHITECTURE.md)** - 20 min read
- System architecture
- Technology stack
- Core components
- Data models

### 6. Track Progress
**[MILESTONES.md](./MILESTONES.md)** - 5 min read
- Current progress
- Weekly updates
- Achievements and learnings

---

## 🏗️ For Developers

### Setup

1. **Read** [docs/SETUP.md](./docs/SETUP.md) - Development environment setup
2. **Clone** the repository
3. **Install** dependencies: `pnpm install`
4. **Configure** environment: Copy `.env.example` to `.env` and add your API key
5. **Start** development: `pnpm dev`

### Key Commands

```bash
pnpm dev          # Start development
pnpm test         # Run tests
pnpm typecheck    # Check types
pnpm lint         # Lint code
pnpm format       # Format code
pnpm build        # Build for production
```

### File Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React app
│   ├── components/ # UI components
│   ├── lib/        # Core libraries (engine)
│   ├── services/   # Services (Claude, DB)
│   ├── store/      # State management
│   └── types/      # TypeScript types
└── shared/         # Shared code

docs/               # Documentation
design/             # Design assets
tests/              # Test suites
```

---

## 🎨 For Designers

### Design Resources

1. **Design System**: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
2. **Figma Files**: `design/figma/` (coming soon)
3. **Assets**: `design/assets/`
4. **Mockups**: `design/mockups/`

### Design Principles

- **Scandinavian** - Minimal, functional, beautiful
- **Timeless** - Design that lasts, not trendy
- **Light** - Generous whitespace
- **Quality** - Craftsmanship in every detail

### Color Palette

- **Primary**: Nordic Blue (#2E96FF)
- **Secondary**: Soft Green (#22C55E)
- **Accent**: Warm Amber (#F59E0B)
- **Neutrals**: Soft grays and off-whites

---

## 📋 Current Priorities

### This Week (Week 1)
- [x] Complete project documentation
- [ ] Initialize Electron + React + TypeScript project
- [ ] Set up development environment
- [ ] Configure TailwindCSS with design tokens
- [ ] Create basic app shell

### Next Week (Week 2)
- [ ] Integrate Claude SDK
- [ ] Implement Extended Thinking
- [ ] Build basic chat interface
- [ ] Test API connection

See [MILESTONES.md](./MILESTONES.md) for detailed weekly goals.

---

## 🤝 How to Contribute

### Right Now

Currently in early development. Best way to contribute:

1. **Provide Feedback** - Open issues with ideas or suggestions
2. **Join Discussions** - Engage in GitHub Discussions
3. **Follow Progress** - Watch the repo for updates

### After Launch

We'll open up contributions for:
- Bug fixes
- Feature requests
- Documentation improvements
- Design enhancements

---

## 💡 Key Concepts

### The 8-Stage Cycle

Every Perpetua journey follows this infinite cycle:

1. **🔍 DISCOVERING** - Research and explore
2. **🎯 CHASING** - Find deeper problems
3. **💡 SOLVING** - Generate solutions
4. **⚡ CHALLENGING** - Question assumptions
5. **❓ QUESTIONING** - Ask probing questions
6. **🔎 SEARCHING** - Deep web research
7. **💭 IMAGINING** - Creative possibilities
8. **🏗️ BUILDING** - Create artifacts

Then repeat, going deeper each time.

### Core Features

- **Auto-Pilot Mode** - Start and come back to results
- **Infinite Zoom** - Explore any insight deeply
- **Thought Forks** - Parallel exploration paths
- **Beautiful Artifacts** - Code, docs, visualizations

---

## 🎯 Success Metrics

### Development Goals

- **Week 4**: Basic exploration engine working
- **Week 8**: Full user experience with Computer Use
- **Week 12**: Beta tested and launch ready

### Post-Launch Goals

- **Week 1**: 500 signups, 100 active users
- **Month 1**: 1,000 users, 50 paying customers
- **Month 3**: 3,000 users, sustainable revenue

---

## 📞 Get Help

### Questions?

1. **Check docs** - Most questions answered here
2. **GitHub Issues** - Bug reports and features
3. **GitHub Discussions** - General discussion
4. **Discord** - Real-time chat (coming soon)

### Found a Bug?

1. Check existing issues
2. Create new issue with template
3. Include reproduction steps
4. Tag with appropriate labels

---

## 🌟 The Vision

### What We're Building

Perpetua isn't just another AI tool. It's a **perpetual motion machine for thought** - an exploration engine that never stops discovering, questioning, and creating.

### Why It Matters

Traditional AI assistants require constant prompting. You do all the work. Perpetua runs autonomously, exploring ideas deeply while you focus on other things. Come back to dozens of insights and real artifacts.

### What Success Looks Like

**Users say:**
> "I gave Perpetua a question before lunch. Came back to a complete research report, 5 solution prototypes, and new questions I never thought to ask."

**That's the magic we're building.** ✨

---

## 🚀 Next Steps

### New to the Project?

1. Read [README.md](./README.md) (5 min)
2. Read [PROJECT.md](./PROJECT.md) (10 min)
3. Skim [ROADMAP.md](./ROADMAP.md) (5 min)
4. Review current [MILESTONES.md](./MILESTONES.md) (5 min)

### Ready to Code?

1. Read [docs/SETUP.md](./docs/SETUP.md)
2. Set up development environment
3. Read [ARCHITECTURE.md](./ARCHITECTURE.md)
4. Pick a task from current milestone
5. Start coding!

### Want to Design?

1. Read [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md)
2. Review existing mockups in `design/mockups/`
3. Check Figma files (when available)
4. Create new mockups or refine existing ones

---

## 📖 Documentation Index

### Core Docs
- [README.md](./README.md) - Project overview
- [PROJECT.md](./PROJECT.md) - Complete documentation
- [ROADMAP.md](./ROADMAP.md) - Build plan
- [MILESTONES.md](./MILESTONES.md) - Progress tracking

### Technical Docs
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [docs/SETUP.md](./docs/SETUP.md) - Development setup
- [docs/API.md](./docs/API.md) - API documentation (coming soon)

### Design Docs
- [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) - Design principles

### Reference
- [.env.example](./.env.example) - Environment variables
- [package.json](./package.json) - Dependencies

---

## 🎉 Welcome!

We're building something special. Something that captures the essence of:
- **Keep Discovering**
- **Keep Solving**
- **Keep Questioning**
- **Keep Building**

Join us on this journey. Let's build the infinite thought engine together.

---

**"Perpetua never stops. Neither should your curiosity."** 🌀

---

**Questions? Open an issue or start a discussion!**

**Last Updated:** October 22, 2025
