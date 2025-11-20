/**
 * Types for chunked page generation with progress tracking
 */

export type GenerationStage = 'hero' | 'overview' | 'stages' | 'insights' | 'combining';

export interface GenerationProgress {
  stage: GenerationStage;
  current: number;
  total: number;
  message: string;
  timestamp: number;
  chunkIndex?: number;
  totalChunks?: number;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

export interface CachedGeneration {
  journeyId: string;
  templateType: string;
  timestamp: number;
  sections: {
    hero?: string;
    overview?: string;
    stages?: { [stageId: string]: string };
    insights?: string;
  };
  completedSteps: GenerationStage[];
}

export interface SectionGenerationResult {
  content: string;
  stage: GenerationStage;
  error?: Error;
}

export type NetworkQuality = 'good' | 'fair' | 'poor';
