/**
 * Unit tests for ExplorationEngine
 * Tests the core 8-stage exploration cycle logic with v0.67.0 SDK
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExplorationEngine } from '../../../src/renderer/lib/engine/ExplorationEngine';
import type { StageType } from '../../../src/renderer/types';

// Mock claudeService
vi.mock('../../../src/renderer/services/claude/ClaudeService', () => ({
  claudeService: {
    execute: vi.fn(),
    initialize: vi.fn(),
    getInitializationStatus: vi.fn().mockReturnValue(true),
  },
}));

// Import the mocked module
import { claudeService } from '../../../src/renderer/services/claude/ClaudeService';

describe('ExplorationEngine', () => {
  let engine: ExplorationEngine;
  const mockExecute = claudeService.execute as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock response
    (mockExecute as any).mockResolvedValue({
      content: 'Test response content',
      thinking: 'Test thinking process',
      artifacts: [],
      usage: {
        inputTokens: 100,
        outputTokens: 200,
      },
    });

    engine = new ExplorationEngine('test-journey-123', {
      maxDepth: 3, // Limit to 3 stages for tests
      autoProgress: false, // Don't auto-progress in tests
      extendedThinking: true,
      saveArtifacts: true,
    });
  });

  describe('initialization', () => {
    it('should initialize with correct config', () => {
      const context = engine.getContext();

      expect(context.journeyId).toBe('test-journey-123');
      expect(context.currentStage).toBe(0);
      expect(context.previousStages).toHaveLength(0);
      expect(context.insights).toHaveLength(0);
      expect(context.questions).toHaveLength(0);
      expect(context.artifacts).toHaveLength(0);
    });

    it('should use default config when not provided', () => {
      const defaultEngine = new ExplorationEngine('default-journey');
      const context = defaultEngine.getContext();

      expect(context.journeyId).toBe('default-journey');
    });
  });

  describe('start()', () => {
    it('should start with DISCOVERING stage', async () => {
      const input = 'What is quantum computing?';
      await engine.start(input);

      expect(mockExecute).toHaveBeenCalledTimes(1);

      const callArgs = mockExecute.mock.calls[0][0];
      expect(callArgs.prompt).toContain('DISCOVERING');
      expect(callArgs.prompt).toContain(input);
      expect(callArgs.extendedThinking).toBe(true);
      expect(callArgs.thinkingBudget).toBe(10000);
      expect(callArgs.maxTokens).toBe(16000);
      expect(callArgs.stream).toBe(true);
    });

    it('should update context after first stage', async () => {
      await engine.start('Test input');

      const context = engine.getContext();
      expect(context.previousStages).toHaveLength(1);
      expect(context.previousStages[0].type).toBe('discovering');
      expect(context.previousStages[0].status).toBe('completed');
      expect(context.previousStages[0].result).toBe('Test response content');
      expect(context.previousStages[0].thinking).toBe('Test thinking process');
    });

    it('should handle execution errors gracefully', async () => {
      mockExecute.mockRejectedValueOnce(new Error('API error'));

      await engine.start('Test input');

      const context = engine.getContext();
      expect(context.previousStages).toHaveLength(1);
      expect(context.previousStages[0].status).toBe('failed');
      expect(context.previousStages[0].result).toContain('API error');
    });

    it('should provide streaming callbacks', async () => {
      const onChunk = jest.fn();
      const onThinking = jest.fn();

      await engine.start('Test input');

      // Verify streaming callbacks were passed to execute
      const callArgs = mockExecute.mock.calls[0][0];
      expect(callArgs.onChunk).toBeDefined();
      expect(callArgs.onThinking).toBeDefined();
    });
  });

  describe('next()', () => {
    beforeEach(async () => {
      // Start with DISCOVERING
      await engine.start('Test input');
      jest.clearAllMocks();
    });

    it('should progress to CHASING stage', async () => {
      await engine.next();

      expect(mockExecute).toHaveBeenCalledTimes(1);

      const callArgs = mockExecute.mock.calls[0][0];
      expect(callArgs.prompt).toContain('CHASING');
    });

    it('should include previous stage context', async () => {
      await engine.next();

      const callArgs = mockExecute.mock.calls[0][0];
      expect(callArgs.prompt).toContain('discovering');
      expect(callArgs.prompt).toContain('Test response content');
    });

    it('should throw error if no journey started', async () => {
      const freshEngine = new ExplorationEngine('new-journey');

      await expect(freshEngine.next()).rejects.toThrow(
        'No journey in progress. Call start() first.'
      );
    });

    it('should cycle through all 8 stages', async () => {
      const expectedStages: StageType[] = [
        'chasing',
        'solving',
        'challenging',
        'questioning',
        'searching',
        'imagining',
        'building',
        'discovering', // Cycles back to start
      ];

      for (let i = 0; i < 8; i++) {
        await engine.next();
        const context = engine.getContext();
        expect(context.previousStages[i + 1].type).toBe(expectedStages[i]);
      }
    });
  });

  describe('8-stage cycle', () => {
    it('should execute all 8 stages in correct order', async () => {
      const expectedStages: StageType[] = [
        'discovering',
        'chasing',
        'solving',
        'challenging',
        'questioning',
        'searching',
        'imagining',
        'building',
      ];

      // Start journey
      await engine.start('Test input');

      // Run through remaining 7 stages
      for (let i = 1; i < 8; i++) {
        await engine.next();
      }

      const context = engine.getContext();
      expect(context.previousStages).toHaveLength(8);

      expectedStages.forEach((stageType, index) => {
        expect(context.previousStages[index].type).toBe(stageType);
      });
    });

    it('should build context progressively', async () => {
      await engine.start('Test input');
      await engine.next(); // CHASING
      await engine.next(); // SOLVING

      const context = engine.getContext();
      expect(context.previousStages).toHaveLength(3);

      // SOLVING prompt should reference CHASING context
      const solvingCall = mockExecute.mock.calls[2][0];
      expect(solvingCall.prompt).toContain('chasing');
    });
  });

  describe('insight extraction', () => {
    it('should extract insights from content', async () => {
      mockExecute.mockResolvedValueOnce({
        content: `
Key finding: Quantum computers use superposition.
Important: They can solve certain problems exponentially faster.
- Quantum entanglement enables parallel processing
- Decoherence is a major challenge
        `,
        artifacts: [],
      });

      await engine.start('Test input');

      const context = engine.getContext();
      expect(context.insights.length).toBeGreaterThan(0);
      expect(context.insights.some(i => i.includes('Quantum computers'))).toBe(true);
    });
  });

  describe('question extraction', () => {
    it('should extract questions from questioning stage', async () => {
      mockExecute.mockResolvedValueOnce({
        content: 'Initial response',
        artifacts: [],
      });

      await engine.start('Test input');

      // Progress to QUESTIONING stage
      for (let i = 0; i < 4; i++) {
        await engine.next();
      }

      mockExecute.mockResolvedValueOnce({
        content: `
1. What are the fundamental limits of quantum computing?
2. How does quantum error correction work?
3. What applications will benefit most from quantum computers?
        `,
        artifacts: [],
      });

      await engine.next(); // QUESTIONING stage

      const context = engine.getContext();
      expect(context.questions.length).toBeGreaterThan(0);
      expect(context.questions.some(q => q.includes('quantum'))).toBe(true);
    });
  });

  describe('artifact extraction', () => {
    it('should extract code artifacts from building stage', async () => {
      mockExecute.mockResolvedValueOnce({
        content: 'Initial response',
        artifacts: [],
      });

      await engine.start('Test input');

      // Progress to BUILDING stage
      for (let i = 0; i < 7; i++) {
        await engine.next();
      }

      mockExecute.mockResolvedValueOnce({
        content: `
\`\`\`python
def quantum_circuit():
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.cx(0, 1)
    return qc
\`\`\`

\`\`\`json
{
  "qubits": 2,
  "gates": ["H", "CNOT"]
}
\`\`\`
        `,
        artifacts: [],
      });

      await engine.next(); // BUILDING stage

      const context = engine.getContext();
      expect(context.artifacts.length).toBeGreaterThan(0);
    });
  });

  describe('getSummary()', () => {
    it('should provide journey summary', async () => {
      await engine.start('Test input');
      await engine.next();
      await engine.next();

      const summary = engine.getSummary();

      expect(summary).toContain('test-journey-123');
      expect(summary).toContain('Stages Completed: 3');
      expect(summary).toContain('discovering');
      expect(summary).toContain('chasing');
      expect(summary).toContain('solving');
    });
  });

  describe('getContext()', () => {
    it('should return immutable context copy', async () => {
      await engine.start('Test input');

      const context1 = engine.getContext();
      const context2 = engine.getContext();

      expect(context1).not.toBe(context2); // Different objects
      expect(context1.journeyId).toBe(context2.journeyId); // Same data
    });
  });

  describe('config options', () => {
    it('should respect maxDepth setting', async () => {
      const limitedEngine = new ExplorationEngine('limited', {
        maxDepth: 2,
        autoProgress: false,
      });

      await limitedEngine.start('Test input');
      const context = limitedEngine.getContext();

      expect(context.currentStage).toBe(0);
    });

    it('should use Extended Thinking when enabled', async () => {
      const thinkingEngine = new ExplorationEngine('thinking', {
        extendedThinking: true,
      });

      await thinkingEngine.start('Test input');

      const callArgs = mockExecute.mock.calls[0][0];
      expect(callArgs.extendedThinking).toBe(true);
      expect(callArgs.thinkingBudget).toBe(10000);
    });

    it('should disable Extended Thinking when configured', async () => {
      const noThinkingEngine = new ExplorationEngine('no-thinking', {
        extendedThinking: false,
      });

      await noThinkingEngine.start('Test input');

      const callArgs = mockExecute.mock.calls[0][0];
      expect(callArgs.extendedThinking).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle failed stages gracefully', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Network error'));

      await engine.start('Test input');

      const context = engine.getContext();
      expect(context.previousStages[0].status).toBe('failed');
      expect(context.previousStages[0].result).toContain('Network error');
    });

    it('should continue after failed stage', async () => {
      mockExecute
        .mockRejectedValueOnce(new Error('Stage 1 failed'))
        .mockResolvedValueOnce({ content: 'Stage 2 success', artifacts: [] });

      await engine.start('Test input');
      await engine.next();

      const context = engine.getContext();
      expect(context.previousStages).toHaveLength(2);
      expect(context.previousStages[0].status).toBe('failed');
      expect(context.previousStages[1].status).toBe('completed');
    });
  });

  describe('usage tracking', () => {
    it('should log token usage', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await engine.start('Test input');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Tokens used: 100 in, 200 out')
      );

      consoleSpy.mockRestore();
    });
  });
});
