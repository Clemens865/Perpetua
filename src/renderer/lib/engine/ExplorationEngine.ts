/**
 * Exploration Engine
 * The core of Perpetua - manages the infinite 8-stage exploration cycle
 *
 * Stages:
 * 1. DISCOVERING  - Research and explore the topic
 * 2. CHASING      - Find deeper problems to solve
 * 3. SOLVING      - Generate potential solutions
 * 4. CHALLENGING  - Question assumptions and constraints
 * 5. QUESTIONING  - Ask probing questions
 * 6. SEARCHING    - Deep web research and discovery
 * 7. IMAGINING    - Creative possibilities and scenarios
 * 8. BUILDING     - Create concrete artifacts
 */

import type { Journey, Stage, StageType, StageStatus } from '../../types';
import { claudeService, type ClaudeModel } from '../../services/claude/ClaudeService';
import { ipcClient } from '../../services/ipc/IPCClient';
import { useAppStore } from '../../store/useAppStore';
import { insightExtractionService } from './services/InsightExtractionService';
import { QuestionTrackingService } from './services/QuestionTrackingService';
import { MiniSynthesisService } from './services/MiniSynthesisService';
import { qualityScoringService } from './services/QualityScoringService';
import { artifactValidationService } from './services/ArtifactValidationService';
import type { RichInsight, TrackedQuestion, RichArtifact, ContextSummary, QualityReport } from './types/optimization-types';

export type ExplorationConfig = {
  maxDepth?: number;           // Maximum recursion depth (default: Infinity)
  autoProgress?: boolean;       // Automatically move to next stage (default: true)
  extendedThinking?: boolean;   // Use Claude Extended Thinking (default: true)
  saveArtifacts?: boolean;      // Save artifacts to database (default: true)
  // Phase 2: Quality scoring configuration
  enableQualityScoring?: boolean; // Enable quality assessment (default: true)
  qualityThreshold?: number;      // Minimum acceptable score 0-10 (default: 6.0)
  autoRevise?: boolean;           // Automatically retry low-quality stages (default: false)
  maxRevisions?: number;          // Maximum revision attempts (default: 1)
};

export type ExplorationContext = {
  journeyId: string;
  currentStage: number;
  previousStages: Stage[];
  insights: string[];
  questions: TrackedQuestion[]; // Phase 1 Quick Win #2: Tracked questions with metadata
  artifacts: RichArtifact[]; // Phase 1 Quick Win #5: Rich artifacts with metadata and validation
  chasedTopics: string[]; // Phase 1: Track topics already explored in chasing stages
  richInsights?: RichInsight[]; // Phase 1: Enhanced insights with metadata (Optional for backwards compatibility)
  qualityReports: QualityReport[]; // Phase 2: Quality assessment history
};

const STAGE_TYPES: StageType[] = [
  'discovering',
  'chasing',
  'solving',
  'challenging',
  'questioning',
  'searching',
  'imagining',
  'building',
];

const SUMMARY_STAGE: StageType = 'building'; // Reuse building stage for summary

/**
 * Intelligent model selection per stage
 * Optimizes for cost and performance based on stage requirements
 *
 * Strategy:
 * - Haiku 4.5: Fast, cost-effective for simpler tasks
 * - Sonnet 4.5: Balanced power and speed for complex tasks
 * - Opus 4: Maximum capability for critical thinking
 */
const MODEL_PER_STAGE: Record<StageType, ClaudeModel> = {
  discovering: 'claude-sonnet-4-5-20250929',  // Complex research requires depth
  chasing: 'claude-haiku-4-5',                 // Fast problem identification
  solving: 'claude-sonnet-4-5-20250929',      // Multiple solutions need depth
  challenging: 'claude-opus-4-20250514',      // Critical thinking needs max capability
  questioning: 'claude-haiku-4-5',             // Fast question generation
  searching: 'claude-sonnet-4-5-20250929',    // Complex research and synthesis
  imagining: 'claude-sonnet-4-5-20250929',    // Creative scenarios need depth
  building: 'claude-opus-4-20250514',         // Highest quality artifacts
};

/**
 * Optimized thinking budgets per stage type
 * Allocates tokens based on cognitive complexity requirements
 *
 * Strategy:
 * - High budgets (15000): Complex problem-solving and artifact creation
 * - Medium budgets (12000-14000): Deep research and critical thinking
 * - Low budgets (6000-8000): Focused tasks and question generation
 */
const THINKING_BUDGETS: Record<StageType, number> = {
  discovering: 12000,   // High depth needed for comprehensive research
  chasing: 8000,        // Focused problem identification
  solving: 15000,       // Highest - multiple solution exploration
  challenging: 14000,   // Critical thinking and adversarial analysis
  questioning: 6000,    // Low - efficient question generation
  searching: 8000,      // Medium - targeted research
  imagining: 12000,     // Creative scenario exploration
  building: 15000,      // Highest - complete artifact creation
};

/**
 * Generate a summary prompt for the final stage
 */
