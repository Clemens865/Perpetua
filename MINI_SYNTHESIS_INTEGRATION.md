# Mini-Synthesis Integration Guide

## Overview
This guide shows how to integrate the MiniSynthesisService into ExplorationEngine.ts.

## Step 1: Add Import

After line 21 (QuestionTrackingService import), add:
```typescript
import { MiniSynthesisService } from './services/MiniSynthesisService';
```

## Step 2: Update ExplorationConfig Type

Replace lines 24-29 with:
```typescript
export type ExplorationConfig = {
  maxDepth?: number;           // Maximum recursion depth (default: Infinity)
  autoProgress?: boolean;       // Automatically move to next stage (default: true)
  extendedThinking?: boolean;   // Use Claude Extended Thinking (default: true)
  saveArtifacts?: boolean;      // Save artifacts to database (default: true)
  enableMiniSynthesis?: boolean; // Enable mini-synthesis every N stages (default: true)
  synthesisInterval?: number;   // Create synthesis every N stages (default: 3)
};
```

## Step 3: Update ExplorationContext Type

In the ExplorationContext type (around line 31-40), add this field after `richInsights`:
```typescript
  synthesisCount?: number; // Phase 1 Quick Win #3: Track number of synthesis reports created
```

## Step 4: Update ExplorationEngine Class

### 4a: Add private field
In the class declaration (around line 911), change:
```typescript
export class ExplorationEngine {
  private config: Required<ExplorationConfig>;
  private context: ExplorationContext;
  private questionTracker: QuestionTrackingService;
```

To:
```typescript
export class ExplorationEngine {
  private config: Required<ExplorationConfig>;
  private context: ExplorationContext;
  private questionTracker: QuestionTrackingService;
  private synthesisService: MiniSynthesisService;
```

### 4b: Initialize config
In the constructor (around line 915-921), update the config initialization to include:
```typescript
    this.config = {
      maxDepth: config.maxDepth ?? Infinity,
      autoProgress: config.autoProgress ?? true,
      extendedThinking: config.extendedThinking ?? true,
      saveArtifacts: config.saveArtifacts ?? true,
      enableMiniSynthesis: config.enableMiniSynthesis ?? true,
      synthesisInterval: config.synthesisInterval ?? 3,
    };
```

### 4c: Initialize context
In the context initialization (around line 923-931), add:
```typescript
      synthesisCount: 0, // Phase 1 Quick Win #3: Initialize synthesis counter
```

### 4d: Initialize service
After the questionTracker initialization (around line 934), add:
```typescript
    this.synthesisService = new MiniSynthesisService();
```

## Step 5: Add createMiniSynthesis Method

Add this new private method to the ExplorationEngine class (add it after the `markJourneyComplete` method, around line 1150):

```typescript
  /**
   * Create a mini-synthesis from the last N stages
   * Triggered every synthesisInterval stages (default: 3)
   */
  private async createMiniSynthesis(): Promise<void> {
    const interval = this.config.synthesisInterval;
    const totalStages = this.context.previousStages.length;

    // Get the last N stages for synthesis
    const lastStages = this.context.previousStages.slice(-interval);

    if (lastStages.length < interval) {
      console.log(`⏭️  Skipping mini-synthesis - need at least ${interval} stages`);
      return;
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔮 CREATING MINI-SYNTHESIS (Stages ${totalStages - interval + 1}-${totalStages})`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      // Get all rich insights (or create from legacy insights if needed)
      const richInsights = this.context.richInsights || [];

      // Create the synthesis
      const synthesisReport = await this.synthesisService.createMiniSynthesis(
        lastStages,
        richInsights
      );

      // Convert synthesis to RichInsight format
      const synthesisInsight = this.synthesisService.createSynthesisInsight(synthesisReport);

      // Add to context
      if (!this.context.richInsights) {
        this.context.richInsights = [];
      }
      this.context.richInsights.push(synthesisInsight);

      // Also add to legacy insights array for backwards compatibility
      this.context.insights.push(`[SYNTHESIS] ${synthesisReport.summary}`);

      // Increment synthesis counter
      this.context.synthesisCount = (this.context.synthesisCount || 0) + 1;

      console.log(`✅ Mini-synthesis #${this.context.synthesisCount} created successfully`);
      console.log(`📊 Quality: ${synthesisReport.synthesisQuality.toFixed(1)}/10`);
      console.log(`🔗 Key connections: ${synthesisReport.connections.substring(0, 100)}...`);
      console.log(`📈 Emerging patterns: ${synthesisReport.patterns.substring(0, 100)}...`);

      // Log synthesis details for debugging
      console.log(`\n📝 SYNTHESIS DETAILS:`);
      console.log(`Summary: ${synthesisReport.summary}`);
      console.log(`Connections: ${synthesisReport.connections}`);
      console.log(`Patterns: ${synthesisReport.patterns}`);
      console.log(`Contradictions: ${synthesisReport.contradictions}`);
      console.log(`Forward Look: ${synthesisReport.forwardLook}`);
      console.log(`Key Insights: ${synthesisReport.keyInsights.join(', ')}`);
      console.log(`\n${'='.repeat(60)}\n`);

    } catch (error) {
      console.error('❌ Failed to create mini-synthesis:', error);
      // Don't throw - allow journey to continue even if synthesis fails
    }
  }
```

## Step 6: Trigger Synthesis in executeStage

In the `executeStage` method, find where the context is updated (around line 1076):
```typescript
    // Update context
    this.context.previousStages.push(stage);
    this.context.currentStage = stageNumber - 1;
```

Immediately AFTER these lines, add:
```typescript
    // Phase 1: Create mini-synthesis every N stages (if enabled and not a summary stage)
    if (
      this.config.enableMiniSynthesis &&
      !isSummary &&
      stage.status === 'complete' &&
      this.context.previousStages.length % this.config.synthesisInterval === 0 &&
      this.context.previousStages.length >= this.config.synthesisInterval
    ) {
      try {
        await this.createMiniSynthesis();
      } catch (error) {
        console.error('Failed to create mini-synthesis, continuing journey:', error);
      }
    }
```

## Testing

After making these changes:

1. Run `npm run build` to compile
2. The mini-synthesis will automatically trigger every 3 stages
3. Look for console output like:
   ```
   🔮 CREATING MINI-SYNTHESIS (Stages 1-3)
   ✅ Mini-synthesis #1 created successfully
   📊 Quality: 7.5/10
   ```

## Features

- Automatically creates synthesis every 3 stages (configurable)
- Uses Claude Sonnet 4.5 with 3000 token thinking budget
- Generates 3-5 paragraph synthesis covering:
  * Key connections between stages
  * Emerging patterns
  * Contradictions needing resolution
  * Forward-looking guidance
- Stores synthesis as special insight with category "Synthesis"
- Quality-scored (0-10 scale)
- Includes comprehensive metadata

## Configuration Options

You can customize the synthesis behavior when creating the engine:

```typescript
const engine = new ExplorationEngine(journeyId, {
  enableMiniSynthesis: true,  // Enable/disable synthesis
  synthesisInterval: 3,       // Create synthesis every N stages
  // ... other config options
});
```
