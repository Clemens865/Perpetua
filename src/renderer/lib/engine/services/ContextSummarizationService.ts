/**
 * Context Summarization Service
 *
 * Implements Hierarchical Context Summarization (Medium #1)
 * Creates multi-level summaries for full journey awareness without context overflow
 *
 * Strategy:
 * - Overall journey summary (2-3 paragraphs)
 * - Stage cluster summaries (every 3 stages)
 * - Top 10 key insights condensed
 * - Top 5 critical unanswered questions
 * - Update incrementally after every 3 stages
 * - Stay under 8000 tokens total
 */

import type {
  ContextSummary,
  StageClusterSummary,
  RichInsight,
  TrackedQuestion,
  Contradiction,
  StageType
} from '../types/optimization-types';
import type { Stage } from '../../../types';
import { claudeService } from '../../../services/claude/ClaudeService';

export class ContextSummarizationService {
  private readonly CLUSTER_SIZE = 3; // Summary every 3 stages
  private readonly MAX_TOKEN_ESTIMATE = 8000; // Target token budget
  private readonly MODEL = 'claude-sonnet-4-5-20250929'; // Use Sonnet for summarization

  /**
   * Build or update the hierarchical context summary
   * Called after every 3 stages (mini-synthesis intervals)
   */
  async buildContextSummary(
    allStages: Stage[],
    insights: RichInsight[],
    questions: TrackedQuestion[],
    existingSummary?: ContextSummary | null
  ): Promise<ContextSummary> {
    console.log(`🔄 Building hierarchical context summary (${allStages.length} stages)...`);

    // If we have fewer than 3 stages, return minimal summary
    if (allStages.length < 3) {
      return this.createMinimalSummary(allStages, insights, questions);
    }

    // Determine which stage clusters need updating
    const clusterSummaries = await this.buildStageClusterSummaries(
      allStages,
      insights,
      questions,
      existingSummary?.stageClusterSummaries || []
    );

    // Build overall journey summary
    const overallSummary = await this.buildOverallSummary(
      allStages,
      insights,
      questions,
      clusterSummaries
    );

    // Condense top insights
    const keyInsightsSummary = await this.buildKeyInsightsSummary(insights);

    // Condense top unanswered questions
    const criticalQuestionsSummary = await this.buildCriticalQuestionsSummary(questions);

    // Detect emerging patterns
    const emergingPatterns = this.detectEmergingPatterns(allStages, insights);

    // Detect contradictions
    const contradictions = this.detectContradictions(insights);

    const summary: ContextSummary = {
      overallSummary,
      stageClusterSummaries: clusterSummaries,
      keyInsightsSummary,
      criticalQuestionsSummary,
      emergingPatterns,
      contradictions,
      lastUpdated: Date.now(),
      version: (existingSummary?.version || 0) + 1,
    };

    // Validate token budget
    const estimatedTokens = this.estimateTokens(summary);
    console.log(`📊 Context summary tokens: ~${estimatedTokens} (target: ${this.MAX_TOKEN_ESTIMATE})`);

    if (estimatedTokens > this.MAX_TOKEN_ESTIMATE * 1.2) {
      console.warn(`⚠️ Context summary exceeds token budget, compressing...`);
      return this.compressSummary(summary);
    }

    console.log(`✅ Context summary built successfully (v${summary.version})`);
    return summary;
  }

  /**
   * Create minimal summary for early stages (< 3 stages)
   */
  private createMinimalSummary(
    stages: Stage[],
    insights: RichInsight[],
    questions: TrackedQuestion[]
  ): ContextSummary {
    const stageTypes = stages.map(s => s.type).join(', ');
    const insightTexts = insights.slice(-5).map(i => i.insight).join(' ');

    return {
      overallSummary: `Journey in progress: ${stages.length} stage(s) completed (${stageTypes}). Key focus: ${insightTexts.substring(0, 200)}...`,
      stageClusterSummaries: [],
      keyInsightsSummary: insights.length > 0
        ? `Early insights: ${insights.slice(-3).map(i => i.insight).join('; ')}`
        : 'No insights yet.',
      criticalQuestionsSummary: questions.length > 0
        ? `Questions raised: ${questions.slice(-3).map(q => q.question).join('; ')}`
        : 'No questions yet.',
      emergingPatterns: [],
      contradictions: [],
      lastUpdated: Date.now(),
      version: 1,
    };
  }

