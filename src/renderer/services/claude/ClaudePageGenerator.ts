/**
 * Claude Page Generator
 * Uses Claude to generate custom, interactive HTML pages based on journey content
 * Similar to Lovable - generates working code tailored to the specific journey
 */

import { claudeService } from './ClaudeService';
import type { Journey } from '../../types';
import type { JourneyAnalysis } from './ClaudePageAnalyzer';
import type { DesignLanguage, DesignStyle } from '../../types/design-language';
import { generateDesignLanguage, generateDesignBrief } from '../../utils/design-language-generator';
import {
  getTimelineInstructions,
  getMindmapInstructions,
  getWebsiteInstructions,
  getPresentationInstructions,
} from '../../utils/enhanced-template-instructions';

export interface GeneratedPage {
  html: string;
  metadata: {
    generatedBy: 'claude';
    model: string;
    tokensUsed?: number;
    generationTime: number;
    templateType: string;
    designLanguage?: DesignLanguage;
  };
}

export class ClaudePageGenerator {
  // Store generated design language for metadata
  private currentDesignLanguage: DesignLanguage | null = null;

  /**
   * Generate a custom, self-contained HTML page for a journey
   * Uses Claude to create interactive visualizations with inline JS (no CDN dependencies)
   */
  async generateCustomPage(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string,
    designStyle?: DesignStyle
  ): Promise<GeneratedPage> {
    console.log(`🎨 Generating custom ${templateType} page with Claude...`);

    if (!claudeService.getInitializationStatus()) {
      throw new Error('Claude service not initialized');
    }

    const startTime = Date.now();
    const prompt = this.buildGenerationPrompt(journey, analysis, templateType, designStyle);

    console.log('🧠 Asking Claude to generate custom page code...');
    console.log('⏱️  Extended Thinking enabled with 12000 token budget (may take 5-15 minutes)...');

    // Use Claude with Extended Thinking and STREAMING for high-quality code generation
    // Streaming is required for operations that may take > 10 minutes
    let response;
    try {
      response = await claudeService.execute({
        prompt,
        model: 'claude-sonnet-4-5-20250929',
        extendedThinking: true,
        thinkingBudget: 12000, // Increased budget for strategic visualization planning + code generation
        maxTokens: 64000, // Large limit for complete 8-stage journey websites (Claude 4.5 supports up to 128k)
        stream: true, // REQUIRED: Enables long-running requests (>10 min)
      });
    } catch (error) {
      console.error('❌ Claude API request failed:');
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));

      // Check for network errors (after retries failed)
      if (error instanceof Error && error.message.toLowerCase().includes('network error')) {
        throw new Error('Network connection issue prevented page generation. Please check your internet connection and try again.');
      }

