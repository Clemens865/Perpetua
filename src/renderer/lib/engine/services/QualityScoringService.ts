/**
 * Quality Scoring Service
 *
 * Evaluates stage output quality using Claude Haiku for fast, cost-effective scoring.
 * Implements self-reflection and continuous improvement by assessing 6 quality dimensions:
 * - Completeness: Did it address all required elements?
 * - Depth: How thorough was the analysis?
 * - Specificity: Concrete examples vs vague generalizations?
 * - Actionability: Can someone use this immediately?
 * - Coherence: Logical structure and clarity?
 * - Novelty: New insights vs obvious information?
 *
 * Scores are 0-10 per dimension, with overall average. Stages scoring < 6.0 are
 * flagged for revision with specific improvement suggestions.
 */

import type { Stage, StageType } from '../../../../types';
import type { QualityReport, QualityScores } from '../types/optimization-types';
import { claudeService, type ClaudeModel } from '../../../services/claude/ClaudeService';

const QUALITY_MODEL: ClaudeModel = 'claude-haiku-4-5'; // Fast and cost-effective
const MAX_QUALITY_TOKENS = 1000; // Keep evaluation concise

/**
 * Quality scoring criteria per stage type
 * Each stage has specific expectations that influence scoring
 */
const STAGE_QUALITY_CRITERIA: Record<StageType, string> = {
  discovering: `
- Completeness: Covers core concepts, historical context, current state, interdisciplinary connections
- Depth: Goes beyond surface-level, provides detailed explanations
- Specificity: Includes concrete examples, specific sources, precise definitions
- Actionability: Identifies clear next steps, areas for further research
- Coherence: Well-structured research report with logical flow
- Novelty: Reveals non-obvious insights, unique perspectives, surprising connections`,

  chasing: `
- Completeness: Identifies surface symptoms, root causes, hidden assumptions, systemic patterns
- Depth: Traces problems through 5-Why analysis, explores interconnections
- Specificity: Clear cause-effect relationships, specific examples of problems
- Actionability: Identifies leverage points for intervention
- Coherence: Logical problem mapping with clear hierarchies
- Novelty: Uncovers non-obvious root causes, challenges conventional thinking`,

  solving: `
- Completeness: Generates 5-7 diverse solutions across different categories
- Depth: Each solution has implementation details, feasibility analysis, risk assessment
- Specificity: Concrete first steps, success metrics, resource requirements
- Actionability: Solutions can be implemented with clear next actions
- Coherence: Solutions ranked by priority, complementary approaches identified
- Novelty: Includes unconventional and innovative approaches, not just obvious fixes`,

  challenging: `
- Completeness: Identifies explicit, implicit, and hidden assumptions; assesses risks and blind spots
- Depth: Genuine adversarial analysis, not superficial criticism
- Specificity: Concrete counter-examples, specific failure modes
- Actionability: Provides mitigation strategies for identified risks
- Coherence: Distinguishes fatal flaws from minor issues, prioritizes concerns
- Novelty: Reveals non-obvious weaknesses, unexpected failure modes`,

  questioning: `
- Completeness: 15-20 questions across all 6 categories (clarifying, probing, hypothetical, challenge, meta, future)
- Depth: Probing questions go 5 levels deep, not just surface-level
- Specificity: Questions are specific and actionable, not vague or generic
- Actionability: Questions can be researched and answered
- Coherence: Questions prioritized and categorized clearly
- Novelty: Asks non-obvious questions that reveal new angles`,

  searching: `
- Completeness: Answers top priority questions with thorough research
- Depth: Multiple authoritative sources per question, cross-referenced
- Specificity: Specific citations with URLs, publication dates, concrete evidence
- Actionability: Clear answers with confidence levels and remaining gaps
- Coherence: Well-organized research findings with source quality assessment
- Novelty: Discovers surprising information, challenges assumptions with evidence`,

  imagining: `
- Completeness: At least 4 distinct scenarios (best-case, worst-case, likely, wildcard) with timelines
- Depth: Detailed narratives with key drivers, indicators, stakeholder impacts
- Specificity: Concrete timelines (1yr, 5yr, 10yr), specific decision points
- Actionability: Identifies early warning signals and robust strategies
- Coherence: Clear scenario logic, realistic causal mechanisms
- Novelty: Wildcard scenarios challenge conventional thinking, innovative possibilities`,

  building: `
- Completeness: 1-3 high-quality artifacts fully developed, not sketches
- Depth: Artifacts include examples, usage instructions, metadata
- Specificity: Professional formatting, concrete details, no vague placeholders
- Actionability: Artifacts can be used immediately by someone else
- Coherence: Well-structured, clear documentation, logical organization
- Novelty: Artifacts provide unique value, not just rehashing existing content`,
};

