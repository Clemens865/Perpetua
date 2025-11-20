# Journey Optimization Architecture

**Version**: 1.0.0
**Date**: October 30, 2025
**Status**: Architecture Design
**Related**: [JOURNEY-OPTIMIZATION-ANALYSIS.md](./JOURNEY-OPTIMIZATION-ANALYSIS.md)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Component Architecture](#component-architecture)
4. [Data Flow & Interactions](#data-flow--interactions)
5. [Integration Dependencies](#integration-dependencies)
6. [Migration Strategy](#migration-strategy)
7. [Implementation Phases](#implementation-phases)
8. [Quality Assurance](#quality-assurance)

---

## Executive Summary

This document defines the system architecture for integrating 12 major optimization improvements into the ExplorationEngine. The architecture is designed to be:

- **Backwards Compatible**: Existing journeys continue to work
- **Incrementally Deployable**: Features can be enabled progressively
- **Type-Safe**: Full TypeScript support with strict mode
- **Extensible**: Easy to add future optimizations
- **Performance-Conscious**: Minimal overhead for disabled features

**Expected Impact**: 40-60% improvement in journey output quality across all metrics.

**Key Architectural Principles**:
1. **Separation of Concerns**: Optimizations are modular and independent
2. **Progressive Enhancement**: Features layer on top of existing system
3. **Feature Flags**: All optimizations controlled by configuration
4. **Data Immutability**: Context updates are tracked and versioned
5. **Fail-Safe Design**: Errors in optimizations don't break core functionality

---

## System Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXPLORATION ENGINE                          │
│                          (Core Orchestrator)                        │
└────────────────────────┬────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │ Context │    │  Stage  │    │Quality  │
    │ Manager │    │Executor │    │ Manager │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────┬───────┴───────┬──────┘
                │               │
    ┌───────────▼──────┐   ┌───▼──────────────┐
    │  Enhanced        │   │  Optimization    │
    │  Context         │   │  Services        │
    │  Storage         │   │                  │
    └───────┬──────────┘   └───┬──────────────┘
            │                  │
    ┌───────▼──────────────────▼──────────────┐
    │                                          │
    │  OPTIMIZATION LAYER                      │
    │  (12 Modular Optimization Components)    │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │ Phase 1: Quick Wins              │   │
    │  │ • Structured Insights            │   │
    │  │ • Question Tracking              │   │
    │  │ • Mini-Synthesis                 │   │
    │  │ • Dynamic Budgets                │   │
    │  │ • Artifact Validation            │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │ Phase 2: Intelligence            │   │
    │  │ • Context Summarization          │   │
    │  │ • Quality Scoring                │   │
    │  │ • Adaptive Stages                │   │
    │  │ • Confidence Tracking            │   │
    │  └──────────────────────────────────┘   │
    │                                          │
    │  ┌──────────────────────────────────┐   │
    │  │ Phase 3: Advanced                │   │
    │  │ • Semantic Search                │   │
    │  │ • Multi-Agent Validation         │   │
    │  │ • Pattern Learning               │   │
    │  └──────────────────────────────────┘   │
    └──────────────┬───────────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │     Claude Service          │
    │  (LLM Integration)          │
    └─────────────────────────────┘
```

### Component Layers

1. **Core Layer** (Existing)
   - ExplorationEngine: Main orchestrator
   - Stage execution pipeline
   - Context management
   - IPC communication

2. **Optimization Layer** (New)
   - Modular optimization services
   - Feature flag management
   - Enhanced data structures
   - Quality control systems

3. **Storage Layer** (Enhanced)
   - Extended context storage
   - Rich metadata persistence
   - Version migration support

4. **Service Layer** (Existing + Enhanced)
   - Claude API integration
   - Streaming support
   - Error handling

---

## Component Architecture

### 1. Enhanced Context Manager

**Purpose**: Manage rich exploration context with optimizations

**Responsibilities**:
- Store and retrieve enhanced context
- Handle context versioning and migrations
- Manage context summarization
- Coordinate mini-syntheses

**Interface**:
```typescript
class EnhancedContextManager {
  // Core operations
  createContext(journeyId: string): EnhancedExplorationContext;
  getContext(journeyId: string): EnhancedExplorationContext | null;
  updateContext(journeyId: string, updates: Partial<EnhancedExplorationContext>): void;

  // Optimization features
  addInsight(journeyId: string, insight: RichInsight): void;
  addQuestion(journeyId: string, question: TrackedQuestion): void;
  addArtifact(journeyId: string, artifact: RichArtifact): void;

  // Context management
  summarizeContext(journeyId: string): ContextSummary;
  createMiniSynthesis(journeyId: string, stages: number[]): MiniSynthesis;

  // Query operations
  getUnansweredQuestions(journeyId: string): TrackedQuestion[];
  getHighConfidenceInsights(journeyId: string): RichInsight[];
  findContradictions(journeyId: string): Contradiction[];
}
```

**Dependencies**:
- `optimization-types.ts`: Type definitions
- `ClaudeService`: For summarization
- `IPCClient`: For persistence

---

### 2. Insight Extraction Service

**Purpose**: Extract structured insights using Claude

**Responsibilities**:
- Parse stage output for insights
- Use Claude for intelligent extraction
- Categorize and prioritize insights
- Create rich metadata
- Handle extraction failures gracefully

**Interface**:
```typescript
class InsightExtractionService {
  async extractInsights(
    content: string,
    stageType: StageType,
    stageNumber: number,
    method: 'claude' | 'pattern' | 'hybrid'
  ): Promise<RichInsight[]>;

  async categorizeInsight(insight: string): Promise<InsightCategory>;
  async assessImportance(insight: string): Promise<ImportanceLevel>;
  async extractEvidence(content: string, insight: string): Promise<string[]>;

  // Fallback for errors
  extractWithPatterns(content: string, stageType: StageType): string[];
}
```

**Flow**:
```
Stage Output
    │
    ▼
┌─────────────────┐
│ Extraction      │ → Use Claude with structured prompt
│ Service         │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Success? │
    └────┬────┘
         │
    ┌────▼─────┬──────────┐
    │          │          │
   Yes        No      Partial
    │          │          │
    │    ┌─────▼─────┐    │
    │    │  Pattern  │    │
    │    │  Fallback │    │
    │    └─────┬─────┘    │
    │          │          │
    └──────────┴──────────┘
               │
    ┌──────────▼─────────┐
    │  RichInsight[]     │
    └────────────────────┘
```

**Dependencies**:
- `ClaudeService`: For intelligent extraction
- `optimization-types.ts`: RichInsight types

---

### 3. Question Tracking Service

**Purpose**: Track questions and answers systematically

**Responsibilities**:
- Extract questions from QUESTIONING stage
- Track question status lifecycle
- Match answers to questions
- Prioritize unanswered questions
- Generate question summaries

**Interface**:
```typescript
class QuestionTrackingService {
  async extractQuestions(
    content: string,
    stageNumber: number
  ): Promise<TrackedQuestion[]>;

  async findAnswers(
    searchingContent: string,
    questions: TrackedQuestion[]
  ): Promise<Map<string, QuestionAnswer>>;

  async prioritizeQuestions(
    questions: TrackedQuestion[]
  ): Promise<TrackedQuestion[]>;

  getUnansweredQuestions(
    questions: TrackedQuestion[],
    priority?: ImportanceLevel
  ): TrackedQuestion[];

  updateQuestionStatus(
    questionId: string,
    status: QuestionStatus,
    answer?: string,
    confidence?: ConfidenceLevel
  ): void;
}

interface QuestionAnswer {
  answer: string;
  evidence: string[];
  confidence: ConfidenceLevel;
  answeredInStage: number;
}
```

**State Machine**:
```
┌─────────────┐
│ unanswered  │
└──────┬──────┘
       │
   ┌───▼───┐
   │partial│
   └───┬───┘
       │
  ┌────▼────┐     ┌─────────┐
  │answered │────▶│obsolete │
  └─────────┘     └─────────┘
```

---

### 4. Artifact Validation Service

**Purpose**: Validate and enrich artifacts

**Responsibilities**:
- Extract artifacts using Claude
- Validate code syntax
- Assess completeness
- Add rich metadata
- Cross-reference with insights

**Interface**:
```typescript
class ArtifactValidationService {
  async extractArtifacts(
    content: string,
    stageNumber: number,
    stageType: StageType
  ): Promise<RichArtifact[]>;

  async validateArtifact(artifact: RichArtifact): Promise<ArtifactValidation>;

  async validateCodeSyntax(
    code: string,
    language: string
  ): Promise<ValidationResult>;

  async assessCompleteness(artifact: RichArtifact): Promise<CompletenessLevel>;

  async linkToInsights(
    artifact: RichArtifact,
    insights: RichInsight[]
  ): Promise<string[]>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

---

### 5. Context Summarization Service

**Purpose**: Create hierarchical summaries of journey context

**Responsibilities**:
- Generate overall journey summary
- Create stage cluster summaries (every 3 stages)
- Summarize key insights
- Track emerging patterns
- Identify contradictions

**Interface**:
```typescript
class ContextSummarizationService {
  async summarizeJourney(context: EnhancedExplorationContext): Promise<ContextSummary>;

  async summarizeStageCluster(
    stages: Stage[],
    stageNumbers: number[]
  ): Promise<StageClusterSummary>;

  async summarizeInsights(insights: RichInsight[]): Promise<string>;

  async findContradictions(
    insights: RichInsight[]
  ): Promise<Contradiction[]>;

  async identifyPatterns(
    context: EnhancedExplorationContext
  ): Promise<string[]>;
}
```

**Summarization Strategy**:
```
Full Journey
    │
    ├─ Overall Summary (2-3 paragraphs)
    │
    ├─ Stage Clusters
    │   ├─ Cluster 1 (Stages 1-3): Summary
    │   ├─ Cluster 2 (Stages 4-6): Summary
    │   └─ Cluster 3 (Stages 7-9): Summary
    │
    ├─ Key Insights (Top 10)
    │   ├─ Insight 1 (Critical)
    │   ├─ Insight 2 (High)
    │   └─ ...
    │
    └─ Critical Questions (Top 5 unanswered)
        ├─ Question 1 (Critical)
        └─ ...

Context Window Budget:
- Overall: 500-800 tokens
- Clusters: 200-300 tokens each
- Insights: 300-500 tokens
- Questions: 200-300 tokens
Total: ~2000-3000 tokens (fits in any context)
```

---

### 6. Quality Scoring Service

**Purpose**: Assess and improve stage output quality

**Responsibilities**:
- Evaluate stage completeness, depth, etc.
- Generate quality reports
- Identify improvement areas
- Determine if revision needed
- Track quality trends

**Interface**:
```typescript
class QualityScoringService {
  async evaluateStage(
    stage: Stage,
    stageType: StageType
  ): Promise<QualityReport>;

  async scoreCompleteness(content: string, stageType: StageType): Promise<number>;
  async scoreDepth(content: string): Promise<number>;
  async scoreSpecificity(content: string): Promise<number>;
  async scoreActionability(content: string): Promise<number>;
  async scoreCoherence(content: string): Promise<number>;
  async scoreNovelty(content: string): Promise<number>;

  shouldRevise(report: QualityReport, threshold: number): boolean;
  generateImprovements(report: QualityReport): string[];
}
```

**Quality Criteria by Stage Type**:
```typescript
const QUALITY_CRITERIA: Record<StageType, QualityCriteria> = {
  discovering: {
    completeness: 'Must cover core concepts, history, and current state',
    depth: 'Detailed analysis with examples',
    specificity: 'Concrete facts with sources',
    actionability: 'Medium - informational',
    coherence: 'Well-structured report',
    novelty: 'New perspectives appreciated',
  },
  chasing: {
    completeness: 'Root causes identified, not just symptoms',
    depth: 'At least 5-why analysis',
    specificity: 'Specific problems, not generic',
    actionability: 'High - problems must be addressable',
    coherence: 'Clear cause-effect relationships',
    novelty: 'Non-obvious problems valued',
  },
  // ... other stages
};
```

---

### 7. Adaptive Stage Selection Service

**Purpose**: Customize stage sequences based on topic type

**Responsibilities**:
- Detect topic type from input
- Select optimal stage sequence
- Adjust thinking budgets
- Prioritize critical stages
- Handle dynamic re-sequencing

**Interface**:
```typescript
class AdaptiveStageService {
  async detectTopicType(input: string): Promise<TopicType>;

  getAdaptiveSequence(topicType: TopicType): AdaptiveSequence;

  getThinkingBudget(
    stageType: StageType,
    topicType: TopicType,
    complexity?: number
  ): number;

  shouldSkipStage(
    stageType: StageType,
    context: EnhancedExplorationContext
  ): boolean;

  suggestNextStage(
    context: EnhancedExplorationContext,
    topicType: TopicType
  ): StageType;
}
```

**Topic Detection**:
```
Input: "How can I optimize my React app performance?"
   │
   ▼
Claude Analysis
   │
   ├─ Keywords: optimize, performance, technical
   ├─ Context: Specific problem
   ├─ Goal: Implementation
   │
   ▼
TopicType: "technical"
   │
   ▼
Sequence: [discovering, searching, solving, building,
           challenging, building, solving, building]
   │
   └─ More building/solving, less imagining
```

**Adaptive Sequences**:
```typescript
const SEQUENCES: Record<TopicType, StageType[]> = {
  research: [
    'discovering', 'searching', 'questioning', 'searching', // Extra search
    'chasing', 'solving', 'challenging', 'building'
  ],
  'problem-solving': [
    'discovering', 'chasing', 'chasing', 'solving', // Extra chasing
    'challenging', 'solving', 'building', 'building' // Extra solving
  ],
  creative: [
    'discovering', 'questioning', 'imagining', 'imagining', // Extra imagine
    'challenging', 'building', 'solving', 'building'
  ],
  technical: [
    'discovering', 'searching', 'solving', 'building', // Practical focus
    'challenging', 'building', 'solving', 'building'
  ],
  strategic: [
    'discovering', 'chasing', 'imagining', 'solving',
    'challenging', 'questioning', 'searching', 'building'
  ],
};
```

---

### 8. Mini-Synthesis Service

**Purpose**: Create intermediate syntheses every N stages

**Responsibilities**:
- Detect synthesis triggers (every 3 stages)
- Synthesize last N stages
- Identify connections and patterns
- Flag contradictions
- Guide future stages

**Interface**:
```typescript
class MiniSynthesisService {
  shouldCreateSynthesis(
    stagesCompleted: number,
    interval: number
  ): boolean;

  async createSynthesis(
    stages: Stage[],
    stageNumbers: number[],
    insights: RichInsight[]
  ): Promise<MiniSynthesis>;

  async findConnections(stages: Stage[]): Promise<string>;
  async identifyPatterns(stages: Stage[]): Promise<string>;
  async detectContradictions(insights: RichInsight[]): Promise<string>;
  async suggestFocus(synthesis: MiniSynthesis): Promise<string>;
}
```

**Synthesis Flow**:
```
Stage 3 Complete
    │
    ▼
Check: stagesCompleted % 3 === 0?
    │
   Yes
    │
    ▼
Gather: Stages 1, 2, 3
    │
    ▼
Claude Synthesis Prompt
    │
    ├─ Key Connections
    ├─ Emerging Patterns
    ├─ Contradictions
    └─ Forward Look
    │
    ▼
MiniSynthesis Object
    │
    └─ Add to context as special insight
```

---

### 9. Confidence Tracking Service

**Purpose**: Track confidence levels and trigger revisits

**Responsibilities**:
- Assess confidence for insights
- Track assumptions
- Identify low-confidence areas
- Trigger selective revision
- Update confidence over time

**Interface**:
```typescript
class ConfidenceTrackingService {
  async assessConfidence(
    insight: RichInsight,
    evidence: string[]
  ): Promise<ConfidenceLevel>;

  async extractAssumptions(insight: string): Promise<string[]>;

  getLowConfidenceInsights(
    insights: RichInsight[],
    threshold: ConfidenceLevel
  ): RichInsight[];

  async revisitInsights(
    insights: RichInsight[],
    researchContent: string
  ): Promise<Map<string, ConfidenceUpdate>>;

  updateConfidence(
    insightId: string,
    newConfidence: ConfidenceLevel,
    evidence: string[]
  ): void;
}

interface ConfidenceUpdate {
  oldConfidence: ConfidenceLevel;
  newConfidence: ConfidenceLevel;
  additionalEvidence: string[];
  clarifications: string[];
}
```

**Confidence Levels**:
```
verified     ━━━━━━━━━━ 100%  Multiple sources confirm
high         ━━━━━━━━░░  80%  Strong evidence
medium       ━━━━━░░░░░  50%  Some evidence
low          ━━░░░░░░░░  20%  Limited evidence
speculative  ░░░░░░░░░░   5%  Hypothesis only
```

---

### 10. Prompt Adaptation Service

**Purpose**: Dynamically adjust prompts based on journey state

**Responsibilities**:
- Inject context summaries into prompts
- Adapt based on insights gathered
- Reference unanswered questions
- Include quality feedback
- Maintain prompt templates

**Interface**:
```typescript
class PromptAdaptationService {
  async buildAdaptivePrompt(
    basePrompt: string,
    stageType: StageType,
    context: EnhancedExplorationContext,
    options: AdaptivePromptOptions
  ): Promise<string>;

  injectContextSummary(prompt: string, summary: ContextSummary): string;
  injectUnansweredQuestions(prompt: string, questions: TrackedQuestion[]): string;
  injectQualityFeedback(prompt: string, report: QualityReport): string;
  injectPatterns(prompt: string, patterns: string[]): string;

  estimateTokens(prompt: string): number;
  truncateContext(prompt: string, maxTokens: number): string;
}

interface AdaptivePromptOptions {
  includeContextSummary: boolean;
  includeRecentStages: number;      // Last N stages
  includeQuestions: boolean;
  includePatterns: boolean;
  maxContextTokens: number;
}
```

**Prompt Injection Pattern**:
```typescript
// Base prompt template
const basePrompt = STAGE_PROMPTS[stageType];

// Add layers
let adaptedPrompt = basePrompt;

if (options.includeContextSummary) {
  adaptedPrompt = injectSection(adaptedPrompt, 'journey_context',
    formatContextSummary(context.contextSummary));
}

if (options.includeQuestions) {
  const unanswered = getUnansweredQuestions(context.questions);
  adaptedPrompt = injectSection(adaptedPrompt, 'unanswered_questions',
    formatQuestions(unanswered));
}

// Ensure fits in context window
if (estimateTokens(adaptedPrompt) > options.maxContextTokens) {
  adaptedPrompt = truncateContext(adaptedPrompt, options.maxContextTokens);
}

return adaptedPrompt;
```

---

## Data Flow & Interactions

### Primary Data Flow

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ExplorationEngine │
│  .start(input)   │
└──────┬───────────┘
       │
       ├─────────────────────────────────────────────┐
       │                                             │
       ▼                                             ▼
┌──────────────────┐                     ┌──────────────────┐
│ Context Manager  │                     │  Adaptive Stage  │
│                  │                     │    Service       │
│ • Create context │                     │                  │
│ • Initialize     │◀────────────────────│• Detect topic    │
└──────┬───────────┘                     │• Select sequence │
       │                                 └──────────────────┘
       │
       ▼
┌──────────────────┐
│  Stage Executor  │
│                  │
│ • Build prompt   │◀───────┐
│ • Call Claude    │        │
│ • Stream output  │        │
└──────┬───────────┘        │
       │                    │
       ├────────────────────┴─────────────────────┐
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Insight     │  │  Question    │  │  Artifact        │
│  Extraction  │  │  Tracking    │  │  Validation      │
│              │  │              │  │                  │
│• Extract     │  │• Extract     │  │• Extract         │
│• Enrich      │  │• Track       │  │• Validate        │
│• Store       │  │• Prioritize  │  │• Enrich          │
└──────┬───────┘  └──────┬───────┘  └──────┬───────────┘
       │                  │                  │
       └──────────────────┴──────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │  Quality     │
                  │  Scoring     │
                  │              │
                  │• Evaluate    │
                  │• Report      │
                  │• Improve     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ Context      │
                  │ Manager      │
                  │              │
                  │• Update      │
                  │• Persist     │
                  └──────┬───────┘
                         │
                         ▼
              Check: Synthesis needed?
                         │
                    ┌────┴────┐
                   Yes       No
                    │          │
                    ▼          │
         ┌──────────────┐     │
         │Mini-Synthesis│     │
         │   Service    │     │
         └──────┬───────┘     │
                │             │
                └─────────────┘
                         │
                         ▼
              Check: Journey complete?
                         │
                    ┌────┴────┐
                   Yes       No
                    │          │
                    ▼          │
         ┌──────────────┐     │
         │   Final      │     │
         │   Summary    │     │
         └──────────────┘     │
                              │
                              └─── Next Stage
```

### Component Interaction Matrix

| From ↓ To →          | Context | Insight | Question | Artifact | Quality | Summary | Adaptive |
|---------------------|---------|---------|----------|----------|---------|---------|----------|
| **ExplorationEngine** | R/W     | W       | W        | W        | R       | R       | R        |
| **Context Manager**   | R/W     | R/W     | R/W      | R/W      | W       | W       | -        |
| **Insight Service**   | R       | W       | -        | -        | -       | -       | -        |
| **Question Service**  | R       | R       | W        | -        | -       | -       | -        |
| **Artifact Service**  | R       | R       | -        | W        | -       | -       | -        |
| **Quality Service**   | R       | R       | R        | R        | W       | -       | -        |
| **Summary Service**   | R       | R       | R        | -        | -       | W       | -        |
| **Adaptive Service**  | R       | R       | R        | -        | R       | -       | W        |

Legend: R = Read, W = Write, - = No direct interaction

---

## Integration Dependencies

### Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                      OPTIMIZATION TYPES                      │
│                (optimization-types.ts)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼──────┐            ┌───────▼──────┐
│ Context      │            │ Extraction   │
│ Manager      │            │ Services     │
└───────┬──────┘            └───────┬──────┘
        │                           │
        └─────────────┬─────────────┘
                      │
              ┌───────▼───────┐
              │ Quality &     │
              │ Adaptive      │
              │ Services      │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │ Exploration   │
              │ Engine        │
              └───────────────┘
```

### External Dependencies

```typescript
// Existing dependencies (unchanged)
import { claudeService } from '@/services/claude/ClaudeService';
import { ipcClient } from '@/services/ipc/IPCClient';
import { useAppStore } from '@/store/useAppStore';

// New dependencies (Phase 3 only)
import { embeddingService } from '@/services/embedding/EmbeddingService';  // For semantic search
import { vectorDB } from '@/services/vectordb/VectorDB';                   // For semantic search
```

### Feature Flag Dependencies

```
Phase 1 Quick Wins (Independent):
├─ enableStructuredInsights       ✓ Standalone
├─ enableQuestionTracking         ✓ Standalone
├─ enableMiniSynthesis            → Requires: enableStructuredInsights
├─ enableDynamicBudgets           ✓ Standalone
└─ enableArtifactValidation       ✓ Standalone

Phase 2 Intelligence (Depends on Phase 1):
├─ enableContextSummary           → Requires: enableStructuredInsights
├─ enableQualityScoring           → Requires: enableStructuredInsights
├─ enableAdaptiveStages           → Requires: enableStructuredInsights, enableQualityScoring
└─ enableConfidenceTracking       → Requires: enableStructuredInsights

Phase 3 Advanced (Depends on Phase 1 & 2):
├─ enableSemanticSearch           → Requires: All Phase 1, embeddings infrastructure
├─ enableMultiAgentValidation     → Requires: enableQualityScoring
└─ enablePatternLearning          → Requires: All Phase 1 & 2, analytics DB
```

---

## Migration Strategy

### Backwards Compatibility Strategy

**Principle**: Existing journeys must continue working without modifications.

#### 1. Data Structure Versioning

```typescript
// Old context (v1)
interface ExplorationContext {
  journeyId: string;
  currentStage: number;
  previousStages: Stage[];
  insights: string[];          // Simple strings
  questions: string[];         // Simple strings
  artifacts: string[];         // Simple strings
  chasedTopics: string[];
}

// New context (v2)
interface EnhancedExplorationContext {
  journeyId: string;
  currentStage: number;
  previousStages: string[];    // Stage IDs only
  insights: RichInsight[];     // Rich objects
  questions: TrackedQuestion[]; // Rich objects
  artifacts: RichArtifact[];   // Rich objects
  chasedTopics: string[];

  // New fields (optional for backwards compat)
  contextSummary: ContextSummary | null;
  miniSyntheses: MiniSynthesis[];
  qualityReports: QualityReport[];
  topicType?: TopicType;
  adaptiveSequence?: AdaptiveSequence;
  metrics: PerformanceMetrics;

  version: number;             // Schema version
  createdAt: number;
  updatedAt: number;
}
```

#### 2. Migration Functions

```typescript
class ContextMigrator {
  /**
   * Migrate old context to new format
   */
  migrateToV2(oldContext: ExplorationContext): EnhancedExplorationContext {
    return {
      journeyId: oldContext.journeyId,
      currentStage: oldContext.currentStage,
      previousStages: oldContext.previousStages.map(s => s.id),

      // Convert simple arrays to rich objects
      insights: oldContext.insights.map((insight, i) =>
        BackwardsCompat.insightFromString(
          insight,
          this.inferStageType(insight),
          i + 1
        )
      ),

      questions: oldContext.questions.map((q, i) =>
        BackwardsCompat.questionFromString(q, i + 1)
      ),

      artifacts: oldContext.artifacts.map((a, i) => ({
        id: `artifact_${Date.now()}_${i}`,
        type: this.inferArtifactType(a),
        title: `Artifact ${i + 1}`,
        content: a,
        stageNumber: i + 1,
        stageType: 'building',
        relatedInsightIds: [],
        relatedQuestionIds: [],
        metadata: {},
        validation: {
          completeness: 'partial',
          validated: false,
        },
        createdAt: Date.now(),
      })),

      chasedTopics: oldContext.chasedTopics,

      // Initialize new fields
      contextSummary: null,
      miniSyntheses: [],
      qualityReports: [],
      topicType: undefined,
      adaptiveSequence: undefined,
      metrics: {
        totalThinkingTokens: 0,
        totalOutputTokens: 0,
        averageStageTime: 0,
        stageTimings: {},
        qualityTrend: [],
      },

      version: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  /**
   * Check if context needs migration
   */
  needsMigration(context: any): boolean {
    return !context.version || context.version < 2;
  }

  /**
   * Auto-migrate on load
   */
  loadContext(contextData: any): EnhancedExplorationContext {
    if (this.needsMigration(contextData)) {
      console.log('Migrating context from v1 to v2...');
      return this.migrateToV2(contextData);
    }
    return contextData;
  }
}
```

#### 3. Feature Flag Patterns

```typescript
class ExplorationEngine {
  private config: OptimizationConfig;

  constructor(journeyId: string, config?: Partial<OptimizationConfig>) {
    // Merge with defaults
    this.config = {
      ...DEFAULT_OPTIMIZATION_CONFIG,
      ...config,
    };
  }

  private async extractInsights(content: string, stageType: StageType): Promise<void> {
    if (this.config.enableStructuredInsights) {
      // Use new structured extraction
      const richInsights = await this.insightService.extractInsights(
        content,
        stageType,
        this.context.currentStage,
        'claude'
      );
      this.context.insights.push(...richInsights);
    } else {
      // Use legacy pattern matching
      const simpleInsights = this.extractInsightsLegacy(content, stageType);
      // Convert to rich format with minimal metadata
      const richInsights = simpleInsights.map(insight =>
        BackwardsCompat.insightFromString(insight, stageType, this.context.currentStage)
      );
      this.context.insights.push(...richInsights);
    }
  }
}
```

### Database Schema Migration

**Approach**: Add new fields without breaking existing data

```sql
-- Add version column to journeys table
ALTER TABLE journeys ADD COLUMN context_version INTEGER DEFAULT 1;

-- Add new tables for rich data (optional, can use JSON)
CREATE TABLE IF NOT EXISTS rich_insights (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  insight TEXT NOT NULL,
  category TEXT NOT NULL,
  importance TEXT NOT NULL,
  confidence TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tracked_questions (
  id TEXT PRIMARY KEY,
  journey_id TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL,
  answer TEXT,
  priority TEXT NOT NULL,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER,
  FOREIGN KEY (journey_id) REFERENCES journeys(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_insights_journey ON rich_insights(journey_id);
CREATE INDEX idx_insights_stage ON rich_insights(stage_number);
CREATE INDEX idx_questions_journey ON tracked_questions(journey_id);
CREATE INDEX idx_questions_status ON tracked_questions(status);
```

### Rollback Strategy

**If optimizations cause issues:**

1. **Feature Flag Disable**: Set all Phase 2/3 flags to `false`
2. **Data Rollback**: Contexts remain valid (all new fields are optional)
3. **Code Rollback**: Old ExplorationEngine still works with rich context (accesses base fields)

```typescript
// Safe access pattern
const insights = context.insights || []; // Falls back to empty array
const insight = typeof insights[0] === 'string'
  ? insights[0]                          // Old format
  : insights[0]?.insight;                // New format
```

---

## Implementation Phases

### Phase 1: Quick Wins (Week 1 - 10 hours)

**Goal**: Implement 5 standalone optimizations with immediate impact

**Tasks**:
1. Create `optimization-types.ts` ✓ (Done)
2. Implement `InsightExtractionService` (2h)
3. Implement `QuestionTrackingService` (2h)
4. Implement `MiniSynthesisService` (2h)
5. Update `ExplorationEngine` with dynamic budgets (15min)
6. Implement `ArtifactValidationService` (3h)
7. Add feature flags and config (30min)
8. Test with sample journeys (1h)

**Deliverables**:
- ✓ Type definitions
- Extraction services
- Updated engine with flags
- Test suite
- Documentation updates

**Success Criteria**:
- 2-3x more insights captured
- Questions systematically tracked
- Better quality artifacts
- No performance regression
- 20-30% better output quality

---

### Phase 2: Intelligence (Week 2-3 - 26 hours)

**Goal**: Add context management and quality control

**Prerequisites**: Phase 1 complete

**Tasks**:
1. Implement `ContextSummarizationService` (8h)
2. Implement `QualityScoringService` (5h)
3. Implement `AdaptiveStageService` (7h)
4. Implement `ConfidenceTrackingService` (4h)
5. Integrate with `ExplorationEngine` (2h)
6. Add database migrations (1h)
7. Comprehensive testing (3h)

**Deliverables**:
- Context management system
- Quality assessment framework
- Adaptive stage selection
- Confidence tracking
- Migration scripts
- Integration tests

**Success Criteria**:
- Full journey awareness in all stages
- Quality scores > 7/10 average
- Adaptive sequences improve outcomes
- Low-confidence items flagged
- Cumulative 35-50% improvement

---

### Phase 3: Advanced (Week 4-9 - 5 weeks)

**Goal**: Add semantic search, multi-agent, and learning

**Prerequisites**: Phase 1 & 2 complete

**Tasks**:
1. **Semantic Search** (2 weeks)
   - Integrate embedding service
   - Implement vector database
   - Build semantic query engine
   - Cache embeddings

2. **Multi-Agent Validation** (1 week)
   - Multiple perspective prompts
   - Parallel Claude calls
   - Consensus synthesis

3. **Pattern Learning** (2 weeks)
   - Analytics database setup
   - Pattern extraction
   - Recommendation engine
   - Feedback loop integration

**Deliverables**:
- Semantic search system
- Multi-agent validation
- Pattern learning database
- Analytics dashboard
- Complete documentation

**Success Criteria**:
- Semantic context retrieval working
- Multiple perspectives evaluated
- System learns from past journeys
- Cumulative 45-65% improvement

---

## Quality Assurance

### Testing Strategy

#### 1. Unit Tests

```typescript
// Example: Insight extraction
describe('InsightExtractionService', () => {
  it('should extract structured insights from stage output', async () => {
    const service = new InsightExtractionService();
    const content = 'Discovered: React performance can be improved by...';

    const insights = await service.extractInsights(
      content,
      'discovering',
      1,
      'claude'
    );

    expect(insights).toHaveLength(1);
    expect(insights[0].category).toBe('discovery');
    expect(insights[0].importance).toBeDefined();
    expect(insights[0].evidence).toBeArray();
  });

  it('should fallback to patterns on Claude error', async () => {
    // Mock Claude service to fail
    const service = new InsightExtractionService();

    const insights = await service.extractInsights(
      'Some content',
      'discovering',
      1,
      'claude'
    );

    // Should not throw, should use pattern fallback
    expect(insights).toBeArray();
  });
});
```

#### 2. Integration Tests

```typescript
describe('ExplorationEngine with Optimizations', () => {
  it('should complete journey with all Phase 1 features', async () => {
    const config: OptimizationConfig = {
      ...DEFAULT_OPTIMIZATION_CONFIG,
      enableStructuredInsights: true,
      enableQuestionTracking: true,
      enableMiniSynthesis: true,
      enableDynamicBudgets: true,
      enableArtifactValidation: true,
    };

    const engine = new ExplorationEngine('test-journey', config);
    const stage = await engine.start('Test topic');

    expect(stage.status).toBe('complete');

    const context = engine.getContext();
    expect(context.insights).toBeArray();
    expect(context.insights[0]).toHaveProperty('category');
    expect(context.insights[0]).toHaveProperty('confidence');
  });

  it('should create mini-synthesis every 3 stages', async () => {
    // ... test synthesis generation
  });
});
```

#### 3. End-to-End Tests

```typescript
describe('Full Journey with Optimizations', () => {
  it('should produce higher quality output than baseline', async () => {
    // Run two journeys: baseline vs optimized
    const baseline = await runBaseline('Test topic');
    const optimized = await runOptimized('Test topic');

    // Compare metrics
    expect(optimized.insights.length).toBeGreaterThan(baseline.insights.length);
    expect(optimized.averageQuality).toBeGreaterThan(baseline.averageQuality);
    expect(optimized.questionsAnswered).toBeGreaterThan(baseline.questionsAnswered);
  });
});
```

### Performance Benchmarks

**Target Metrics**:
```
Baseline (Current):
- Insights extracted: 10-15 per journey
- Insight accuracy: ~60%
- Questions answered: ~40%
- Artifact quality: 6/10 average
- Context awareness: Last 2-3 stages only

Phase 1 Target:
- Insights extracted: 25-40 per journey (2-3x)
- Insight accuracy: ~85% (1.4x)
- Questions answered: ~70% (1.75x)
- Artifact quality: 7.5/10 (1.25x)
- Context awareness: Last 2-3 stages + synthesis

Phase 2 Target:
- Context awareness: Full journey via summarization
- Quality scores: 7+/10 average
- Adaptive improvements: 30-40% better relevance
- Confidence tracking: Low-confidence flagged and revisited

Phase 3 Target:
- Semantic context: Find any relevant past stage
- Multi-perspective: 3 viewpoints synthesized
- Learning: Improve over time from feedback
```

### Monitoring & Observability

```typescript
class OptimizationMetrics {
  // Track optimization performance
  static async recordExecution(
    feature: string,
    duration: number,
    success: boolean,
    metadata: Record<string, any>
  ): Promise<void> {
    // Log to analytics
    console.log(`[Optimization] ${feature}: ${duration}ms (${success ? 'success' : 'failed'})`);

    // Track in context metrics
    // ...
  }

  // Generate reports
  static generateReport(context: EnhancedExplorationContext): OptimizationReport {
    return {
      insightsExtracted: context.insights.length,
      questionsTracked: context.questions.length,
      questionsAnswered: context.questions.filter(q => q.status === 'answered').length,
      synthesesCreated: context.miniSyntheses.length,
      qualityAverage: average(context.qualityReports.map(r => r.overallScore)),
      confidenceDistribution: this.analyzeConfidence(context.insights),
      performanceMetrics: context.metrics,
    };
  }
}
```

---

## Conclusion

This architecture provides a comprehensive, modular, and incrementally deployable framework for optimizing the ExplorationEngine. Key advantages:

✅ **Backwards Compatible**: Existing journeys unaffected
✅ **Incrementally Deployable**: Features can be enabled progressively
✅ **Type-Safe**: Full TypeScript support
✅ **Testable**: Comprehensive testing strategy
✅ **Extensible**: Easy to add future optimizations
✅ **Performance-Conscious**: Minimal overhead when disabled

**Next Steps**:
1. Review and approve architecture
2. Begin Phase 1 implementation
3. Test with diverse journey topics
4. Measure improvements against baselines
5. Iterate based on findings

**Documentation References**:
- [JOURNEY-OPTIMIZATION-ANALYSIS.md](./JOURNEY-OPTIMIZATION-ANALYSIS.md) - Detailed analysis
- [optimization-types.ts](../src/renderer/lib/engine/types/optimization-types.ts) - Type definitions
- [ExplorationEngine.ts](../src/renderer/lib/engine/ExplorationEngine.ts) - Current implementation

---

**Architecture Version**: 1.0.0
**Last Updated**: October 30, 2025
**Status**: Ready for Implementation
