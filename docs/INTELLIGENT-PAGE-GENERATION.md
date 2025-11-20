# Intelligent Page Generation with Claude Agent SDK

## Overview

Transform Perpetua's journey visualizations from static templates to intelligent, Claude-powered interactive pages that understand content and recommend optimal visualization formats.

## Current Architecture Analysis

### Journey Structure (8-Stage Exploration Cycle)

```
1. DISCOVERING  → Research and exploration (Sonnet)
2. CHASING      → Finding deeper problems (Haiku)
3. SOLVING      → Generating solutions (Sonnet)
4. CHALLENGING  → Questioning assumptions (Opus)
5. QUESTIONING  → Probing questions (Haiku)
6. SEARCHING    → Deep research (Sonnet)
7. IMAGINING    → Creative scenarios (Sonnet)
8. BUILDING     → Creating artifacts (Opus)
```

**Key Characteristics:**
- Rich context flow between stages (insights, questions, artifacts)
- Extended Thinking with 10K token budgets
- Real-time streaming with progressive updates
- Multiple Claude models optimized per stage
- Automatic artifact extraction from code blocks
- **Configurable journey length** (4/8/12/16 stages or manual mode)

### Current Page Generation Status ✅

**✅ Fully Implemented:**
- **ClaudePageAnalyzer**: Intelligent content analysis with template recommendations
- **Report**: Professional document with sidebar navigation and PDF export
- **Presentation**: AI-generated slides with HTML download (Claude-powered)
- **Storage Architecture**: Hybrid database + filesystem with version history
- **IPC Integration**: Secure file operations via PageFileService

**⏳ In Progress:**
- **UI Integration**: Wire analysis into PageGeneratorDialog
- **Enhanced Presentation**: Use ClaudePageAnalyzer insights for better slide generation

**🔜 Planned:**
- **Timeline**: D3.js chronological visualization
- **Mindmap**: Force-directed concept graph
- **Wiki**: Wikipedia-style article (enhancement)

**Key Features Working:**
- ✅ Claude analyzes journey content and structure
- ✅ Recommends optimal visualization format with confidence score
- ✅ Extracts key themes, concepts, and relationships
- ✅ Identifies narrative arc and decision points
- ✅ Caches analysis for performance
- ✅ Generates beautiful, interactive HTML pages
- ✅ PDF export for reports
- ✅ HTML download for presentations (preserves interactivity)

## Proposed Solution: Claude-Powered Intelligent Page Generation

### Three-Phase Architecture

#### Phase 1: Content Analysis & Recommendation

**ClaudePageAnalyzer Service**
- Analyzes journey content using Claude
- Identifies content patterns and structure
- Recommends optimal visualization format
- Extracts key themes and relationships

```typescript
interface JourneyAnalysis {
  // Content Classification
  contentType: 'research' | 'process' | 'comparison' | 'temporal' | 'conceptual';
  complexity: 'simple' | 'moderate' | 'complex';

  // Structural Analysis
  keyThemes: string[];                    // Main topics explored
  conceptMap: ConceptNode[];              // Relationships between ideas
  temporalFlow: boolean;                  // Has time-based progression?
  decisionPoints: DecisionNode[];         // Key choices/branches

  // Visualization Recommendations
  recommendations: {
    primary: TemplateType;                // Best-fit template
    secondary: TemplateType[];            // Alternative options
    reasoning: string;                    // Why this recommendation
    confidence: number;                   // 0-1 confidence score
  };

  // Enhanced Metadata
  narrativeArc: {
    beginning: string;                    // Journey start summary
    development: string[];                // Key progression points
    climax: string;                       // Major insights/breakthroughs
    resolution: string;                   // Conclusions/artifacts
  };
}
```

#### Phase 2: Intelligent Template Generation

**Each template uses Claude to:**
1. **Structure Extraction**: Claude identifies logical groupings
2. **Narrative Generation**: Creates coherent story flow
3. **Visualization Design**: Determines what to visualize and how
4. **Interactive Elements**: Adds click targets, tooltips, links

##### A. Presentation Template (Reveal.js)

