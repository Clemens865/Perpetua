/**
 * Claude Page Analyzer
 * Intelligently analyzes journey content to recommend optimal visualization
 * Uses Extended Thinking for deep understanding
 */

import { claudeService } from './ClaudeService';
import type { Journey, Stage } from '../../types';

/**
 * Journey analysis result from Claude
 */
export interface JourneyAnalysis {
  // Content Classification
  contentType: 'research' | 'process' | 'comparison' | 'temporal' | 'conceptual';
  complexity: 'simple' | 'moderate' | 'complex';

  // Structural Analysis
  keyThemes: string[];
  conceptMap: ConceptNode[];
  temporalFlow: boolean;
  decisionPoints: DecisionNode[];

  // Narrative Arc
  narrativeArc: {
    beginning: string;
    development: string[];
    climax: string;
    resolution: string;
  };

  // Visualization Recommendations
  recommendations: {
    primary: TemplateType;
    secondary: TemplateType[];
    reasoning: string;
    confidence: number; // 0-1
  };

  // Template-Specific Insights
  templateInsights: {
    presentation?: PresentationInsights;
    timeline?: TimelineInsights;
    mindmap?: MindmapInsights;
  };

  // Metadata
  analyzedAt: number;
  modelUsed: string;
  tokensUsed?: number;
}

export type TemplateType = 'report' | 'wiki' | 'presentation' | 'timeline' | 'mindmap';

export interface ConceptNode {
  id: string;
  label: string;
  importance: number; // 0-1
  stageOrigin: string; // Which stage introduced this
  relatedConcepts: string[]; // IDs of related concepts
}

export interface DecisionNode {
  stage: string;
  description: string;
  outcome: string;
  alternatives?: string[];
}

export interface PresentationInsights {
  suggestedSlideCount: number;
  keyPoints: Array<{
    stage: string;
    title: string;
    bullets: string[];
  }>;
  visualSuggestions: string[]; // "Add Mermaid diagram for stage 3"
}

export interface TimelineInsights {
  events: Array<{
    timestamp: string; // Relative: "Stage 2", "After discovery phase"
    title: string;
    description: string;
    importance: 'low' | 'medium' | 'high';
    type: 'milestone' | 'decision' | 'discovery' | 'insight';
  }>;
  parallelTracks?: string[]; // If multiple themes run in parallel
}

export interface MindmapInsights {
  centralConcept: string;
  mainBranches: Array<{
    label: string;
    concepts: string[];
    depth: number; // How many levels deep
  }>;
  strongConnections: Array<{
    from: string;
    to: string;
    strength: number; // 0-1
    reason: string;
  }>;
}

