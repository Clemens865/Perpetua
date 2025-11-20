# Page Generation Flow Architecture

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INITIATES                            │
│                    "Generate Page" Button                        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 1: CONTENT ANALYSIS                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  ClaudePageAnalyzer.analyzeJourney()                     │  │
│  │                                                            │  │
│  │  Input:                                                   │  │
│  │  - Journey (all 8 stages + artifacts)                    │  │
│  │  - Extended Thinking enabled (10K tokens)                │  │
│  │                                                            │  │
│  │  Claude Tasks:                                            │  │
│  │  1. Classify content type (research/process/temporal)    │  │
│  │  2. Extract key themes & concepts                        │  │
│  │  3. Map relationships & decision points                  │  │
│  │  4. Identify narrative arc                               │  │
│  │  5. Recommend optimal visualization                      │  │
│  │                                                            │  │
│  │  Output: JourneyAnalysis                                 │  │
│  │  {                                                         │  │
│  │    contentType, complexity, keyThemes,                   │  │
│  │    recommendations: {                                     │  │
│  │      primary: 'presentation',                            │  │
│  │      reasoning: "...",                                    │  │
│  │      confidence: 0.87                                     │  │
│  │    }                                                       │  │
│  │  }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Duration: ~5-10 seconds with Extended Thinking                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER REVIEWS & SELECTS                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  "I recommend PRESENTATION because this journey        │    │
│  │   has clear stages and decision points. (87% conf.)"   │    │
│  │                                                          │    │
│  │  [✓ Presentation]  [Timeline]  [Mindmap]               │    │
│  │  [Report]  [Wiki]                                       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
          ┌─────────▼──┐   ┌────▼────┐   ┌──▼────────┐
          │PRESENTATION│   │TIMELINE │   │  MINDMAP  │
          └─────────┬──┘   └────┬────┘   └──┬────────┘
                    │           │            │
                    └───────────┼────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│              PHASE 2: INTELLIGENT TEMPLATE GENERATION            │
│                                                                   │
│  Based on selected template, use specialized generator:         │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  A. PRESENTATION (Reveal.js)                             │  │
│  │                                                            │  │
│  │  PresentationGenerator.generate(journey, analysis)       │  │
│  │                                                            │  │
│  │  Claude Tasks:                                            │  │
│  │  1. Extract 10-15 key insights as slide topics          │  │
│  │  2. Generate 3-5 bullets per slide                       │  │
│  │  3. Create Mermaid diagrams for concepts                │  │
│  │  4. Add speaker notes from Extended Thinking            │  │
│  │  5. Design narrative flow across slides                  │  │
│  │                                                            │  │
│  │  Output: Reveal.js HTML                                  │  │
│  │  - Custom Scandinavian theme                             │  │
│  │  - Embedded diagrams & code                              │  │
│  │  - Keyboard navigation                                    │  │
│  │  - Export to PDF                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  B. TIMELINE (D3.js SVG)                                 │  │
│  │                                                            │  │
│  │  TimelineGenerator.generate(journey, analysis)           │  │
│  │                                                            │  │
│  │  Claude Tasks:                                            │  │
│  │  1. Extract temporal events from stages                  │  │
│  │  2. Identify milestones & decision points                │  │
│  │  3. Map relationships (cause → effect)                   │  │
│  │  4. Determine event importance (node size)               │  │
│  │  5. Generate timeline metadata                           │  │
│  │                                                            │  │
│  │  Output: Interactive D3 Timeline                         │  │
│  │  - Horizontal/vertical layouts                           │  │
│  │  - Zoom & pan                                             │  │
│  │  - Click nodes → details                                 │  │
│  │  - Export as PNG/SVG                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  C. MINDMAP (D3 Force Graph)                             │  │
│  │                                                            │  │
│  │  MindmapGenerator.generate(journey, analysis)            │  │
│  │                                                            │  │
│  │  Claude Tasks:                                            │  │
│  │  1. Extract all concepts from journey                    │  │
│  │  2. Identify hierarchies & relationships                 │  │
│  │  3. Calculate node importance (size)                     │  │
│  │  4. Determine connection strength (weight)               │  │
│  │  5. Group related concepts (clustering)                  │  │
│  │                                                            │  │
│  │  Output: Interactive Force Graph                         │  │
│  │  - Drag nodes to reorganize                              │  │
│  │  - Expand/collapse clusters                              │  │
│  │  - Search & highlight                                     │  │
│  │  - Export as PNG/SVG                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  Duration: ~10-20 seconds per template                           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   PHASE 3: RENDER & INTERACT                     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PageViewer Component                                    │  │
│  │                                                            │  │
│  │  Features:                                                │  │
│  │  ✓ Full interactivity (clicks, drags, zoom)             │  │
│  │  ✓ Search across all content                            │  │
│  │  ✓ Theme toggle (light/dark)                            │  │
│  │  ✓ Export (PDF, PNG, standalone HTML)                   │  │
│  │  ✓ Deep links to specific sections                       │  │
│  │  ✓ Copy insights/code snippets                          │  │
│  │                                                            │  │
│  │  Template-Specific:                                       │  │
│  │  - Presentation: Speaker notes, print view               │  │
│  │  - Timeline: Time filters, multi-track                   │  │
│  │  - Mindmap: Layout algorithms, physics controls         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 4: SAVE & SHARE                        │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Storage (via IPC)                                       │  │
│  │                                                            │  │
│  │  Database (SQLite):                                       │  │
│  │  - Page metadata (id, journey_id, type, title)          │  │
│  │  - Analysis results (cached for re-generation)           │  │
│  │  - User preferences (template choice, overrides)         │  │
│  │                                                            │  │
│  │  File System:                                             │  │
│  │  - Generated HTML content                                │  │
│  │  - Exported files (PDF, PNG)                             │  │
│  │  - Standalone packages (HTML + assets)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Export Options                                           │  │
│  │                                                            │  │
│  │  📄 PDF → Electron print to PDF                          │  │
│  │  🖼️  PNG → Canvas/SVG to image                           │  │
│  │  🌐 HTML → Standalone with embedded assets              │  │
│  │  🔗 Link → Shareable deep link                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Between Components