**Claude Tasks:**
- Extract key points per stage (5-7 points max per slide)
- Generate slide structure with narrative arc
- Create visual hierarchy
- Design transitions between stages
- Add speaker notes from Extended Thinking

**Slide Structure:**
```
Slide 1: Title + Journey Overview
Slides 2-N: One slide per major concept
  - Title: Main insight/stage
  - Content: 3-5 bullet points
  - Visual: Mermaid diagram or code block
  - Notes: Extended thinking summary
Slide N+1: Key Findings
Slide N+2: Artifacts & Next Steps
```

**Technologies:**
- Reveal.js for slide engine
- Mermaid.js for diagrams
- Highlight.js for code
- Custom Scandinavian design theme

##### B. Timeline Template (D3.js / SVG)

**Claude Tasks:**
- Identify temporal elements across stages
- Map stages to timeline positions
- Extract key events and milestones
- Determine parallel tracks (if multiple themes)
- Generate timeline metadata

**Timeline Structure:**
```
Linear Timeline:
- Horizontal axis: Stage progression
- Vertical: Event importance/complexity
- Nodes: Key decisions, insights, artifacts
- Connections: Cause-effect relationships
- Annotations: Extended thinking highlights
```

**Interactive Features:**
- Click node → Show stage details in side panel
- Hover → Tooltip with summary
- Zoom/pan for long journeys
- Filter by theme/concept

**Technologies:**
- D3.js for visualization
- SVG for rendering
- Framer Motion for smooth interactions

##### C. Mindmap Template (D3 Force Graph)

**Claude Tasks:**
- Extract all concepts from journey
- Identify relationships and hierarchies
- Determine node importance (size)
- Group related concepts (clustering)
- Generate connection strengths

**Mindmap Structure:**
```
Central Node: Original journey question
Level 1: Stage types (8 nodes)
Level 2: Key concepts per stage
Level 3: Sub-concepts and details
Connections: Weighted by relationship strength
```

**Interactive Features:**
- Drag nodes to reorganize
- Click node → Expand/collapse children
- Click node → Show full stage content
- Search to highlight concepts
- Export as PNG/SVG

**Technologies:**
- D3.js force-directed graph
- Canvas for performance (many nodes)
- WebGL for advanced effects (optional)

#### Phase 3: Interactive Features & Export

**Universal Features (All Templates):**
- 🔍 **Search**: Full-text search across journey
- 🎨 **Theme Toggle**: Light/dark/system
- 📤 **Export**: PDF, PNG, HTML standalone
- 🔗 **Deep Links**: Share specific stages/slides
- 📋 **Copy**: Click to copy insights/code
- 🎯 **Navigation**: Keyboard shortcuts, TOC

**Template-Specific:**
- Presentation: Speaker mode, auto-advance, print view
- Timeline: Zoom controls, time filters, parallel tracks
- Mindmap: Graph layouts (force, tree, radial), physics controls

## Implementation Plan

### Week 1: Foundation & Analysis Service

**Day 1-2: ClaudePageAnalyzer**
```typescript
// src/renderer/services/claude/ClaudePageAnalyzer.ts
export class ClaudePageAnalyzer {
  async analyzeJourney(journey: Journey): Promise<JourneyAnalysis> {
    // Use Claude to analyze journey content
    // Extended Thinking to deeply understand structure
    // Return comprehensive analysis
  }
}
```

**Day 3-4: Enhanced PageGeneratorService**
```typescript
// Refactor to use Claude analysis
async generatePage(journey: Journey, options: GeneratePageOptions) {
  // Step 1: Analyze journey with Claude
  const analysis = await claudePageAnalyzer.analyze(journey);

  // Step 2: Use recommended template or user choice
  const template = options.templateType || analysis.recommendations.primary;

  // Step 3: Generate with Claude-powered template generator
  return this.generateIntelligentTemplate(journey, analysis, template);
}
```

**Day 5: Testing & Refinement**
- Test analysis quality on various journey types
- Refine prompts for better recommendations
- Add confidence thresholds

### Week 2: Presentation Template

