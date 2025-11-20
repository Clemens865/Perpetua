# Chasing Stage Improvements - Analysis & Recommendations

**Date**: October 29, 2025
**Status**: Proposed Improvements
**Priority**: High (affects exploration quality in longer journeys)

---

## Executive Summary

The current chasing stage implementation has **repetition issues in multi-cycle journeys** (8+ stages). When the exploration cycle repeats, chasing stages may pursue similar topics without awareness of what was already explored, reducing exploration diversity and value.

**Key Finding**: In a 16-stage journey, the chasing stage appears at positions 1 and 9, but the second occurrence has no memory of what the first chasing stage already explored.

---

## Current Implementation Analysis

### How Stage Cycling Works

```typescript
// ExplorationEngine.ts:908-909
const nextStageIndex = this.context.currentStage + 1;
const nextStageType = STAGE_TYPES[nextStageIndex % STAGE_TYPES.length];
```

**Stage Sequence** (repeats every 8 stages):
```
Stage 0: discovering
Stage 1: chasing      ← First chasing
Stage 2: solving
Stage 3: challenging
Stage 4: questioning
Stage 5: searching
Stage 6: imagining
Stage 7: building
Stage 8: discovering  ← Cycle repeats
Stage 9: chasing      ← Second chasing (potential repetition!)
Stage 10: solving
...
```

### Chasing Stage Context (Current)

**What the chasing stage sees**:
```typescript
// ExplorationEngine.ts:269-272
Context from previous stages:
${context.previousStages.slice(-2).map(...)}  // Only last 2 stages!

Insights gathered:
${context.insights.slice(-10).join('\n')}    // Only last 10 insights
```

**Problems**:
1. ❌ **Limited Memory**: Only sees last 2 stages (loses context from 8 stages ago)
2. ❌ **No Anti-Repetition**: No tracking of "already chased" topics
3. ❌ **Lost Discoveries**: Important findings from first cycle may be forgotten
4. ❌ **Same Prompt Structure**: Both chasing stages get identical prompts

---

## Identified Issues

### Issue 1: Topic Repetition

**Example Journey** (16 stages):

**Stage 1 (First Chasing)** might chase:
- "Why do developers resist documentation?"
- "What are the root causes of tech debt?"

**Stage 9 (Second Chasing)** might chase:
- "Why do teams struggle with documentation?" ← Similar to first!
- "What causes code quality degradation?" ← Similar to first!

**Impact**: Wasted exploration effort, reduced user value

### Issue 2: Context Loss

**Problem**: By stage 9, the insights from stages 1-7 are only accessible through the `insights` array, but the detailed reasoning and connections are lost.

**Example**:
- Stage 1 discovers: "Documentation friction due to tool complexity"
- Stage 9 should build on this but may rediscover the same issue differently

### Issue 3: No Depth Progression

**Current**: All chasing stages have the same "depth" - no distinction between:
- **First Chase** (broad problem identification)
- **Second Chase** (deeper root cause analysis)
- **Third Chase** (systemic patterns)

---

## Proposed Improvements

### Strategy 1: Chasing Stage History Tracking

**Add to ExplorationContext**:
```typescript
export type ExplorationContext = {
  journeyId: string;
  currentStage: number;
  previousStages: Stage[];
  insights: string[];
  questions: string[];
  artifacts: string[];

  // NEW: Track exploration history
  chasedTopics: string[];        // Topics already explored
  chasingDepth: number;           // How many times we've chased (0, 1, 2...)
  explorationFocus: string[];    // Current focus areas
};
```

**Benefits**:
- Track what's been chased
- Prevent duplicate exploration
- Guide deeper investigation

### Strategy 2: Enhanced Chasing Prompt with Anti-Repetition

**Modify chasing prompt** to include:

```typescript
chasing: (context: ExplorationContext, input: string, stagesRemaining?: number) => {
  const chasingOccurrence = Math.floor(context.currentStage / STAGE_TYPES.length) + 1;
  const previousChasingStages = context.previousStages.filter(s => s.type === 'chasing');

  // Extract previously chased topics
  const alreadyChased = previousChasingStages.length > 0
    ? `\n\n<previously_chased>
Topics and problems already explored in earlier chasing stages:
${previousChasingStages.map((s, i) => `
Chasing Round ${i + 1}:
${s.result?.substring(0, 400)}...
`).join('\n')}

