/**
 * Optimization Types for Journey Improvements
 *
 * This module defines comprehensive type structures for the 12 major optimization
 * improvements to the ExplorationEngine, supporting enhanced insight tracking,
 * quality scoring, context management, and adaptive intelligence.
 *
 * Architecture: These types are designed to be:
 * - Backwards compatible with existing Stage/Journey types
 * - Extensible for future enhancements
 * - Composable for complex orchestration patterns
 * - Type-safe for TypeScript strict mode
 */

import type { StageType as BaseStageType } from '../../../types';

// Re-export StageType for use in services
export type StageType = BaseStageType;

// ============================================================================
// CATEGORY 1: Enhanced Insights & Metadata
// ============================================================================

/**
 * Rich insight structure with comprehensive metadata
 * Replaces simple string[] with structured, queryable insight objects
 */
export interface RichInsight {
  id: string;                          // Unique identifier for cross-referencing
  insight: string;                      // The actual insight text (1-2 sentences)
  category: InsightCategory;            // Type classification
  importance: ImportanceLevel;          // Priority ranking
  evidence: string[];                   // Supporting evidence or reasoning
  stageType: StageType;                 // Stage where discovered
  stageNumber: number;                  // Which stage (1-indexed)
  confidence: ConfidenceLevel;          // Certainty level
  assumptions: string[];                // Underlying assumptions
  relatedInsightIds: string[];          // Cross-references to other insights
  artifactIds: string[];                // Related artifacts
  questionIds: string[];                // Related questions
  metadata: InsightMetadata;            // Additional context
  createdAt: number;                    // Timestamp
}

export type InsightCategory =
  | 'discovery'       // New information found
  | 'problem'         // Issue or challenge identified
  | 'solution'        // Proposed solution
  | 'question'        // Question raised
  | 'connection'      // Link between concepts
  | 'recommendation'  // Actionable suggestion
  | 'synthesis';      // Cross-stage synthesis

export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';

export type ConfidenceLevel = 'verified' | 'high' | 'medium' | 'low' | 'speculative';

export interface InsightMetadata {
  sourceStageId?: string;              // Stage ID where discovered
  extractionMethod: 'claude' | 'pattern' | 'manual'; // How extracted
  qualityScore?: number;               // 0-10 quality rating
  tags?: string[];                     // Custom tags
  [key: string]: unknown;              // Extensible
}

// ============================================================================
// CATEGORY 2: Question-Answer Tracking
// ============================================================================

/**
 * Tracked question with answer status and metadata
 * Ensures questions are systematically answered and tracked
 */
export interface TrackedQuestion {
  id: string;                          // Unique identifier
  question: string;                    // Question text
  askedInStage: number;                // Stage number where asked (1-indexed)
  stageType: StageType;                // Stage type where asked
  priority: ImportanceLevel;           // Criticality
  status: QuestionStatus;              // Current status
  answer?: string;                     // Answer if available
  answeredInStage?: number;            // Stage number where answered
  confidence?: ConfidenceLevel;        // Answer confidence
  evidence?: string[];                 // Supporting evidence for answer
  relatedInsightIds: string[];         // Related insights
  metadata: QuestionMetadata;
  createdAt: number;
  updatedAt?: number;
}

export type QuestionStatus = 'unanswered' | 'partial' | 'answered' | 'obsolete';

export interface QuestionMetadata {
  category?: QuestionCategory;
  requiresResearch?: boolean;          // Needs SEARCHING stage
  researchAttempts?: number;           // How many times researched
  [key: string]: unknown;
}

export type QuestionCategory =
  | 'clarifying'     // Understanding concepts
  | 'probing'        // Going deeper
  | 'hypothetical'   // Exploring scenarios
  | 'challenge'      // Testing assumptions
  | 'meta'           // About exploration itself
  | 'future';        // Long-term implications

// ============================================================================
// CATEGORY 3: Rich Artifacts with Metadata
// ============================================================================

/**
 * Enhanced artifact structure with validation and relationships
 */
export interface RichArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  stageNumber: number;
  stageType: StageType;
  relatedInsightIds: string[];         // Which insights led to this
  relatedQuestionIds: string[];        // Which questions this addresses
  metadata: ArtifactMetadata;
  validation: ArtifactValidation;
  createdAt: number;
}