export class ClaudePageAnalyzer {
  /**
   * Analyze a journey to determine best visualization
   */
  async analyzeJourney(journey: Journey): Promise<JourneyAnalysis> {
    console.log(`🔍 Analyzing journey: ${journey.input.substring(0, 50)}...`);

    if (!claudeService.getInitializationStatus()) {
      throw new Error('Claude service not initialized');
    }

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(journey);

    console.log(`🧠 Running Claude analysis with Extended Thinking...`);
    const startTime = Date.now();

    // Execute with Extended Thinking for deep analysis
    const response = await claudeService.execute({
      prompt,
      model: 'claude-sonnet-4-5-20250929', // Balanced for analysis
      extendedThinking: true,
      thinkingBudget: 10000, // Budget for thorough analysis
      maxTokens: 16000, // Must be greater than thinkingBudget
      stream: false, // Non-streaming for clean JSON response
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Analysis complete in ${(duration / 1000).toFixed(1)}s`);

    // Parse Claude's JSON response
    const analysis = this.parseAnalysisResponse(response.content, journey);

    // Add metadata
    analysis.analyzedAt = Date.now();
    analysis.modelUsed = 'claude-sonnet-4-5-20250929';
    analysis.tokensUsed = response.usage?.outputTokens;

    return analysis;
  }

  /**
   * Build the analysis prompt for Claude
   */
  private buildAnalysisPrompt(journey: Journey): string {
    // Truncate long stage results to fit in context
    const truncateStage = (stage: Stage): string => {
      const maxLength = 1500;
      if (stage.result.length <= maxLength) {
        return stage.result;
      }

      // Keep first 1000 and last 500 characters
      return (
        stage.result.substring(0, 1000) +
        '\n\n[... truncated ...]\n\n' +
        stage.result.substring(stage.result.length - 500)
      );
    };

    return `You are analyzing an 8-stage exploration journey from Perpetua (The Infinite Thought Engine) to recommend the optimal visualization format.

<journey>
<metadata>
Input Question: ${journey.input}
Total Stages: ${journey.stages.length}
Status: ${journey.status}
Created: ${new Date(journey.createdAt).toISOString()}
</metadata>

<stages>
${journey.stages
  .map(
    (stage, i) => `
## STAGE ${i + 1}: ${stage.type.toUpperCase()}

**Result:**
${truncateStage(stage)}

${
  stage.thinking
    ? `**Extended Thinking:**
${stage.thinking.substring(0, 500)}...
`
    : ''
}

**Artifacts:** ${stage.artifacts.length > 0 ? stage.artifacts.map((a) => a.type).join(', ') : 'None'}
`
  )
  .join('\n---\n')}
</stages>
</journey>

<task>
Deeply analyze this journey and provide comprehensive insights for visualization.

Follow this analysis framework:

## 1. CONTENT CLASSIFICATION

Classify the journey's content type:
- **research**: Exploring a topic from multiple angles
- **process**: Step-by-step progression or workflow
- **comparison**: Evaluating alternatives or options
- **temporal**: Time-based evolution or historical analysis
- **conceptual**: Abstract ideas and relationships

Determine complexity:
- **simple**: Single-thread exploration, clear conclusions
- **moderate**: Multiple threads, some branching
- **complex**: Highly interconnected, many perspectives

## 2. STRUCTURAL ANALYSIS

Extract key information:
- **Key Themes** (5-7 main topics): What are the central ideas that emerged?
- **Concept Map**: What concepts appeared and how do they relate?
  - For each concept: importance (0-1), which stage introduced it, related concepts
- **Temporal Flow**: Does this journey have time-based progression? (true/false)
- **Decision Points**: Were there key decisions, branches, or turning points?

## 3. NARRATIVE ARC

Identify the story structure:
- **Beginning**: How did the journey start? What was the initial approach?
- **Development** (2-4 key points): How did the exploration progress?
- **Climax**: What was the major insight, breakthrough, or critical finding?
- **Resolution**: How did things conclude? What artifacts were created?

## 4. VISUALIZATION RECOMMENDATION

Recommend the BEST template for this journey:

**Available Templates:**
1. **website**: Comprehensive multi-section website (good for in-depth exploration with rich content)
2. **report**: Professional document with sections (good for comprehensive findings)
3. **wiki**: Wikipedia-style article with navigation (good for reference material)
4. **presentation**: Slide deck format (good for narratives with clear points)
5. **timeline**: Chronological visualization (good for temporal/process flows)
6. **mindmap**: Concept graph (good for interconnected ideas)

Provide:
- **primary**: Your #1 recommendation
- **secondary** (2-3 alternatives): Other suitable options
- **reasoning**: WHY is primary the best fit? Be specific.
- **confidence** (0-1): How confident are you?

## 5. TEMPLATE-SPECIFIC INSIGHTS

For the PRIMARY template you recommended, provide detailed structure:

### If Presentation:
- Suggested slide count (10-15 max)
- Key points per slide (title + 3-5 bullets)
- Visual suggestions (diagrams, code blocks)

### If Timeline:
- Events with timestamps, titles, descriptions
- Event importance (low/medium/high)
- Event types (milestone/decision/discovery/insight)
- Parallel tracks if multiple themes

### If Mindmap:
- Central concept
- Main branches with sub-concepts
- Strong connections between concepts (with strength 0-1)

</task>

<output_format>
Return ONLY valid JSON (no markdown code blocks, no preamble):

{
  "contentType": "research" | "process" | "comparison" | "temporal" | "conceptual",
  "complexity": "simple" | "moderate" | "complex",

  "keyThemes": ["theme1", "theme2", ...],

  "conceptMap": [
    {
      "id": "concept-1",
      "label": "Concept Name",
      "importance": 0.8,
      "stageOrigin": "discovering",
      "relatedConcepts": ["concept-2", "concept-3"]
    }
  ],

  "temporalFlow": true | false,

  "decisionPoints": [
    {
      "stage": "challenging",
      "description": "Question assumptions about X",
      "outcome": "Discovered Y was the root cause",
      "alternatives": ["Option A", "Option B"]
    }
  ],

  "narrativeArc": {
    "beginning": "Started by exploring...",
    "development": [
      "First discovered X",
      "Then questioned Y",
      "Finally connected to Z"
    ],
    "climax": "The major breakthrough was...",
    "resolution": "Concluded with artifacts for..."
  },

  "recommendations": {
    "primary": "website" | "presentation" | "timeline" | "mindmap" | "report" | "wiki",
    "secondary": ["timeline", "wiki"],
    "reasoning": "This journey has a clear narrative arc with distinct stages and key insights at each step, making a presentation format ideal for storytelling...",
    "confidence": 0.87
  },

  "templateInsights": {
    // Include ONLY the object for your PRIMARY recommendation

    "presentation": {
      "suggestedSlideCount": 12,
      "keyPoints": [
        {
          "stage": "discovering",
          "title": "Initial Exploration",
          "bullets": ["Point 1", "Point 2", "Point 3"]
        }
      ],
      "visualSuggestions": [
        "Add Mermaid flowchart for decision tree in stage 4",
        "Include code block for algorithm in stage 8"
      ]
    }

    // OR

    "timeline": {
      "events": [
        {
          "timestamp": "Stage 1: Discovering",
          "title": "First Research Phase",
          "description": "Explored core concepts...",
          "importance": "high",
          "type": "discovery"
        }
      ],
      "parallelTracks": ["Technical Track", "Business Track"]
    }

    // OR

    "mindmap": {
      "centralConcept": "AI Ethics in Healthcare",
      "mainBranches": [
        {
          "label": "Privacy Concerns",
          "concepts": ["Data Protection", "Patient Consent", "HIPAA"],
          "depth": 2
        }
      ],
      "strongConnections": [
        {
          "from": "Data Protection",
          "to": "Patient Consent",
          "strength": 0.9,
          "reason": "Both are foundational to privacy"
        }
      ]
    }
  }
}
</output_format>

<quality_guidelines>
- Be specific and concrete in your analysis
- Base recommendations on actual journey content, not assumptions
- Confidence should reflect how well the template matches the content
- Template insights should be detailed enough to guide generation
- Concept relationships should be meaningful, not superficial
- Decision points should be actual turning points, not just stage transitions
</quality_guidelines>

Analyze thoroughly using your extended thinking, then return the JSON analysis.`;
  }

  /**
   * Parse Claude's analysis response
   */
  private parseAnalysisResponse(content: string, journey: Journey): JourneyAnalysis {
    try {
      // Extract JSON from response (Claude might wrap it)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const analysis = JSON.parse(jsonMatch[0]) as JourneyAnalysis;

      // Validate required fields
      if (!analysis.contentType || !analysis.recommendations?.primary) {
        throw new Error('Invalid analysis structure');
      }

      return analysis;
    } catch (error) {
      console.error('Failed to parse analysis:', error);
      console.error('Raw response:', content);

      // Fallback: Return basic analysis with report recommendation
      return this.createFallbackAnalysis(journey);
    }
  }

  /**
   * Create fallback analysis if Claude parsing fails
   */
  private createFallbackAnalysis(journey: Journey): JourneyAnalysis {
    console.warn('⚠️  Using fallback analysis');

    return {
      contentType: 'research',
      complexity: 'moderate',
      keyThemes: journey.stages.map((s) => s.type),
      conceptMap: [],
      temporalFlow: true,
      decisionPoints: [],
      narrativeArc: {
        beginning: journey.input,
        development: ['Explored through 8 stages'],
        climax: 'Completed exploration',
        resolution: 'Generated artifacts',
      },
      recommendations: {
        primary: 'report',
        secondary: ['wiki'],
        reasoning: 'Defaulting to report format as analysis could not be completed',
        confidence: 0.5,
      },
      templateInsights: {},
      analyzedAt: Date.now(),
      modelUsed: 'fallback',
    };
  }

  /**
   * Get cached analysis if available
   */
  async getCachedAnalysis(journeyId: string): Promise<JourneyAnalysis | null> {
    // This will be implemented with IPC to read from file system
    // For now, return null (always analyze)
    return null;
  }

  /**
   * Save analysis to cache
   */
  async cacheAnalysis(journeyId: string, analysis: JourneyAnalysis): Promise<void> {
    // This will be implemented with IPC to save to file system
    console.log(`💾 Caching analysis for journey ${journeyId}`);
  }
}

// Export singleton instance
export const claudePageAnalyzer = new ClaudePageAnalyzer();
