/**
 * InsightExtractionService Tests
 *
 * Tests the Claude-powered insight extraction functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { InsightExtractionService } from '../src/renderer/lib/engine/services/InsightExtractionService';
import { claudeService } from '../src/renderer/services/claude/ClaudeService';

describe('InsightExtractionService', () => {
  let service: InsightExtractionService;

  beforeAll(() => {
    service = InsightExtractionService.getInstance();

    // Initialize Claude service with API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      claudeService.initialize(apiKey);
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = InsightExtractionService.getInstance();
      const instance2 = InsightExtractionService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Regex Fallback Extraction', () => {
    it('should extract insights using regex patterns', async () => {
      const content = `
Key findings from our research:
- Important: Machine learning models require large datasets
- Discovered: Transfer learning can reduce training time by 80%
- Significant: Data quality matters more than quantity
      `;

      const insights = await service.extractInsights(content, 'discovering', 1);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0]).toHaveProperty('insight');
      expect(insights[0]).toHaveProperty('category');
      expect(insights[0]).toHaveProperty('importance');
      expect(insights[0].metadata.extractionMethod).toBe('pattern');
    });

    it('should handle empty content gracefully', async () => {
      const insights = await service.extractInsights('', 'discovering', 1);
      expect(insights).toEqual([]);
    });

    it('should handle very short content', async () => {
      const insights = await service.extractInsights('Short text', 'discovering', 1);
      expect(insights).toEqual([]);
    });
  });

  describe('Claude-powered Extraction', () => {
    // Skip these tests if no API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const testFn = apiKey ? it : it.skip;

    testFn('should extract structured insights using Claude', async () => {
      const content = `
# Research Findings

Our analysis revealed several critical insights about neural networks:

1. **Architecture Matters**: Deep neural networks with residual connections
   significantly outperform shallow networks on image classification tasks,
   achieving 95% accuracy compared to 78% with traditional architectures.

2. **Data Efficiency**: Transfer learning from pre-trained models reduces
   the required training data by 90%, making AI accessible to smaller organizations.

3. **Computational Trade-offs**: While larger models provide better accuracy,
   they require exponentially more compute resources. A 10B parameter model
   needs 100x more GPU time than a 1B parameter model for similar tasks.

4. **Open Question**: How can we maintain model performance while reducing
   computational requirements? This remains a key challenge in the field.
      `;

      const insights = await service.extractInsights(content, 'discovering', 1);

      // Should extract multiple insights
      expect(insights.length).toBeGreaterThanOrEqual(3);
      expect(insights.length).toBeLessThanOrEqual(10);

      // Check structure of first insight
      const firstInsight = insights[0];
      expect(firstInsight).toHaveProperty('id');
      expect(firstInsight).toHaveProperty('insight');
      expect(firstInsight).toHaveProperty('category');
      expect(firstInsight).toHaveProperty('importance');
      expect(firstInsight).toHaveProperty('evidence');
      expect(firstInsight).toHaveProperty('confidence');
      expect(firstInsight).toHaveProperty('stageType', 'discovering');
      expect(firstInsight).toHaveProperty('stageNumber', 1);
      expect(firstInsight.metadata.extractionMethod).toBe('claude');

      // Check that categories are valid
      const validCategories = [
        'discovery',
        'problem',
        'solution',
        'question',
        'connection',
        'recommendation',
        'synthesis'
      ];
      expect(validCategories).toContain(firstInsight.category);

      // Check that importance levels are valid
      const validImportance = ['critical', 'high', 'medium', 'low'];
      expect(validImportance).toContain(firstInsight.importance);

      // Check that confidence levels are valid
      const validConfidence = ['verified', 'high', 'medium', 'low', 'speculative'];
      expect(validConfidence).toContain(firstInsight.confidence);

      // Should have evidence
      expect(Array.isArray(firstInsight.evidence)).toBe(true);

      // Should have quality score
      expect(firstInsight.metadata.qualityScore).toBeGreaterThanOrEqual(0);
      expect(firstInsight.metadata.qualityScore).toBeLessThanOrEqual(10);
    }, 30000); // 30 second timeout for API call

    testFn('should extract insights from different stage types', async () => {
      const chasingContent = `
Root cause analysis revealed:
- The performance bottleneck stems from inefficient database queries
- Memory leaks occur due to improper cleanup of event listeners
- The architecture lacks separation of concerns
      `;

      const insights = await service.extractInsights(chasingContent, 'chasing', 2);

      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].stageType).toBe('chasing');
      expect(insights[0].stageNumber).toBe(2);
    }, 30000);
  });

  describe('Batch Extraction', () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const testFn = apiKey ? it : it.skip;

    testFn('should extract insights from multiple stages', async () => {
      const stages = [
        {
          content: 'Important finding: AI models need quality data',
          stageType: 'discovering' as const,
          stageNumber: 1
        },
        {
          content: 'Root cause: Poor data quality leads to inaccurate predictions',
          stageType: 'chasing' as const,
          stageNumber: 2
        },
        {
          content: 'Solution: Implement data validation pipelines',
          stageType: 'solving' as const,
          stageNumber: 3
        }
      ];

      const results = await service.extractInsightsBatch(stages);

      expect(results).toHaveLength(3);
      expect(results[0][0].stageType).toBe('discovering');
      expect(results[1][0].stageType).toBe('chasing');
      expect(results[2][0].stageType).toBe('solving');
    }, 60000); // 60 seconds for batch processing
  });

  describe('Error Handling', () => {
    it('should fall back to regex if Claude extraction fails', async () => {
      // Temporarily break Claude by not initializing
      const uninitializedService = new (InsightExtractionService as any)();

      const content = `
- Important: This should still be extracted
- Discovered: Fallback mechanisms work correctly
      `;

      const insights = await uninitializedService.extractInsights(content, 'discovering', 1);

      // Should still get insights from regex fallback
      expect(insights.length).toBeGreaterThan(0);
      expect(insights[0].metadata.extractionMethod).toBe('pattern');
    });
  });

  describe('Quality Scoring', () => {
    it('should assign quality scores to insights', async () => {
      const content = `
Critical finding with high confidence: Deep learning models achieve 95% accuracy.
Evidence: Multiple studies from Stanford, MIT, and Google Research confirm this.
Assumptions: Assumes clean, properly labeled training data.
      `;

      const insights = await service.extractInsights(content, 'discovering', 1);

      if (insights.length > 0) {
        const insight = insights[0];
        expect(insight.metadata.qualityScore).toBeDefined();
        expect(insight.metadata.qualityScore).toBeGreaterThanOrEqual(0);
        expect(insight.metadata.qualityScore).toBeLessThanOrEqual(10);
      }
    });
  });
});