/**
 * Evaluation prompt for Claude Haiku
 * Optimized for fast, accurate quality assessment
 */
const QUALITY_EVALUATION_PROMPT = (stage: Stage, criteria: string): string => `
You are a quality assessor evaluating the output of a ${stage.type.toUpperCase()} stage in an exploration journey.

<stage_output>
${stage.result}
</stage_output>

<evaluation_criteria>
Evaluate this output on 6 dimensions (score 0-10 for each):

${criteria}
</evaluation_criteria>

<scoring_scale>
10: Exceptional - Far exceeds expectations
8-9: Excellent - Exceeds expectations in most areas
6-7: Good - Meets expectations with minor gaps
4-5: Adequate - Meets some expectations but has significant gaps
2-3: Poor - Falls short of most expectations
0-1: Unacceptable - Fails to meet basic requirements
</scoring_scale>

<instructions>
1. Score each dimension 0-10
2. Identify 2-3 specific strengths (what was done well)
3. Identify 2-3 specific weaknesses (what could be improved)
4. Provide 2-3 concrete improvement suggestions
5. Determine if revision is needed (overall score < 6.0)
6. If revision needed, provide specific revision suggestions

Be honest and constructive. Focus on actionable feedback.
</instructions>

<output_format>
Return ONLY valid JSON (no markdown, no explanations):
{
  "scores": {
    "completeness": 7,
    "depth": 8,
    "specificity": 6,
    "actionability": 7,
    "coherence": 9,
    "novelty": 5
  },
  "strengths": [
    "Specific strength with example",
    "Another strength"
  ],
  "weaknesses": [
    "Specific weakness with example",
    "Another weakness"
  ],
  "improvements": [
    "Concrete improvement suggestion",
    "Another suggestion"
  ],
  "shouldRevise": false,
  "revisionSuggestions": []
}
</output_format>
`.trim();

/**
 * Quality Scoring Service
 */
export class QualityScoringService {
  /**
   * Evaluate the quality of a stage's output
   * Returns a comprehensive quality report with scores and recommendations
   */
  async evaluateStageQuality(stage: Stage): Promise<QualityReport> {
    console.log(`📊 Evaluating quality for ${stage.type} stage...`);

    try {
      // Get stage-specific criteria
      const criteria = STAGE_QUALITY_CRITERIA[stage.type];

      // Build evaluation prompt
      const prompt = QUALITY_EVALUATION_PROMPT(stage, criteria);

      // Call Claude Haiku for fast evaluation
      const response = await claudeService.execute({
        model: QUALITY_MODEL,
        prompt,
        maxTokens: MAX_QUALITY_TOKENS,
        extendedThinking: false, // No need for extended thinking in evaluation
        stream: false, // No streaming for evaluation
      });

      // Parse JSON response
      const evaluation = this.parseEvaluationResponse(response.content);

      // Calculate overall score (average of all dimensions)
      const scores = evaluation.scores;
      const overallScore = (
        scores.completeness +
        scores.depth +
        scores.specificity +
        scores.actionability +
        scores.coherence +
        scores.novelty
      ) / 6;

      // Build quality report
      const report: QualityReport = {
        stageId: stage.id,
        stageType: stage.type,
        scores: evaluation.scores,
        overallScore: Math.round(overallScore * 10) / 10, // Round to 1 decimal
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        improvements: evaluation.improvements,
        shouldRevise: overallScore < 6.0, // Flag for revision if below threshold
        revisionSuggestions: overallScore < 6.0 ? evaluation.revisionSuggestions : [],
        evaluatedAt: Date.now(),
      };

      // Log results
      console.log(`✅ Quality evaluation complete:`);
      console.log(`   Overall Score: ${report.overallScore}/10`);
      console.log(`   Completeness: ${scores.completeness}/10`);
      console.log(`   Depth: ${scores.depth}/10`);
      console.log(`   Specificity: ${scores.specificity}/10`);
      console.log(`   Actionability: ${scores.actionability}/10`);
      console.log(`   Coherence: ${scores.coherence}/10`);
      console.log(`   Novelty: ${scores.novelty}/10`);

      if (report.shouldRevise) {
        console.log(`⚠️  Quality below threshold (6.0) - revision recommended`);
      }

      return report;

    } catch (error) {
      console.error('❌ Quality evaluation failed:', error);

      // Return default report on error
      return this.createDefaultReport(stage, error);
    }
  }

