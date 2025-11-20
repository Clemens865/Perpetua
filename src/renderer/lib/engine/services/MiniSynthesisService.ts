/**
 * Mini-Synthesis Service
 *
 * Generates intermediate synthesis reports every N stages (default: 3)
 * Helps maintain context and identify patterns across exploration stages
 *
 * Features:
 * - Synthesizes insights from recent stages
 * - Identifies connections and emerging patterns
 * - Highlights contradictions needing resolution
 * - Provides forward-looking guidance
 */

import type { Stage, StageType } from '../../../types';
import type { RichInsight, MiniSynthesis } from '../types/optimization-types';
import { claudeService } from '../../../services/claude/ClaudeService';

/**
 * Detailed synthesis report with metadata
 */
export interface SynthesisReport extends MiniSynthesis {
  summary: string;                    // High-level overview
  stageTypes: StageType[];            // Types of stages synthesized
  insightCount: number;               // Number of insights analyzed
  synthesisQuality: number;           // 0-10 quality estimate
  metadata: {
    thinkingTokens: number;
    outputTokens: number;
    model: string;
    generatedAt: number;
  };
}

/**
 * Configuration for synthesis generation
 */
export interface SynthesisConfig {
  thinkingBudget: number;             // Extended thinking budget (default: 3000)
  maxOutputTokens: number;            // Maximum output tokens (default: 2000)
  model: 'claude-sonnet-4-5-20250929' | 'claude-opus-4-20250514';
}

const DEFAULT_SYNTHESIS_CONFIG: SynthesisConfig = {
  thinkingBudget: 3000,
  maxOutputTokens: 2000,
  model: 'claude-sonnet-4-5-20250929',
};

/**
 * Mini-Synthesis Service
 * Creates intermediate summaries to maintain context coherence
 */
export class MiniSynthesisService {
  private config: SynthesisConfig;

  constructor(config: Partial<SynthesisConfig> = {}) {
    this.config = {
      ...DEFAULT_SYNTHESIS_CONFIG,
      ...config,
    };
  }