const SUMMARY_PROMPT = (context: ExplorationContext, input: string) => `
You are creating the FINAL SUMMARY of this exploration journey.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
Original Question: ${input}

Journey Overview:
- Total stages completed: ${context.previousStages.length}
- Insights gathered: ${context.insights.length}
- Questions generated: ${context.questions.length}

All Journey Insights:
${context.insights.join('\n')}

Complete Stage History:
${context.previousStages.map((s, i) => `
Stage ${i + 1} - ${s.type.toUpperCase()}:
${s.result?.substring(0, 300)}...
`).join('\n')}

Core Objective: Create a comprehensive, actionable summary that synthesizes the entire exploration journey and provides clear next steps.
</task_context>

<process>
Follow this structured approach:

1. **Executive Summary** (2-3 paragraphs):
   - What was the original question/goal?
   - What did we discover?
   - What's the key takeaway?

2. **Key Findings** (5-10 major insights):
   - Synthesize insights across all stages
   - Highlight breakthrough discoveries
   - Note patterns and connections
   - Provide specific evidence and examples

3. **Critical Questions Answered**:
   - Address the most important questions raised
   - Provide clear, evidence-based answers
   - Note remaining uncertainties

4. **Recommendations & Next Steps**:
   - Immediate actions (can be done now)
   - Short-term priorities (next 1-3 months)
   - Long-term strategies (3+ months)
   - Resources needed
   - Success metrics

5. **Journey Artifacts Created**:
   - List key outputs from BUILDING stages
   - Link to specific findings and evidence
   - Explain how to use each artifact

6. **Areas for Further Exploration**:
   - Unanswered questions
   - Emerging topics discovered
   - Follow-up research needed
</process>

<output_format>
# Journey Summary: [Title based on original question]

## Executive Summary
[2-3 paragraphs synthesizing the entire journey]

## Key Findings
1. **[Finding Title]**: [Detailed explanation with evidence]
2. **[Finding Title]**: [Detailed explanation with evidence]
[Continue for 5-10 findings]

## Critical Questions Addressed
### [Question 1]
**Answer**: [Comprehensive answer]
**Evidence**: [Supporting facts and sources]
**Confidence**: High/Medium/Low

[Repeat for top 5-7 questions]

## Recommendations & Next Steps

### Immediate Actions (Now)
1. [Specific action with clear steps]
2. [Specific action with clear steps]

### Short-Term Priorities (1-3 months)
1. [Priority with timeline and resources]
2. [Priority with timeline and resources]

### Long-Term Strategy (3+ months)
1. [Strategic direction with milestones]
2. [Strategic direction with milestones]

## Journey Artifacts
- **[Artifact Name]**: [What it is and how to use it]
- **[Artifact Name]**: [What it is and how to use it]

## Further Exploration
- [Unanswered question or emerging topic]
- [Unanswered question or emerging topic]

## Conclusion
[Final thoughts and overall assessment - 1 paragraph]
</output_format>

<quality_guidelines>
- Be comprehensive but concise
- Provide actionable insights
- Include specific examples and evidence
- Make recommendations concrete and measurable
- Acknowledge uncertainties honestly
- Connect insights across stages
- Focus on practical value
- End with clear next steps
</quality_guidelines>
`;

const STAGE_PROMPTS = {
  discovering: (context: ExplorationContext, input: string, stagesRemaining?: number) => `
You are in the DISCOVERING stage of an exploration journey.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
Original Question: ${input}

${stagesRemaining ? `
⚠️ **Journey Planning**: You have ${stagesRemaining} stages remaining (including this one).
- Reserve the LAST stage for a comprehensive summary
- Plan your exploration to fit within ${stagesRemaining - 1} exploration stages
- Make each stage count - be thorough but efficient
` : ''}

${context.previousStages.length > 0 ? `
Previous Insights:
${context.insights.join('\n')}

Previous Stage Context:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}
` : ''}

Core Objective: Research and deeply explore this topic from multiple angles to build a comprehensive understanding.
</task_context>

<process>
Follow this structured approach:

1. **Assessment** (think thoroughly):
   - Break down the question into key concepts and entities
   - Determine if this is depth-first (multiple perspectives on one topic) or breadth-first (multiple distinct sub-topics)
   - Identify what information would be most valuable

2. **Research Planning** (consider at least 3 different approaches):
   - Approach A: Historical/evolutionary perspective
   - Approach B: Current state/technical analysis
   - Approach C: Interdisciplinary connections
   - Select the most promising combination

3. **Deep Exploration**:
   - Core concepts and fundamentals
   - Historical context and evolution
   - Related fields and interdisciplinary connections
   - Current state and recent developments
   - Edge cases and unusual perspectives

4. **Synthesis**:
   - Connect findings into coherent insights
   - Identify patterns and relationships
   - Note areas needing further investigation
</process>

<output_format>
Provide a comprehensive research report with:
- Key concepts defined
- Historical context
- Current state analysis
- Interdisciplinary connections
- Specific examples and evidence
- Sources cited where applicable
</output_format>

<quality_guidelines>
- Maintain high information density
- Be specific and precise with examples
- Distinguish facts from speculation
- Note confidence levels
- Cite credible sources
</quality_guidelines>
`,

  chasing: (context: ExplorationContext, input: string, stagesRemaining?: number) => {
    // Phase 1: Include previously chased topics for anti-repetition
    const previouslyChased = context.chasedTopics.length > 0
      ? `\n\n<previously_chased>
⚠️ TOPICS ALREADY EXPLORED IN PREVIOUS CHASING STAGES:
${context.chasedTopics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}

🎯 CRITICAL INSTRUCTION: Do NOT repeat these topics!
- Find NEW problems and root causes
- Explore different angles and perspectives
- Go deeper into unexplored territory
- If you notice overlap, pivot to adjacent areas
</previously_chased>`
      : '';

    return `
You are in the CHASING stage - finding deeper problems.
Current date: ${new Date().toISOString().split('T')[0]}
${previouslyChased}

<task_context>
Context from previous stages:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}

Insights gathered:
${context.insights.slice(-10).join('\n')}

Core Objective: Identify underlying problems, root causes, and hidden opportunities that weren't immediately obvious${context.chasedTopics.length > 0 ? ' - focusing on NEW, unexplored areas' : ''}.
</task_context>

<process>
Follow this structured approach:

1. **Problem Space Mapping**:
   - List all observable symptoms and surface-level issues
   - Identify potential root causes for each
   - Map cause-effect relationships

2. **5-Whys Analysis** (go at least 5 levels deep):
   - For each symptom, ask "Why?" repeatedly
   - Trace back to fundamental causes
   - Distinguish symptoms from root causes

3. **Hidden Assumptions & Constraints**:
   - What are we taking for granted?
   - What constraints are artificial vs. necessary?
   - What problems are we not seeing?
   - Who benefits from the current situation?

4. **Systemic Analysis**:
   - How do different problems interconnect?
   - What feedback loops exist?
   - What leverage points could create change?
</process>

<output_format>
Provide a structured analysis with:
1. **Surface Symptoms**: Observable issues
2. **Root Causes**: Fundamental underlying problems
3. **Hidden Assumptions**: What we're taking for granted
4. **Systemic Patterns**: How problems interconnect
5. **Leverage Points**: Where intervention would be most effective
</output_format>

<quality_guidelines>
- Be specific about cause-effect relationships
- Distinguish between correlation and causation
- Note confidence levels for each claim
- Identify problems worth solving vs. accepting
</quality_guidelines>
`;
  },

  solving: (context: ExplorationContext, input: string, stagesRemaining?: number) => `
You are in the SOLVING stage - generating solutions.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
Problems identified:
${context.insights.slice(-10).join('\n')}

Previous stage context:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 150)}...`).join('\n')}

Core Objective: Generate diverse, creative, and practical solutions that address the root causes identified.
</task_context>

<process>
Follow this structured approach:

1. **Divergent Thinking** (generate at least 5-7 solutions across types):
   - **Quick Wins**: Implementable immediately with existing resources
   - **Systemic Solutions**: Address root causes, require structural changes
   - **Innovative Combinations**: Novel approaches combining existing ideas
   - **Unconventional Approaches**: Challenge standard methods
   - **Aspirational Solutions**: If we had no constraints

2. **Solution Analysis** (for each solution):
   - Implementation feasibility (Low/Medium/High)
   - Expected impact (Low/Medium/High)
   - Resource requirements
   - Time horizon (Short/Medium/Long term)
   - Key risks and dependencies

3. **Convergent Analysis**:
   - Compare solutions across dimensions
   - Identify complementary vs. mutually exclusive approaches
   - Rank by priority (impact × feasibility)

4. **Implementation Planning** (for top 3 solutions):
   - Concrete first steps
   - Success metrics
   - Potential obstacles
</process>

<output_format>
Provide structured solutions:
1. **Solution Name**: Brief description
   - Type: [Quick Win / Systemic / Innovative / etc.]
   - Impact: [Low/Medium/High]
   - Feasibility: [Low/Medium/High]
   - Implementation: Concrete next steps
   - Risks: Key challenges

[Repeat for 5-7 solutions]

**Recommendation**: Top 3 solutions with rationale
</output_format>

<quality_guidelines>
- Be specific and actionable
- Provide concrete examples
- Consider implementation reality
- Note tradeoffs explicitly
- Prioritize solutions that address root causes
</quality_guidelines>
`,

  challenging: (context: ExplorationContext, input: string, stagesRemaining?: number) => `
You are in the CHALLENGING stage - questioning everything.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
Current solutions and insights:
${context.insights.slice(-5).join('\n')}

Previous stage context:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 150)}...`).join('\n')}

Core Objective: Challenge all assumptions, question constraints, identify blind spots, and stress-test conclusions through adversarial thinking.
</task_context>

<process>
Follow this structured approach:

1. **Assumption Identification**:
   - List all explicit assumptions made in previous stages
   - Identify implicit assumptions (unstated beliefs)
   - Uncover hidden assumptions (cultural, cognitive biases)
   - Mark each as: Explicit, Implicit, or Hidden

2. **Challenge Each Assumption** (for top 5-7 assumptions):
   - What if the opposite were true?
   - What evidence contradicts this?
   - Who would disagree and why?
   - Under what conditions would this fail?
   - What are we taking for granted?

3. **Blind Spot Analysis**:
   - What perspectives are missing? (cultural, demographic, disciplinary)
   - What could we be overlooking? (edge cases, long-term effects)
   - What biases might we have? (confirmation, availability, recency)
   - Who is not at the table? (stakeholders, affected parties)

4. **Risk Assessment & Failure Modes**:
   - What could go wrong with proposed solutions?
   - What unintended consequences might occur?
   - What dependencies are fragile?
   - What's the worst-case scenario?
</process>

<output_format>
Provide structured critical analysis:

1. **Assumptions to Challenge**:
   - Assumption: [Statement]
   - Type: [Explicit/Implicit/Hidden]
   - Challenge: [Counter-argument or alternative perspective]
   - Risk if wrong: [Potential consequences]

[Repeat for 5-7 key assumptions]

2. **Missing Perspectives**: Who/what we haven't considered
3. **Blind Spots**: What we might be overlooking
4. **Risk Assessment**: Top 3-5 failure modes with mitigation strategies
5. **Strongest Counter-Arguments**: Best cases against our conclusions
</output_format>

<quality_guidelines>
- Be genuinely adversarial, not superficial
- Provide specific counter-examples
- Distinguish between fatal flaws and minor issues
- Be constructive - identify how to address weaknesses
- Note which criticisms are most critical
</quality_guidelines>
`,

  questioning: (context: ExplorationContext, input: string, stagesRemaining?: number) => `
You are in the QUESTIONING stage - asking probing questions.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
Journey so far:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 150)}...`).join('\n')}

Current insights:
${context.insights.slice(-10).join('\n')}

Core Objective: Generate deep, probing questions across multiple categories that push the exploration into new territories and reveal hidden complexities.
</task_context>

<process>
Follow this structured approach:

1. **Assessment**:
   - Review what we've learned so far
   - Identify gaps in understanding
   - Note areas needing deeper investigation
   - Determine which question types are most valuable

2. **Question Generation** (aim for 15-20 questions across categories):

   **Clarifying Questions** (understand better):
   - What exactly do we mean by [concept]?
   - How does [X] relate to [Y]?
   - What are the boundaries/definitions?

   **Probing Questions** (go deeper - 5 Whys):
   - Why is this the case?
   - What causes this to happen?
   - What's beneath the surface?
   - Why does that matter?

   **Hypothetical Questions** (explore possibilities):
   - What if we removed constraint [X]?
   - How would this work in scenario [Y]?
   - What if the opposite were true?

   **Challenge Questions** (test understanding):
   - What evidence contradicts this?
   - What are the counterarguments?
   - Who would disagree and why?

   **Meta Questions** (about the exploration itself):
   - What are we not asking?
   - What should we be investigating?
   - What blind spots might we have?

   **Future-Oriented Questions**:
   - What happens next?
   - What are the long-term implications?
   - How might this evolve?

3. **Prioritization**:
   - Mark top 5 most important questions
   - Identify which need immediate research
   - Flag questions that could change everything
</process>

<output_format>
Provide organized questions:

**CLARIFYING** (3-4 questions)
1. [Question that clarifies concepts/definitions]
2. ...

**PROBING** (5-6 questions going progressively deeper)
1. [Surface-level why]
2. [Second-level why]
3. [Third-level why - root cause]
...

**HYPOTHETICAL** (3-4 questions exploring scenarios)
1. [What if scenario]
...

**CHALLENGE** (3-4 questions testing assumptions)
1. [Counter-perspective question]
...