export type ArtifactType =
  | 'code'           // Code snippets or full programs
  | 'markdown'       // Markdown documents
  | 'table'          // Data tables
  | 'diagram'        // Visual diagrams (mermaid, etc.)
  | 'guide'          // Step-by-step guides
  | 'framework'      // Mental models or frameworks
  | 'report'         // Comprehensive reports
  | 'presentation'   // Slide content
  | 'other';

export interface ArtifactMetadata {
  language?: string;                   // Programming language for code
  framework?: string;                  // Framework/library used
  format?: string;                     // File format (md, json, etc.)
  size?: number;                       // Content size in bytes
  targetAudience?: string;             // Who should use this
  usageInstructions?: string;          // How to use
  tags?: string[];
  [key: string]: unknown;
}

export interface ArtifactValidation {
  completeness: CompletenessLevel;     // How complete is it
  validated: boolean;                  // Has been validated
  validationMethod?: string;           // How validated
  validationNotes?: string;            // Issues found
  syntaxValid?: boolean;               // For code artifacts
  errors?: string[];                   // Validation errors
  warnings?: string[];                 // Validation warnings
  qualityScore?: number;               // 0-10 quality rating
}

export type CompletenessLevel = 'complete' | 'partial' | 'skeleton';

// ============================================================================
// CATEGORY 4: Context Summarization & Management
// ============================================================================

/**
 * Hierarchical context summary for managing large journey contexts
 * Enables later stages to access early discoveries without context overflow
 */
export interface ContextSummary {
  overallSummary: string;              // 2-3 paragraphs of entire journey
  stageClusterSummaries: StageClusterSummary[]; // 3-stage clusters
  keyInsightsSummary: string;          // Top insights condensed
  criticalQuestionsSummary: string;    // Top unanswered questions
  emergingPatterns: string[];          // Patterns across stages
  contradictions: Contradiction[];      // Conflicting findings
  lastUpdated: number;
  version: number;                     // Increments with updates
}

export interface StageClusterSummary {
  stages: number[];                    // Stage numbers in cluster (e.g., [1,2,3])
  stageTypes: StageType[];             // Types of stages
  summary: string;                     // Condensed summary
  keyInsights: string[];               // Insight IDs
  keyQuestions: string[];              // Question IDs
  createdAt: number;
}

export interface Contradiction {
  description: string;                 // What contradicts
  sourceA: string;                     // First source (insight/stage)
  sourceB: string;                     // Second source
  resolution?: string;                 // How resolved
  resolved: boolean;
}

// ============================================================================
// CATEGORY 5: Quality Scoring & Self-Reflection
// ============================================================================

/**
 * Quality assessment for stage outputs
 * Enables self-reflection and continuous improvement
 */
export interface QualityReport {
  stageId: string;
  stageType: StageType;
  scores: QualityScores;
  overallScore: number;                // 0-10 average
  strengths: string[];                 // What went well
  weaknesses: string[];                // What needs improvement
  improvements: string[];              // Suggestions
  shouldRevise: boolean;               // Needs re-execution
  revisionSuggestions: string[];       // Specific improvements
  evaluatedAt: number;
}

export interface QualityScores {
  completeness: number;                // 0-10: Addressed all elements
  depth: number;                       // 0-10: Thoroughness
  specificity: number;                 // 0-10: Concrete vs vague
  actionability: number;               // 0-10: Usability
  coherence: number;                   // 0-10: Structure and logic
  novelty: number;                     // 0-10: New vs obvious
}

// ============================================================================
// CATEGORY 6: Adaptive Intelligence
// ============================================================================

/**
 * Topic classification for adaptive stage selection
 */
export type TopicType =
  | 'research'           // Information gathering
  | 'problem-solving'    // Solving specific problems
  | 'creative'           // Idea generation
  | 'technical'          // Implementation/building
  | 'strategic';         // Planning/decision-making

/**
 * Adaptive stage sequence configuration
 */
export interface AdaptiveSequence {
  topicType: TopicType;
  stageSequence: StageType[];          // Customized sequence
  thinkingBudgets: Record<StageType, number>; // Budget per stage
  priorityStages: StageType[];         // Most important stages
  optionalStages?: StageType[];        // Can be skipped if time limited
  reasoning: string;                   // Why this sequence
}