  /**
   * Create a mini-synthesis from the last N stages
   *
   * @param lastStages - Recent stages to synthesize (typically 3)
   * @param allInsights - All insights from the journey (for context)
   * @returns Synthesis report with connections and patterns
   */
  async createMiniSynthesis(
    lastStages: Stage[],
    allInsights: RichInsight[]
  ): Promise<SynthesisReport> {
    if (lastStages.length === 0) {
      throw new Error('Cannot create synthesis from empty stage list');
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 CREATING MINI-SYNTHESIS FOR STAGES ${lastStages.map(s => s.type).join(', ')}`);
    console.log(`${'='.repeat(60)}\n`);

    const prompt = this.buildSynthesisPrompt(lastStages, allInsights);

    try {
      // Execute with Claude using Extended Thinking
      const response = await claudeService.execute({
        model: this.config.model,
        prompt,
        extendedThinking: true,
        thinkingBudget: this.config.thinkingBudget,
        maxTokens: this.config.maxOutputTokens,
        stream: false,
      });

      // Parse the synthesis content
      const synthesisContent = this.parseSynthesisContent(response.content);

      // Create the full synthesis report
      const report: SynthesisReport = {
        id: `synthesis_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        stages: lastStages.map(s => {
          // Extract stage number from journey context
          // For now, use creation time as a simple indicator
          return lastStages.indexOf(s) + 1;
        }),
        connections: synthesisContent.connections,
        patterns: synthesisContent.patterns,
        contradictions: synthesisContent.contradictions,
        forwardLook: synthesisContent.forwardLook,
        keyInsights: this.extractKeyInsightIds(synthesisContent.keyInsights, allInsights),
        summary: synthesisContent.summary,
        stageTypes: lastStages.map(s => s.type),
        insightCount: allInsights.length,
        synthesisQuality: this.estimateQuality(synthesisContent),
        createdAt: Date.now(),
        metadata: {
          thinkingTokens: response.usage?.inputTokens || 0,
          outputTokens: response.usage?.outputTokens || 0,
          model: this.config.model,
          generatedAt: Date.now(),
        },
      };

      console.log(`✅ Mini-synthesis created successfully`);
      console.log(`📊 Quality score: ${report.synthesisQuality.toFixed(1)}/10`);
      console.log(`📝 Insights analyzed: ${report.insightCount}`);

      return report;
    } catch (error) {
      console.error('❌ Failed to create mini-synthesis:', error);
      throw new Error(`Synthesis generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build the synthesis prompt
   */
  private buildSynthesisPrompt(stages: Stage[], insights: RichInsight[]): string {
    const stagesSummary = stages.map((stage, idx) => {
      const stageResult = stage.result?.substring(0, 800) || '';
      return `
### Stage ${idx + 1}: ${stage.type.toUpperCase()}
${stageResult}${stage.result && stage.result.length > 800 ? '...' : ''}
`;
    }).join('\n');

    const recentInsights = insights.slice(-15).map(i =>
      `- [${i.stageType}] ${i.insight} (${i.importance} importance, ${i.confidence} confidence)`
    ).join('\n');

    return `
You are creating a MINI-SYNTHESIS to connect recent exploration stages.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
This synthesis covers ${stages.length} recent stages:
${stages.map(s => s.type).join(' → ')}

Your goal is to create a cohesive narrative that:
1. Identifies key connections between these stages
2. Reveals emerging patterns and themes
3. Highlights any contradictions that need resolution
4. Provides forward-looking guidance for next stages
</task_context>

<stage_content>
${stagesSummary}
</stage_content>

<recent_insights>
${recentInsights}
</recent_insights>

<process>
Follow this structured approach:

1. **Summary** (2-3 sentences):
   - What was the overarching theme of these stages?
   - What was the key progression?

2. **Key Connections** (1 paragraph):
   - How did insights from one stage inform the next?
   - What causal relationships emerged?
   - What surprising connections did you discover?

3. **Emerging Patterns** (1 paragraph):
   - What themes are recurring across stages?
   - What deeper structure is becoming visible?
   - What trends or trajectories are developing?

4. **Contradictions** (1 paragraph):
   - What findings seem to conflict?
   - What tensions or paradoxes emerged?
   - What assumptions might need revisiting?
   - How might these contradictions be resolved?

5. **Forward Guidance** (1 paragraph):
   - Based on these stages, what should we explore next?
   - What questions became more urgent?
   - What areas need deeper investigation?
   - What pitfalls should we avoid?
</process>

<output_format>
## Summary
[2-3 sentences summarizing the key progression]

## Key Connections
[Paragraph describing how stages connected and informed each other]

## Emerging Patterns
[Paragraph identifying recurring themes and deeper structures]

## Contradictions & Tensions
[Paragraph highlighting conflicts and how to resolve them]

## Forward Guidance
[Paragraph providing direction for next stages]

## Key Insights
[List 3-5 most important insights from these stages]
- [Insight 1]
- [Insight 2]
- [Insight 3]
</output_format>

<quality_guidelines>
- Be specific with examples from the stages
- Connect concrete findings, not abstract themes
- Identify non-obvious patterns and relationships
- Be honest about contradictions and uncertainties
- Provide actionable forward guidance
- Keep each paragraph focused and concise (3-5 sentences)
- Total length: 3-5 paragraphs (not counting Key Insights list)
</quality_guidelines>
`;
  }

  /**
   * Parse synthesis content from Claude's response
   */
  private parseSynthesisContent(content: string): {
    summary: string;
    connections: string;
    patterns: string;
    contradictions: string;
    forwardLook: string;
    keyInsights: string[];
  } {
    // Extract sections using regex patterns
    const extractSection = (sectionName: string): string => {
      const pattern = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
      const match = content.match(pattern);
      return match ? match[1].trim() : '';
    };

    const summary = extractSection('Summary');
    const connections = extractSection('Key Connections');
    const patterns = extractSection('Emerging Patterns');
    const contradictions = extractSection('Contradictions');
    const forwardLook = extractSection('Forward Guidance');

    // Extract key insights from bulleted list
    const insightsSection = extractSection('Key Insights');
    const insightMatches = insightsSection.matchAll(/^[-•*]\s*(.+?)$/gm);
    const keyInsights: string[] = [];
    for (const match of insightMatches) {
      if (match[1]) {
        keyInsights.push(match[1].trim());
      }
    }

    return {
      summary,
      connections,
      patterns,
      contradictions,
      forwardLook,
      keyInsights,
    };
  }

  /**
   * Extract insight IDs matching the key insights
   */
  private extractKeyInsightIds(keyInsightTexts: string[], allInsights: RichInsight[]): string[] {
    const ids: string[] = [];

    for (const text of keyInsightTexts) {
      // Try to find matching insights by text similarity
      const normalizedText = text.toLowerCase().substring(0, 100);

      for (const insight of allInsights) {
        const normalizedInsight = insight.insight.toLowerCase().substring(0, 100);

        // Simple substring matching (could be improved with fuzzy matching)
        if (normalizedText.includes(normalizedInsight.substring(0, 30)) ||
            normalizedInsight.includes(normalizedText.substring(0, 30))) {
          if (!ids.includes(insight.id)) {
            ids.push(insight.id);
          }
        }
      }
    }

    return ids;
  }

  /**
   * Estimate quality of the synthesis (0-10 scale)
   */
  private estimateQuality(content: {
    summary: string;
    connections: string;
    patterns: string;
    contradictions: string;
    forwardLook: string;
    keyInsights: string[];
  }): number {
    let score = 0;

    // Check completeness (all sections present)
    const sections = [
      content.summary,
      content.connections,
      content.patterns,
      content.contradictions,
      content.forwardLook,
    ];

    const completedSections = sections.filter(s => s.length > 50).length;
    score += (completedSections / sections.length) * 4; // Max 4 points for completeness

    // Check depth (average length of sections)
    const avgLength = sections.reduce((sum, s) => sum + s.length, 0) / sections.length;
    if (avgLength > 200) score += 2; // 2 points for substantial content
    else if (avgLength > 100) score += 1;

    // Check insight extraction
    if (content.keyInsights.length >= 3) score += 2; // 2 points for good insights
    else if (content.keyInsights.length >= 1) score += 1;

    // Check specificity (look for concrete examples)
    const combinedText = sections.join(' ');
    const hasExamples = /(?:example|specifically|such as|for instance|e\.g\.|namely)/i.test(combinedText);
    if (hasExamples) score += 2; // 2 points for specificity

    return Math.min(10, Math.max(0, score));
  }

  /**
   * Convert synthesis report to RichInsight format
   * Allows synthesis to be stored alongside other insights
   */
  createSynthesisInsight(report: SynthesisReport): RichInsight {
    const insightText = `Mini-synthesis (stages ${report.stages.join(', ')}): ${report.summary}`;

    return {
      id: report.id,
      insight: insightText,
      category: 'synthesis',
      importance: 'high',
      evidence: [
        report.connections,
        report.patterns,
        report.contradictions,
        report.forwardLook,
      ].filter(e => e.length > 0),
      stageType: report.stageTypes[report.stageTypes.length - 1], // Last stage type
      stageNumber: report.stages[report.stages.length - 1], // Last stage number
      confidence: 'high',
      assumptions: [],
      relatedInsightIds: report.keyInsights,
      artifactIds: [],
      questionIds: [],
      metadata: {
        extractionMethod: 'claude',
        qualityScore: report.synthesisQuality,
        tags: ['synthesis', 'intermediate', 'connections'],
        synthesisReport: report, // Embed full report
      },
      createdAt: report.createdAt,
    };
  }
}