  /**
   * Build stage cluster summaries (every 3 stages)
   * Only creates NEW clusters, reuses existing ones for efficiency
   */
  private async buildStageClusterSummaries(
    allStages: Stage[],
    insights: RichInsight[],
    questions: TrackedQuestion[],
    existingClusters: StageClusterSummary[]
  ): Promise<StageClusterSummary[]> {
    const clusters: StageClusterSummary[] = [...existingClusters];
    const totalClusters = Math.ceil(allStages.length / this.CLUSTER_SIZE);
    const existingClusterCount = existingClusters.length;

    // Only create summaries for NEW clusters
    for (let i = existingClusterCount; i < totalClusters; i++) {
      const startIdx = i * this.CLUSTER_SIZE;
      const endIdx = Math.min(startIdx + this.CLUSTER_SIZE, allStages.length);
      const clusterStages = allStages.slice(startIdx, endIdx);

      if (clusterStages.length === 0) continue;

      const clusterSummary = await this.summarizeCluster(
        clusterStages,
        insights,
        questions,
        i + 1
      );

      clusters.push(clusterSummary);
      console.log(`📝 Created cluster summary ${i + 1}: stages ${startIdx + 1}-${endIdx}`);
    }

    return clusters;
  }

  /**
   * Summarize a cluster of 3 stages using Claude
   */
  private async summarizeCluster(
    clusterStages: Stage[],
    allInsights: RichInsight[],
    allQuestions: TrackedQuestion[],
    clusterNumber: number
  ): Promise<StageClusterSummary> {
    const stageNumbers = clusterStages.map((_, idx) => (clusterNumber - 1) * this.CLUSTER_SIZE + idx + 1);
    const stageTypes = clusterStages.map(s => s.type);

    // Find insights and questions from these stages
    const clusterInsights = allInsights.filter(i =>
      stageNumbers.includes(i.stageNumber)
    );
    const clusterQuestions = allQuestions.filter(q =>
      stageNumbers.includes(q.askedInStage)
    );

    // Build prompt for Claude to summarize
    const prompt = `Summarize this cluster of exploration stages concisely (2-3 sentences max).

Stages ${stageNumbers[0]}-${stageNumbers[stageNumbers.length - 1]} (${stageTypes.join(' → ')}):

${clusterStages.map((s, i) => `
**Stage ${stageNumbers[i]} (${s.type})**:
${s.result?.substring(0, 400)}...
`).join('\n')}

**Key Insights** (${clusterInsights.length}):
${clusterInsights.slice(0, 5).map(i => `- ${i.insight}`).join('\n')}

**Questions Raised** (${clusterQuestions.length}):
${clusterQuestions.slice(0, 3).map(q => `- ${q.question}`).join('\n')}

Provide a 2-3 sentence summary capturing:
1. What was explored in these stages
2. Key findings or patterns
3. Main questions or challenges identified

Be concise and specific.`;

    try {
      const response = await claudeService.execute({
        model: this.MODEL,
        prompt,
        maxTokens: 300,
        extendedThinking: false,
      });

      return {
        stages: stageNumbers,
        stageTypes,
        summary: response.content.trim(),
        keyInsights: clusterInsights.slice(0, 5).map(i => i.id),
        keyQuestions: clusterQuestions.slice(0, 3).map(q => q.id),
        createdAt: Date.now(),
      };
    } catch (error) {
      console.error(`Failed to summarize cluster ${clusterNumber}:`, error);

      // Fallback: create basic summary without Claude
      return {
        stages: stageNumbers,
        stageTypes,
        summary: `Stages ${stageNumbers[0]}-${stageNumbers[stageNumbers.length - 1]}: ${stageTypes.join(' → ')}. ${clusterInsights.length} insights, ${clusterQuestions.length} questions.`,
        keyInsights: clusterInsights.slice(0, 5).map(i => i.id),
        keyQuestions: clusterQuestions.slice(0, 3).map(q => q.id),
        createdAt: Date.now(),
      };
    }
  }