/**
 * Dynamic thinking budget allocation
 */
export interface ThinkingBudgetConfig {
  default: number;                     // Base budget
  byStage: Record<StageType, number>;  // Per-stage budgets
  byTopicType?: Record<TopicType, Record<StageType, number>>; // Topic-specific
  adaptive?: boolean;                  // Adjust based on complexity
}

// ============================================================================
// CATEGORY 7: Mini-Synthesis
// ============================================================================

/**
 * Intermediate synthesis every N stages
 */
export interface MiniSynthesis {
  id: string;
  stages: number[];                    // Stages synthesized (e.g., [4,5,6])
  connections: string;                 // How stages relate
  patterns: string;                    // Emerging themes
  contradictions: string;              // Conflicts found
  forwardLook: string;                 // What to focus on next
  keyInsights: string[];               // Insight IDs from synthesis
  createdAt: number;
}

// ============================================================================
// CATEGORY 8: Enhanced Exploration Context
// ============================================================================

/**
 * Extended context structure with all optimizations
 * Replaces the basic ExplorationContext with rich tracking
 */
export interface EnhancedExplorationContext {
  journeyId: string;
  currentStage: number;
  previousStages: string[];            // Stage IDs (not full stages)

  // Rich tracking (replaces simple arrays)
  insights: RichInsight[];             // Instead of string[]
  questions: TrackedQuestion[];        // Instead of string[]
  artifacts: RichArtifact[];           // Instead of string[]

  // New features
  contextSummary: ContextSummary | null;
  miniSyntheses: MiniSynthesis[];
  qualityReports: QualityReport[];
  chasedTopics: string[];              // Anti-repetition for chasing

  // Adaptive intelligence
  topicType?: TopicType;
  adaptiveSequence?: AdaptiveSequence;

  // Performance tracking
  metrics: PerformanceMetrics;

  // Versioning
  version: number;                     // Schema version for migrations
  createdAt: number;
  updatedAt: number;
}

export interface PerformanceMetrics {
  totalThinkingTokens: number;
  totalOutputTokens: number;
  averageStageTime: number;            // Milliseconds
  stageTimings: Record<string, number>; // Stage ID -> duration
  qualityTrend: number[];              // Quality scores over time
}

// ============================================================================
// CATEGORY 9: Stage Execution Options
// ============================================================================

/**
 * Enhanced stage execution configuration
 */
export interface EnhancedStageOptions {
  type: StageType;
  input: string;
  context: EnhancedExplorationContext;

  // Quality control
  enableQualityCheck: boolean;
  qualityThreshold: number;            // 0-10 minimum score
  autoRevise: boolean;                 // Re-run if quality low
  maxRevisions: number;

  // Adaptive features
  dynamicThinkingBudget: boolean;
  adaptivePrompts: boolean;

  // Context management
  useContextSummary: boolean;
  maxContextLength?: number;           // Tokens

  // Extraction
  structuredInsightExtraction: boolean;
  enhancedArtifactExtraction: boolean;

  // Mini-synthesis
  triggerSynthesis?: boolean;
}

// ============================================================================
// CATEGORY 10: Semantic Search (Future)
// ============================================================================

/**
 * Semantic search configuration for vector-based context retrieval
 * (Phase 3 - Long-term optimization)
 */
export interface SemanticSearchConfig {
  enabled: boolean;
  embeddingModel: string;              // Model for embeddings
  similarityThreshold: number;         // 0-1 cosine similarity threshold
  topK: number;                        // Number of results
  cacheEmbeddings: boolean;
}

export interface EmbeddedStage {
  stageId: string;
  stageType: StageType;
  embedding: number[];                 // Vector embedding
  content: string;                     // Original content
  createdAt: number;
}

// ============================================================================
// CATEGORY 11: Multi-Agent Validation (Future)
// ============================================================================

/**
 * Multi-perspective validation
 * (Phase 3 - Long-term optimization)
 */
export interface ValidationReport {
  topic: string;
  perspectives: ValidationPerspective[];
  consensus: string;
  disagreements: string[];
  synthesis: string;
  confidence: ConfidenceLevel;
  validatedAt: number;
}

