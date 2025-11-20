/**
 * Code Snippets for Context Summarization Integration
 * Copy and paste these into ExplorationEngine.ts at the indicated locations
 */

// ============================================================================
// SNIPPET 1: ADD TO IMPORTS (after line 22)
// ============================================================================
import { ContextSummarizationService } from './services/ContextSummarizationService';
// Also update the type import to include ContextSummary:
import type { RichInsight, TrackedQuestion, RichArtifact, ContextSummary } from './types/optimization-types';

// ============================================================================
// SNIPPET 2: ADD TO ExplorationContext TYPE (around line 39)
// ============================================================================
contextSummary?: ContextSummary | null; // Medium #1: Hierarchical context summarization

// ============================================================================
// SNIPPET 3: ADD TO CLASS FIELDS (after line 950: "private context: ExplorationContext;")
// ============================================================================
private contextSummarizer: ContextSummarizationService; // Medium #1

// ============================================================================
// SNIPPET 4: ADD TO CONSTRUCTOR context initialization (around line 965)
// ============================================================================
contextSummary: null, // Medium #1: Initialize null context summary

// ============================================================================
// SNIPPET 5: ADD TO CONSTRUCTOR after context initialization (around line 971)
// ============================================================================
this.contextSummarizer = new ContextSummarizationService(); // Medium #1

// ============================================================================
// SNIPPET 6: ADD AFTER STAGE COMPLETION (around line 1057, after the console.log statements)
// ============================================================================
// Medium #1: Update context summary after every 3 stages
const shouldUpdateSummary = this.context.previousStages.length > 0 &&
                            (this.context.previousStages.length + 1) % 3 === 0;

if (shouldUpdateSummary) {
  console.log(`\n📝 Updating hierarchical context summary (mini-synthesis)...`);
  await this.updateContextSummary();
}

// ============================================================================
// SNIPPET 7: ADD NEW METHOD (after markJourneyComplete method, around line 1154)
// ============================================================================
/**
 * Update hierarchical context summary (Medium #1)
 * Called after every 3 stages (mini-synthesis intervals)
 */
private async updateContextSummary(): Promise<void> {
  try {
    // Convert simple questions to TrackedQuestion objects for summarization
    const trackedQuestions: TrackedQuestion[] = this.context.questions.map((q, idx) => {
      // If already TrackedQuestion, use as-is
      if (typeof q === 'object' && 'id' in q) {
        return q as TrackedQuestion;
      }

      // Otherwise, convert from string (backwards compatibility)
      const question = typeof q === 'string' ? q : String(q);
      return {
        id: `q_${Date.now()}_${idx}`,
        question,
        askedInStage: this.context.previousStages.length,
        stageType: 'questioning',
        priority: 'medium',
        status: 'unanswered',
        relatedInsightIds: [],
        metadata: {},
        createdAt: Date.now(),
      } as TrackedQuestion;
    });

    this.context.contextSummary = await this.contextSummarizer.buildContextSummary(
      this.context.previousStages,
      this.context.richInsights || [],
      trackedQuestions,
      this.context.contextSummary
    );

    console.log(`📊 Context summary updated (v${this.context.contextSummary.version})`);
  } catch (error) {
    console.error('❌ Failed to update context summary:', error);
    // Don't throw - summarization is enhancement, not critical
  }
}

// ============================================================================
// SNIPPET 8: UPDATE DISCOVERING PROMPT (around line 230)
// Replace the "Previous Insights" and "Previous Stage Context" section with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : context.previousStages.length > 0 ? `
Previous Insights:
${context.insights.join('\n')}

Previous Stage Context:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}
` : ''}

// ============================================================================
// SNIPPET 9: UPDATE CHASING PROMPT (around line 308)
// Replace "Context from previous stages" section with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : `
Context from previous stages:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}

Insights gathered:
${context.insights.slice(-10).join('\n')}
`}

// ============================================================================
// SNIPPET 10: UPDATE SOLVING PROMPT (around line 366)
// Replace "Problems identified" and "Previous stage context" with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : `
Problems identified:
${context.insights.slice(-10).join('\n')}

Previous stage context:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 150)}...`).join('\n')}
`}

// ============================================================================
// SNIPPET 11: UPDATE CHALLENGING PROMPT (around line 431)
// Replace "Current solutions and insights" section with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : `
Current solutions and insights:
${context.insights.slice(-5).join('\n')}

Previous stage context:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 150)}...`).join('\n')}
`}

// ============================================================================
// SNIPPET 12: UPDATE QUESTIONING PROMPT (around line 500)
// Replace "Journey so far" section with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : `
Journey so far:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 150)}...`).join('\n')}

Current insights:
${context.insights.slice(-10).join('\n')}
`}

// ============================================================================
// SNIPPET 13: UPDATE IMAGINING PROMPT (around line 705)
// Replace "Everything discovered so far" section with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : `
Everything discovered so far:
${context.insights.slice(-15).join('\n')}

Key findings from recent stages:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}
`}

// ============================================================================
// SNIPPET 14: UPDATE BUILDING PROMPT (around line 822)
// Replace "Recent stage outputs" section with:
// ============================================================================
${context.contextSummary ? `
${this.contextSummarizer.formatForPrompt(context.contextSummary)}
` : `
Recent stage outputs:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}
`}

// ============================================================================
// IMPORTANT NOTES:
// ============================================================================
// 1. The SEARCHING prompt is already handled by QuestionTrackingService
// 2. Make sure to add `this.contextSummarizer` as a class property
// 3. The formatForPrompt() method is called as an instance method
// 4. All prompts have fallback to original format if contextSummary is null
// 5. Summaries are built every 3 stages automatically
// ============================================================================
