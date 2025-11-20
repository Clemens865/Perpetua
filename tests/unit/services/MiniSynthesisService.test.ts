/**
 * Unit Tests for MiniSynthesisService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiniSynthesisService } from '../../../src/renderer/lib/engine/services/MiniSynthesisService';
import type { RichInsight } from '../../../src/renderer/lib/engine/types/optimization-types';
import type { Stage } from '../../../src/renderer/types';

// Mock ClaudeService
vi.mock('../../../src/renderer/services/claude/ClaudeService', () => ({
  claudeService: {
    execute: vi.fn(),
  },
}));

describe('MiniSynthesisService', () => {
  let service: MiniSynthesisService;
  let mockStages: Stage[];
  let mockInsights: RichInsight[];

  beforeEach(() => {
    service = new MiniSynthesisService();

    // Create mock stages
    mockStages = [
      {
        id: 'stage1',
        journeyId: 'journey1',
        type: 'discovering',
        status: 'complete',
        prompt: 'Discover AI',
        result: 'AI is transforming industries through machine learning and automation...',
        thinking: null,
        artifacts: [],
        createdAt: Date.now() - 3000,
      },
      {
        id: 'stage2',
        journeyId: 'journey1',
        type: 'chasing',
        status: 'complete',
        prompt: 'Find problems',
        result: 'Root causes include data quality issues and lack of expertise...',
        thinking: null,
        artifacts: [],
        createdAt: Date.now() - 2000,
      },
      {
        id: 'stage3',
        journeyId: 'journey1',
        type: 'solving',
        status: 'complete',
        prompt: 'Generate solutions',
        result: 'Solutions include automated data cleaning and training programs...',
        thinking: null,
        artifacts: [],
        createdAt: Date.now() - 1000,
      },
    ];

    // Create mock insights
    mockInsights = [
      {
        id: 'insight1',
        insight: 'Machine learning requires high-quality labeled data',
        category: 'discovery',
        importance: 'high',
        evidence: ['Multiple studies show data quality is critical'],
        stageType: 'discovering',
        stageNumber: 1,
        confidence: 'high',
        assumptions: [],
        relatedInsightIds: [],
        artifactIds: [],
        questionIds: [],
        metadata: {
          extractionMethod: 'claude',
        },
        createdAt: Date.now() - 3000,
      },
      {
        id: 'insight2',
        insight: 'Skills gap is a major barrier to AI adoption',
        category: 'problem',
        importance: 'critical',
        evidence: ['Industry surveys indicate shortage of ML engineers'],
        stageType: 'chasing',
        stageNumber: 2,
        confidence: 'high',
        assumptions: [],
        relatedInsightIds: ['insight1'],
        artifactIds: [],
        questionIds: [],
        metadata: {
          extractionMethod: 'claude',
        },
        createdAt: Date.now() - 2000,
      },
    ];
  });

  describe('createMiniSynthesis', () => {
    it('should throw error if stages array is empty', async () => {
      await expect(service.createMiniSynthesis([], mockInsights)).rejects.toThrow(
        'Cannot create synthesis from empty stage list'
      );
    });

    it('should create synthesis report with correct structure', async () => {
      const { claudeService } = await import('../../../src/renderer/services/claude/ClaudeService');

      // Mock Claude response
      vi.mocked(claudeService.execute).mockResolvedValue({
        content: `
## Summary
These stages explored AI implementation challenges and solutions.

## Key Connections
The discovery of data quality issues directly informed the problem analysis.

## Emerging Patterns
Data quality and skills gaps are recurring themes.

## Contradictions & Tensions
Some solutions require expertise that is currently lacking.

## Forward Guidance
Focus on building training programs alongside technical solutions.

## Key Insights
- Data quality is fundamental
- Skills gap must be addressed
- Integrated approach needed
        `,
        thinking: 'Analyzing connections...',
        usage: {
          inputTokens: 1000,
          outputTokens: 500,
        },
      });

      const report = await service.createMiniSynthesis(mockStages, mockInsights);

      expect(report).toBeDefined();
      expect(report.id).toMatch(/^synthesis_/);
      expect(report.stages).toHaveLength(3);
      expect(report.stageTypes).toEqual(['discovering', 'chasing', 'solving']);
      expect(report.summary).toBeTruthy();
      expect(report.connections).toBeTruthy();
      expect(report.patterns).toBeTruthy();
      expect(report.contradictions).toBeTruthy();
      expect(report.forwardLook).toBeTruthy();
      expect(report.synthesisQuality).toBeGreaterThanOrEqual(0);
      expect(report.synthesisQuality).toBeLessThanOrEqual(10);
    });

    it('should parse synthesis content correctly', async () => {
      const { claudeService } = await import('../../../src/renderer/services/claude/ClaudeService');

      vi.mocked(claudeService.execute).mockResolvedValue({
        content: `
## Summary
Test summary content.

## Key Connections
Test connections content.

## Emerging Patterns
Test patterns content.

## Contradictions & Tensions
Test contradictions content.

## Forward Guidance
Test forward guidance content.

## Key Insights
- First insight
- Second insight
- Third insight
        `,
        thinking: null,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const report = await service.createMiniSynthesis(mockStages, mockInsights);

      expect(report.summary).toContain('Test summary');
      expect(report.connections).toContain('Test connections');
      expect(report.patterns).toContain('Test patterns');
      expect(report.contradictions).toContain('Test contradictions');
      expect(report.forwardLook).toContain('Test forward guidance');
      expect(report.keyInsights).toHaveLength(3);
      expect(report.keyInsights[0]).toContain('First insight');
    });

    it('should estimate quality score based on content', async () => {
      const { claudeService } = await import('../../../src/renderer/services/claude/ClaudeService');

      // High-quality content with all sections and examples
      vi.mocked(claudeService.execute).mockResolvedValue({
        content: `
## Summary
This is a comprehensive summary with substantive content that provides valuable insights.

## Key Connections
For example, we can see how the discovering stage directly informed the chasing stage.

## Emerging Patterns
Specifically, themes of data quality and skills development emerged repeatedly.

## Contradictions & Tensions
There are tensions between the need for immediate solutions and long-term capability building.

## Forward Guidance
Next steps should focus on addressing the skills gap through targeted training programs.

## Key Insights
- Data quality is critical for ML success
- Skills gap is a major barrier
- Integrated solutions are needed
- Training programs are essential
        `,
        thinking: null,
        usage: { inputTokens: 200, outputTokens: 100 },
      });

      const report = await service.createMiniSynthesis(mockStages, mockInsights);

      // High-quality content should score well
      expect(report.synthesisQuality).toBeGreaterThan(6);
    });
  });

  describe('createSynthesisInsight', () => {
    it('should convert synthesis report to RichInsight', async () => {
      const { claudeService } = await import('../../../src/renderer/services/claude/ClaudeService');

      vi.mocked(claudeService.execute).mockResolvedValue({
        content: `
## Summary
Test summary

## Key Connections
Test connections

## Emerging Patterns
Test patterns

## Contradictions & Tensions
Test contradictions

## Forward Guidance
Test guidance

## Key Insights
- Insight 1
        `,
        thinking: null,
        usage: { inputTokens: 100, outputTokens: 50 },
      });

      const report = await service.createMiniSynthesis(mockStages, mockInsights);
      const insight = service.createSynthesisInsight(report);

      expect(insight.id).toBe(report.id);
      expect(insight.category).toBe('synthesis');
      expect(insight.importance).toBe('high');
      expect(insight.confidence).toBe('high');
      expect(insight.insight).toContain('Mini-synthesis');
      expect(insight.insight).toContain(report.summary);
      expect(insight.evidence).toHaveLength(4); // connections, patterns, contradictions, forwardLook
      expect(insight.metadata.tags).toContain('synthesis');
      expect(insight.metadata.tags).toContain('intermediate');
      expect(insight.metadata.synthesisReport).toBe(report);
    });
  });
});