**Day 1-2: Slide Generator**
```typescript
// src/renderer/services/templates/PresentationGenerator.ts
export class PresentationGenerator {
  async generate(journey: Journey, analysis: JourneyAnalysis): Promise<string> {
    // Use Claude to extract slide structure
    // Generate Reveal.js HTML
    // Embed Mermaid diagrams
    // Add speaker notes
  }
}
```

**Day 3-4: Reveal.js Integration**
- Custom Scandinavian theme
- Keyboard navigation
- Speaker notes from Extended Thinking
- Code syntax highlighting

**Day 5: Polish & Export**
- PDF export
- Standalone HTML
- Slide sharing

### Week 3: Timeline Template

**Day 1-2: Timeline Generator**
```typescript
// src/renderer/services/templates/TimelineGenerator.ts
export class TimelineGenerator {
  async generate(journey: Journey, analysis: JourneyAnalysis): Promise<string> {
    // Use Claude to extract temporal events
    // Generate D3 timeline structure
    // Create interactive SVG
  }
}
```

**Day 3-4: D3.js Timeline**
- Responsive timeline visualization
- Zoom/pan interactions
- Event detail panels
- Multi-track support (if multiple themes)

**Day 5: Enhancement**
- Timeline export as image
- Milestone markers
- Date range filtering

### Week 4: Mindmap Template

**Day 1-2: Mindmap Generator**
```typescript
// src/renderer/services/templates/MindmapGenerator.ts
export class MindmapGenerator {
  async generate(journey: Journey, analysis: JourneyAnalysis): Promise<string> {
    // Use Claude to build concept graph
    // Generate D3 force graph structure
    // Calculate node positions and connections
  }
}
```

**Day 3-4: D3.js Force Graph**
- Force-directed layout
- Drag & reorganize nodes
- Expand/collapse clusters
- Search & highlight

**Day 5: Advanced Features**
- Multiple layout algorithms
- Physics controls (gravity, charge, etc.)
- Export graph as SVG/PNG

## Technical Architecture

### Service Layer

```
src/renderer/services/
├── claude/
│   ├── ClaudeService.ts                    [Existing]
│   ├── ClaudePageAnalyzer.ts               [NEW] Analysis service
│   └── prompts/
│       ├── journeyAnalysisPrompt.ts        [NEW] Analysis prompt
│       ├── presentationPrompt.ts           [NEW] Slide generation
│       ├── timelinePrompt.ts               [NEW] Timeline extraction
│       └── mindmapPrompt.ts                [NEW] Concept mapping
├── templates/
│   ├── PresentationGenerator.ts            [NEW]
│   ├── TimelineGenerator.ts                [NEW]
│   └── MindmapGenerator.ts                 [NEW]
└── PageGeneratorService.ts                 [REFACTOR]
```

### Component Layer

```
src/renderer/components/pages/
├── PageGeneratorDialog.tsx                 [Existing]
├── PageViewer.tsx                          [Existing]
├── templates/
│   ├── PresentationView.tsx                [NEW] Reveal.js viewer
│   ├── TimelineView.tsx                    [NEW] D3 timeline viewer
│   ├── MindmapView.tsx                     [NEW] D3 graph viewer
│   └── shared/
│       ├── ExportControls.tsx              [NEW]
│       ├── SearchOverlay.tsx               [NEW]
│       └── ThemeToggle.tsx                 [NEW]
```

## Claude Prompting Strategy

### Analysis Prompt (Step 1)

```typescript
const JOURNEY_ANALYSIS_PROMPT = (journey: Journey) => `
You are analyzing an 8-stage exploration journey to recommend the best visualization format.

<journey>
Input Question: ${journey.input}
Total Stages: ${journey.stages.length}
Status: ${journey.status}

${journey.stages.map((stage, i) => `
STAGE ${i+1}: ${stage.type.toUpperCase()}
${stage.result.substring(0, 500)}...
${stage.thinking ? `[Extended Thinking: ${stage.thinking.substring(0, 200)}...]` : ''}
`).join('\n')}
</journey>

<task>
Analyze this journey deeply and provide:

