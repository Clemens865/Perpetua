# Quality Scoring Service - Phase 2 Medium Effort Optimization

## Overview

The Quality Scoring Service implements **self-reflection and quality assessment** for the ExplorationEngine. It automatically evaluates each stage's output quality using Claude Haiku for fast, cost-effective scoring across 6 key dimensions.

## Purpose

**Problem Solved**: Previously, there was no validation that stage outputs met quality standards. Stages could produce vague, incomplete, or low-quality results without any feedback mechanism.

**Solution**: Automatic quality assessment after each stage completion, with:
- Quantitative scores (0-10) across 6 dimensions
- Qualitative feedback (strengths, weaknesses, improvements)
- Automatic flagging for revision when quality falls below threshold
- Optional auto-revision capability (disabled by default)

## Architecture

### Components

1. **QualityScoringService** (`src/renderer/lib/engine/services/QualityScoringService.ts`)
   - Core service for quality evaluation
   - Uses Claude Haiku for fast, accurate assessments
   - Returns structured QualityReport objects

2. **ExplorationEngine Integration**
   - Quality scoring called after each stage completes
   - Results stored in stage metadata and context
   - Configurable via ExplorationConfig

3. **Type Definitions** (`src/renderer/lib/engine/types/optimization-types.ts`)
   - `QualityReport`: Full quality assessment
   - `QualityScores`: 6-dimension scoring
   - Stage interface extended with quality metadata

## Quality Dimensions

Each stage is evaluated on 6 dimensions (0-10 scale):

### 1. Completeness
**What it measures**: Did the stage address all required elements?

**Stage-Specific Criteria**:
- **Discovering**: Covers core concepts, historical context, current state, interdisciplinary connections
- **Chasing**: Identifies symptoms, root causes, assumptions, systemic patterns, leverage points
- **Solving**: Generates 5-7 diverse solutions across categories with feasibility analysis
- **Questioning**: 15-20 questions across 6 categories (clarifying, probing, hypothetical, challenge, meta, future)
- **Building**: 1-3 fully developed artifacts with examples and documentation

### 2. Depth
**What it measures**: How thorough was the analysis?

**Indicators of depth**:
- Goes beyond surface-level explanations
- Explores underlying mechanisms
- Provides detailed reasoning
- Traces connections and implications
- Analyzes from multiple angles

### 3. Specificity
**What it measures**: Concrete examples vs. vague generalizations?

**High specificity includes**:
- Specific examples with details
- Concrete evidence and data points
- Named sources and citations
- Precise definitions and boundaries
- Actionable details vs. abstract concepts

### 4. Actionability
**What it measures**: Can someone use this immediately?

**Actionable outputs include**:
- Clear next steps
- Implementation instructions
- Success metrics
- Resource requirements
- Concrete recommendations

### 5. Coherence
**What it measures**: Logical structure and clarity?

**Coherent outputs have**:
- Well-organized structure
- Logical flow between sections
- Clear hierarchies
- Consistent terminology
- Easy to follow reasoning

### 6. Novelty
**What it measures**: New insights vs. obvious information?

**Novel outputs include**:
- Non-obvious connections
- Surprising discoveries
- Unconventional perspectives
- Challenging assumptions
- Fresh angles on familiar topics

## Configuration

### Enable/Disable Quality Scoring

```typescript
const engine = new ExplorationEngine(journeyId, {
  enableQualityScoring: true,  // Enable quality assessment (default: true)
  qualityThreshold: 6.0,        // Minimum acceptable score (default: 6.0)
  autoRevise: false,            // Auto-retry low-quality stages (default: false)
  maxRevisions: 1,              // Max revision attempts if autoRevise enabled
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableQualityScoring` | boolean | `true` | Enable quality assessment |
| `qualityThreshold` | number | `6.0` | Minimum acceptable score (0-10) |
| `autoRevise` | boolean | `false` | Automatically retry low-quality stages |
| `maxRevisions` | number | `1` | Maximum revision attempts |

## Usage

### Automatic Evaluation

Quality scoring runs automatically after each stage completes (when enabled):

```typescript
// Start a journey - quality scoring happens automatically
const stage = await engine.start("Research AI in healthcare");

// Quality report is attached to the stage
console.log(stage.qualityScore);        // 7.5
console.log(stage.qualityReport);       // Full quality report
```