  /**
   * Build overall journey summary (2-3 paragraphs)
   */
  private async buildOverallSummary(
    stages: Stage[],
    insights: RichInsight[],
    questions: TrackedQuestion[],
    clusterSummaries: StageClusterSummary[]
  ): Promise<string> {
    const originalQuestion = stages[0]?.prompt.split('\n')[0] || 'Unknown';

    const prompt = `Create a comprehensive 2-3 paragraph summary of this exploration journey.

**Original Question**: ${originalQuestion.substring(0, 200)}

**Journey Progress**:
- ${stages.length} stages completed
- ${insights.length} insights gathered
- ${questions.length} questions raised

**Stage Cluster Summaries**:
${clusterSummaries.map((c, i) =>
  `Cluster ${i + 1} (Stages ${c.stages.join('-')}): ${c.summary}`
).join('\n')}

**Recent Progress** (last 2 stages):
${stages.slice(-2).map((s, i) => `
Stage ${stages.length - 1 + i} (${s.type}): ${s.result?.substring(0, 300)}...
`).join('\n')}

Write 2-3 paragraphs that:
1. State the original question and overall goal
2. Summarize the exploration journey and major milestones
3. Highlight key discoveries and current understanding

Be concise but comprehensive. This summary will be used as context for future stages.`;

    try {
      const response = await claudeService.execute({
        model: this.MODEL,
        prompt,
        maxTokens: 500,
        extendedThinking: false,
      });

      return response.content.trim();
    } catch (error) {
      console.error('Failed to build overall summary:', error);

      // Fallback summary
      return `Journey exploring: ${originalQuestion.substring(0, 100)}. ${stages.length} stages completed across ${clusterSummaries.length} clusters. ${insights.length} insights gathered, ${questions.length} questions raised. Currently in ${stages[stages.length - 1]?.type} stage.`;
    }
  }

  /**
   * Build condensed summary of top 10 key insights
   */
  private async buildKeyInsightsSummary(insights: RichInsight[]): Promise<string> {
    if (insights.length === 0) {
      return 'No insights yet.';
    }

    // Sort by importance and take top 10
    const topInsights = insights
      .sort((a, b) => {
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return importanceOrder[b.importance] - importanceOrder[a.importance];
      })
      .slice(0, 10);

    const prompt = `Condense these top insights into a brief summary (3-4 sentences).

**Top ${topInsights.length} Insights**:
${topInsights.map((i, idx) =>
  `${idx + 1}. [${i.importance}] ${i.insight} (Stage ${i.stageNumber}: ${i.stageType})`
).join('\n')}

Create a 3-4 sentence summary that captures:
- The most critical findings
- Key patterns or themes
- Main discoveries

Be concise and actionable.`;

    try {
      const response = await claudeService.execute({
        model: this.MODEL,
        prompt,
        maxTokens: 200,
        extendedThinking: false,
      });

      return response.content.trim();
    } catch (error) {
      console.error('Failed to summarize key insights:', error);

      // Fallback: just list top 5
      return topInsights.slice(0, 5).map(i => i.insight).join('; ');
    }
  }

  /**
   * Build summary of top 5 critical unanswered questions
   */
  private async buildCriticalQuestionsSummary(questions: TrackedQuestion[]): Promise<string> {
    const unanswered = questions.filter(q => q.status === 'unanswered' || q.status === 'partial');

    if (unanswered.length === 0) {
      return 'All critical questions answered.';
    }

    // Sort by priority and take top 5
    const topQuestions = unanswered
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);

    const prompt = `Summarize these critical unanswered questions (2-3 sentences).

**Top ${topQuestions.length} Unanswered Questions**:
${topQuestions.map((q, idx) =>
  `${idx + 1}. [${q.priority}] ${q.question} (Stage ${q.askedInStage})`
).join('\n')}

Create a 2-3 sentence summary highlighting:
- The most critical open questions
- What areas need investigation
- What's blocking progress

Be concise and specific.`;