export interface ValidationPerspective {
  role: 'optimistic' | 'skeptical' | 'pragmatic' | 'creative' | 'critical';
  analysis: string;
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

// ============================================================================
// CATEGORY 12: Journey Pattern Learning (Future)
// ============================================================================

/**
 * Learning from past journeys
 * (Phase 3 - Long-term optimization)
 */
export interface JourneyPattern {
  id: string;
  topicCategory: string;
  topicType: TopicType;
  successMetrics: JourneySuccessMetrics;
  effectiveStages: StageType[];
  stageSequence: StageType[];
  effectivePromptModifications: string[];
  commonPitfalls: string[];
  bestPractices: string[];
  insights: string[];
  createdAt: number;
}

export interface JourneySuccessMetrics {
  userRating?: number;                 // 1-5 stars
  completionRate: number;              // 0-1
  artifactsUsed: boolean;
  averageQualityScore: number;         // 0-10
  stagesCompleted: number;
  timeToCompletion: number;            // milliseconds
  userFeedback?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard utilities
 */
export type OptimizationPhase = 'phase1' | 'phase2' | 'phase3';

export interface OptimizationStatus {
  phase1: boolean;                     // Quick wins implemented
  phase2: boolean;                     // Medium effort implemented
  phase3: boolean;                     // Long-term implemented
  enabledFeatures: string[];
  version: string;
}

/**
 * Configuration for optimization features
 */
export interface OptimizationConfig {
  // Phase 1: Quick Wins
  enableStructuredInsights: boolean;
  enableQuestionTracking: boolean;
  enableMiniSynthesis: boolean;
  enableDynamicBudgets: boolean;
  enableArtifactValidation: boolean;

  // Phase 2: Medium Effort
  enableContextSummary: boolean;
  enableQualityScoring: boolean;
  enableAdaptiveStages: boolean;
  enableConfidenceTracking: boolean;

  // Phase 3: Long-term
  enableSemanticSearch: boolean;
  enableMultiAgentValidation: boolean;
  enablePatternLearning: boolean;

  // Thresholds
  qualityThreshold: number;            // 0-10
  synthesisInterval: number;           // Every N stages
  confidenceMinimum: ConfidenceLevel;
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  // Phase 1 (implement first)
  enableStructuredInsights: true,
  enableQuestionTracking: true,
  enableMiniSynthesis: true,
  enableDynamicBudgets: true,
  enableArtifactValidation: true,

  // Phase 2 (implement second)
  enableContextSummary: false,         // Requires Phase 1
  enableQualityScoring: false,         // Requires Phase 1
  enableAdaptiveStages: false,         // Requires Phase 1
  enableConfidenceTracking: false,     // Requires Phase 1

  // Phase 3 (implement last)
  enableSemanticSearch: false,         // Requires external dependencies
  enableMultiAgentValidation: false,   // Requires Phase 1 & 2
  enablePatternLearning: false,        // Requires analytics infrastructure

  // Defaults
  qualityThreshold: 6.0,
  synthesisInterval: 3,
  confidenceMinimum: 'medium',
};

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Type for migrating old context to new enhanced context
 */
export interface ContextMigration {
  fromVersion: number;
  toVersion: number;
  migrationSteps: string[];
  backwardsCompatible: boolean;
}

/**
 * Backwards compatibility: Convert old simple types to new rich types
 */
export namespace BackwardsCompat {
  export function insightFromString(
    insight: string,
    stageType: StageType,
    stageNumber: number
  ): RichInsight {
    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      insight,
      category: 'discovery',
      importance: 'medium',
      evidence: [],
      stageType,
      stageNumber,
      confidence: 'medium',
      assumptions: [],
      relatedInsightIds: [],
      artifactIds: [],
      questionIds: [],
      metadata: {
        extractionMethod: 'pattern',
      },
      createdAt: Date.now(),
    };
  }

  export function questionFromString(
    question: string,
    stageNumber: number
  ): TrackedQuestion {
    return {
      id: `question_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      question,
      askedInStage: stageNumber,
      stageType: 'questioning',
      priority: 'medium',
      status: 'unanswered',
      relatedInsightIds: [],
      metadata: {},
      createdAt: Date.now(),
    };
  }
}
