# Website Generation Improvements - Architecture Design

**Date**: October 30, 2025
**Status**: In Progress
**Priority**: High (Prevents 10-minute generation failures)

---

## Problem Analysis

### Current Implementation Issues

**Single Monolithic Request**:
```typescript
// Current: ONE huge request (10+ minutes)
generateCustomPage() {
  const prompt = buildMassivePrompt(allJourneyContent); // 164KB+
  const response = await claude.execute({
    prompt,
    extendedThinking: true,
    thinkingBudget: 12000,
    maxTokens: 64000,
    stream: true
  });
  // 10-15 minutes later... (vulnerable to network issues)
}
```

**Failure Points**:
1. ❌ Mac goes to sleep → `ERR_NETWORK_IO_SUSPENDED`
2. ❌ Network switches → `ERR_NETWORK_CHANGED`
3. ❌ WiFi disconnects → `ERR_INTERNET_DISCONNECTED`
4. ❌ All progress lost after 10 minutes

---

## Solution Architecture

### Chunked Generation Strategy

Break the monolithic request into **5 smaller chunks** (2-3 min each):

```typescript
// Improved: Multiple smaller requests
async generateCustomPageChunked() {
  const sections = [];

  // 1. Hero Section (~2 min)
  sections.push(await generateHeroSection());
  saveProgress({ hero: true });

  // 2. Journey Overview (~2 min)
  sections.push(await generateOverviewSection());
  saveProgress({ hero: true, overview: true });

  // 3. Stages (2-3 stages per chunk, ~2-3 min each)
  for (const chunk of stageChunks) {
    sections.push(await generateStagesChunk(chunk));
    saveProgress({ ...previous, stages: chunk.ids });
  }

  // 4. Insights Summary (~2 min)
  sections.push(await generateInsightsSection());
  saveProgress({ ...previous, insights: true });

  // 5. Combine & Wrap (~1 min)
  return combineS sections();
}
```

### Benefits

**Resilience**:
- Each chunk is only 2-3 minutes (less vulnerable)
- Network failure loses max 3 minutes (not 10)
- Can resume from last saved chunk

**User Experience**:
- Progress indicators: "Generating hero section... (1/5)"
- Partial results visible as they complete
- Clear feedback on what's happening

**Network Quality**:
- Pre-check before starting
- Warn user if connection is poor
- Offer static template alternative

---

## Implementation Details

### 1. Progress Event System

```typescript
export interface GenerationProgress {
  stage: 'hero' | 'overview' | 'stages' | 'insights' | 'combining';
  current: number;
  total: number;
  message: string;
  timestamp: number;
}

export type ProgressCallback = (progress: GenerationProgress) => void;

class ChunkedPageGenerator {
  async generateWithProgress(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string,
    onProgress?: ProgressCallback
  ): Promise<GeneratedPage> {
    // Emit progress events
    onProgress?.({
      stage: 'hero',
      current: 1,
      total: 5,
      message: 'Generating hero section...',
      timestamp: Date.now()
    });

    const hero = await this.generateHeroSection(journey, analysis);

    onProgress?.({
      stage: 'overview',
      current: 2,
      total: 5,
      message: 'Generating journey overview...',
      timestamp: Date.now()
    });

    // ... continue
  }
}
```

### 2. Partial Result Caching

```typescript
interface CachedGeneration {
  journeyId: string;
  templateType: string;
  timestamp: number;
  sections: {
    hero?: string;
    overview?: string;
    stages?: { [stageId: string]: string };
    insights?: string;
  };
  completedSteps: string[];
}

class GenerationCache {
  private cache: Map<string, CachedGeneration> = new Map();

  save(journeyId: string, partial: Partial<CachedGeneration>): void {
    const key = `${journeyId}-${partial.templateType}`;
    const existing = this.cache.get(key) || {};
    this.cache.set(key, { ...existing, ...partial, timestamp: Date.now() });
    console.log(`💾 Saved progress: ${partial.completedSteps?.join(', ')}`);
  }

  get(journeyId: string, templateType: string): CachedGeneration | null {
    const key = `${journeyId}-${templateType}`;
    const cached = this.cache.get(key);

    // Cache expires after 1 hour
    if (cached && Date.now() - cached.timestamp < 3600000) {
      console.log(`📦 Found cached progress: ${cached.completedSteps.join(', ')}`);
      return cached;
    }

    return null;
  }
}
```