    try {
      const response = await claudeService.execute({
        model: this.MODEL,
        prompt,
        maxTokens: 200,
        extendedThinking: false,
      });

      return response.content.trim();
    } catch (error) {
      console.error('Failed to summarize critical questions:', error);

      // Fallback: just list top 3
      return topQuestions.slice(0, 3).map(q => q.question).join('; ');
    }
  }

  /**
   * Detect emerging patterns across stages
   */
  private detectEmergingPatterns(stages: Stage[], insights: RichInsight[]): string[] {
    const patterns: string[] = [];

    // Pattern 1: Recurring themes in insights
    const insightTexts = insights.map(i => i.insight.toLowerCase());
    const words = insightTexts.join(' ').split(/\s+/);
    const wordFreq = new Map<string, number>();

    // Count significant words (exclude common words)
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'can']);

    for (const word of words) {
      if (word.length > 4 && !stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    // Find words mentioned 3+ times
    for (const [word, count] of wordFreq.entries()) {
      if (count >= 3) {
        patterns.push(`Recurring theme: "${word}" (mentioned ${count} times)`);
      }
    }

    // Pattern 2: Stage type patterns
    const stageTypeSequence = stages.map(s => s.type).join(' → ');
    if (stages.length >= 6) {
      patterns.push(`Stage progression: ${stageTypeSequence}`);
    }

    // Pattern 3: Category patterns in insights
    const categoryCount = new Map<string, number>();
    for (const insight of insights) {
      categoryCount.set(insight.category, (categoryCount.get(insight.category) || 0) + 1);
    }

    const entries = Array.from(categoryCount.entries());
    const topCategory = entries.sort((a, b) => b[1] - a[1])[0];

    if (topCategory && topCategory[1] >= 3) {
      patterns.push(`Primary insight type: ${topCategory[0]} (${topCategory[1]} insights)`);
    }

    return patterns.slice(0, 5); // Return top 5 patterns
  }

  /**
   * Detect contradictions between insights
   */
  private detectContradictions(insights: RichInsight[]): Contradiction[] {
    const contradictions: Contradiction[] = [];

    // Simple heuristic: look for insights with opposing keywords
    const oppositeKeywords = [
      ['increase', 'decrease'],
      ['benefit', 'drawback'],
      ['advantage', 'disadvantage'],
      ['positive', 'negative'],
      ['support', 'oppose'],
      ['effective', 'ineffective'],
      ['success', 'failure'],
      ['important', 'unimportant'],
    ];

    for (let i = 0; i < insights.length; i++) {
      for (let j = i + 1; j < insights.length; j++) {
        const insightA = insights[i];
        const insightB = insights[j];

        // Check for opposite keywords
        for (const [word1, word2] of oppositeKeywords) {
          const aHasWord1 = insightA.insight.toLowerCase().includes(word1);
          const aHasWord2 = insightA.insight.toLowerCase().includes(word2);
          const bHasWord1 = insightB.insight.toLowerCase().includes(word1);
          const bHasWord2 = insightB.insight.toLowerCase().includes(word2);

          if ((aHasWord1 && bHasWord2) || (aHasWord2 && bHasWord1)) {
            // Check if they're about similar topics (have common words)
            const wordsA = new Set(insightA.insight.toLowerCase().split(/\s+/));
            const wordsB = new Set(insightB.insight.toLowerCase().split(/\s+/));
            const commonWords = Array.from(wordsA).filter(w => wordsB.has(w) && w.length > 4);

            if (commonWords.length >= 2) {
              contradictions.push({
                description: `Potential contradiction regarding ${commonWords.join(', ')}`,
                sourceA: `${insightA.id} (Stage ${insightA.stageNumber})`,
                sourceB: `${insightB.id} (Stage ${insightB.stageNumber})`,
                resolved: false,
              });
            }
          }
        }
      }
    }

    return contradictions.slice(0, 3); // Return top 3 contradictions
  }

  /**
   * Estimate token count for summary (rough approximation)
   */
  private estimateTokens(summary: ContextSummary): number {
    const text = JSON.stringify(summary);
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Compress summary if it exceeds token budget
   */
  private compressSummary(summary: ContextSummary): ContextSummary {
    // Strategy: Keep only the most recent cluster summaries
    const maxClusters = 5; // Keep last 5 clusters
    const compressedClusters = summary.stageClusterSummaries.slice(-maxClusters);

    return {
      ...summary,
      stageClusterSummaries: compressedClusters,
      // Truncate other fields if needed
      overallSummary: summary.overallSummary.substring(0, 800),
      keyInsightsSummary: summary.keyInsightsSummary.substring(0, 500),
      criticalQuestionsSummary: summary.criticalQuestionsSummary.substring(0, 500),
      emergingPatterns: summary.emergingPatterns.slice(0, 3),
      contradictions: summary.contradictions.slice(0, 2),
    };
  }

  /**
   * Format context summary for use in stage prompts
   * Returns a condensed, readable format
   */
  formatForPrompt(summary: ContextSummary | null): string {
    if (!summary) {
      return '';
    }

    return `
<hierarchical_context>
**JOURNEY OVERVIEW**:
${summary.overallSummary}

**STAGE CLUSTERS** (Progressive Detail):
${summary.stageClusterSummaries.map((cluster, idx) =>
  `Cluster ${idx + 1} (Stages ${cluster.stages.join('-')}): ${cluster.summary}`
).join('\n')}

**KEY INSIGHTS**:
${summary.keyInsightsSummary}

**CRITICAL OPEN QUESTIONS**:
${summary.criticalQuestionsSummary}

${summary.emergingPatterns.length > 0 ? `
**EMERGING PATTERNS**:
${summary.emergingPatterns.map(p => `- ${p}`).join('\n')}
` : ''}

${summary.contradictions.length > 0 ? `
**CONTRADICTIONS TO RESOLVE**:
${summary.contradictions.map(c => `- ${c.description}`).join('\n')}
` : ''}
</hierarchical_context>
`;
  }
}
