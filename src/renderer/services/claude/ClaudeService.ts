/**
 * Claude SDK Service (v0.67.0)
 * Wrapper around Anthropic SDK with Extended Thinking, Streaming, and Computer Use
 *
 * Features:
 * - Extended Thinking with configurable token budget
 * - Real-time streaming with progress callbacks
 * - Automatic artifact extraction
 * - Tool use support
 * - Computer Use (beta) integration ready
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages.mjs';

/**
 * Sanitize header value to ISO-8859-1 compatible string
 * Replaces non-ISO-8859-1 characters with safe alternatives
 */
function sanitizeHeaderValue(value: string): string {
  // Replace non-ISO-8859-1 characters (anything above 0xFF) with safe ASCII equivalents
  return value.replace(/[^\x00-\xFF]/g, '?');
}

/**
 * Polyfill Headers class to auto-sanitize values for browser compatibility
 * This fixes "String contains non ISO-8859-1 code point" errors in Electron
 */
function patchHeadersForBrowser(): void {
  // Only run in browser environment
  // @ts-ignore - window may not be defined in main process
  if (typeof window === 'undefined') return;

  // @ts-ignore - accessing global window
  const globalScope: any = window;

  // Check if already patched
  if (globalScope.__HEADERS_PATCHED__) return;

  const OriginalHeaders = globalScope.Headers;
  if (!OriginalHeaders) return;

  // Create wrapper class
  class SafeHeaders extends OriginalHeaders {
    constructor(init?: any) {
      super();

      if (init) {
        // Check if it's a Headers object (has forEach method)
        if (typeof init.forEach === 'function' && !(init instanceof Array)) {
          // Copy from Headers object
          init.forEach((value: string, key: string) => {
            super.append(key, sanitizeHeaderValue(value));
          });
        } else if (Array.isArray(init)) {
          // Handle array of [key, value] pairs
          for (const [key, value] of init) {
            super.append(key, sanitizeHeaderValue(value as string));
          }
        } else if (typeof init === 'object') {
          // Handle object
          for (const [key, value] of Object.entries(init)) {
            super.append(key, sanitizeHeaderValue(value as string));
          }
        }
      }
    }

    append(name: string, value: string): void {
      super.append(name, sanitizeHeaderValue(value));
    }

    set(name: string, value: string): void {
      super.set(name, sanitizeHeaderValue(value));
    }
  }

  // Replace global Headers
  globalScope.Headers = SafeHeaders;
  globalScope.__HEADERS_PATCHED__ = true;
  console.log('🔧 Headers class patched for ISO-8859-1 compatibility');
}

export type ClaudeModel =
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-20250514'
  | 'claude-haiku-4-5';

export interface ClaudeExecuteOptions {
  prompt: string;
  model?: ClaudeModel;
  maxTokens?: number;
  extendedThinking?: boolean;
  thinkingBudget?: number;
  stream?: boolean;
  onChunk?: (chunk: StreamChunk) => void;
  onThinking?: (thinking: string) => void;
  tools?: Anthropic.Tool[];
  systemPrompt?: string;
}

export interface StreamChunk {
  type: 'content' | 'thinking' | 'tool_use';
  content: string;
  isComplete: boolean;
}

export interface ClaudeResponse {
  content: string;
  thinking?: string;
  artifacts?: Artifact[];
  toolUses?: ToolUse[];
  usage?: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
  };
}

export interface Artifact {
  id: string;
  stageId?: string;
  type: 'code' | 'document' | 'visualization' | 'data';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface ToolUse {
  type: string;
  input: Record<string, unknown>;
}

export class ClaudeService {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;
  private isInitialized = false;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 2000; // Start with 2 seconds

  /**
   * Initialize Claude client with API key
   */
  initialize(apiKey: string): void {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    // Patch Headers class before initializing SDK
    patchHeadersForBrowser();

    this.apiKey = apiKey;
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for Electron renderer process
      timeout: 20 * 60 * 1000, // 20 minutes timeout for Extended Thinking page generation
      maxRetries: 2, // Retry failed requests up to 2 times
    });
    this.isInitialized = true;