**META** (2-3 questions about the exploration)
1. [Question about what we're missing]
...

**PRIORITY FLAGS**:
⭐⭐⭐ = Critical to answer immediately
⭐⭐ = High priority
⭐ = Important but can wait

[Mark 5 questions with priority stars]
</output_format>

<quality_guidelines>
- Make questions specific, not generic
- Each question should reveal something new
- Avoid yes/no questions - ask open-ended
- Questions should be actionable (can be researched/answered)
- Balance depth vs. breadth
</quality_guidelines>
`,

  searching: (context: ExplorationContext, input: string, stagesRemaining?: number) => {
    // Phase 1 Quick Win #2: Format tracked questions with status and priority
    const unansweredQuestions = context.questions
      .filter(q => q.status === 'unanswered' || q.status === 'partial')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 15);

    const questionList = unansweredQuestions.length > 0
      ? unansweredQuestions.map((q, i) => {
          const priorityEmoji = {
            critical: '🔴',
            high: '🟠',
            medium: '🟡',
            low: '⚪'
          }[q.priority];
          const statusTag = q.status === 'partial' ? ' [PARTIALLY ANSWERED]' : '';
          return `${i + 1}. ${priorityEmoji} [${q.priority.toUpperCase()}]${statusTag} ${q.question}`;
        }).join('\n')
      : 'No specific questions to research - explore the topic broadly.';

    return `
You are in the SEARCHING stage - deep research and discovery.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
🎯 PRIORITY QUESTIONS TO ANSWER (${unansweredQuestions.length} unanswered):
${questionList}

⚠️ CRITICAL INSTRUCTION: For EACH question you answer, provide:
- The question being answered (copy verbatim from above)
- Your comprehensive answer with evidence
- Confidence level (verified/high/medium/low/speculative)
- Supporting evidence with sources

Previous findings:
${context.insights.slice(-5).join('\n')}

Core Objective: Systematically answer the priority questions above, find credible evidence, and discover new information through thorough research.
</task_context>

<process>
Follow this structured approach using OODA loop:

1. **Research Planning** (Observe):
   - Identify top 5-10 questions needing answers
   - Determine information sources needed:
     * Academic/research papers
     * Expert opinions and interviews
     * Case studies and examples
     * Data and statistics
     * Historical records
     * Current trends and signals
   - Prioritize by importance and discoverability

2. **Research Execution** (Orient & Decide):
   Use multiple research strategies:
   - **Web Research**: Search for authoritative sources
   - **Cross-Referencing**: Verify claims across multiple sources
   - **Primary Sources**: Prioritize original research over aggregators
   - **Expert Sources**: Find domain experts and their work
   - **Data Sources**: Locate statistics, studies, datasets

   Research Budget: 10-15 iterations
   Stop when: Diminishing returns or sufficient coverage

3. **Source Quality Assessment** (for each source):
   - **Recency**: Publication date, still relevant?
   - **Authority**: Author credentials, institutional backing?
   - **Reliability**: Peer-reviewed, fact-checked, reputable?
   - **Type**: Original research vs. secondary vs. opinion?
   - **Conflicts**: Any contradicting information?

4. **Synthesis & Citation** (Act):
   - Compile findings for each question
   - Cite specific sources with URLs/references
   - Note confidence levels (High/Medium/Low)
   - Flag speculation vs. verified facts
   - Identify remaining gaps
</process>

<output_format>
For each question researched:

**Q: [Question verbatim from priority list above]**

**Answer**: [Comprehensive answer based on research]

**Evidence**:
- [Specific fact/statistic] (Source: [Citation with URL/reference])
- [Example or case study] (Source: [Citation])
- [Expert opinion] (Source: [Citation])

**Source Quality**:
- Primary sources: [Count and examples]
- Secondary sources: [Count and examples]
- Publication dates: [Range, e.g., 2020-2025]

**Confidence Level**: verified/high/medium/low/speculative
**Reasoning**: [Why this confidence level]

**Gaps**: [What we still don't know - if any]

---

[Repeat for as many priority questions as you can thoroughly answer]

⚠️ IMPORTANT: Copy each question EXACTLY as written above so it can be matched and marked as answered.

**SUMMARY OF FINDINGS**:
- Total questions answered: [Number] of ${unansweredQuestions.length}
- Questions fully answered: [List question numbers]
- Questions partially answered: [List question numbers if any]
- Questions not addressed: [List question numbers if any]
- Total sources consulted: [Number]
- Key discoveries: [3-5 bullet points]
- Strongest evidence for: [Claims]
- Areas needing more research: [Gaps]
</output_format>

<quality_guidelines>
- Prioritize original sources over aggregators
- Verify claims across multiple independent sources
- Note publication dates and recency
- Distinguish facts from speculation clearly
- Cite specific sources (not just "studies show")
- Flag conflicting information explicitly
- Maintain epistemic humility - note confidence levels
- Focus on high-value, significant information
</quality_guidelines>
`;
},

  imagining: (context: ExplorationContext, input: string, stagesRemaining?: number) => `
You are in the IMAGINING stage - creative possibilities.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
Everything discovered so far:
${context.insights.slice(-15).join('\n')}

Key findings from recent stages:
${context.previousStages.slice(-3).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}

Core Objective: Imagine creative possibilities, future scenarios, and breakthrough innovations while staying grounded in research insights and realistic constraints.
</task_context>

<process>
Follow this structured approach:

1. **Foundation Assessment**:
   - Review all insights and findings
   - Identify key variables and drivers of change
   - Note constraints vs. flexible assumptions
   - Determine what's fixed vs. what could evolve

2. **Scenario Generation** (create at least 4 distinct scenarios):

   **Best-Case Scenario** (Everything goes right):
   - What does success look like?
   - What enabling factors align?
   - Timeline: 1 year, 5 years, 10 years
   - Key milestones and breakthroughs

   **Worst-Case Scenario** (Everything goes wrong):
   - What are the failure modes?
   - What risks materialize?
   - Timeline: 1 year, 5 years, 10 years
   - Warning signs and inflection points

   **Most Likely Scenario** (Realistic prediction):
   - What probably happens?
   - What's the expected trajectory?
   - Timeline: 1 year, 5 years, 10 years
   - Key decision points

   **Wildcard Scenario** (Unexpected developments):
   - What surprising turn could occur?
   - What would disrupt current thinking?
   - Timeline: When could this emerge?
   - Early signals to watch for

3. **Innovation Exploration**:
   - Novel combinations of existing ideas
   - Breakthrough possibilities if constraints removed
   - Cross-pollination from other fields
   - Unconventional applications

4. **Synthesis Across Scenarios**:
   - Common threads and patterns
   - Key uncertainties and decision points
   - Strategies that work across multiple futures
   - Early warning indicators
</process>

<output_format>
For each scenario, provide:

**[SCENARIO NAME]**

**Timeline**:
- 1 Year: [What happens in short term]
- 5 Years: [Medium-term evolution]
- 10+ Years: [Long-term implications]

**Key Drivers**: [What makes this scenario unfold]
**Critical Decisions**: [Choices that lead here]
**Indicators**: [Early signs this is happening]
**Stakeholder Impact**: [Who wins/loses]

**Narrative**: [Vivid 2-3 paragraph description painting the picture]

---

**INNOVATIVE POSSIBILITIES**:
1. [Breakthrough idea combining concepts]
2. [Novel application or approach]
3. [Unconventional solution]
4. [Cross-domain innovation]

**SYNTHESIS**:
- **Common Threads**: [Patterns across scenarios]
- **Key Uncertainties**: [What we can't predict]
- **Robust Strategies**: [What works in multiple futures]
- **Watch Signals**: [Early indicators to monitor]
</output_format>

<quality_guidelines>
- Be creative but grounded in research
- Make scenarios vivid and specific
- Identify realistic causal mechanisms
- Balance optimism with realism
- Note probability estimates where possible
- Distinguish between plausible and possible
- Focus on insights that inform decisions
</quality_guidelines>
`,

  building: (context: ExplorationContext, stagesRemaining?: number) => `
You are in the BUILDING stage - creating concrete artifacts.
Current date: ${new Date().toISOString().split('T')[0]}

<task_context>
All insights from this journey:
${context.insights.join('\n')}

Journey summary:
- Stages completed: ${context.previousStages.length}
- Questions generated: ${context.questions.length}
- Total insights: ${context.insights.length}

${stagesRemaining ? `
⚠️ **Journey Planning**: You have ${stagesRemaining} stages remaining (including this one).
- If this is near the end, consider building artifacts that synthesize the journey
- Reserve the LAST stage for a comprehensive summary
` : ''}

Recent stage outputs:
${context.previousStages.slice(-2).map(s => `[${s.type}]: ${s.result?.substring(0, 200)}...`).join('\n')}

Core Objective: Create tangible, high-quality artifacts that capture the journey's insights and make them useful, shareable, and actionable for others.
</task_context>

<process>
Follow this structured approach:

1. **Artifact Selection**:
   Review the journey and determine which artifacts are most valuable:

   - **Executive Summary**: 1-page overview of key findings (good for all journeys)
   - **Mind Map**: Visual representation of connections and relationships
   - **Action Plan**: Concrete next steps with priorities and timelines
   - **Code/Prototype**: Working example or proof-of-concept (if technical)
   - **Framework/Model**: Reusable mental model or decision framework
   - **Comprehensive Report**: Full documentation with all details
   - **Presentation**: Slide deck or visual summary
   - **Implementation Guide**: Step-by-step how-to with examples

   Select 1-3 most appropriate artifacts based on journey type and audience

2. **Creation** (for each artifact):
   - Use appropriate formatting (Markdown, code blocks, tables, diagrams)
   - Structure for easy consumption
   - Include specific examples and evidence
   - Make it actionable with concrete next steps
   - Ensure completeness - don't leave gaps
   - Add visual elements where helpful

3. **Quality Validation**:
   For each artifact, verify:
   - **Useful**: Does it provide value? Solve a problem?
   - **Complete**: Are all key points covered?
   - **Actionable**: Can someone use this immediately?
   - **Shareable**: Is it formatted for easy distribution?
   - **Accurate**: Does it reflect the journey findings?
   - **Clear**: Can a newcomer understand it?

4. **Packaging**:
   - Add metadata (date, context, sources)
   - Include usage instructions if needed
   - Provide examples or case studies
   - Note limitations and assumptions
</process>

<output_format>
Create 1-3 artifacts with this structure:

**ARTIFACT 1: [Type - e.g., Executive Summary]**

[Full artifact content here - properly formatted and complete]

**Metadata**:
- Created: ${new Date().toISOString().split('T')[0]}
- Journey stages: ${context.previousStages.length}
- Target audience: [Who should use this]
- Usage: [How to use this artifact]

---

**ARTIFACT 2: [Type]**

[Full artifact content here]

**Metadata**:
[Same as above]

---

**USAGE NOTES**:
- Best applied to: [Context where these artifacts are most valuable]
- Prerequisites: [What's needed to use these]
- Next steps: [What to do with these artifacts]
</output_format>

<quality_guidelines>
- Prioritize completeness over brevity
- Use professional formatting (Markdown, code blocks, tables)
- Include specific examples, not just theory
- Make recommendations concrete and actionable
- Cite key sources from SEARCHING stage
- Add visual structure (headers, lists, emphasis)
- Test that code/examples actually work
- Write for clarity - assume intelligent but uninformed reader
</quality_guidelines>
`,
};

export class ExplorationEngine {
  private config: Required<ExplorationConfig>;
  private context: ExplorationContext;
  private questionTracker: QuestionTrackingService; // Phase 1 Quick Win #2: Question tracking service

  constructor(journeyId: string, config: ExplorationConfig = {}) {
    this.config = {
      maxDepth: config.maxDepth ?? Infinity,
      autoProgress: config.autoProgress ?? true,
      extendedThinking: config.extendedThinking ?? true,
      saveArtifacts: config.saveArtifacts ?? true,
      enableQualityScoring: config.enableQualityScoring ?? true,
      qualityThreshold: config.qualityThreshold ?? 6.0,
      autoRevise: config.autoRevise ?? false,
      maxRevisions: config.maxRevisions ?? 1,
    };

    this.context = {
      journeyId,
      currentStage: 0,
      previousStages: [],
      insights: [],
      questions: [], // Phase 1 Quick Win #2: Now TrackedQuestion[]
      artifacts: [],
      chasedTopics: [], // Phase 1: Initialize empty chased topics array
      richInsights: [], // Phase 1: Initialize empty rich insights array
      qualityReports: [], // Phase 2: Initialize empty quality reports array
    };

    this.questionTracker = new QuestionTrackingService(); // Phase 1 Quick Win #2: Initialize tracker
  }

  /**
   * Start the exploration journey
   */
  async start(input: string): Promise<Stage> {
    console.log(`🚀 Starting exploration journey: "${input.substring(0, 50)}..."`);
    return this.executeStage(input, 'discovering');
  }

  /**
   * Continue to the next stage in the cycle
   */
  async next(): Promise<Stage> {
    if (this.context.previousStages.length === 0) {
      throw new Error('No journey in progress. Call start() first.');
    }

    const nextStageIndex = this.context.currentStage + 1;
    const nextStageType = STAGE_TYPES[nextStageIndex % STAGE_TYPES.length];

    console.log(`➡️  Moving to stage ${nextStageIndex + 1}: ${nextStageType.toUpperCase()}`);

    return this.executeStage(
      this.context.previousStages[0].prompt, // Original input
      nextStageType as StageType
    );
  }

  /**
   * Execute a specific stage
   */
  private async executeStage(input: string, type: StageType, isSummary: boolean = false): Promise<Stage> {
    const stageNumber = this.context.currentStage + 1;
    const stagesRemaining = this.config.maxDepth - this.context.previousStages.length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 STAGE ${stageNumber}/${this.config.maxDepth}: ${type.toUpperCase()}${isSummary ? ' (SUMMARY)' : ''}`);
    console.log(`📊 Stages remaining: ${stagesRemaining}`);
    console.log(`${'='.repeat(60)}\n`);

    // Build the prompt for this stage
    let prompt: string;
    if (isSummary) {
      prompt = SUMMARY_PROMPT(this.context, input);
    } else {
      const promptBuilder = STAGE_PROMPTS[type];
      prompt = promptBuilder(this.context, input, stagesRemaining);
    }

    // Create the stage object
    const stage: Stage = {
      id: `stage_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      journeyId: this.context.journeyId,
      type,
      status: 'running',
      prompt,
      result: '',
      thinking: '',
      artifacts: [],
      createdAt: Date.now(),
    };

    // Set as active stage for real-time UI updates
    useAppStore.getState().setActiveStage(stage);

    try {
      // Execute with Claude using Extended Thinking and Streaming
      console.log(`🤖 Invoking ${MODEL_PER_STAGE[type]} with ${this.config.extendedThinking ? 'Extended Thinking' : 'standard mode'}...`);

      const response = await claudeService.execute({
        model: MODEL_PER_STAGE[type],
        prompt,
        extendedThinking: this.config.extendedThinking,
        thinkingBudget: THINKING_BUDGETS[type], // Dynamic budget optimized per stage
        maxTokens: 16000,
        stream: true, // Enable streaming for real-time updates
        onChunk: (chunk) => {
          // Real-time progress updates - update active stage
          if (chunk.type === 'content' && chunk.content) {
            console.log(`📝 ${chunk.content}`);
            const currentResult = stage.result || '';
            stage.result = currentResult + chunk.content;
            useAppStore.getState().updateActiveStage({ result: stage.result });
          }
        },
        onThinking: (thinking) => {
          // Show thinking process in real-time - update active stage
          console.log(`💭 ${thinking}`);
          const currentThinking = stage.thinking || '';
          stage.thinking = currentThinking + thinking;
          useAppStore.getState().updateActiveStage({ thinking: stage.thinking });
        },
      });

      stage.result = response.content;
      stage.thinking = response.thinking || null;
      stage.status = 'complete';

      // Log usage stats
      if (response.usage) {
        console.log(`📊 Tokens used: ${response.usage.inputTokens} in, ${response.usage.outputTokens} out`);
      }

      // Extract insights using new Claude-powered service
      await this.extractInsights(response.content, type, stageNumber);

      // Phase 1: Extract chased topics if in chasing stage
      if (type === 'chasing') {
        this.extractChasedTopics(response.content);
      }

      // Phase 1 Quick Win #2: Extract questions using tracking service
      if (type === 'questioning') {
        this.extractQuestionsWithTracking(response.content, stageNumber, type);
      }

      // Phase 1 Quick Win #2: Detect answers in searching stage
      if (type === 'searching') {
        this.detectAnswers(response.content, stageNumber);
      }

      // Extract artifacts if in building stage
      if (type === 'building') {
        await this.extractArtifacts(response.content, stageNumber);
      }


      // Phase 2: Quality scoring - evaluate stage output
      if (this.config.enableQualityScoring && !isSummary) {
        try {
          console.log(`\n📊 Evaluating stage quality...`);
          const qualityReport = await qualityScoringService.evaluateStageQuality(stage);
          
          // Store quality report in context
          this.context.qualityReports.push(qualityReport);
          
          // Add quality metadata to stage
          stage.qualityScore = qualityReport.overallScore;
          stage.qualityReport = {
            overallScore: qualityReport.overallScore,
            scores: qualityReport.scores,
            strengths: qualityReport.strengths,
            weaknesses: qualityReport.weaknesses,
            improvements: qualityReport.improvements,
            shouldRevise: qualityReport.shouldRevise,
            evaluatedAt: qualityReport.evaluatedAt,
          };
          
          // Log quality summary
          console.log(`   📈 Quality Score: ${qualityReport.overallScore.toFixed(1)}/10`);
          if (qualityReport.shouldRevise && this.config.autoRevise) {
            console.log(`   ⚠️  Score below threshold (${this.config.qualityThreshold}) - revision recommended`);
            console.log(`   💡 Improvements:`);
            qualityReport.improvements.forEach(imp => console.log(`      - ${imp}`));
            // TODO: Implement auto-revision logic if needed
          } else if (qualityReport.shouldRevise) {
            console.log(`   ℹ️  Score below threshold but auto-revision disabled`);
          }
        } catch (error) {
          console.error(`❌ Quality evaluation failed:`, error);
          // Continue - quality scoring failure shouldnt block progress
        }
      }
      console.log(`✅ Stage completed: ${type}`);
      console.log(`📊 Insights collected: ${this.context.insights.length} (${this.context.richInsights?.length || 0} rich)`);
      console.log(`❓ Questions tracked: ${this.context.questions.length}`);

      // Phase 1 Quick Win #2: Show question tracking metrics
      if (type === 'questioning' || type === 'searching') {
        const metrics = this.questionTracker.getMetrics();
        console.log(`📊 Question Metrics:`, {
          total: metrics.totalQuestions,
          unanswered: metrics.unansweredCount,
          partial: metrics.partialCount,
          answered: metrics.answeredCount,
          highPriorityUnanswered: metrics.highPriorityUnanswered,
        });
      }

    } catch (error) {
      console.error(`❌ Stage failed: ${type}`, error);
      stage.status = 'error';
      stage.result = `Error: ${error instanceof Error ? error.message : String(error)}`;
    }

    // Save stage to database via IPC
    try {
      if (ipcClient.isAvailable()) {
        await ipcClient.createStage(stage);
        console.log(`💾 Stage saved to database: ${stage.id}`);
      }
    } catch (error) {
      console.error('Failed to save stage to database:', error);
    }

    // Clear active stage now that it's saved
    useAppStore.getState().setActiveStage(null);

    // Update context
    this.context.previousStages.push(stage);
    this.context.currentStage = stageNumber - 1;

    // Check if journey has been stopped or paused before auto-progressing
    let journeyStatus: 'continue' | 'stopped' | 'paused' = 'continue';
    try {
      if (ipcClient.isAvailable()) {
        const updatedJourney = await ipcClient.getJourney(this.context.journeyId);
        if (updatedJourney) {
          if (updatedJourney.status === 'stopped') {
            journeyStatus = 'stopped';
          } else if (updatedJourney.status === 'paused') {
            journeyStatus = 'paused';
          }
        }
      }
    } catch (error) {
      console.error('Failed to check journey status:', error);
    }

    // Handle different journey states
    if (journeyStatus === 'paused') {
      console.log(`\n⏸️  Journey paused. Stopping exploration.\n`);
    } else if (journeyStatus === 'stopped' && !isSummary) {
      // User stopped the journey - create a summary before ending
      console.log(`\n⏹️  Journey stopped by user. Creating final summary...\n`);
      setTimeout(() => this.createSummaryStage(input), 2000);
    } else if (journeyStatus === 'continue' && this.config.autoProgress && stage.status === 'complete') {
      const stagesCompleted = this.context.previousStages.length;

      // Check if we should create a summary stage
      if (stagesCompleted === this.config.maxDepth - 1 && !isSummary) {
        console.log(`\n📝 Creating final summary stage...\n`);
        setTimeout(() => this.createSummaryStage(input), 2000);
      } else if (stagesCompleted < this.config.maxDepth && !isSummary) {
        console.log(`\n⏭️  Auto-progressing to next stage in 2 seconds... (${stagesCompleted}/${this.config.maxDepth})\n`);
        setTimeout(() => this.next(), 2000);
      } else {
        console.log(`\n🏁 Journey complete (${stagesCompleted}/${this.config.maxDepth} stages). Marking as complete.\n`);
        this.markJourneyComplete();
      }
    }

    return stage;
  }

  /**
   * Create a summary stage at the end of the journey
   */
  private async createSummaryStage(input: string): Promise<Stage> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 CREATING FINAL SUMMARY STAGE`);
    console.log(`${'='.repeat(60)}\n`);

    return this.executeStage(input, SUMMARY_STAGE, true);
  }

  /**
   * Mark journey as complete in database
   */
  private async markJourneyComplete(): Promise<void> {
    try {
      if (ipcClient.isAvailable()) {
        const journey = await ipcClient.getJourney(this.context.journeyId);
        if (journey) {
          await ipcClient.updateJourney({
            ...journey,
            status: 'complete',
          });
          console.log('✅ Journey marked as complete');
        }
      }
    } catch (error) {
      console.error('Failed to mark journey as complete:', error);
    }
  }

  /**
   * Extract insights from stage result using Claude-powered service
   * Phase 1: Enhanced with structured metadata and Claude extraction
   */
  private async extractInsights(content: string, type: StageType, stageNumber: number): Promise<void> {
    try {
      // Use new InsightExtractionService for Claude-powered extraction
      const richInsights = await insightExtractionService.extractInsights(
        content,
        type,
        stageNumber
      );

      // Store rich insights
      if (!this.context.richInsights) {
        this.context.richInsights = [];
      }
      this.context.richInsights.push(...richInsights);

      // Maintain backwards compatibility: also store as simple strings
      for (const richInsight of richInsights) {
        this.context.insights.push(`[${type}] ${richInsight.insight}`);
      }

      console.log(`📊 Extracted ${richInsights.length} rich insights from ${type} stage`);
    } catch (error) {
      console.error('❌ Failed to extract insights:', error);
      // Don't throw - insights are nice to have but not critical
    }
  }

  /**
   * Extract questions from questioning stage (DEPRECATED - use extractQuestionsWithTracking)
   * Kept for backwards compatibility
   */
  private extractQuestions(content: string): void {
    // This method is now deprecated in favor of extractQuestionsWithTracking
    // Keeping it for backwards compatibility but it won't be called
    console.warn('⚠️ extractQuestions is deprecated, use extractQuestionsWithTracking instead');
  }

  /**
   * Phase 1 Quick Win #2: Extract questions with full tracking
   */
  private extractQuestionsWithTracking(
    content: string,
    stageNumber: number,
    stageType: StageType
  ): void {
    // Pattern 1: Numbered questions with optional priority markers
    const numberedPattern = /(?:^|\n)\d+\.\s*([⭐🔴🟠🟡⚪]*)\s*([A-Z][^?\n]+\?)/gm;
    const matches = content.matchAll(numberedPattern);

    for (const match of matches) {
      const priorityMarkers = match[1] || '';
      const questionText = match[2].trim();

      // Determine priority from markers
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      if (priorityMarkers.includes('⭐⭐⭐') || priorityMarkers.includes('🔴')) {
        priority = 'critical';
      } else if (priorityMarkers.includes('⭐⭐') || priorityMarkers.includes('🟠')) {
        priority = 'high';
      } else if (priorityMarkers.includes('⭐') || priorityMarkers.includes('🟡')) {
        priority = 'medium';
      } else if (priorityMarkers.includes('⚪')) {
        priority = 'low';
      }

      // Track question
      const trackedQuestion = this.questionTracker.trackQuestion(
        questionText,
        stageNumber,
        stageType,
        priority
      );

      // Add to context
      this.context.questions.push(trackedQuestion);
    }

    // Pattern 2: Bulleted questions (fallback)
    const bulletPattern = /(?:^|\n)[-•]\s*([A-Z][^?\n]+\?)/gm;
    const bulletMatches = content.matchAll(bulletPattern);

    for (const match of bulletMatches) {
      const questionText = match[1].trim();

      // Track question with default priority
      const trackedQuestion = this.questionTracker.trackQuestion(
        questionText,
        stageNumber,
        stageType
      );

      // Add to context if not already added
      if (!this.context.questions.find(q => q.id === trackedQuestion.id)) {
        this.context.questions.push(trackedQuestion);
      }
    }

    console.log(`✅ Extracted ${this.context.questions.length} tracked questions from ${stageType} stage`);
  }

  /**
   * Phase 1 Quick Win #2: Detect answers in SEARCHING stage
   */
  private detectAnswers(content: string, stageNumber: number): void {
    // Pattern: **Q: [Question]** followed by **Answer**: and **Confidence Level**:
    const answerPattern = /\*\*Q:\s*([^*]+?)\*\*\s*\n\s*\*\*Answer\*\*:\s*([^*]+?)(?=\n\s*\*\*|\n\n|\*\*Evidence|\*\*Source|\*\*Confidence)/gs;
    const confidencePattern = /\*\*Confidence Level\*\*:\s*(verified|high|medium|low|speculative)/gi;

    const answerMatches = Array.from(content.matchAll(answerPattern));
    const confidenceMatches = Array.from(content.matchAll(confidencePattern));

    let answersDetected = 0;

    for (let i = 0; i < answerMatches.length; i++) {
      const questionFromAnswer = answerMatches[i][1].trim();
      const answerText = answerMatches[i][2].trim();

      // Try to find confidence level (should follow the answer)
      const confidence = confidenceMatches[i]
        ? (confidenceMatches[i][1].toLowerCase() as 'verified' | 'high' | 'medium' | 'low' | 'speculative')
        : 'medium';

      // Find matching question in tracker
      const matchingQuestion = this.findMatchingQuestion(questionFromAnswer);

      if (matchingQuestion) {
        // Extract evidence if present
        const evidencePattern = /\*\*Evidence\*\*:\s*\n([\s\S]*?)(?=\n\s*\*\*|$)/i;
        const evidenceMatch = content.match(evidencePattern);
        const evidence = evidenceMatch
          ? evidenceMatch[1].split('\n').filter(line => line.trim().startsWith('-')).map(line => line.trim())
          : undefined;

        // Mark as answered
        this.questionTracker.markAnswered(
          matchingQuestion.id,
          answerText,
          confidence,
          stageNumber,
          evidence
        );

        answersDetected++;
      } else {
        console.warn(`⚠️ Could not match question from answer: ${questionFromAnswer.substring(0, 60)}...`);
      }
    }

    console.log(`✅ Detected ${answersDetected} answers in SEARCHING stage`);

    // Update context with latest tracked questions
    this.context.questions = this.questionTracker.exportAsArray();
  }

  /**
   * Phase 1 Quick Win #2: Find matching question by text similarity
   */
  private findMatchingQuestion(questionText: string): TrackedQuestion | undefined {
    const normalized = questionText.toLowerCase().trim().replace(/[^\w\s]/g, '');

    for (const question of this.context.questions) {
      const normalizedTracked = question.question.toLowerCase().trim().replace(/[^\w\s]/g, '');

      // Exact match
      if (normalized === normalizedTracked) {
        return question;
      }

      // High similarity (contains most of the words)
      const words1 = new Set(normalized.split(/\s+/));
      const words2 = new Set(normalizedTracked.split(/\s+/));
      const intersection = new Set([...words1].filter(word => words2.has(word)));
      const similarity = intersection.size / Math.max(words1.size, words2.size);

      if (similarity > 0.8) {
        return question;
      }
    }

    return undefined;
  }

  /**
   * Extract artifacts from building stage (Phase 1 Quick Win #5: Rich Artifact Extraction)
   */
  private async extractArtifacts(content: string, stageNumber: number): Promise<void> {
    try {
      // Use the artifact validation service to extract rich artifacts
      const richArtifacts = await artifactValidationService.extractArtifacts(
        content,
        stageNumber,
        'building'
      );

      // Add to context
      this.context.artifacts.push(...richArtifacts);

      console.log(`📦 Extracted ${richArtifacts.length} rich artifacts with metadata`);
      console.log(`   Quality scores:`, richArtifacts.map(a => ({
        title: a.title,
        type: a.type,
        quality: a.validation.qualityScore,
        completeness: a.validation.completeness,
      })));

    } catch (error) {
      console.error('❌ Failed to extract rich artifacts:', error);
      // Fallback to simple extraction (keeping backward compatibility)
      const codeBlockPattern = /```[\s\S]+?```/g;
      const matches = content.match(codeBlockPattern);

      if (matches) {
        // Convert to basic RichArtifact format
        const fallbackArtifacts: RichArtifact[] = matches.map((match, index) => ({
          id: `artifact_fallback_${Date.now()}_${index}`,
          type: 'code',
          title: `Code Artifact ${index + 1}`,
          content: match,
          stageNumber,
          stageType: 'building',
          relatedInsightIds: [],
          relatedQuestionIds: [],
          metadata: {
            size: match.length,
          },
          validation: {
            completeness: 'partial',
            validated: false,
            validationMethod: 'pattern-match',
          },
          createdAt: Date.now(),
        }));

        this.context.artifacts.push(...fallbackArtifacts);
      }
    }
  }

  /**
   * Extract chased topics from chasing stage (Phase 1 improvement)
   * Captures key problems, root causes, and areas explored
   */
  private extractChasedTopics(content: string): void {
    // Pattern 1: Section headers (Root Causes, Surface Symptoms, etc.)
    const headerPattern = /(?:^|\n)(?:\*\*)?(\d+\.|[-•])\s*\*\*([^*\n]+)\*\*/gm;
    const headers = content.matchAll(headerPattern);

    for (const match of headers) {
      if (match[2] && match[2].length > 10 && match[2].length < 200) {
        const topic = match[2].trim();
        if (!this.context.chasedTopics.includes(topic)) {
          this.context.chasedTopics.push(topic);
        }
      }
    }

    // Pattern 2: Key phrases indicating problems/topics
    const topicPatterns = [
      /(?:root cause|problem|issue|challenge|constraint)[:\s]+([^.\n]+)/gi,
      /(?:symptom|pattern|assumption|leverage point)[:\s]+([^.\n]+)/gi,
      /(?:^|\n)[-•]\s*\*\*([^*]+)\*\*/gm, // Bulleted bold items
    ];

    for (const pattern of topicPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 15 && match[1].length < 200) {
          const topic = match[1].trim();
          // Avoid duplicates and overly generic statements
          if (!this.context.chasedTopics.includes(topic) &&
              !topic.toLowerCase().includes('follow') &&
              !topic.toLowerCase().includes('structured approach')) {
            this.context.chasedTopics.push(topic);
          }
        }
      }
    }

    console.log(`📝 Extracted ${this.context.chasedTopics.length} total chased topics from this stage`);
  }

  /**
   * Get current journey context
   */
  getContext(): ExplorationContext {
    return { ...this.context };
  }

  /**
   * Get journey summary
   */
  getSummary(): string {
    return `
Journey Summary
===============
ID: ${this.context.journeyId}
Stages Completed: ${this.context.previousStages.length}
Current Stage: ${STAGE_TYPES[this.context.currentStage % STAGE_TYPES.length]}
Insights: ${this.context.insights.length}
Questions: ${this.context.questions.length}
Artifacts: ${this.context.artifacts.length}

Stages:
${this.context.previousStages.map((s, i) =>
  `${i + 1}. ${s.type.toUpperCase()} - ${s.status} (${new Date(s.createdAt).toLocaleTimeString()})`
).join('\n')}
`;
  }
}