```
Journey (Database)
      │
      ├─→ ClaudePageAnalyzer
      │        │
      │        ├─→ Claude API (Extended Thinking)
      │        │
      │        └─→ JourneyAnalysis (cached)
      │
      ├─→ Template Generator (selected)
      │        │
      │        ├─→ PresentationGenerator
      │        │     └─→ Claude → Slide Structure → Reveal.js HTML
      │        │
      │        ├─→ TimelineGenerator
      │        │     └─→ Claude → Event Data → D3 Timeline JSON
      │        │
      │        └─→ MindmapGenerator
      │              └─→ Claude → Graph Data → D3 Force Graph JSON
      │
      └─→ Page (Database)
            │
            ├─→ metadata: { analysis, template, version }
            ├─→ content: HTML string
            └─→ file: saved HTML/PDF/PNG
```

## Component Interaction Sequence

```
┌──────┐         ┌─────────────┐         ┌──────────┐         ┌─────────┐
│ User │         │ PageDialog  │         │ Analyzer │         │ Claude  │
└───┬──┘         └──────┬──────┘         └────┬─────┘         └────┬────┘
    │                   │                     │                    │
    │ Click Generate    │                     │                    │
    ├──────────────────>│                     │                    │
    │                   │                     │                    │
    │                   │ analyzeJourney()    │                    │
    │                   ├────────────────────>│                    │
    │                   │                     │                    │
    │                   │                     │ execute() + ET     │
    │                   │                     ├───────────────────>│
    │                   │                     │                    │
    │                   │                     │  Streaming chunks  │
    │                   │    Progress bar     │<───────────────────┤
    │<──────────────────┼─────────────────────┤                    │
    │   "Analyzing..."  │                     │                    │
    │                   │                     │                    │
    │                   │  JourneyAnalysis    │                    │
    │                   │<────────────────────┤                    │
    │                   │                     │                    │
    │ Show recommend.   │                     │                    │
    │<──────────────────┤                     │                    │
    │ "Presentation     │                     │                    │
    │  (87% conf.)"     │                     │                    │
    │                   │                     │                    │
    │ Select template   │                     │                    │
    ├──────────────────>│                     │                    │
    │                   │                     │                    │
    │                   │ generateTemplate()  │                    │
    │                   ├─────────────────────┼───────────────────>│
    │                   │                     │  Generate slides   │
    │                   │                     │                    │
    │                   │    Progress bar     │  Streaming result  │
    │<──────────────────┼─────────────────────┼<───────────────────┤
    │  "Generating..."  │                     │                    │
    │                   │                     │                    │
    │                   │  HTML content       │                    │
    │                   │<────────────────────┤                    │
    │                   │                     │                    │
    │                   │ createPage()        │                    │
    │                   ├─────────────────────┼────>[IPC]─────>[DB]
    │                   │                     │                    │
    │ Render page       │                     │                    │
    │<──────────────────┤                     │                    │
    │ (interactive)     │                     │                    │
    │                   │                     │                    │
```