    console.log('✅ Claude SDK v0.67.0 initialized with patched Headers and 20min timeout');
  }

  /**
   * Check if service is initialized
   */
  getInitializationStatus(): boolean {
    return this.isInitialized && this.client !== null;
  }

  /**
   * Execute a prompt with optional Extended Thinking and Streaming
   */
  async execute(options: ClaudeExecuteOptions): Promise<ClaudeResponse> {
    if (!this.client) {
      throw new Error('Claude service not initialized. Call initialize() first.');
    }

    const {
      prompt,
      model = 'claude-sonnet-4-5-20250929',
      maxTokens = 8000,
      extendedThinking = false,
      thinkingBudget = 5000,
      stream = false,
      onChunk,
      onThinking,
      tools,
      systemPrompt,
    } = options;

    // Build message params
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    // Build create params
    const createParams: Anthropic.MessageCreateParamsNonStreaming = {
      model,
      max_tokens: maxTokens,
      messages,
      ...(systemPrompt && { system: systemPrompt }),
      ...(tools && { tools }),
    };

    // Add Extended Thinking if enabled
    if (extendedThinking) {
      (createParams as any).thinking = {
        type: 'enabled',
        budget_tokens: thinkingBudget,
      };
      console.log(`🧠 Extended Thinking enabled (budget: ${thinkingBudget} tokens)`);
    }

    // Execute with streaming or non-streaming
    if (stream) {
      // Use retry wrapper for streaming (network errors are common with long streams)
      return this.executeWithRetry(async () => {
        return this.executeStreaming({
          ...createParams,
          stream: true,
        } as Anthropic.MessageCreateParamsStreaming, onChunk, onThinking);
      });
    } else {
      return this.executeNonStreaming(createParams);
    }
  }

  /**
   * Execute with automatic retry on network errors (exponential backoff)
   */
  private async executeWithRetry(
    operation: () => Promise<ClaudeResponse>,
    attempt: number = 1
  ): Promise<ClaudeResponse> {
    try {
      return await operation();
    } catch (error) {
      // Check if it's a network error that we should retry
      const isNetworkError = this.isRetryableNetworkError(error);
      const shouldRetry = isNetworkError && attempt < this.MAX_RETRIES;

      if (shouldRetry) {
        const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(`⚠️ Network error on attempt ${attempt}/${this.MAX_RETRIES}. Retrying in ${delay}ms...`);
        console.warn(`Error: ${error instanceof Error ? error.message : String(error)}`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));

        // Retry
        return this.executeWithRetry(operation, attempt + 1);
      } else {
        // Either not a network error, or we've exhausted retries
        if (isNetworkError && attempt >= this.MAX_RETRIES) {
          console.error(`❌ Network error persisted after ${this.MAX_RETRIES} retries. Giving up.`);
        }
        throw error;
      }
    }
  }

  /**
   * Check if error is a retryable network error
   */
  private isRetryableNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const errorMessage = error.message.toLowerCase();
    const networkErrorKeywords = [
      'network error',
      'fetch failed',
      'err_http2_protocol_error',
      'connection reset',
      'socket hang up',
      'etimedout',
      'econnreset',
      'enotfound',
      'econnrefused',
    ];

    return networkErrorKeywords.some(keyword => errorMessage.includes(keyword));
  }

  /**
   * Execute non-streaming request
   */
  private async executeNonStreaming(
    params: Anthropic.MessageCreateParamsNonStreaming
  ): Promise<ClaudeResponse> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('📤 Sending request to Claude...');
    const startTime = Date.now();

    const response = await this.client.messages.create(params);

    const duration = Date.now() - startTime;
    console.log(`📥 Response received in ${duration}ms`);

    return this.parseResponse(response);
  }

  /**
   * Execute streaming request
   */
  private async executeStreaming(
    params: Anthropic.MessageCreateParamsStreaming,
    onChunk?: (chunk: StreamChunk) => void,
    onThinking?: (thinking: string) => void
  ): Promise<ClaudeResponse> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    console.log('🌊 Starting streaming request...');

    const stream = await this.client.messages.stream(params);

    let fullContent = '';
    let fullThinking = '';
    const artifacts: Artifact[] = [];
    const toolUses: ToolUse[] = [];
    let usage: ClaudeResponse['usage'];

    try {
      for await (const event of stream) {
        // Handle different event types
        switch (event.type) {
          case 'content_block_start':
            if (event.content_block.type === 'text') {
              console.log('📝 Content block started');
            } else if (event.content_block.type === 'thinking') {
              console.log('💭 Thinking block started');
            }
            break;

          case 'content_block_delta':
            if (event.delta.type === 'text_delta') {
              const text = event.delta.text;
              fullContent += text;

              if (onChunk) {
                onChunk({
                  type: 'content',
                  content: text,
                  isComplete: false,
                });
              }
            } else if (event.delta.type === 'thinking_delta') {
              const thinking = (event.delta as any).thinking;
              if (thinking) {
                fullThinking += thinking;

                if (onThinking) {
                  onThinking(thinking);
                }

                if (onChunk) {
                  onChunk({
                    type: 'thinking',
                    content: thinking,
                    isComplete: false,
                  });
                }
              }
            }
            break;

          case 'content_block_stop':
            console.log('✅ Content block completed');
            if (onChunk) {
              onChunk({
                type: 'content',
                content: '',
                isComplete: true,
              });
            }
            break;

          case 'message_delta':
            // Update usage stats if available
            if (event.usage) {
              usage = {
                inputTokens: usage?.inputTokens || 0,
                outputTokens: event.usage.output_tokens,
              };
            }
            break;

          case 'message_stop':
            console.log('🏁 Stream completed');
            break;

          // Note: 'error' is not a valid MessageStreamEvent type
          // Errors are thrown as exceptions by the SDK
        }
      }

      // Final message after stream completes
      const finalMessage = await stream.finalMessage();

      // Extract usage from final message
      if (finalMessage.usage) {
        usage = {
          inputTokens: finalMessage.usage.input_tokens,
          outputTokens: finalMessage.usage.output_tokens,
        };
      }

      // Extract tool uses from final message
      for (const block of finalMessage.content) {
        if (block.type === 'tool_use') {
          toolUses.push({
            type: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

    } catch (error) {
      console.error('❌ Streaming error:', error);
      throw error;
    }

    return {
      content: fullContent,
      thinking: fullThinking || undefined,
      artifacts: this.extractArtifacts(fullContent),
      toolUses: toolUses.length > 0 ? toolUses : undefined,
      usage,
    };
  }

  /**
   * Parse Claude response into structured format
   */
  private parseResponse(response: Anthropic.Message): ClaudeResponse {
    let thinking: string | undefined;
    const textBlocks: string[] = [];
    const toolUses: ToolUse[] = [];

    // Extract content blocks
    for (const block of response.content) {
      if (block.type === 'text') {
        textBlocks.push(block.text);
      } else if (block.type === 'tool_use') {
        toolUses.push({
          type: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    }

    // Check for thinking in response (Extended Thinking)
    // Note: Thinking content might be in a separate field depending on API version
    if ((response as any).thinking) {
      const thinkingBlocks = (response as any).thinking;
      if (Array.isArray(thinkingBlocks)) {
        thinking = thinkingBlocks
          .filter((b: any) => b.type === 'thinking')
          .map((b: any) => b.thinking)
          .join('\n');
      } else if (typeof thinkingBlocks === 'string') {
        thinking = thinkingBlocks;
      }
    }

    const content = textBlocks.join('\n\n');

    return {
      content,
      thinking,
      artifacts: this.extractArtifacts(content),
      toolUses: toolUses.length > 0 ? toolUses : undefined,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  /**
   * Extract artifacts from content
   * Looks for code blocks, data structures, and formatted content
   */
  private extractArtifacts(content: string): Artifact[] {
    const artifacts: Artifact[] = [];
    let index = 0;

    // Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();

      if (code.length > 10) {
        // Only capture meaningful code blocks
        artifacts.push({
          id: `artifact-${Date.now()}-${index}`,
          type: this.getArtifactType(language),
          title: `${this.capitalizeFirst(language)} Code`,
          content: code,
          metadata: {
            language,
            lineCount: code.split('\n').length,
          },
          createdAt: Date.now(),
        });
        index++;
      }
    }

    // Extract JSON data blocks
    const jsonRegex = /```json\n([\s\S]*?)```/g;
    let jsonMatch;

    while ((jsonMatch = jsonRegex.exec(content)) !== null) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        artifacts.push({
          id: `artifact-${Date.now()}-${index}`,
          type: 'data',
          title: 'JSON Data',
          content: jsonMatch[1],
          metadata: {
            format: 'json',
            parsed: jsonData,
          },
          createdAt: Date.now(),
        });
        index++;
      } catch {
        // Invalid JSON, skip
      }
    }

    return artifacts;
  }

  /**
   * Determine artifact type from language
   */
  private getArtifactType(language: string): Artifact['type'] {
    const codeLanguages = [
      'javascript', 'typescript', 'python', 'java', 'rust', 'go', 'cpp', 'c',
      'html', 'css', 'jsx', 'tsx', 'ruby', 'php', 'swift', 'kotlin', 'scala',
    ];

    const vizLanguages = ['mermaid', 'graphviz', 'dot', 'plantuml'];
    const dataLanguages = ['json', 'yaml', 'toml', 'xml', 'csv'];

    const lang = language.toLowerCase();

    if (codeLanguages.includes(lang)) return 'code';
    if (vizLanguages.includes(lang)) return 'visualization';
    if (dataLanguages.includes(lang)) return 'data';

    return 'document';
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.client) {
      console.error('❌ Client not initialized');
      return false;
    }

    try {
      console.log('🔍 Testing API connection...');

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Reply with exactly "CONNECTION_OK"',
          },
        ],
      });

      const content = response.content.find((block) => block.type === 'text');
      const isOk = content?.type === 'text' && content.text.includes('CONNECTION_OK');

      if (isOk) {
        console.log('✅ API connection successful');
      } else {
        console.warn('⚠️  API responded but with unexpected content');
      }

      return isOk;
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels(): ClaudeModel[] {
    return ['claude-sonnet-4-5-20250929', 'claude-opus-4-20250514'];
  }

  /**
   * Helper: Capitalize first letter
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Export singleton instance
export const claudeService = new ClaudeService();