      // Check for timeout errors
      if (error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('time out')
      )) {
        throw new Error('Page generation timed out (>20 minutes). Try a shorter journey or simpler template.');
      }

      // Re-throw the original error with more context
      throw new Error(`Claude API failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const generationTime = Date.now() - startTime;
    console.log(`✅ Page generated in ${(generationTime / 1000).toFixed(1)}s`);
    console.log(`📊 Tokens: input=${response.usage?.inputTokens}, output=${response.usage?.outputTokens}`);

    // Warn if approaching token limit
    if (response.usage?.outputTokens && response.usage.outputTokens > 60000) {
      console.warn(`⚠️ WARNING: Output tokens (${response.usage.outputTokens}) approaching limit (64000). HTML may be truncated!`);
    }

    // Extract HTML from response
    const html = this.extractHTML(response.content);

    // Log HTML preview
    const htmlPreview = html.length > 1000 ? html.substring(0, 1000) + '...' : html;
    console.log(`📄 Generated HTML (${html.length} chars):`);
    console.log('First 1000 chars:', htmlPreview);

    // Check if HTML has body content and is complete
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
    if (bodyMatch) {
      const bodyContent = bodyMatch[1];
      console.log(`📏 Body content: ${bodyContent.length} chars`);
      if (bodyContent.length < 500) {
        console.warn('⚠️ WARNING: Body content is very short!', bodyContent);
      }
    } else {
      console.error('❌ ERROR: HTML missing closing </body> tag - likely truncated!');
    }

    // Validate HTML completeness
    if (!html.includes('</html>')) {
      console.error('❌ ERROR: HTML truncated - missing closing </html> tag!');
      throw new Error('Generated HTML is incomplete (missing </html> tag). Try reducing journey length or increase token limit.');
    }

    return {
      html,
      metadata: {
        generatedBy: 'claude',
        model: 'claude-sonnet-4-5-20250929',
        tokensUsed: response.usage?.outputTokens,
        generationTime,
        templateType,
        designLanguage: this.currentDesignLanguage || undefined,
      },
    };
  }

  /**
   * Build the prompt for Claude to generate custom page code
   */
  private buildGenerationPrompt(
    journey: Journey,
    analysis: JourneyAnalysis,
    templateType: string,
    designStyle?: DesignStyle
  ): string {
    // Debug logging to verify journey data
    console.log(`📊 Building prompt for journey with ${journey.stages?.length || 0} stages`);
    if (!journey.stages || journey.stages.length === 0) {
      console.error('⚠️ WARNING: Journey has no stages!', journey);
      throw new Error('Journey has no stages to generate page from');
    }

    // Log stage content sizes
    const stageSizes = journey.stages.map((s, i) => ({
      stage: i + 1,
      type: s.type,
      resultChars: s.result?.length || 0,
      thinkingChars: s.thinking?.length || 0,
      artifactCount: s.artifacts?.length || 0,
    }));
    console.log('📝 Stage content sizes:', stageSizes);

    // Prepare complete stage content with artifacts
    const stagesContent = journey.stages.map((stage, i) => {
      const artifactsContent = stage.artifacts.length > 0
        ? stage.artifacts.map((artifact, idx) => `
### Artifact ${idx + 1}: ${artifact.title}
Type: ${artifact.type}
${artifact.content}
`).join('\n')
        : 'No artifacts';

      return `
## Stage ${i + 1}: ${stage.type.toUpperCase()}
Timestamp: ${new Date(stage.createdAt).toISOString()}

### Stage Result:
${stage.result}

${stage.thinking ? `### Extended Thinking:\n${stage.thinking}\n` : ''}

### Artifacts (${stage.artifacts.length}):
${artifactsContent}
`;
    }).join('\n---\n');

    // Log content summary
    console.log(`📦 Content prepared:`, {
      totalChars: stagesContent.length,
      preview: stagesContent.substring(0, 500) + '...',
    });

    // Generate unique design language for this page (with optional forced style)
    this.currentDesignLanguage = generateDesignLanguage(journey.id, analysis, templateType, undefined, designStyle);
    const designBrief = generateDesignBrief(this.currentDesignLanguage);

    console.log(`🎨 Generated design language: ${this.currentDesignLanguage.visualStyle.primary} + ${this.currentDesignLanguage.layout.system}`);
    console.log(`🎲 Design seed: ${this.currentDesignLanguage.uniqueness.seed}`);
    console.log(`${this.currentDesignLanguage.uniqueness.experimental ? '🚀 EXPERIMENTAL MODE' : '✨ Standard mode'}`);

    return `You are a creative web developer creating an interactive, beautiful page to visualize an exploration journey from Perpetua (The Infinite Thought Engine).

<journey_context>
<input_question>${journey.input}</input_question>

<analysis>
Content Type: ${analysis.contentType}
Complexity: ${analysis.complexity}
Key Themes: ${analysis.keyThemes.join(', ')}
Recommended Format: ${templateType}
Reasoning: ${analysis.recommendations.reasoning}
</analysis>

<design_language>
${designBrief}
</design_language>

<complete_journey_content>
Total Stages: ${journey.stages.length}
Journey Status: ${journey.status}
Created: ${new Date(journey.createdAt).toISOString()}

${stagesContent}
</complete_journey_content>
</journey_context>

<task>
Create a COMPLETE, SELF-CONTAINED, INTERACTIVE HTML page that visualizes this journey in the style of a **${templateType}**.

## 🎬 MANDATORY REQUIREMENT: ANIMATED HEADER (NON-NEGOTIABLE)

**⚠️ YOUR PAGE WILL BE REJECTED IF THE HEADER IS NOT ANIMATED ⚠️**

Your header/hero section MUST include:
1. ✅ Animated title (fade-in + slide-up with 0.2s delay)
2. ✅ Animated subtitle (fade-in + slide-up with 0.5s delay)
3. ✅ Animated background (gradient shift, parallax, or particles)
4. ✅ Animated accent elements (icons, borders, shapes)
5. ✅ **CRITICAL: PROPER TEXT CONTRAST** - Header text MUST have high contrast against background

**🚨 ACCESSIBILITY REQUIREMENT - TEXT CONTRAST:**

**ABSOLUTELY FORBIDDEN:**
- ❌ White text on white/light backgrounds
- ❌ Black text on dark backgrounds
- ❌ Low contrast combinations (gray on gray, etc.)

**REQUIRED COLOR LOGIC:**
- ✅ If background is LIGHT (white, light grays, pastels): Use DARK text (black, dark grays, navy)
- ✅ If background is DARK (black, dark grays, navy): Use LIGHT text (white, light grays, bright colors)
- ✅ Minimum contrast ratio: 4.5:1 (WCAG AA standard)
- ✅ Test mentally: "Can I easily read this text?" → If NO, pick opposite color

**Example Correct Combinations:**
- Dark background (#000, #1a1a1a, #2b2b2b) → Light text (#fff, #f0f0f0, bright accent)
- Light background (#fff, #f8f8f8, #e0e0e0) → Dark text (#000, #1a1a1a, #333)
- Colored background (vibrant) → White or black text depending on background luminance

**See the design brief below for required CSS animation code patterns to copy and adapt.**

**Static black headers = FAILURE. Animated colorful headers = SUCCESS. Poor contrast = FAILURE.**

## CRITICAL: Visualization Strategy (Use Extended Thinking)

**Before you start coding**, use Extended Thinking to analyze the journey content and determine which visualization elements would be most effective.

<visualization_catalog>
**Available Visualizations** (ALL must be vanilla JS/CSS, no external libraries):

### Data & Information Visualization
- **Charts & Graphs**: Bar charts, line graphs, pie charts (SVG with vanilla JS), area charts, scatter plots
- **Progress Indicators**: Progress bars, radial progress, completion percentages
- **Heat Maps**: Color-coded intensity grids (CSS Grid + color interpolation)

### Hierarchical & Relational
- **Mind Maps**: Force-directed node graphs (custom vanilla JS)
- **Tree Diagrams**: Nested hierarchies with expand/collapse
- **Network Graphs**: Connected nodes with lines (SVG + vanilla JS)
- **Venn Diagrams**: Overlapping circles for intersections

### Process & Journey Visualization
- **Timelines**: Horizontal or vertical with events (CSS + vanilla JS)
- **Flowcharts**: Decision trees with arrows (SVG shapes)
- **Journey Maps**: Step-by-step progression with icons
- **Progress Trackers**: Multi-step indicators

### Comparative & Layout
- **Comparison Tables**: Side-by-side matrices with highlights
- **Before/After**: Toggle or slider comparisons
- **Icon Arrays**: Visual quantity representations
- **Grid Layouts**: Bento grids, masonry, periodic table styles

### Modern Interactive Elements
- **Cards/Tiles**: Modular content blocks with hover effects
- **Accordions**: Expandable/collapsible sections
- **Tabs**: Organized content switching
- **Carousels**: Sequential information navigation
- **Interactive Dashboards**: Multiple visualizations combined
- **Tooltips/Popovers**: Additional information on hover
- **Scroll Animations**: Fade in, slide in as user scrolls
</visualization_catalog>

**Your Extended Thinking Process Should Include:**

1. **Content Analysis**: What type of information is in this journey?
   - Quantitative data (numbers, metrics) → Use charts/graphs
   - Sequential events → Use timelines/flowcharts
   - Comparisons → Use tables/before-after
   - Relationships → Use network graphs/mind maps
   - Hierarchical → Use tree diagrams/nested structures

2. **Visualization Selection**: For each stage, decide:
   - What is the CORE insight or information?
   - What visualization would make this most clear/engaging?
   - Can I implement this with vanilla JS/CSS? (must be YES)
   - Would this enhance understanding or just add complexity?

3. **Implementation Planning**: For chosen visualizations:
   - Sketch the SVG/Canvas approach (if needed)
   - Plan the JavaScript interaction logic
   - Consider responsive behavior
   - Ensure performance (no complex calculations on scroll)

**Constraints** (CRITICAL - Must Follow):
✅ **CAN USE**: Vanilla JavaScript, CSS3, SVG, Canvas, HTML5
✅ **CAN CREATE**: Custom charts with SVG paths, animations with CSS/JS, interactive graphs
❌ **CANNOT USE**: D3.js, Chart.js, Reveal.js, any CDN libraries
❌ **CANNOT DO**: Complex physics simulations, 3D rendering, external data loading

**Example Thinking Pattern**:
"Stage 2 has a comparison between 5 approaches. I'll create a comparison table with color-coded pros/cons cards. Stage 4 shows a progression of ideas - I'll use a horizontal timeline with expandable detail cards at each point."

## Requirements

### 1. Format Style
${this.getTemplateInstructions(templateType)}

### 2. Technical Requirements
- **MUST be completely self-contained** - ALL JavaScript inline (NO external CDN links like D3.js, Reveal.js, etc.)
- **Use vanilla JavaScript only** - Write custom animation/interaction code
- **Inline ALL CSS** - No external stylesheets
- **Beautiful, modern design** - Use gradients, animations, transitions
- **Responsive** - Works on different screen sizes
- **Interactive** - Clickable elements, smooth animations, engaging UX
- **Scandinavian design aesthetic** - Clean, minimal, elegant
- **🎨 USE INLINE SVG ICONS, NOT EMOJIS** - Emojis render inconsistently across platforms and don't print well to PDF. Use inline SVG icons instead.

### 2.1. Icon System - USE INLINE SVG ICONS

**❌ NEVER USE EMOJIS** - They render poorly in PDFs and look inconsistent across platforms.
**✅ ALWAYS USE INLINE SVG ICONS** - They're scalable, crisp, and work perfectly in PDFs.

<icon_library>
Here's a curated set of inline SVG icons you can use. Copy these exactly or create similar simple, clean icons:

**Common Icons** (16x16 or 24x24 viewBox):

\`\`\`html
<!-- Brain / Thinking -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M12 2a9 9 0 1 0 9 9c0-1-1-2-2-2s-2 1-2 2-1 2-2 2-2-1-2-2 1-2 2-2 2 1 2 2"/>
</svg>

<!-- Lightbulb / Idea -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M9 21h6M12 3v3m0 12v3m9-9h-3M3 12h3"/>
  <circle cx="12" cy="12" r="5"/>
</svg>

<!-- Check / Success -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M20 6L9 17l-5-5"/>
</svg>

<!-- Star / Important -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/>
</svg>

<!-- Rocket / Launch -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
</svg>

<!-- Chart / Analytics -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
</svg>

<!-- Compass / Exploration -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
</svg>

<!-- Target / Goal -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
</svg>

<!-- Code / Development -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
</svg>

<!-- Document / Report -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>

<!-- Search / Discover -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
</svg>

<!-- Arrow Right / Next -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
</svg>

<!-- Info / Information -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
</svg>

<!-- Book / Learning -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
</svg>

<!-- Network / Connections -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="5" r="2"/>
  <circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="2"/>
  <path d="M14 12h3m-10 0h3m2-5 1.5-1.5M9 9 7.5 7.5m7 7 1.5 1.5M9 15l-1.5 1.5"/>
</svg>

<!-- Clock / Time -->
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
</svg>
\`\`\`

**Usage in HTML:**
\`\`\`html
<!-- Inline in content -->
<div class="insight-card">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2a9 9 0 1 0 9 9c0-1-1-2-2-2s-2 1-2 2-1 2-2 2-2-1-2-2 1-2 2-2 2 1 2 2"/>
  </svg>
  <h3>Key Insight</h3>
</div>

<!-- With CSS styling -->
<style>
  .icon {
    width: 20px;
    height: 20px;
    stroke: currentColor;
    vertical-align: middle;
  }
  .icon-primary { stroke: #4F46E5; }
  .icon-success { stroke: #10B981; }
</style>
<span class="icon icon-primary">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
</span>
\`\`\`

**Icon Design Guidelines:**
- Keep viewBox at 24x24 for consistency
- Use stroke-width="2" for clean, visible lines
- Use \`stroke="currentColor"\` so icons inherit text color
- Keep designs simple - clean lines, minimal detail
- SVG size should be 16-24px for inline use, 32-48px for feature icons
</icon_library>

### 3. Content Requirements - CRITICAL

🚨 **MANDATORY**: You MUST include ALL content from the <complete_journey_content> section above.

**BUT - PRESENT IT INTERACTIVELY, NOT AS A TEXT DUMP!**

**For Each Stage**, transform the content into engaging visual elements:
- ✅ **Stage Results**: Break into sections with headings, use cards, tabs, or accordion sections
- ✅ **Extended Thinking**: Put in expandable "Deep Dive" sections with brain SVG icon (collapsed by default)
- ✅ **Artifacts**: Display in special artifact cards with SVG icons based on type (document, code, chart, etc.)
- ✅ **Key Points**: Extract and highlight in visual callout boxes with SVG icons
- ✅ **Lists**: Turn into visual bullet points with appropriate SVG icons
- ✅ **Tables**: Make interactive with sortable columns, hover effects
- ✅ **Quotes**: Display in beautiful blockquotes with styling

**TRANSFORMATION STRATEGIES** (Use these techniques):

1. **Sectioning & Progressive Disclosure**:
   - Break long text into logical subsections with clear headings
   - Use expandable sections for details (collapsed by default)
   - Tab interfaces for related content
   - "Show More" buttons for lengthy passages

2. **Visual Hierarchy**:
   - Pull out key insights into highlighted cards
   - Use SVG icon + text combinations
   - Color-code different types of information
   - Create visual "peaks" for important discoveries

3. **Interactive Elements**:
   - Clickable stage navigation (sticky sidebar or top nav)
   - Scroll animations (fade in, slide in)
   - Hover effects reveal additional information
   - Toggle between summary/detail views

4. **Content Reflow**:
   - Don't just paste markdown → HTML
   - Extract structure from content (headings, lists, key points)
   - Reformat as cards, timelines, comparison tables, etc.
   - Add visual separators and breathing room

5. **Journey Feel**:
   - Make it feel like progressing through stages
   - Each stage has distinct visual identity
   - Stage transitions are smooth
   - Clear beginning, middle, end

**Content Inclusion Rules**:
1. **NO CONTENT LOSS** - All information must be present somewhere
2. **TRANSFORM, DON'T DUMP** - Don't paste raw text; create visual elements
3. **MAKE IT SCANNABLE** - Users should grasp the journey in 30 seconds of scrolling
4. **DETAILS ON DEMAND** - Full content available through expansion/interaction
5. **BALANCE** - Mix overview (cards, highlights) with depth (expandable sections)

**Quality Check**:
- Can a reader learn EVERYTHING if they explore all interactive elements? ✅ YES
- Does it feel like an interactive journey, not a text document? ✅ YES
- Is content organized visually with clear hierarchy? ✅ YES
- Are there interactive elements (expandable sections, tabs, animations)? ✅ YES

**Think of it as**: A museum exhibit about this journey, not a research paper. The content is there, but presented to engage and guide exploration.

**CONCRETE EXAMPLES:**

❌ **DON'T DO THIS** (Text dump):
\`\`\`html
<p>The analysis revealed multiple key points including technological convergence, market dynamics, regulatory challenges, and competitive landscape considerations. [500 more words of paragraph text...]</p>
\`\`\`

✅ **DO THIS INSTEAD** (Visual transformation with SVG icons):
\`\`\`html
<div class="insights-grid">
  <div class="insight-card">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <h3>Technological Convergence</h3>
    <p>AI + biotech creating new possibilities</p>
    <button class="expand-btn">Learn More</button>
    <div class="hidden-detail">[Full explanation]</div>
  </div>
  <!-- More cards... -->
</div>
\`\`\`

❌ **DON'T DO THIS** (Wall of text):
\`\`\`html
<div>Extended thinking process: First I considered approach A which involves analyzing the technical feasibility...</div>
\`\`\`

✅ **DO THIS INSTEAD** (Expandable deep dive with SVG icon):
\`\`\`html
<details class="deep-dive">
  <summary>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 2a9 9 0 1 0 9 9c0-1-1-2-2-2s-2 1-2 2-1 2-2 2-2-1-2-2 1-2 2-2 2 1 2 2"/>
    </svg>
    Extended Thinking: How we arrived at this conclusion
  </summary>
  <div class="thinking-content">
    [Organized into sections with icons and highlights]
  </div>
</details>
\`\`\`

### 4. Code Quality
- Clean, well-structured HTML
- Organized CSS with comments
- Clear JavaScript with good naming
- No console errors
- Fully functional on first load

## Output Format

Return ONLY the complete HTML document. Start with \`<!DOCTYPE html>\` and end with \`</html>\`.

Do not include:
- Markdown code blocks
- Explanatory text
- Comments outside the HTML
- Any text before or after the HTML

## Design Inspiration

Think of this as creating a custom-designed webpage like Lovable would generate:
- Unique layout tailored to this specific journey
- Creative use of color and typography
- Smooth animations that enhance understanding
- Interactive elements that reveal deeper insights
- Professional, polished appearance

## 🚨 FINAL CRITICAL REMINDER 🚨

**STEP 1: Use Extended Thinking to Plan Visualizations** (5-10 minutes)
Analyze each stage and decide:
- What visualization would best represent this information?
- Can I implement it with vanilla JS/CSS? (no external libraries)
- Does it enhance understanding or just add noise?
- Example: "Stage 3 compares 4 frameworks → comparison table with colored cards"

**STEP 2: Verify Your Implementation Plan Includes:**
- ✅ Hero section with "${journey.input}"
- ✅ ${journey.stages.length} interactive stage sections
- ✅ Content TRANSFORMED into strategic visualizations (not generic cards)
- ✅ At least 2-3 different visualization types across stages (timelines, charts, tables, etc.)
- ✅ ALL content present but organized for exploration (not dumped as text walls)
- ✅ Progressive disclosure (summary → expandable details)
- ✅ Interactive elements (expandable sections, scroll animations, hover effects)
- ✅ Navigation that works for ${journey.stages.length} sections
- ✅ Each stage has appropriate visualization + expandable full content

**STEP 3: Implementation Checklist:**
- ✅ Vanilla JavaScript only (NO D3.js, Chart.js, etc.)
- ✅ All CSS inline
- ✅ All JavaScript inline
- ✅ SVG/Canvas for custom visualizations
- ✅ Smooth animations and transitions
- ✅ Responsive design
- ✅ Complete HTML from <!DOCTYPE html> to </html>

**KEY PRINCIPLES**:
1. **Visualize, don't just format** - Use appropriate visualizations from the catalog
2. **Strategic choices** - Each visualization should have a purpose
3. **Transform, don't transcribe** - Extract insights into visual elements
4. **Interactive museum exhibit** - Not a document, an experience

**Remember**: The user expects INTELLIGENT VISUALIZATION CHOICES that make the journey insights clear and engaging.

Generate the complete interactive HTML page now.
</task>`;
  }


  /**
   * Get specific instructions for each template type
   * Now uses enhanced template instructions with unique design language
   */
  private getTemplateInstructions(templateType: string): string {
    if (!this.currentDesignLanguage) {
      throw new Error('Design language not generated - call this after generating design language');
    }

    // Use enhanced template instructions for timeline and mindmap
    if (templateType === 'timeline' && this.currentDesignLanguage.templateLayout?.timeline) {
      return getTimelineInstructions(this.currentDesignLanguage.templateLayout.timeline, this.currentDesignLanguage);
    }

    if (templateType === 'mindmap' && this.currentDesignLanguage.templateLayout?.mindmap) {
      return getMindmapInstructions(this.currentDesignLanguage.templateLayout.mindmap, this.currentDesignLanguage);
    }

    if (templateType === 'presentation' && this.currentDesignLanguage.templateLayout?.slideDesign) {
      const presentationGuidance = getPresentationInstructions(
        this.currentDesignLanguage.templateLayout.slideDesign,
        this.currentDesignLanguage
      );
      return presentationGuidance + this.getFullPresentationInstructions();
    }

    if (templateType === 'website') {
      const websiteGuidance = getWebsiteInstructions(this.currentDesignLanguage);
      return websiteGuidance + this.getFullWebsiteInstructions();
    }

    // Fallback to standard instructions for report/wiki
    const instructions: Record<string, string> = {
      report: `
Create a structured document:
- Professional report layout
- Table of contents with jump links
- Sections for each stage
- Summary/conclusion section
- Sidebar navigation
- Print-friendly styling
- Clear typography hierarchy
`,
      wiki: `
Create a Wikipedia-style article:
- Article title and intro
- Table of contents
- Sections with headings
- Infobox with metadata
- References/sources section
- Clean, readable design
- Internal navigation links
`,
      'linkedin-content': `
## LINKEDIN CONTENT PACKAGE - STEVE JOBS STYLE

**🎯 TARGET PERSONAS:**
- CEOs and decision makers
- AI experts and AI strategy professionals
- Business strategists
- Senior executives evaluating AI adoption

**🎤 WRITING STYLE - STEVE JOBS ON LINKEDIN:**

This isn't corporate speak. This is authentic, powerful storytelling that makes executives stop scrolling.

**Core Principles:**
1. **Conversational & Direct** - Talk to readers like friends, not a boardroom
2. **Simple Language** - No jargon. If a CEO wouldn't say it over coffee, don't write it
3. **Rule of Three** - Structure around triads (3 reasons, 3 examples, 3 takeaways)
4. **Repetition** - Repeat key phrases for impact ("This changes everything.")
5. **Contrast & Revelation** - Show the gap between now and what's possible
6. **Visual Language** - Paint pictures with metaphors ("It's like having...")
7. **Emotional Connection** - Make it personal, show genuine passion

**📦 DELIVERABLE STRUCTURE:**

Your HTML page must contain TWO main sections:

### SECTION 1: FEATURED LINKEDIN ARTICLE

**Format**: One complete LinkedIn article (1,500-2,000 words) in Steve Jobs' storytelling style

**Article Requirements:**

**Headline (CRITICAL):**
- Simple, direct, benefit-driven
- Use Jobs-style contrast: "Why Most X Are Wrong About Y"
- Or revelation: "What We Discovered About X"
- Or the rule of three: "Three Things Every CEO Should Know About X"
- Examples:
  - "Why AI Strategy Failed. And What We're Doing About It."
  - "Three Insights That Changed How We Think About Innovation"
  - "What Tesla Taught Us About Digital Transformation"

**Opening (First 3 Lines) - THE HOOK:**
- Start with a story, not a thesis
- Jobs-style contrast: "Here's what everyone thinks... But here's what we found..."
- Or a moment of revelation: "Three months ago, I believed X. I was wrong."
- Or a vivid scene: "Picture this: A CEO walks into a boardroom with a simple question..."
- Make them lean in immediately

**Structure (Jobs-Style Narrative Flow):**
- **Short paragraphs** (2-4 sentences max) - Let ideas breathe
- **Varied sentence rhythm** - Mix short punches with longer builds
- **Use "you" constantly** - Direct connection ("You've probably noticed...")
- **Tell stories** - Real examples, not abstract concepts
- **Build to insights** - Don't list them, discover them together
- **Subheadings as signposts** - Simple, direct ("The Problem", "What We Found", "Why This Matters")

**Content Tactics (Steve Jobs Method):**
- **Open with contrast**: "Here's the status quo... Now imagine this..."
- **Use the rule of three**: Three reasons, three examples, three takeaways
- **Create revelation moments**: Build tension, then deliver the insight
- **Visual metaphors**: Compare complex ideas to simple, concrete things
- **Repeat key phrases**: Your one big idea should echo throughout
- **Personal voice**: Use "I", "we", "you" - this is a conversation
- **Balance light and heavy**: Humor + profundity, casual + profound

**What to AVOID:**
- Corporate jargon ("synergize", "leverage", "paradigm shift")
- Formal transitions ("Furthermore", "Moreover", "In addition")
- Feature lists without context ("Our platform offers X, Y, Z...")
- Abstract language ("optimization", "streamlining", "enhancement")
- Meta-commentary ("Let me tell you", "I'm going to explain")

**Ending (CRITICAL - Jobs-Style Close):**
- **Rule of three**: Summarize with exactly 3 takeaways
- **Memorable line**: One sentence they'll remember ("This changes everything.")
- **Personal CTA**: Not "Share your thoughts" but "What's your take? I'd love to know."
- **Leave them wanting more**: Hint at what's next, create curiosity

**Visual Design (Steve Jobs Aesthetic):**
- **Minimalist, not cluttered** - Lots of whitespace
- **One idea per visual section** - Don't cram
- **Use SVG icons sparingly** - Only when they enhance, not decorate
- **Highlight key phrases** - Bold or subtle background, not excessive
- **Section breaks are moments** - Like pauses in a speech

---

### SECTION 2: 4-5 LINKEDIN POST DRAFTS (STEVE JOBS STYLE)

**Format**: 4-5 standalone post drafts (100-300 words each), ready to copy-paste

**Jobs-Style Post Structure:**

**Each Post Must:**
- **Line 1: The Hook** - Make them stop scrolling
  - Jobs contrast: "Everyone thinks X. Here's why they're wrong."
  - Revelation: "Three months ago, I believed X. Then this happened."
  - Simple question: "What if everything you know about X is outdated?"
  - Bold claim: "This changes everything."

- **Body: Story → Insight** - Don't lecture, discover together
  - Use "you" constantly
  - Short sentences (10-15 words max)
  - One clear message
  - Visual language, concrete examples
  - Build to the insight organically

- **Close: Memorable + CTA** - Leave an impression
  - Repeat your key phrase
  - Personal question (not "What do you think?" but something specific)
  - 2-3 hashtags only

**Post Variety** (Jobs-Style Angles):
1. **The Revelation Post**: "I was wrong about X. Here's what I learned."
2. **The Contrast Post**: "Here's what everyone does... Now imagine this instead..."
3. **The Three Things Post**: "Three insights that changed everything for us."
4. **The Story Post**: Real moment, real discovery, real impact
5. **The Bold Take Post**: Challenge assumptions with confidence

**Post Writing Rules (Steve Jobs Method):**
- **Conversational** - Use contractions (I'm, we're, that's, it's)
- **Short & punchy** - Vary sentence length for rhythm
- **Personal voice** - This is you talking, not your company
- **Rule of three** - When listing, always use three items
- **Repetition** - Echo your key phrase for emphasis
- **Visual language** - Paint pictures with words
- **No jargon** - Talk like a human, not a press release

**Example Jobs-Style Post:**
\`\`\`
Everyone thinks AI adoption is about technology.

They're wrong.

It's about people. It's always been about people.

Three months ago, we deployed the most advanced AI platform I'd ever seen. The tech was flawless. The adoption? Zero.

Then we did something different. We stopped talking about features. We started telling stories. We showed people not what the AI could do, but what THEY could do with it.

Everything changed.

The lesson? Technology doesn't transform businesses. People do. AI is just the tool.

What's your experience? Have you seen technology fail because the human side wasn't ready?

#AITransformation #Leadership #Innovation
\`\`\`

**Notice:**
- Opens with contrast
- Short, punchy sentences
- Rule of three (three months ago, three-part structure)
- Repetition ("people", "changed")
- Personal story
- Ends with specific question
- Feels like a conversation, not a post

---

### 🎨 HTML PAGE DESIGN:

**Layout:**
- Clean, professional design (LinkedIn-style aesthetic)
- Top section: Article with scroll
- Bottom section: Post drafts in cards (easy to copy)
- Download buttons for each piece of content
- Copy-to-clipboard buttons for posts

**Typography:**
- Article: 18-20px body text, 1.6 line height
- Post drafts: 16-18px, clearly separated in cards
- Headlines: Bold, 32-40px

**Colors:**
- Professional LinkedIn-inspired palette: Blues, grays, white
- Accent color for CTAs and highlights
- High contrast for readability

**Interactive Elements:**
- Click to copy post to clipboard
- Download article as text
- Character counters for posts (LinkedIn limits)
- Visual indicators: "Ready to publish" checkmarks

**Perpetua Branding:**
- Top-left: "Generated by Perpetua" logo/text
- Subtle footer: "The Infinite Thought Engine"

---

**🎯 CONTENT EXTRACTION FROM JOURNEY:**

Analyze all stages to:
- Identify main narrative arc for article
- Extract 4-5 discrete insights/angles for posts
- Find compelling stats, quotes, or examples
- Determine strategic positioning for target personas
- Ensure actionable takeaways for decision-makers

**Quality Checklist:**
- ✅ Article is 1,500-2,000 words
- ✅ Article has compelling headline with numbers/benefit
- ✅ Opening hooks attention (stat, story, question)
- ✅ Short paragraphs (2-4 sentences)
- ✅ Clear subheadings every 3-4 paragraphs
- ✅ Practical takeaways for CEOs/strategists
- ✅ Ends with 3 key takeaways + CTA question
- ✅ 4-5 post drafts with varied angles
- ✅ Each post has strong hook in line 1
- ✅ Posts are 100-300 words, mobile-optimized
- ✅ Each post ends with engagement question
- ✅ 2-3 strategic hashtags per post
- ✅ Copy buttons for easy publishing
- ✅ Professional, LinkedIn-style design
- ✅ All content targets CEOs, AI experts, business strategists
`,
      carousel: `
## LINKEDIN CAROUSEL - SOCIAL MEDIA OPTIMIZED SLIDES

**📱 FORMAT REQUIREMENTS (CRITICAL):**
- **Square Format**: Each slide MUST be 1080x1080px (1:1 aspect ratio)
- **Slide Count**: 5-10 slides total (optimal for LinkedIn)
- **Horizontal Scrolling**: Slides arranged horizontally with smooth swipe/scroll
- **Individual Slides**: Each slide must be self-contained and screenshot-ready

**🎯 SLIDE STRUCTURE:**

**Slide 1 - HOOK (Title Slide):**
- Eye-catching title (LARGE, bold typography, 48-72px)
- Compelling subtitle/question that hooks attention
- Minimal text (5-10 words max)
- Bold background (gradient, pattern, or solid with high contrast)
- Optional: Small "1/N" page indicator in corner (where N is total slides)

**Slides 2-N - CONTENT (Value Slides):**
- One key insight per slide (focus!)
- Large, readable text (24-36px for body, 40-56px for headings)
- Maximum 3-4 bullet points OR 1-2 short paragraphs
- Use numbers, stats, or bold statements
- Visual elements: icons, simple charts, or geometric shapes
- Consistent color scheme but vary layouts
- Page indicator: "2/N", "3/N", etc. (where N is total slides)

**Last Slide - CTA (Call-to-Action):**
- Thank you message or summary
- Call-to-action: "Follow for more", "Visit perpetua.ai", "Share your thoughts"
- Optional: QR code or link
- Make it memorable and engaging

**🎨 DESIGN REQUIREMENTS:**

**Typography:**
- Headlines: 48-72px, ultra-bold (900 weight), attention-grabbing
- Body text: 24-36px, readable (600 weight minimum)
- Use max 2 font families
- HIGH CONTRAST: Dark text on light bg OR light text on dark bg
- Line spacing: 1.4-1.6 for readability

**Colors:**
- High contrast color schemes (WCAG AAA)
- Bold, saturated colors for backgrounds
- Consistent accent color throughout (from design language)
- Use gradients, duotones, or solid colors
- Avoid muddy/low-contrast combinations

**Visual Elements:**
- Large SVG icons (64-128px) to break up text
- Geometric shapes for visual interest
- Simple data visualizations (if applicable)
- Consistent visual style across all slides
- Generous whitespace/padding (80-120px margins)

**📐 CSS IMPLEMENTATION:**

\`\`\`css
.carousel-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  width: 100vw;
  height: 100vh;
  background: #f0f0f0;
}

.carousel-slide {
  flex: 0 0 1080px;
  width: 1080px;
  height: 1080px;
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 120px 100px;
  box-sizing: border-box;
  position: relative;
}

.slide-number {
  position: absolute;
  top: 40px;
  right: 40px;
  font-size: 18px;
  font-weight: 600;
  opacity: 0.6;
}

.slide-title {
  font-size: 64px;
  font-weight: 900;
  line-height: 1.2;
  text-align: center;
  margin-bottom: 32px;
  max-width: 800px;
}

.slide-content {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.6;
  text-align: center;
  max-width: 700px;
}

/* Smooth scroll with arrow keys or touch */
.carousel-nav {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 1000;
}

.nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(0,0,0,0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-dot.active {
  background: rgba(0,0,0,0.8);
  transform: scale(1.3);
}
\`\`\`

**🎬 CONTENT DISTRIBUTION:**

From the journey stages, extract:
- **Slide 1**: Journey question as hook
- **Slides 2 through (N-1)**: Top 5-8 insights (one per slide)
- **Last Slide (N)**: Summary + CTA

**EACH SLIDE MUST:**
- ✅ Be exactly 1080x1080px
- ✅ Have ONE focused message
- ✅ Use BOLD, large typography
- ✅ Have high contrast (easily readable)
- ✅ Include page number (e.g., "3/7")
- ✅ Be screenshot-ready (looks good standalone)
- ✅ Follow consistent visual theme

**LINKEDIN OPTIMIZATION:**
- First slide hooks in 1 second
- Middle slides deliver quick value
- Last slide encourages engagement
- Mobile-friendly (large text, simple layouts)
- Shareable (each slide valuable on its own)

**📋 CHECKLIST:**
- [ ] 5-10 slides total
- [ ] Each slide 1080x1080px (square)
- [ ] Horizontal scroll with snap points
- [ ] Page indicators on each slide
- [ ] Navigation dots at bottom
- [ ] Bold typography (48px+ headlines)
- [ ] High contrast colors
- [ ] One message per slide
- [ ] CTA on last slide
- [ ] Keyboard arrow navigation works
- [ ] Touch swipe works on mobile
`,
    };

    return instructions[templateType] || instructions.report;
  }

  /**
   * Get full website instructions (original comprehensive version)
   */
  private getFullWebsiteInstructions(): string {
    return `
Create a comprehensive, multi-section website:
- **Hero Section**: Eye-catching landing with journey title, compelling tagline, gradient background
- **Navigation Bar**: Fixed/sticky nav with smooth scroll to sections, hamburger menu for mobile
- **About Section**: Introduction to the journey's topic and purpose
- **Content Sections** - INTERACTIVE JOURNEY THROUGH STAGES:
  * **One section per stage** with distinct visual identity
  * **Transform content into visual elements**:
    - Key insights → Highlight cards with icons
    - Long text → Expandable sections with "Read More" buttons
    - Lists → Timeline elements or icon + text cards
    - Tables → Interactive with hover effects
    - Quotes → Beautiful blockquotes with styling
  * **Progressive Disclosure**:
    - Summary view: Show key points and highlights (3-5 cards per stage)
    - Detail view: Expandable sections reveal full content
    - Extended Thinking: Collapsed by default with "💭 Deep Dive" toggle
  * **Visual Variety**:
    - Alternate layouts (left/right, cards/grid, timeline)
    - Stage-specific color accents
    - Icons representing stage types (🔍 discovering, 🎯 solving, etc.)
    - Smooth transitions between stages
  * **Interactivity**:
    - Scroll animations (elements fade/slide in)
    - Click to expand collapsed sections
    - Hover effects reveal details
    - Smooth scroll to stages from navigation
- **Key Insights Section**: Highlight major discoveries/conclusions in card grid
- **Interactive Elements**:
  * Smooth scroll behavior
  * Fade-in animations on scroll
  * Expandable/collapsible sections
  * Hover effects on interactive elements
- **Footer**: Credits, metadata, generated timestamp
- **Design System**:
  * Scandinavian aesthetic: clean, minimal, elegant
  * Consistent color palette (gradients welcome)
  * Beautiful typography hierarchy
  * Generous whitespace
  * Responsive grid layout
  * Professional, polished appearance

**📦 Content Fidelity - CRITICAL:**
The journey content is PARAMOUNT. You MUST capture all the substance:
- **Complete Content**: Include ALL stage results - don't summarize or skip content
- **Visual Richness**: Use typography, colors, layouts to make content engaging and scannable
- **Text Preservation**: Keep the actual insights, findings, and discoveries intact
- **Artifact Integration**: Display all artifacts (documents, code, visualizations) prominently
- **Nothing Lost**: If a stage discovered something important, it MUST appear on the page

**🎭 Storytelling & Content Presentation:**
Think carefully about HOW the content is presented to create an engaging narrative (while keeping ALL content):

- **Narrative Arc**: Structure the website as a story with beginning, middle, and end:
  * **Opening Hook**: Start with a compelling question or problem that draws users in
  * **Rising Action**: Build understanding progressively through sections
  * **Climax**: Present the most important discoveries or insights
  * **Resolution**: Conclude with clear takeaways and actionable next steps

- **User Journey & Pacing**:
  * **Entry Point**: Make it immediately clear what this journey is about
  * **Progressive Disclosure**: Reveal information gradually to maintain interest
  * **Breathing Room**: Balance dense content with visual breaks and whitespace
  * **Peak Moments**: Create 2-3 "wow moments" where key insights are revealed dramatically
  * **Natural Flow**: Guide users smoothly from one section to the next with transitional elements

- **Visual Storytelling**:
  * **Visual Metaphors**: Use design elements that reflect the content (e.g., branching paths for exploration, light bulbs for insights)
  * **Color Progression**: Evolve the color scheme throughout the page to signal journey progression
  * **Typography Rhythm**: Vary text presentation (quotes, callouts, emphasis) to create reading rhythm
  * **Sectional Identity**: Give each major section its own visual character while maintaining coherence

- **Emotional Engagement**:
  * **Human Connection**: Present insights in relatable, human terms
  * **Curiosity Triggers**: Use intriguing headings and preview text to encourage scrolling
  * **Satisfaction Points**: Create moments of "aha!" where understanding crystallizes
  * **Memorable Moments**: Highlight 3-5 key takeaways that users will remember

- **Content Hierarchy & Flow**:
  * **Information Layering**: Present high-level overview first, then details on demand
  * **Connecting Threads**: Show how stages relate and build upon each other
  * **Key Insights Elevation**: Make discoveries stand out visually and contextually
  * **Thematic Consistency**: Weave core themes throughout rather than isolating them

**⚖️ Balance:**
- Content completeness is NON-NEGOTIABLE - include everything from the journey
- Storytelling is about PRESENTATION, not reduction
- Use design and narrative structure to make dense content accessible and engaging
- Visual richness + complete text = the perfect combination

The goal is to transform raw exploration data into a compelling narrative experience that feels intentionally crafted, engaging, and memorable - WITHOUT losing any of the actual content. Every design and content decision should serve both the story AND the substance.
`;
  }

  /**
   * Get full presentation instructions (original comprehensive version)
   */
  private getFullPresentationInstructions(): string {
    return `
Create a professional, PDF-ready slide deck interface:

🚨 **CRITICAL WARNING - NO EXTERNAL LIBRARIES** 🚨
❌ **ABSOLUTELY FORBIDDEN**: Do NOT use Reveal.js, Swiper.js, Impress.js, or ANY external CDN libraries
❌ **WILL FAIL**: Loading scripts from cdn.jsdelivr.net, unpkg.com, cdnjs.com, etc. violates Content Security Policy
✅ **REQUIRED**: Build ALL slide navigation and transitions with vanilla JavaScript only
✅ **REQUIRED**: ALL code must be inline in the HTML file (no external <script src> or <link href>)

**Why no external libraries?**
- Content Security Policy (CSP) blocks external scripts/stylesheets
- Must work offline without internet connection
- Must be completely self-contained in one HTML file

**How to build slides with vanilla JS** (instead of Reveal.js):
\`\`\`javascript
// Container: <div id="slides"><div class="slide">...</div><div class="slide">...</div></div>
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function showSlide(n) {
  currentSlide = Math.max(0, Math.min(n, totalSlides - 1));
  slides.forEach((slide, i) => {
    slide.style.display = i === currentSlide ? 'flex' : 'none';
  });
  document.querySelector('.slide-counter').textContent = \`\${currentSlide + 1} / \${totalSlides}\`;
}

// Navigation
document.getElementById('next-btn').onclick = () => showSlide(currentSlide + 1);
document.getElementById('prev-btn').onclick = () => showSlide(currentSlide - 1);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') showSlide(currentSlide + 1);
  if (e.key === 'ArrowLeft') showSlide(currentSlide - 1);
  if (e.key === 'Home') showSlide(0);
  if (e.key === 'End') showSlide(totalSlides - 1);
});

showSlide(0); // Initialize
\`\`\`

**CSS for smooth transitions**:
\`\`\`css
.slide {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.slide[style*="display: flex"] {
  opacity: 1;
}
\`\`\`

**Presentation Structure:**
- **Title Slide**:
  * Large, eye-catching title with journey question
  * Subtitle with context or tagline
  * Beautiful background gradient or visual
  * "Generated by Perpetua" branding at bottom

- **Stage Slides** (one per exploration stage):
  * Clear slide number and stage type badge
  * Concise heading (1-2 sentences max)
  * 3-5 key bullet points (not full paragraphs!)
  * Visual elements: icons, diagrams, or illustrations
  * Consistent layout but varied visual treatment
  * Stage-specific color accents

- **Key Insights Slide**:
  * "What We Discovered" or similar title
  * 4-6 major takeaways in card format
  * Visual icons or numbers

- **Summary Slide**:
  * Recap of the journey
  * Call to action or next steps
  * Thank you message

**Interactive Features:**
- **Navigation Controls**:
  * Previous/Next buttons (arrows)
  * Keyboard shortcuts: Arrow keys, Space, Home, End
  * Click anywhere on slide to advance
  * Slide counter (e.g., "3 / 12")

- **Progress Indicator**:
  * Horizontal bar or dots at bottom
  * Shows current position in deck
  * Clickable to jump to slides

- **Smooth Transitions**:
  * Slide transitions (fade, slide left/right)
  * CSS animations (60fps)
  * No janky movements

**Design System:**
- **Layout**: Full-screen slides (100vw × 100vh)
- **Typography**:
  * Slide titles: 3-4rem, bold
  * Body text: 1.5-2rem, readable from distance
  * Bullet points: proper hierarchy
  * Maximum 6-7 lines of text per slide

- **Colors**: Use content-type palette with high contrast
- **Spacing**: Generous whitespace, not cramped
- **Backgrounds**:
  * Subtle gradients or solid colors
  * Avoid busy patterns
  * Ensure text readability

- **Visual Hierarchy**:
  * One main point per slide
  * Support with 3-5 sub-points
  * Use icons, emojis, or illustrations
  * Data: charts or infographics

**Sharing & Export Capability:**
- **Save Presentation Button**:
  * Fixed position (bottom-right corner when not presenting)
  * "Save Presentation" with download icon
  * Downloads complete HTML file
  * JavaScript function that creates a Blob and triggers download
  * Filename: journey title + date (e.g., "AI-Ethics-Presentation-2024-01-15.html")

- **Implementation**:
  Add this JavaScript function:

  function savePresentation() {
    var blob = new Blob([document.documentElement.outerHTML], { type: 'text/html' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'presentation-' + Date.now() + '.html';
    a.click();
    URL.revokeObjectURL(url);
  }

- **Why HTML instead of PDF**:
  * Preserves all interactivity (navigation, animations)
  * Maintains exact colors, gradients, and full-screen layout
  * Works perfectly on any device with a browser
  * Recipients get the full experience
  * Much better than print-to-PDF which breaks slide formatting

- **CRITICAL: Print/PDF Export Styles** (@media print - REQUIRED for PDF export):
  The page must include comprehensive print styles for high-quality PDF exports via Electron's printToPDF.

  **Essential Print CSS Rules:**
  \`\`\`css
  @media print {
    /* Page setup for A4 landscape presentations */
    @page {
      size: A4 landscape;
      margin: 0;
    }

    /* Ensure backgrounds and colors are preserved */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Each slide should be its own page */
    .slide {
      page-break-after: always;
      page-break-inside: avoid;
      break-after: page;
      break-inside: avoid;
      min-height: 100vh;
      height: 100vh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Hide navigation and interactive elements */
    button, .nav-controls, .slide-nav, .controls {
      display: none !important;
    }

    /* Preserve gradients and backgrounds */
    body, .slide, [class*="bg-"], [class*="gradient"] {
      background: inherit !important;
    }

    /* Optimize typography for print */
    body {
      font-size: 12pt;
      line-height: 1.4;
    }

    h1 { font-size: 32pt; }
    h2 { font-size: 24pt; }
    h3 { font-size: 18pt; }

    /* Ensure proper spacing */
    .content, .slide-content {
      padding: 2cm;
    }

    /* Avoid orphans and widows */
    p, li {
      orphans: 3;
      widows: 3;
    }
  }
  \`\`\`

  **Print Style Checklist:**
  ✅ Page breaks between slides (@page, break-after: page)
  ✅ Background preservation (-webkit-print-color-adjust: exact)
  ✅ Hide interactive elements (display: none on buttons/nav)
  ✅ Optimize typography (pt units instead of px)
  ✅ Full-width slides (100vw/100vh with proper margins)
  ✅ Preserve gradients and colors (color-adjust: exact)
  ✅ Proper spacing (padding in cm for physical dimensions)

**Technical Requirements:**
🚨 **REMINDER: NO <script src="..."> OR <link href="..."> TAGS ALLOWED** 🚨
- ❌ Do NOT import Reveal.js, Chart.js, D3.js, or any CDN library
- ✅ Write ALL JavaScript inline in <script> tags (no src attribute)
- ✅ Write ALL CSS inline in <style> tags (no link href)
- Vanilla JavaScript only (no frameworks or libraries)
- All CSS inline in the HTML file
- Self-contained (no external dependencies or CDN links)
- Works offline without internet
- Smooth 60fps animations with vanilla CSS
- Responsive (works on different screen sizes)
- Professional appearance suitable for business presentations

**Content Guidelines:**
- **Be concise**: Slides are summaries, not essays
- **Use bullet points**: 3-5 points max per slide
- **Visual > Text**: Use icons, emojis, diagrams when possible
- **One idea per slide**: Don't cram multiple concepts
- **Tell a story**: Build narrative from slide to slide
- **Engage visually**: Use color, contrast, and layout creatively

This should feel like a professionally designed presentation created by a designer, with smooth interactions and beautiful slides tailored to the journey's content and topic. Perfect for presenting findings or exporting as a PDF handout.
`;
  }

  /**
   * Extract HTML from Claude's response
   */
  private extractHTML(content: string): string {
    // Remove markdown code blocks if present
    let html = content.trim();

    // Remove ```html or ``` wrapper
    html = html.replace(/^```html?\n?/i, '');
    html = html.replace(/\n?```$/, '');

    // Ensure it starts with DOCTYPE
    if (!html.startsWith('<!DOCTYPE')) {
      throw new Error('Generated content is not valid HTML');
    }

    return html.trim();
  }

  /**
   * Validate generated HTML
   */
  private validateHTML(html: string): boolean {
    // Basic validation
    return (
      html.includes('<!DOCTYPE') &&
      html.includes('<html') &&
      html.includes('</html>') &&
      html.includes('<head>') &&
      html.includes('<body>')
    );
  }
}

// Export singleton
export const claudePageGenerator = new ClaudePageGenerator();
