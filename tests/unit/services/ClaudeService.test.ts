/**
 * Unit tests for ClaudeService
 * Tests Claude SDK integration, Extended Thinking, and tool usage
 */

import { ClaudeService } from '../../../src/lib/services/ClaudeService';
import Anthropic from '@anthropic-ai/sdk';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk');

describe('ClaudeService', () => {
  let service: ClaudeService;
  let mockClient: jest.Mocked<Anthropic>;

  beforeEach(() => {
    mockClient = {
      messages: {
        create: jest.fn(),
        stream: jest.fn(),
      },
    } as any;

    (Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(
      () => mockClient
    );

    service = new ClaudeService('test-api-key');
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(Anthropic).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });

    it('should throw error without API key', () => {
      expect(() => new ClaudeService('')).toThrow('API key is required');
    });
  });

  describe('execute', () => {
    const mockResponse: Anthropic.Message = {
      id: 'msg_test123',
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'Test response',
        },
      ],
      model: 'claude-sonnet-4-5-20250929',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    };

    it('should execute basic prompt', async () => {
      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await service.execute({
        prompt: 'Test prompt',
      });

      expect(result.content).toBe('Test response');
      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-sonnet-4-5-20250929',
          messages: [{ role: 'user', content: 'Test prompt' }],
        })
      );
    });

    it('should enable Extended Thinking when requested', async () => {
      mockClient.messages.create.mockResolvedValue(mockResponse);

      await service.execute({
        prompt: 'Think deeply',
        extendedThinking: true,
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          thinking: {
            type: 'enabled',
            budget_tokens: 4000,
          },
        })
      );
    });

    it('should parse Extended Thinking from response', async () => {
      const responseWithThinking: Anthropic.Message = {
        ...mockResponse,
        content: [
          {
            type: 'thinking',
            thinking: 'Deep thought process...',
          },
          {
            type: 'text',
            text: 'Final answer',
          },
        ],
      };

      mockClient.messages.create.mockResolvedValue(responseWithThinking);

      const result = await service.execute({
        prompt: 'Test',
        extendedThinking: true,
      });

      expect(result.thinking).toBe('Deep thought process...');
      expect(result.content).toBe('Final answer');
    });

    it('should handle tools in prompt', async () => {
      mockClient.messages.create.mockResolvedValue(mockResponse);

      const tools = [
        {
          name: 'web_search',
          description: 'Search the web',
          input_schema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
          },
        },
      ];

      await service.execute({
        prompt: 'Search for cats',
        tools,
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({
              name: 'web_search',
            }),
          ]),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      mockClient.messages.create.mockRejectedValue(
        new Error('API error')
      );

      await expect(
        service.execute({ prompt: 'Test' })
      ).rejects.toThrow('API error');
    });

    it('should respect max tokens setting', async () => {
      mockClient.messages.create.mockResolvedValue(mockResponse);

      await service.execute({
        prompt: 'Test',
        maxTokens: 1000,
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 1000,
        })
      );
    });
  });

  describe('executeStream', () => {
    it('should support streaming responses', async () => {
      const mockStream = {
        on: jest.fn(),
        [Symbol.asyncIterator]: jest.fn(),
      };

      mockClient.messages.stream.mockReturnValue(mockStream as any);

      await service.execute({
        prompt: 'Test',
        stream: true,
      });

      expect(mockClient.messages.stream).toHaveBeenCalled();
    });
  });

  describe('extractArtifacts', () => {
    it('should extract code artifacts from response', async () => {
      const responseWithArtifacts: Anthropic.Message = {
        ...mockResponse,
        content: [
          {
            type: 'text',
            text: '```typescript\nconst x = 1;\n```',
          },
        ],
      };

      mockClient.messages.create.mockResolvedValue(responseWithArtifacts);

      const result = await service.execute({ prompt: 'Test' });

      expect(result.artifacts).toBeDefined();
      expect(result.artifacts?.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle rate limits', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      (rateLimitError as any).status = 429;

      mockClient.messages.create.mockRejectedValue(rateLimitError);

      await expect(
        service.execute({ prompt: 'Test' })
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle network errors', async () => {
      mockClient.messages.create.mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        service.execute({ prompt: 'Test' })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid API key', async () => {
      const authError = new Error('Invalid API key');
      (authError as any).status = 401;

      mockClient.messages.create.mockRejectedValue(authError);

      await expect(
        service.execute({ prompt: 'Test' })
      ).rejects.toThrow('Invalid API key');
    });
  });
});