## File System Structure

```
src/renderer/
├── services/
│   ├── claude/
│   │   ├── ClaudeService.ts              [EXISTING]
│   │   ├── ClaudePageAnalyzer.ts         [NEW] Phase 1
│   │   └── prompts/
│   │       ├── journeyAnalysisPrompt.ts  [NEW]
│   │       ├── presentationPrompt.ts     [NEW]
│   │       ├── timelinePrompt.ts         [NEW]
│   │       └── mindmapPrompt.ts          [NEW]
│   │
│   ├── templates/
│   │   ├── PresentationGenerator.ts      [NEW] Week 2
│   │   ├── TimelineGenerator.ts          [NEW] Week 3
│   │   └── MindmapGenerator.ts           [NEW] Week 4
│   │
│   └── PageGeneratorService.ts           [REFACTOR]
│
├── components/
│   └── pages/
│       ├── PageGeneratorDialog.tsx       [EXISTING]
│       ├── PageViewer.tsx                [REFACTOR]
│       └── templates/
│           ├── PresentationView.tsx      [NEW]
│           ├── TimelineView.tsx          [NEW]
│           ├── MindmapView.tsx           [NEW]
│           └── shared/
│               ├── ExportControls.tsx    [NEW]
│               ├── SearchOverlay.tsx     [NEW]
│               └── NavigationControls.tsx [NEW]
│
└── lib/
    └── visualization/
        ├── revealjs/
        │   ├── theme-scandinavian.css    [NEW]
        │   └── reveal-config.ts          [NEW]
        ├── d3/
        │   ├── timeline.ts                [NEW]
        │   ├── force-graph.ts             [NEW]
        │   └── utils.ts                   [NEW]
        └── export/
            ├── pdf-export.ts              [NEW]
            ├── png-export.ts              [NEW]
            └── html-package.ts            [NEW]
```

## Key Decision Points

### 1. When to Use Claude

**YES - Claude analysis needed:**
- Content classification and theme extraction
- Visualization recommendation
- Slide/timeline/graph structure generation
- Narrative arc identification
- Relationship mapping

**NO - Use programmatic logic:**
- Template rendering (Reveal.js, D3)
- User interactions (clicks, drags)
- Export functionality
- File system operations
- Database queries

### 2. Caching Strategy

```
Cache Analysis Results:
- Key: journey.id + journey.updatedAt
- Value: JourneyAnalysis
- TTL: Until journey updates
- Storage: SQLite pages table

Benefits:
- Instant re-generation with same template
- Switch templates without re-analysis
- Offline support
```

### 3. Error Handling

```
Analysis Fails:
→ Fall back to basic template (Report)
→ Show error: "Couldn't analyze journey, using Report template"

Generation Fails:
→ Fall back to simpler template
→ Show error: "Generation failed, try Report or Wiki"

Claude API Down:
→ Use cached analysis if available
→ Otherwise, disable intelligent features
→ Basic templates still work
```

## Performance Benchmarks

**Target Performance:**
- Analysis: <10s (Extended Thinking)
- Generation: <20s per template
- Rendering: <1s for initial display
- Interactions: <16ms (60 FPS)
- Export: <5s for PDF/PNG

**Optimization Techniques:**
- Truncate long stage results (keep key sections)
- Use Haiku for structure, Sonnet for content
- Stream results progressively
- Lazy load heavy visualizations
- Cache rendered D3 graphics
- Virtual scrolling for long content
