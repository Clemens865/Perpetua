/**
 * Chunked Page Generator
 * Breaks page generation into smaller, resilient chunks with progress tracking and caching
 */

import { claudeService } from './ClaudeService';
import type { Journey, Stage } from '../../types';
import type { JourneyAnalysis } from './ClaudePageAnalyzer';
import type { GeneratedPage } from './ClaudePageGenerator';
import type { DesignStyle } from '../../types/design-language';
import type {
  GenerationProgress,
  ProgressCallback,
  GenerationStage,
  SectionGenerationResult
} from './types/generation-progress';
import { executeWithBackoff, isNetworkError } from './utils/retry-utils';
import { GenerationCache } from './utils/generation-cache';
import { checkNetworkQuality } from './utils/network-check';

export class ChunkedPageGenerator {
  private cache: GenerationCache;

  constructor() {
    this.cache = new GenerationCache();
  }

  /**
   * Generate page with chunked approach and progress tracking
   */
  async generateWithProgress(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string,
    onProgress?: ProgressCallback,
    designStyle?: DesignStyle
  ): Promise<GeneratedPage> {
    const startTime = Date.now();
    console.log(`🎨 Starting chunked generation for ${templateType} page...`);

    // Pre-flight network quality check
    const networkCheck = await checkNetworkQuality();
    if (networkCheck.quality === 'poor') {
      console.warn(`⚠️  Network quality is ${networkCheck.quality} (latency: ${networkCheck.latency}ms)`);
      console.warn('Generation may fail or be slow. Consider waiting for better connection.');
    } else {
      console.log(`✅ Network quality: ${networkCheck.quality} (latency: ${networkCheck.latency}ms)`);
    }

    // Check for cached partial results
    const cached = this.cache.get(journey.id, templateType);
    const sections: SectionGenerationResult[] = [];

    try {
      // Section 1: Hero/Header (2-3 min)
      if (cached?.sections.hero) {
        console.log('📦 Using cached hero section');
        sections.push({ content: cached.sections.hero, stage: 'hero' });
      } else {
        onProgress?.({
          stage: 'hero',
          current: 1,
          total: 5,
          message: 'Generating hero section...',
          timestamp: Date.now()
        });

        const hero = await this.generateHeroSection(journey, analysis, templateType);
        sections.push(hero);

        // Cache immediately
        this.cache.save(journey.id, templateType, {
          sections: { hero: hero.content },
          completedSteps: ['hero']
        });
      }

      // Section 2: Overview (2-3 min)
      if (cached?.sections.overview) {
        console.log('📦 Using cached overview section');
        sections.push({ content: cached.sections.overview, stage: 'overview' });
      } else {
        onProgress?.({
          stage: 'overview',
          current: 2,
          total: 5,
          message: 'Generating journey overview...',
          timestamp: Date.now()
        });

        const overview = await this.generateOverviewSection(journey, analysis, templateType);
        sections.push(overview);

        this.cache.save(journey.id, templateType, {
          sections: {
            hero: sections[0].content,
            overview: overview.content
          },
          completedSteps: ['hero', 'overview']
        });
      }

      // Section 3: Stages in chunks (2-3 stages per chunk, 2-3 min each)
      const stageChunks = this.chunkStages(journey.stages, 3);
      const stageResults: { [stageId: string]: string } = { ...(cached?.sections.stages || {}) };

      for (let i = 0; i < stageChunks.length; i++) {
        const chunk = stageChunks[i];
        const chunkKey = `chunk_${i}`;

        if (stageResults[chunkKey]) {
          console.log(`📦 Using cached stage chunk ${i + 1}/${stageChunks.length}`);
          sections.push({ content: stageResults[chunkKey], stage: 'stages' });
        } else {
          onProgress?.({
            stage: 'stages',
            current: 3 + i,
            total: 5 + stageChunks.length - 1,
            message: `Generating stages ${chunk[0].type} to ${chunk[chunk.length - 1].type}...`,
            timestamp: Date.now(),
            chunkIndex: i + 1,
            totalChunks: stageChunks.length
          });

          const stageSection = await this.generateStagesChunk(chunk, journey, analysis, templateType);
          sections.push(stageSection);
          stageResults[chunkKey] = stageSection.content;

          this.cache.save(journey.id, templateType, {
            sections: {
              hero: sections[0].content,
              overview: sections[1].content,
              stages: stageResults
            },
            completedSteps: ['hero', 'overview', 'stages']
          });
        }
      }

      // Section 4: Insights Summary (2 min)
      if (cached?.sections.insights) {
        console.log('📦 Using cached insights section');
        sections.push({ content: cached.sections.insights, stage: 'insights' });
      } else {
        onProgress?.({
          stage: 'insights',
          current: 3 + stageChunks.length,
          total: 5 + stageChunks.length - 1,
          message: 'Generating insights summary...',
          timestamp: Date.now()
        });

        const insights = await this.generateInsightsSection(journey, analysis, templateType);
        sections.push(insights);

        this.cache.save(journey.id, templateType, {
          sections: {
            hero: sections[0].content,
            overview: sections[1].content,
            stages: stageResults,
            insights: insights.content
          },
          completedSteps: ['hero', 'overview', 'stages', 'insights']
        });
      }

      // Section 5: Combine & Wrap (1 min)
      onProgress?.({
        stage: 'combining',
        current: 4 + stageChunks.length,
        total: 5 + stageChunks.length - 1,
        message: 'Combining sections and finalizing...',
        timestamp: Date.now()
      });

      const html = this.combineSections(sections, journey, analysis, templateType);

      // Clear cache on success
      this.cache.clear(journey.id, templateType);

      const generationTime = Date.now() - startTime;
      console.log(`✅ Chunked generation completed in ${(generationTime / 1000).toFixed(1)}s`);

      return {
        html,
        metadata: {
          generatedBy: 'claude',
          model: 'claude-sonnet-4-5-20250929',
          generationTime,
          templateType
        }
      };

    } catch (error) {
      console.error('❌ Chunked generation failed:', error);

      // If network error, keep cache for resume
      if (error instanceof Error && isNetworkError(error)) {
        console.log('💾 Cache preserved for resume attempt');
        throw new Error(`Network error during generation. Progress saved. Please retry to resume from: ${cached?.completedSteps.join(' → ') || 'start'}`);
      }

      // Clear cache on other errors
      this.cache.clear(journey.id, templateType);
      throw error;
    }
  }

