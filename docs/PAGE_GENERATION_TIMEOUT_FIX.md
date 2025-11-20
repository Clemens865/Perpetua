# Page Generation Timeout Fix

## Problem

AI-generated pages were falling back to static templates due to timeout issues. The Anthropic SDK default timeout of 10 minutes was insufficient for Extended Thinking operations generating large HTML pages.

## Changes Made

### 1. Increased API Timeout (ClaudeService.ts)

**Location:** `src/renderer/services/claude/ClaudeService.ts:81-86`

```typescript
this.client = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true,
  timeout: 20 * 60 * 1000, // 20 minutes timeout for Extended Thinking
  maxRetries: 2, // Retry failed requests up to 2 times
});
```

**Changes:**
- Increased timeout from default 10 minutes to **20 minutes**
- Added retry logic (up to 2 retries)
- Updated console log to indicate new timeout setting

### 2. Enhanced Error Handling (ClaudePageGenerator.ts)

**Location:** `src/renderer/services/claude/ClaudePageGenerator.ts:41-72`

**Changes:**
- Wrapped API call in try-catch block for detailed error logging
- Added specific timeout error detection and messaging
- Added informative console message about expected generation time
- Improved error messages with specific context

```typescript
console.log('⏱️  Extended Thinking enabled with 8000 token budget (may take 5-15 minutes)...');

try {
  response = await claudeService.execute({...});
} catch (error) {
  console.error('❌ Claude API request failed:');
  console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);

  // Check for timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    throw new Error('Page generation timed out (>20 minutes). Try a shorter journey or simpler template.');
  }

  throw new Error(`Claude API failed: ${error instanceof Error ? error.message : String(error)}`);
}
```

### 3. Improved Fallback Error Logging (PageGeneratorService.ts)

**Location:** `src/renderer/services/PageGeneratorService.ts:180-186`

**Changes:**
- Enhanced error logging with detailed information
- Log error type, message, stack trace, and full error object
- Changed from `console.warn` to `console.error` for better visibility

```typescript
catch (error) {
  console.error('❌ AI generation failed, falling back to static template:');
  console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
  console.error('Error message:', error instanceof Error ? error.message : String(error));
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  console.error('Full error object:', error);
  // Fall through to static templates
}
```

### 4. Better User Experience (PageGeneratorDialog.tsx)

**Location:** `src/renderer/components/pages/PageGeneratorDialog.tsx`

**Changes:**
- Updated button text to inform users of expected time: `"Generating (this may take 5-15 minutes)..."`
- Added prominent loading state message during generation:

```tsx
{/* Generation Loading State */}
{isGenerating && (
  <div className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
    <div className="text-center">
      <div className="text-sm font-medium text-indigo-900">
        Generating custom page with Extended Thinking...
      </div>
      <div className="text-xs text-indigo-700 mt-1">
        This may take 5-15 minutes for complex journeys. Please keep this window open.
      </div>
    </div>
  </div>
)}
```

## Expected Behavior

### Before Fix
- API calls timed out after 10 minutes
- Silent fallback to static templates
- No clear error messages
- Users confused about why AI generation wasn't working

### After Fix
- API calls can run for up to 20 minutes
- Clear console logging of timeout/error causes
- User sees informative loading message
- Automatic retries (up to 2 times) for transient failures
- Specific timeout error messages if still failing

## Testing

To test the fix:

1. **Short Journey (2-4 stages):**
   - Should complete in 2-5 minutes
   - Should succeed with AI generation

2. **Medium Journey (5-8 stages):**
   - Should complete in 5-10 minutes
   - Should succeed with AI generation

3. **Long Journey (9-16 stages):**
   - May take 10-20 minutes
   - Should succeed with new timeout
   - Previously would have failed at 10 minutes

4. **Monitor Console:**
   - Check for detailed error logs if fallback occurs
   - Look for timeout-specific messages
   - Verify generation time in logs

## Performance Recommendations

For extremely long journeys (12+ stages), consider:

1. **Reduce thinking budget** from 8000 to 5000 tokens
2. **Use simpler templates** (report/wiki vs website/presentation)
3. **Split into multiple pages** instead of one large page
4. **Increase timeout further** if needed (e.g., 30 minutes)

## Debugging

If fallback still occurs, check console for:

```
❌ Claude API request failed:
Error type: [error type]
Error message: [specific error]
Error stack: [stack trace]
```

Common issues:
- **Timeout:** Still taking >20 minutes (increase timeout further)
- **Token limit:** Approaching 64,000 output tokens (reduce journey size)
- **API error:** Network issues or API downtime (retry)
- **Rate limit:** Too many concurrent requests (wait and retry)

## Related Files

- `src/renderer/services/claude/ClaudeService.ts` - API client configuration
- `src/renderer/services/claude/ClaudePageGenerator.ts` - Page generation logic
- `src/renderer/services/PageGeneratorService.ts` - High-level generation service
- `src/renderer/components/pages/PageGeneratorDialog.tsx` - UI component

## Future Improvements

1. **Progress streaming:** Show real-time progress during generation
2. **Cancellation:** Allow users to cancel long-running operations
3. **Chunked generation:** Generate page in sections to avoid timeouts
4. **Smart caching:** Cache generated pages to avoid regeneration
5. **Background generation:** Move to main process for better reliability