### Manual Evaluation

Evaluate any stage manually:

```typescript
import { qualityScoringService } from './services/QualityScoringService';

const report = await qualityScoringService.evaluateStageQuality(stage);

console.log(report.overallScore);       // 7.5
console.log(report.scores.completeness); // 8
console.log(report.scores.depth);        // 7
console.log(report.strengths);           // ["Strong examples", "Clear structure"]
console.log(report.weaknesses);          // ["Limited depth in analysis"]
console.log(report.improvements);        // ["Add more specific evidence"]
console.log(report.shouldRevise);        // false
```

### Batch Evaluation

Evaluate multiple stages at once:

```typescript
const reports = await qualityScoringService.evaluateMultipleStages(stages);

// Get statistics
const stats = qualityScoringService.getQualityStatistics(reports);
console.log(stats.average);              // 7.2
console.log(stats.needsRevision);        // 2
console.log(stats.scoresByDimension);    // Average per dimension
```

## Quality Reports

### QualityReport Structure

```typescript
interface QualityReport {
  stageId: string;                       // Stage ID
  stageType: StageType;                  // Stage type
  scores: QualityScores;                 // 6-dimension scores
  overallScore: number;                  // 0-10 average
  strengths: string[];                   // What went well
  weaknesses: string[];                  // What needs improvement
  improvements: string[];                // Specific suggestions
  shouldRevise: boolean;                 // Needs re-execution
  revisionSuggestions: string[];         // How to improve
  evaluatedAt: number;                   // Timestamp
}
```

### Example Quality Report

```json
{
  "stageId": "stage_123",
  "stageType": "discovering",
  "scores": {
    "completeness": 8,
    "depth": 7,
    "specificity": 9,
    "actionability": 6,
    "coherence": 8,
    "novelty": 7
  },
  "overallScore": 7.5,
  "strengths": [
    "Comprehensive coverage of core concepts with specific examples",
    "Well-structured with clear sections and logical flow",
    "Strong use of concrete evidence and citations"
  ],
  "weaknesses": [
    "Limited actionable next steps for implementation",
    "Some interdisciplinary connections could be explored deeper"
  ],
  "improvements": [
    "Add specific action items for readers",
    "Expand on economic implications with data",
    "Include more unconventional perspectives"
  ],
  "shouldRevise": false,
  "revisionSuggestions": [],
  "evaluatedAt": 1704321600000
}
```

## Performance

### Speed & Cost

- **Model**: Claude Haiku 4.5 (fast and cost-effective)
- **Max Tokens**: 1000 (concise evaluation)
- **Typical Duration**: 1-3 seconds per stage
- **Cost per Evaluation**: ~$0.001-0.003

### Optimization

The service is optimized for:
- **Speed**: Uses Haiku, not Sonnet/Opus
- **Accuracy**: Detailed stage-specific criteria
- **Cost**: Short prompts, limited output tokens
- **Reliability**: Graceful error handling, never blocks journey progress

## Integration with ExplorationEngine

### Stage Lifecycle with Quality Scoring

```
1. Execute Stage (Claude Extended Thinking)
   ↓
2. Extract Insights, Questions, Artifacts
   ↓
3. Evaluate Quality (Claude Haiku)
   ↓
4. Store Quality Report in Stage & Context
   ↓
5. Log Quality Summary
   ↓
6. Check if Revision Needed
   ↓
7. Continue to Next Stage or Revise
```

### Context Tracking

Quality reports are stored in multiple locations:

1. **Stage Metadata** (`stage.qualityReport`)
   - Attached to each stage object
   - Persisted to database
   - Available in UI for display

2. **Context Array** (`context.qualityReports`)
   - Chronological history of all evaluations
   - Used for trend analysis
   - Enables journey-wide quality statistics

3. **Console Logs**
   - Real-time quality feedback
   - Helps monitor journey quality during execution

## Best Practices

### 1. Enable for Production Journeys

Quality scoring adds minimal overhead and provides valuable feedback:

```typescript
// ✅ Recommended for important journeys
const productionEngine = new ExplorationEngine(id, {
  enableQualityScoring: true,
  qualityThreshold: 7.0,  // Higher bar for production
});
```