IMPORTANT: Do NOT repeat these topics. Find NEW, unexplored problems.
</previously_chased>`
    : '';

  const depthGuidance = chasingOccurrence === 1
    ? `This is your FIRST chasing stage - focus on identifying diverse surface-level problems and root causes.`
    : chasingOccurrence === 2
    ? `This is your SECOND chasing stage - go DEEPER. Find systemic patterns, hidden assumptions, and meta-problems that weren't obvious in the first round.`
    : `This is your ${chasingOccurrence}th chasing stage - focus on CROSS-CUTTING concerns, emergent properties, and system-level dynamics.`;

  return `
You are in the CHASING stage - finding deeper problems.
Current date: ${new Date().toISOString().split('T')[0]}

<depth_guidance>
${depthGuidance}
</depth_guidance>
${alreadyChased}

<task_context>
Context from previous stages:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}

All insights from full journey:
${context.insights.join('\n')}

Core Objective: Identify NEW underlying problems, root causes, and hidden opportunities that haven't been explored yet.
</task_context>

<process>
Follow this structured approach:

1. **Review Previously Explored**:
   - Quickly scan what's already been chased
   - Identify gaps and blind spots
   - Note unexplored angles

2. **Problem Space Mapping** (NEW AREAS ONLY):
   - List observable symptoms NOT yet analyzed
   - Identify potential root causes for each
   - Map cause-effect relationships

3. **5-Whys Analysis** (go deeper than before):
   - For NEW symptoms, ask "Why?" repeatedly
   - Trace back to fundamental causes
   - Distinguish symptoms from root causes

4. **Hidden Assumptions & Constraints**:
   - What NEW assumptions haven't we questioned?
   - What constraints did we miss?
   - What problems are we STILL not seeing?

5. **Systemic Analysis**:
   - How do problems interconnect in ways we haven't explored?
   - What NEW feedback loops exist?
   - What leverage points did we miss?
</process>

<diversity_requirements>
- Explore at least 3-5 NEW problem areas not covered before
- If you notice overlap, explicitly redirect to adjacent unexplored territory
- Focus on problems at different scales (individual, team, system, societal)
- Consider problems from different stakeholder perspectives
</diversity_requirements>

<output_format>
Provide structured analysis with:
1. **New Problem Areas**: Problems NOT explored in previous chasing
2. **Deeper Root Causes**: Going beneath surface-level findings
3. **Hidden Assumptions**: Unquestioned beliefs we haven't examined
4. **Systemic Patterns**: New interconnections and feedback loops
5. **Leverage Points**: Where intervention would be most effective
</output_format>

<quality_guidelines>
- Be specific about cause-effect relationships
- Distinguish between correlation and causation
- Note confidence levels for each claim
- EXPLICITLY avoid repeating previous chasing topics
- If you find yourself repeating, pivot to an adjacent unexplored area
</quality_guidelines>
`;
}
```

### Strategy 3: Cycle-Aware Context Windows

**Adjust context windows based on cycle**:

```typescript
// For first occurrence of any stage type
if (stageOccurrence === 1) {
  contextWindow = previousStages.slice(-2);  // Recent context only
}
// For second+ occurrence
else {
  // Include ALL previous occurrences of this stage type + recent context
  const previousSameType = previousStages.filter(s => s.type === type);
  const recentContext = previousStages.slice(-3);
  contextWindow = [...previousSameType, ...recentContext];
}
```

### Strategy 4: Progressive Depth Indicators

**Add stage metadata**:

```typescript
interface Stage {
  // ... existing fields

  // NEW: Cycle tracking
  cycleNumber: number;     // Which cycle (0-based): 0, 1, 2...
  stageInCycle: number;    // Position in cycle (0-7)
  occurrenceOfType: number; // How many times this stage type has run (1, 2, 3...)
}
```

---

## Implementation Recommendations

### Phase 1: Track Chasing History (Quick Win)

**Changes**:
1. Add `chasedTopics: string[]` to `ExplorationContext`
2. Extract topics from each chasing stage result
3. Pass to next chasing stage in prompt

**Effort**: 2-3 hours
**Impact**: HIGH - Prevents obvious repetition

### Phase 2: Enhanced Prompts with Depth (Medium)

**Changes**:
1. Detect cycle number: `Math.floor(currentStage / 8)`
2. Filter previous chasing stages
3. Build anti-repetition guidance
4. Add depth-specific instructions

**Effort**: 4-6 hours
**Impact**: VERY HIGH - Diverse exploration + depth progression

### Phase 3: Cycle-Aware Context (Advanced)

**Changes**:
1. Add cycle tracking to Stage interface
2. Implement smart context windowing
3. Update database schema for cycle fields
4. Migrate existing journeys

**Effort**: 8-12 hours
**Impact**: HIGH - Better context across long journeys

---

## Example: 16-Stage Journey with Improvements

### Without Improvements:
```
Stage 1 (Chasing): "Documentation friction, tool complexity, developer habits"
Stage 9 (Chasing): "Documentation challenges, tooling issues, dev workflows"
                    ↑ Nearly identical!
```

### With Improvements:
```
Stage 1 (Chasing - First Pass):
- "Documentation friction due to tool complexity"
- "Knowledge silos from async communication"
- "Onboarding challenges with codebases"

Stage 9 (Chasing - Second Pass, Depth 2):
- [AVOIDS: Documentation, tools, onboarding] ← Anti-repetition
- [FOCUSES: Deeper patterns]
- "Meta-problem: Why do solutions to documentation problems fail?"
- "Systemic issue: Incentive misalignment between speed and quality"
- "Hidden assumption: We assume documentation = text, ignoring other knowledge transfer modes"
```

---

## Metrics for Success

**Before Improvements**:
- Topic overlap between chasing stages: ~60-80%
- User perception: "It feels repetitive"
- Unique insights per cycle: Decreasing

**After Improvements**:
- Topic overlap between chasing stages: <20%
- User perception: "Each cycle goes deeper"
- Unique insights per cycle: Stable or increasing

---

## Next Steps

1. **Review**: Discuss approach with team
2. **Prototype**: Implement Phase 1 (tracking)
3. **Test**: Run 16-stage journey and measure repetition
4. **Iterate**: Refine prompts based on results
5. **Deploy**: Roll out Phase 2 improvements
6. **Monitor**: Track user feedback and metrics

---

## Related Files

- `/src/renderer/lib/engine/ExplorationEngine.ts:263-317` - Chasing stage prompt
- `/src/renderer/lib/engine/ExplorationEngine.ts:903-917` - Stage cycling logic
- `/src/renderer/lib/engine/ExplorationEngine.ts:922-1075` - Stage execution
- `/src/renderer/types/index.ts` - Type definitions

---

**Questions? Feedback?**

This analysis is based on code review and architectural understanding. Real-world testing with 16-stage journeys will validate assumptions and refine improvements.