1. **Content Classification**
   - What type of content is this? (research/process/comparison/temporal/conceptual)
   - Complexity level? (simple/moderate/complex)
   - Does it have temporal flow or is it concept-based?

2. **Structural Analysis**
   - Extract 5-7 key themes that emerged
   - Identify relationships between concepts
   - Map major decision points or breakthroughs
   - Determine narrative arc (beginning, development, climax, resolution)

3. **Visualization Recommendation**
   - Primary recommendation: report/wiki/presentation/timeline/mindmap
   - Why is this the best fit?
   - What are 2-3 alternative options?
   - Confidence level (0-1)

4. **Template-Specific Insights**
   For your recommended template, provide:
   - How should content be structured?
   - What are the key visual elements?
   - What interactive features would be most valuable?
</task>

Return structured JSON analysis.
`;
```

### Template Generation Prompts (Step 2)

Each template has a specialized prompt that uses the analysis:

```typescript
// Presentation
const PRESENTATION_PROMPT = (journey: Journey, analysis: JourneyAnalysis) => `
Generate a Reveal.js slide deck structure for this journey.

<analysis>
${JSON.stringify(analysis, null, 2)}
</analysis>

<requirements>
- 10-15 slides maximum
- Each slide: title + 3-5 bullet points + optional visual
- Logical flow following narrative arc
- Speaker notes from Extended Thinking
- Code blocks formatted with highlight.js
- Mermaid diagrams where helpful
</requirements>

Return slide structure as JSON array.
`;
```

## User Experience Flow

### Current Flow (Basic)
```
User → Select Template → Generate → View Static HTML
```

### New Flow (Intelligent)
```
User → Click "Generate Page"
  ↓
System → Claude analyzes journey (5-10s with Extended Thinking)
  ↓
UI → Shows analysis + recommendations
  │   "I recommend a PRESENTATION format because this journey
  │    explores a process with clear stages and decision points.
  │    Confidence: 0.87"
  │
  │   [Use Presentation ✓] [Timeline] [Mindmap] [Report] [Wiki]
  ↓
User → Confirms or selects different template
  ↓
System → Claude generates template-specific content (10-20s)
  ↓
UI → Renders interactive page in electron app
  │   - Full interactivity (clicks, zoom, search)
  │   - Export options (PDF, PNG, HTML)
  │   - Theme toggle
  ↓
User → Explores, exports, shares
```

## Performance Considerations

**Optimization Strategies:**

1. **Caching**
   - Cache analysis results per journey
   - Invalidate on journey updates
   - Store in SQLite database

2. **Progressive Enhancement**
   - Show basic template immediately
   - Enhance with Claude-generated content as it streams
   - Use loading skeletons

3. **Token Management**
   - Truncate long stages for analysis (keep first 1000 + last 500 chars)
   - Use cheaper models where possible (Haiku for structure, Sonnet for generation)
   - Batch operations when analyzing multiple stages

4. **Rendering Performance**
   - D3 canvas mode for 100+ nodes in mindmap
   - Virtual scrolling for long timelines
   - Lazy load code highlighting

## Success Metrics

**Quality Metrics:**
- Recommendation accuracy: >80% user acceptance
- Generation time: <30s for analysis + template
- User satisfaction: Can user find insights easily?

**Usage Metrics:**
- Template distribution: Track which templates are most used
- Export frequency: How often users export pages
- Interaction depth: Do users engage with interactive features?

## Next Steps

1. **Immediate**: Review & approve architecture
2. **This Week**: Implement ClaudePageAnalyzer
3. **Week 2-4**: Implement templates sequentially
4. **Ongoing**: Gather user feedback, refine prompts

## Questions to Address

1. **Storage**: Should generated pages be stored in database or file system?
   - Recommendation: Database for metadata + searchability, filesystem for HTML

2. **Versioning**: How to handle regenerating pages when journey updates?
   - Recommendation: Store version number, allow re-generation, keep old versions

3. **Sharing**: Should pages be shareable outside Electron app?
   - Recommendation: Yes, export as standalone HTML with embedded assets

4. **Customization**: Allow users to edit Claude-generated structure?
   - Recommendation: Phase 2 feature - visual editor for advanced users
