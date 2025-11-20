/**
 * ClaudeService tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClaudeService } from '@/services/claude/ClaudeService';

describe('ClaudeService', () => {
  let service: ClaudeService;

  beforeEach(() => {
    service = new ClaudeService();
  });

  it('initializes with API key', () => {
    expect(service.isInitialized()).toBe(false);

    service.initialize('test-api-key');

    expect(service.isInitialized()).toBe(true);
  });

  it('throws error when executing without initialization', async () => {
    await expect(
      service.execute({
        prompt: 'test',
      })
    ).rejects.toThrow('Claude service not initialized');
  });

  it('executes prompt with extended thinking', async () => {
    service.initialize('test-api-key');

    // Mock the Anthropic client
    vi.spyOn(service as any, 'client').mockResolvedValue({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: 'Test response',
            },
          ],
        }),
      },
    });

    const result = await service.execute({
      prompt: 'Test prompt',
      extendedThinking: true,
    });

    expect(result).toBeDefined();
  });

  it('extracts artifacts from code blocks', () => {
    const content = `
Here is some code:

\`\`\`typescript
function test() {
  return 'hello';
}
\`\`\`

And some more text.
    `;

    const artifacts = (service as any).extractArtifactsFromContent(content);

    expect(artifacts).toHaveLength(1);
    expect(artifacts[0]!.type).toBe('code');
    expect(artifacts[0]!.metadata.language).toBe('typescript');
  });
});