### 3. Exponential Backoff Retry

```typescript
async function executeWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) break;

      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`⚠️  Attempt ${attempt}/${maxRetries} failed. Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  throw lastError!;
}
```

### 4. Network Quality Check

```typescript
async function checkNetworkQuality(): Promise<'good' | 'fair' | 'poor'> {
  try {
    const start = Date.now();

    // Ping Anthropic API with small request
    await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'ping' })
    });

    const latency = Date.now() - start;

    if (latency < 500) return 'good';
    if (latency < 1500) return 'fair';
    return 'poor';

  } catch (error) {
    return 'poor';
  }
}

// Use before generation
const quality = await checkNetworkQuality();
if (quality === 'poor') {
  showWarning('Network connection is unstable. Consider using a static template instead.');
}
```

### 5. Intelligent Resume

```typescript
async function resumeGeneration(
  journey: Journey,
  templateType: string,
  cache: GenerationCache
): Promise<GeneratedPage> {
  const cached = cache.get(journey.id, templateType);

  if (!cached) {
    // Start from scratch
    return await generateCustomPageChunked(journey, ...);
  }

  console.log(`🔄 Resuming from step: ${cached.completedSteps[cached.completedSteps.length - 1]}`);

  const sections = [];

  // Reuse completed sections
  if (cached.sections.hero) {
    console.log('✅ Reusing hero section from cache');
    sections.push(cached.sections.hero);
  } else {
    sections.push(await generateHeroSection(...));
  }

  if (cached.sections.overview) {
    console.log('✅ Reusing overview section from cache');
    sections.push(cached.sections.overview);
  } else {
    sections.push(await generateOverviewSection(...));
  }

  // Continue for remaining sections...

  return combineSection(sections);
}
```

---

## Section Breakdown

### Hero Section (~2-3 min)
- Title
- Subtitle
- Key visual/illustration
- Navigation menu

### Overview Section (~2-3 min)
- Journey summary
- Key statistics (stages, insights, duration)
- Timeline visualization

### Stages Section (~2-3 min per 2-3 stages)
- Chunk 1: Stages 1-3
- Chunk 2: Stages 4-6
- Chunk 3: Stages 7-8
- Each with interactive cards/visualization

### Insights Section (~2 min)
- Key findings summary
- Recommendations
- Related questions

### Combining (~1 min)
- Merge all sections
- Add navigation
- Final validation

---

## Testing Strategy

### Unit Tests
- Test each section generator independently
- Mock Claude responses
- Verify HTML structure

### Integration Tests
- Test full chunked generation
- Simulate network failures mid-generation
- Verify resume capability

### Manual Testing
- Generate website with 8-stage journey
- Disconnect WiFi during generation
- Verify resume works

---

## Implementation Plan

### Phase 1: Core Chunking (2 hours)
1. Create ChunkedPageGenerator class
2. Implement section generators
3. Add progress callbacks
4. Basic testing

### Phase 2: Resilience (1.5 hours)
1. Implement caching mechanism
2. Add exponential backoff
3. Network quality check
4. Resume logic

### Phase 3: UI Integration (0.5 hours)
1. Connect progress events to UI
2. Add progress indicators
3. Show partial results
4. User feedback

### Phase 4: Testing & Polish (1 hour)
1. Test with real journeys
2. Handle edge cases
3. Documentation
4. Deploy

**Total Estimated Time**: ~5 hours

---

## Success Metrics

**Before**:
- ❌ Single 10-minute request
- ❌ Network failure = total loss
- ❌ No progress visibility
- ❌ ~30% failure rate for long journeys

**After**:
- ✅ 5x 2-3 minute requests
- ✅ Network failure = max 3 min loss + auto-resume
- ✅ Clear progress indicators
- ✅ <5% failure rate (with retries)

---

## Next Steps

1. **Create ChunkedPageGenerator class** with section-based architecture
2. **Implement progress event system** for UI feedback
3. **Add caching layer** for partial results
4. **Integrate resume logic** for failed generations
5. **Test with real 8-stage journey** and network simulation
6. **Deploy and monitor** success rates

---

**Related Files**:
- `/src/renderer/services/claude/ClaudePageGenerator.ts` - Current implementation
- `/src/renderer/services/claude/ClaudeService.ts` - API client
- `/src/renderer/components/pages/PageGeneratorDialog.tsx` - UI component