### 2. Adjust Threshold by Use Case

Different use cases need different quality bars:

```typescript
// Research/exploration: Standard threshold
{ qualityThreshold: 6.0 }

// Production artifacts: High threshold
{ qualityThreshold: 7.5 }

// Quick prototyping: Lower threshold
{ qualityThreshold: 5.0 }
```

### 3. Review Low-Quality Stages

When stages score below threshold:

1. Review the `weaknesses` array
2. Check `revisionSuggestions`
3. Implement `improvements`
4. Consider re-running the stage

### 4. Monitor Quality Trends

Track quality across journeys:

```typescript
const trend = qualityScoringService.getQualityTrend(reports);
// [7.2, 6.8, 7.5, 8.0, 7.3] - track improvement over time
```

### 5. Disable for Testing

During development/testing, you may want to disable:

```typescript
const testEngine = new ExplorationEngine(id, {
  enableQualityScoring: false,  // Skip for speed during testing
});
```

## Future Enhancements

### Phase 3: Advanced Features

1. **Auto-Revision**
   - Automatically re-run stages scoring below threshold
   - Use revision suggestions to improve prompts
   - Track revision history

2. **Quality-Aware Stage Selection**
   - Skip optional stages if time limited and quality high
   - Allocate more time to stages with lower quality
   - Adaptive thinking budgets based on quality needs

3. **Multi-Agent Validation**
   - Multiple perspectives (optimistic, skeptical, pragmatic)
   - Consensus-based quality scoring
   - Disagreement analysis

4. **Learning from Quality Patterns**
   - Identify what makes high-quality outputs
   - Train quality prediction models
   - Suggest prompt improvements

## Troubleshooting

### Quality Evaluation Fails

If quality evaluation fails, the journey continues normally:

```
❌ Quality evaluation failed: API timeout
✅ Stage completed: discovering  (continues without quality score)
```

### Low Quality Scores

If getting consistently low scores:

1. **Check criteria alignment**: Are prompts asking for what quality criteria measure?
2. **Review thinking budgets**: Increase budget for complex stages
3. **Analyze weaknesses**: Common patterns indicate systematic issues
4. **Adjust threshold**: May be too high for use case

### False Positives

If high-quality outputs score low:

1. **Review evaluation prompt**: May need refinement for specific domain
2. **Check output format**: Scoring expects specific structure
3. **Consider manual override**: Add quality report manually if needed

## Testing

Run the quality scoring tests:

```bash
npm run test:quality-scoring
```

Test file location: `tests/quality-scoring-test.ts`

## API Reference

### QualityScoringService

#### Methods

```typescript
// Evaluate single stage
evaluateStageQuality(stage: Stage): Promise<QualityReport>

// Evaluate multiple stages
evaluateMultipleStages(stages: Stage[]): Promise<QualityReport[]>

// Get quality trend (array of scores)
getQualityTrend(reports: QualityReport[]): number[]

// Calculate statistics
getQualityStatistics(reports: QualityReport[]): {
  average: number;
  min: number;
  max: number;
  needsRevision: number;
  totalStages: number;
  scoresByDimension: QualityScores;
}
```

## Related Documentation

- [Optimization Types](../src/renderer/lib/engine/types/optimization-types.ts) - Type definitions
- [ExplorationEngine](../src/renderer/lib/engine/ExplorationEngine.ts) - Main engine integration
- [Phase 1 Quick Wins](./phase1-quick-wins.md) - Related improvements
- [Phase 2 Roadmap](./phase2-medium-effort.md) - Overall Phase 2 plan

## Summary

The Quality Scoring Service provides:

✅ **Automatic quality assessment** for all stages
✅ **6-dimension scoring** (completeness, depth, specificity, actionability, coherence, novelty)
✅ **Actionable feedback** (strengths, weaknesses, improvements)
✅ **Revision flagging** when quality falls below threshold
✅ **Fast and cost-effective** using Claude Haiku
✅ **Non-blocking** - failures don't stop journey progress
✅ **Comprehensive tracking** in stage metadata and context
✅ **Configurable** threshold and auto-revision settings

This implements **Medium Effort Optimization #2** from the Phase 2 roadmap, providing continuous quality improvement and self-reflection capabilities to the exploration engine.