  /**
   * Generate hero/header section
   */
  private async generateHeroSection(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string
  ): Promise<SectionGenerationResult> {
    console.log('🎭 Generating hero section...');

    const prompt = `Create the hero/header section for a ${templateType} page about: "${journey.input}"

Content Type: ${analysis.contentType}
Key Themes: ${analysis.keyThemes.join(', ')}
Total Stages: ${journey.stages.length}

Generate ONLY the hero section HTML including:
- Title and subtitle
- Key visual or illustration
- Navigation menu (if applicable for ${templateType})
- Opening statement

Return ONLY the HTML for this section (not full page), properly formatted and styled.`;

    const response = await executeWithBackoff(
      () => claudeService.execute({
        prompt,
        model: 'claude-sonnet-4-5-20250929',
        extendedThinking: true,
        thinkingBudget: 2000,
        maxTokens: 4000,
        stream: true
      }),
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, error) => {
          console.log(`🔄 Retrying hero section (attempt ${attempt})...`);
        }
      }
    );

    return {
      content: this.extractSectionHTML(response.content),
      stage: 'hero'
    };
  }

  /**
   * Generate overview section
   */
  private async generateOverviewSection(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string
  ): Promise<SectionGenerationResult> {
    console.log('📊 Generating overview section...');

    // Collect high-level insights
    const insights = journey.stages
      .flatMap(s => s.artifacts)
      .slice(0, 10)
      .map(a => `- ${a.title}`);

    const prompt = `Create the overview section for a ${templateType} page about: "${journey.input}"

Journey Statistics:
- Total Stages: ${journey.stages.length}
- Duration: ${this.calculateDuration(journey)}
- Status: ${journey.status}

Key Insights (first 10):
${insights.join('\n')}

Stage Types Covered:
${journey.stages.map(s => s.type).join(' → ')}

Generate ONLY the overview section HTML including:
- Journey summary
- Key statistics visualization
- Timeline or progression indicator
- What to expect in the full journey

Return ONLY the HTML for this section, properly formatted and styled.`;

    const response = await executeWithBackoff(
      () => claudeService.execute({
        prompt,
        model: 'claude-sonnet-4-5-20250929',
        extendedThinking: true,
        thinkingBudget: 2000,
        maxTokens: 4000,
        stream: true
      }),
      {
        maxRetries: 3,
        baseDelay: 1000
      }
    );

    return {
      content: this.extractSectionHTML(response.content),
      stage: 'overview'
    };
  }

  /**
   * Generate a chunk of stages
   */
  private async generateStagesChunk(
    stages: Stage[],
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string
  ): Promise<SectionGenerationResult> {
    console.log(`📚 Generating stages ${stages[0].type} to ${stages[stages.length - 1].type}...`);

    const stagesContent = stages.map((stage, localIdx) => {
      const globalIdx = journey.stages.indexOf(stage);
      const artifactsContent = stage.artifacts.length > 0
        ? stage.artifacts.map((artifact, idx) => `
### Artifact ${idx + 1}: ${artifact.title}
Type: ${artifact.type}
${artifact.content.substring(0, 500)}${artifact.content.length > 500 ? '...' : ''}
`).join('\n')
        : 'No artifacts';

      return `
## Stage ${globalIdx + 1}: ${stage.type.toUpperCase()}

### Result:
${stage.result.substring(0, 1000)}${stage.result.length > 1000 ? '...' : ''}

${stage.thinking ? `### Key Thinking:\n${stage.thinking.substring(0, 500)}...\n` : ''}

### Artifacts:
${artifactsContent}
`;
    }).join('\n---\n');

    const prompt = `Create the stages section for stages ${stages[0].type} to ${stages[stages.length - 1].type} in a ${templateType} page.

Context: "${journey.input}"
Content Type: ${analysis.contentType}

Stages Content:
${stagesContent}

Generate ONLY the HTML for these ${stages.length} stages including:
- Interactive cards or sections for each stage
- Visual hierarchy and clear progression
- Expandable/collapsible details if needed
- Engaging visual elements

Return ONLY the HTML for this stage chunk, properly formatted and styled.`;

    const response = await executeWithBackoff(
      () => claudeService.execute({
        prompt,
        model: 'claude-sonnet-4-5-20250929',
        extendedThinking: true,
        thinkingBudget: 3000,
        maxTokens: 8000,
        stream: true
      }),
      {
        maxRetries: 3,
        baseDelay: 1000
      }
    );

    return {
      content: this.extractSectionHTML(response.content),
      stage: 'stages'
    };
  }

  /**
   * Generate insights summary section
   */
  private async generateInsightsSection(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string
  ): Promise<SectionGenerationResult> {
    console.log('💡 Generating insights section...');

    const allInsights = journey.stages
      .flatMap(s => s.artifacts)
      .map(a => `- ${a.title}: ${a.content.substring(0, 200)}`);

    const prompt = `Create the insights summary section for a ${templateType} page about: "${journey.input}"

All Journey Insights:
${allInsights.slice(0, 20).join('\n')}
${allInsights.length > 20 ? `\n... and ${allInsights.length - 20} more insights` : ''}

Generate ONLY the insights section HTML including:
- Key findings summary
- Recommendations or next steps
- Related questions or areas for exploration
- Call-to-action or conclusion

Return ONLY the HTML for this section, properly formatted and styled.`;

    const response = await executeWithBackoff(
      () => claudeService.execute({
        prompt,
        model: 'claude-sonnet-4-5-20250929',
        extendedThinking: true,
        thinkingBudget: 2000,
        maxTokens: 4000,
        stream: true
      }),
      {
        maxRetries: 3,
        baseDelay: 1000
      }
    );

    return {
      content: this.extractSectionHTML(response.content),
      stage: 'insights'
    };
  }

  /**
   * Combine all sections into final HTML
   */
  private combineSections(
    sections: SectionGenerationResult[],
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string
  ): string {
    console.log('🔗 Combining sections into final HTML...');

    const combinedBody = sections.map(s => s.content).join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${journey.input} - Perpetua Journey</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }
    h2 {
      font-size: 2rem;
      margin: 2rem 0 1rem;
      color: #34495e;
    }
    h3 {
      font-size: 1.5rem;
      margin: 1.5rem 0 0.5rem;
      color: #546e7a;
    }
    p {
      margin-bottom: 1rem;
    }
    .metadata {
      font-size: 0.9rem;
      color: #7f8c8d;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #ecf0f1;
    }
  </style>
</head>
<body>
  <div class="container">
    ${combinedBody}

    <section class="metadata">
      <p><strong>Generated by Perpetua</strong> - The Infinite Thought Engine</p>
      <p>Template: ${templateType} | Stages: ${journey.stages.length} | Content Type: ${analysis.contentType}</p>
      <p>Created: ${new Date().toISOString()}</p>
    </section>
  </div>
</body>
</html>`;
  }

  /**
   * Extract HTML from Claude response (handles markdown code blocks)
   */
  private extractSectionHTML(content: string): string {
    // Try to extract from markdown code block
    const htmlMatch = content.match(/```html\n([\s\S]*?)\n```/);
    if (htmlMatch) {
      return htmlMatch[1].trim();
    }

    // Return as-is if no code block
    return content.trim();
  }

  /**
   * Chunk stages into groups
   */
  private chunkStages(stages: Stage[], chunkSize: number): Stage[][] {
    const chunks: Stage[][] = [];
    for (let i = 0; i < stages.length; i += chunkSize) {
      chunks.push(stages.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Calculate journey duration
   */
  private calculateDuration(journey: Journey): string {
    if (journey.stages.length === 0) return 'N/A';

    const start = new Date(journey.createdAt).getTime();
    const end = new Date(journey.stages[journey.stages.length - 1].createdAt).getTime();
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) return `${diffMins} minutes`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  }
}

// Export singleton
export const chunkedPageGenerator = new ChunkedPageGenerator();