  /**
   * Parse the JSON evaluation response from Claude
   * Handles malformed JSON gracefully
   */
  private parseEvaluationResponse(content: string): {
    scores: QualityScores;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    revisionSuggestions: string[];
  } {
    try {
      // Remove markdown code blocks if present
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
      }

      // Parse JSON
      const parsed = JSON.parse(jsonContent);

      // Validate and normalize scores
      const scores: QualityScores = {
        completeness: this.normalizeScore(parsed.scores?.completeness),
        depth: this.normalizeScore(parsed.scores?.depth),
        specificity: this.normalizeScore(parsed.scores?.specificity),
        actionability: this.normalizeScore(parsed.scores?.actionability),
        coherence: this.normalizeScore(parsed.scores?.coherence),
        novelty: this.normalizeScore(parsed.scores?.novelty),
      };

      return {
        scores,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        revisionSuggestions: Array.isArray(parsed.revisionSuggestions) ? parsed.revisionSuggestions : [],
      };
    } catch (error) {
      console.error('Failed to parse evaluation response:', error);
      throw new Error('Invalid evaluation response format');
    }
  }

  /**
   * Normalize a score to 0-10 range
   */
  private normalizeScore(score: any): number {
    const num = typeof score === 'number' ? score : parseFloat(score);
    if (isNaN(num)) return 5; // Default to middle score on error
    return Math.max(0, Math.min(10, num)); // Clamp to 0-10
  }

  /**
   * Create a default report when evaluation fails
   */
  private createDefaultReport(stage: Stage, error: any): QualityReport {
    return {
      stageId: stage.id,
      stageType: stage.type,
      scores: {
        completeness: 5,
        depth: 5,
        specificity: 5,
        actionability: 5,
        coherence: 5,
        novelty: 5,
      },
      overallScore: 5.0,
      strengths: ['Evaluation failed - unable to assess strengths'],
      weaknesses: [`Evaluation error: ${error instanceof Error ? error.message : String(error)}`],
      improvements: ['Re-run quality evaluation when service is available'],
      shouldRevise: false,
      revisionSuggestions: [],
      evaluatedAt: Date.now(),
    };
  }

  /**
   * Batch evaluate multiple stages
   * Useful for evaluating entire journeys
   */
  async evaluateMultipleStages(stages: Stage[]): Promise<QualityReport[]> {
    console.log(`📊 Batch evaluating ${stages.length} stages...`);

    const reports: QualityReport[] = [];
    for (const stage of stages) {
      const report = await this.evaluateStageQuality(stage);
      reports.push(report);
    }

    // Log aggregate statistics
    const avgScore = reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length;
    const needRevision = reports.filter(r => r.shouldRevise).length;

    console.log(`✅ Batch evaluation complete:`);
    console.log(`   Average Score: ${avgScore.toFixed(1)}/10`);
    console.log(`   Stages needing revision: ${needRevision}/${reports.length}`);

    return reports;
  }

  /**
   * Get quality trend over time
   * Returns array of scores for visualization
   */
  getQualityTrend(reports: QualityReport[]): number[] {
    return reports.map(r => r.overallScore);
  }

  /**
   * Calculate quality statistics for a journey
   */
  getQualityStatistics(reports: QualityReport[]): {
    average: number;
    min: number;
    max: number;
    needsRevision: number;
    totalStages: number;
    scoresByDimension: {
      completeness: number;
      depth: number;
      specificity: number;
      actionability: number;
      coherence: number;
      novelty: number;
    };
  } {
    if (reports.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        needsRevision: 0,
        totalStages: 0,
        scoresByDimension: {
          completeness: 0,
          depth: 0,
          specificity: 0,
          actionability: 0,
          coherence: 0,
          novelty: 0,
        },
      };
    }

    const scores = reports.map(r => r.overallScore);
    const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const needsRevision = reports.filter(r => r.shouldRevise).length;

    // Calculate average per dimension
    const scoresByDimension = {
      completeness: reports.reduce((sum, r) => sum + r.scores.completeness, 0) / reports.length,
      depth: reports.reduce((sum, r) => sum + r.scores.depth, 0) / reports.length,
      specificity: reports.reduce((sum, r) => sum + r.scores.specificity, 0) / reports.length,
      actionability: reports.reduce((sum, r) => sum + r.scores.actionability, 0) / reports.length,
      coherence: reports.reduce((sum, r) => sum + r.scores.coherence, 0) / reports.length,
      novelty: reports.reduce((sum, r) => sum + r.scores.novelty, 0) / reports.length,
    };

    return {
      average: Math.round(average * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      needsRevision,
      totalStages: reports.length,
      scoresByDimension,
    };
  }
}

// Export singleton instance
export const qualityScoringService = new QualityScoringService();
