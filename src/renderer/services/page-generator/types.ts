/**
 * Shared types for page generation
 */

import type { Journey, PageMetadata } from '@/types';
import type { JourneyAnalysis } from '../claude/ClaudePageAnalyzer';

export interface TemplateGenerationResult {
  content: string;
  metadata: PageMetadata;
}

export interface TemplateGenerator {
  (journey: Journey, analysis?: JourneyAnalysis | null): Promise<TemplateGenerationResult>;
}
