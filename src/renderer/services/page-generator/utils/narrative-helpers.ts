/**
 * Narrative Helpers
 * Functions for transforming exploration data into compelling narrative speech
 */

import type { Stage } from '@/types';
import { claudeService } from '../../claude/ClaudeService';

/**
 * Get a Steve Jobs-style chapter title based on stage type
 * Simple, direct, memorable - like his presentation sections
 */
export function getChapterTitle(stageType: string, chapterNumber: number): string {
  const titleMap: Record<string, string> = {
    discovering: 'What We Found',
    chasing: 'The Pursuit',
    solving: 'How It Works',
    challenging: 'Why This Matters',
    questioning: 'The Big Questions',
    searching: 'The Search',
    imagining: 'What\'s Possible',
    building: 'Making It Real',
  };

  return titleMap[stageType] || `Part ${chapterNumber}`;
}

/**
 * Create speech rhythm - authentic, emotional, memorable
 * Like Jobs, King, Churchill - let silence and simplicity do the work
 */
export function addConversationalFlow(text: string): string {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());

  // Create natural pauses and emphasis through paragraph structure
  return paragraphs
    .map((para, idx) => {
      // Most paragraphs stand alone - let them breathe
      if (idx === 0) return para;

      // Very rarely (10%) add the simplest connector
      if (Math.random() < 0.1) {
        const simple = ['And ', 'But ', ''][Math.floor(Math.random() * 3)];
        if (simple) {
          return simple + para.charAt(0).toLowerCase() + para.slice(1);
        }
      }

      return para;
    })
    .join('\n\n');
}

/**
 * Transform content into authentic storytelling - like a world-class speech
 * Focus: Emotion over logic, singular message, authentic voice
 */
export function toNarrativeProse(text: string): string {
  let narrative = text;

  // Strip all formatting first
  narrative = narrative.replace(/\*\*([^*]+)\*\*/g, '$1');
  narrative = narrative.replace(/\*([^*]+)\*/g, '$1');
  narrative = narrative.replace(/`([^`]+)`/g, '$1');
  narrative = narrative.replace(/#{1,6}\s+/g, '');

  // Remove ALL label patterns - let content speak directly
  narrative = narrative.replace(/^([A-Z][^:]{1,50}):\s*/gm, '');
  narrative = narrative.replace(/(\d{4}):\s+/g, '$1. ');
  narrative = narrative.replace(/([a-z])\s*:\s*([A-Z])/g, '$1. $2');
  narrative = narrative.replace(/([a-z])\s*:\s*$/gm, '$1.');

  // Convert lists to flowing narrative
  narrative = narrative.replace(/^[-*•]\s+/gm, '');
  narrative = narrative.replace(/^\d+\.\s+/gm, '');

  // Clean up technical language - make it human
  narrative = narrative
    .replace(/e\.g\./gi, 'like')
    .replace(/i\.e\./gi, '')
    .replace(/etc\./gi, '')
    .replace(/vs\./gi, 'versus')
    .replace(/\betc\b/gi, '');

  // Remove formal constructions - be direct
  narrative = narrative
    .replace(/\bIt is important to note that\b/gi, '')
    .replace(/\bIt should be noted that\b/gi, '')
    .replace(/\bIt is clear that\b/gi, '')
    .replace(/\bOne can\b/g, 'You can')
    .replace(/\bOne must\b/g, 'You must')
    .replace(/\bHowever,\b/gi, 'But')
    .replace(/\bTherefore,\b/gi, 'So')
    .replace(/\bNevertheless,\b/gi, 'But')
    .replace(/\bFurthermore,\b/gi, '')
    .replace(/\bMoreover,\b/gi, '')
    .replace(/\bAdditionally,\b/gi, '')
    .replace(/\bConsequently,\b/gi, '')
    .replace(/\bIn conclusion,\b/gi, '')
    .replace(/\bIn summary,\b/gi, '')
    .replace(/\bConsider\b/gi, '')
    .replace(/\bNote that\b/gi, '')
    .replace(/\bNotice that\b/gi, '');

  // Remove URLs
  narrative = narrative.replace(/https?:\/\/[^\s]+/g, '');

  // Clean up special characters
  narrative = narrative
    .replace(/[<>{}[\]]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/—/g, ' - ')
    .replace(/–/g, ' - ')
    .replace(/\.\.\./g, '.');

  // Create rhythm through varied sentence length
  // Break up run-on sentences
  narrative = narrative.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');

  // Remove excessive repetition
  narrative = narrative.replace(/\.\s+And\s+/g, '. ');
  narrative = narrative.replace(/\.\s+But\s+/g, '. ');
  narrative = narrative.replace(/\.\s+So\s+/g, '. ');

  // Clean up spacing and punctuation
  narrative = narrative
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\s*\./g, '.')
    .replace(/,\s*,/g, ',')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return narrative;
}

/**
 * Generate a compelling title and subtitle for the literature piece
 * Steve Jobs-style: Simple, direct, memorable
 */
export async function generateLiteratureTitle(
  journeyInput: string,
  stages: Stage[]
): Promise<{ title: string; subtitle: string }> {
  // Build context from all stages
  const stagesOverview = stages.map((s, i) =>
    `Stage ${i + 1} (${s.type}): ${s.result.substring(0, 200)}...`
  ).join('\n\n');

  const prompt = `You're creating a title and subtitle for a book/speech based on this exploration.

ORIGINAL QUESTION:
"${journeyInput}"

EXPLORATION CONTENT:
${stagesOverview}

YOUR TASK:
Generate a compelling title and subtitle in Steve Jobs' style.

**TITLE GUIDELINES:**
- Simple, direct, memorable (3-7 words max)
- Use Jobs-style patterns:
  - "What We Discovered About X"
  - "The Truth About X"
  - "Three Lessons About X"
  - "Why X Matters"
  - "How We Learned X"
- NOT the original question verbatim
- Make people curious, not confused
- Concrete, not abstract

**SUBTITLE GUIDELINES:**
- One compelling sentence (10-15 words)
- Provide context and intrigue
- What will they learn? Why does it matter?
- Personal voice ("A journey of discovery...", "What we learned when...")

**EXAMPLES:**

Original: "How does quantum computing affect cybersecurity?"
Title: "The Quantum Threat"
Subtitle: "What three years of research taught us about the future of security"

Original: "What makes a great company culture?"
Title: "Culture Isn't Free Pizza"
Subtitle: "Three insights from building teams that actually work"

Original: "Can AI replace human creativity?"
Title: "The Creativity Myth"
Subtitle: "What we discovered about machines, minds, and making things that matter"

**YOUR RESPONSE FORMAT:**
Return ONLY two lines:
Title: [your title here]
Subtitle: [your subtitle here]`;

  // Check if Claude service is available
  if (!claudeService.getInitializationStatus()) {
    console.warn('⚠️ TITLE GENERATION: Claude service not initialized, using original question as title');
    return {
      title: journeyInput,
      subtitle: `A Journey of Exploration Through ${stages.length} Stages`
    };
  }

  try {
    console.log('🎨 TITLE GENERATION: Calling Claude to generate title...');

    // Simplified prompt for more reliable parsing
    const simplePrompt = `You are creating a title and subtitle for a book/speech. Be VERY concise.

ORIGINAL QUESTION:
"${journeyInput}"

Generate a Steve Jobs-style title (3-7 words, direct, memorable) and subtitle (one sentence, 10-15 words).

Examples:
- Title: "The Quantum Threat"
  Subtitle: "What three years of research taught us about the future of security"
- Title: "Culture Isn't Free Pizza"
  Subtitle: "Three insights from building teams that actually work"

Respond with EXACTLY this format (no extra text):
Title: [your title]
Subtitle: [your subtitle]`;

    const response = await claudeService.execute({
      prompt: simplePrompt,
      model: 'claude-sonnet-4-5-20250929',
      extendedThinking: false, // Disable for faster, more direct response
      maxTokens: 200, // Shorter response expected
    });

    const content = response.content.trim();
    console.log('📝 TITLE GENERATION: Claude response:', content);

    // Try multiple parsing strategies
    let title = '';
    let subtitle = '';

    // Strategy 1: Standard format "Title: X\nSubtitle: Y"
    const titleMatch = content.match(/Title:\s*(.+?)(?:\n|$)/i);
    const subtitleMatch = content.match(/Subtitle:\s*(.+?)(?:\n|$)/i);

    if (titleMatch && subtitleMatch) {
      title = titleMatch[1].trim().replace(/^["']|["']$/g, '');
      subtitle = subtitleMatch[1].trim().replace(/^["']|["']$/g, '');
      console.log('✅ TITLE GENERATION: Parsed using standard format');
    }

    // Strategy 2: Look for lines after "Title:" and "Subtitle:"
    if (!title || !subtitle) {
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('title:') && !title) {
          title = lines[i].replace(/^title:\s*/i, '').replace(/^["']|["']$/g, '');
        }
        if (lines[i].toLowerCase().includes('subtitle:') && !subtitle) {
          subtitle = lines[i].replace(/^subtitle:\s*/i, '').replace(/^["']|["']$/g, '');
        }
      }
      if (title && subtitle) {
        console.log('✅ TITLE GENERATION: Parsed using line-by-line strategy');
      }
    }

    // Strategy 3: Take first two substantial lines if format isn't followed
    if (!title || !subtitle) {
      const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l && !l.toLowerCase().startsWith('title:') && !l.toLowerCase().startsWith('subtitle:'))
        .filter(l => l.length > 5); // Ignore very short lines

      if (lines.length >= 2) {
        title = lines[0].replace(/^["']|["']$/g, '');
        subtitle = lines[1].replace(/^["']|["']$/g, '');
        console.log('✅ TITLE GENERATION: Parsed using fallback strategy (first two lines)');
      }
    }

    // Validate and return
    if (title && subtitle && title.length > 0 && subtitle.length > 0) {
      console.log(`✅ TITLE GENERATION SUCCESS: "${title}"`);
      console.log(`✅ SUBTITLE GENERATION SUCCESS: "${subtitle}"`);
      return { title, subtitle };
    } else {
      console.warn('⚠️ TITLE GENERATION: Could not extract valid title/subtitle');
      console.warn('Full response:', content);
      return {
        title: journeyInput,
        subtitle: `A Journey of Exploration Through ${stages.length} Stages`
      };
    }

  } catch (error) {
    console.error('❌ TITLE GENERATION ERROR:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return {
      title: journeyInput,
      subtitle: `A Journey of Exploration Through ${stages.length} Stages`
    };
  }
}

/**
 * Transform a stage into compelling speech using Claude's storytelling abilities
 * This is the heart of Literature generation - turning raw exploration into narrative
 */
export async function transformStageToSpeech(
  stage: Stage,
  chapterNumber: number,
  journeyTopic: string,
  totalChapters: number
): Promise<string> {
  // Build comprehensive context for Claude
  const stageContext = `
STAGE CONTENT:
${stage.result}

${stage.thinking ? `\nEXTENDED THINKING:\n${stage.thinking}` : ''}

${stage.artifacts.length > 0 ? `\nKEY DISCOVERIES:\n${stage.artifacts.map(a => `- ${a.title}: ${a.content}`).join('\n')}` : ''}
`.trim();

  const prompt = `You are Steve Jobs presenting at a keynote. Transform these exploration notes into his signature speech style - conversational, inspiring, and unforgettable.

CONTEXT:
- This is section ${chapterNumber} of ${totalChapters} in a journey about: "${journeyTopic}"
- Stage type: ${stage.type}

STEVE JOBS' SIGNATURE STYLE:

**1. Conversational & Informal:**
- Talk like you're chatting with friends, not giving a lecture
- Use contractions (I'm, we're, that's, it's)
- Short, punchy sentences mixed with longer, building ones
- Natural pauses - let silence do the work

**2. The Rule of Three:**
- Structure key points in triads ("Three things I want to talk about today...")
- Use three examples, three reasons, three benefits
- Three is memorable, three has rhythm

**3. Repetition for Impact:**
- Repeat key phrases for emphasis ("This changes everything.")
- Use anaphora (starting sentences the same way)
- Create a catchphrase or memorable line that sticks

**4. Storytelling with Contrast:**
- Show the gap: "Here's what we have now... But imagine this..."
- Create dissatisfaction with status quo before revealing the solution
- Build suspense, then deliver the payoff

**5. Moments of Revelation:**
- Create "one more thing..." moments
- Surprise the audience with an insight they didn't see coming
- Make it feel like discovery, not instruction

**6. Simple, Visual Language:**
- Paint pictures with words
- Use metaphors and analogies ("It's like having 1,000 songs in your pocket")
- Concrete, not abstract

**7. Emotional Connection:**
- Show genuine passion and enthusiasm
- Make it personal - why does this matter to YOU?
- Balance humor with gravity - be profound without being pompous

**WHAT TO AVOID:**
- Formal transitions ("Furthermore", "In addition", "Moreover")
- Jargon or technical speak without explaining simply
- Lists with bullets or numbers (weave them into narrative)
- Meta-commentary ("I'm going to tell you about...")
- Academic tone

**YOUR TASK:**
Transform the content below into 2-4 paragraphs that sound like Steve Jobs on stage. Make people lean forward. Make them remember. Make them care.

${stageContext}

Write it like you're standing on that stage right now.`;

  // Check if Claude service is available
  if (!claudeService.getInitializationStatus()) {
    console.warn('  ⚠ Claude service not initialized, using basic text transformation');
    let fallback = toNarrativeProse(stage.result);
    if (stage.thinking) {
      fallback += '\n\n' + toNarrativeProse(stage.thinking);
    }
    return fallback;
  }

  try {
    const response = await claudeService.execute({
      prompt,
      model: 'claude-sonnet-4-5-20250929',
      extendedThinking: true,
      thinkingBudget: 3000, // Deep analysis for storytelling
      maxTokens: 4000,
    });

    const narrative = response.content.trim();
    console.log(`  ✓ Chapter ${chapterNumber} transformed (${narrative.length} chars)`);
    return narrative;

  } catch (error) {
    console.error(`  ✗ Failed to transform chapter ${chapterNumber}:`, error);
    // Fallback to basic prose transformation if Claude fails
    console.warn('  ⚠ Falling back to basic text transformation');
    let fallback = toNarrativeProse(stage.result);
    if (stage.thinking) {
      fallback += '\n\n' + toNarrativeProse(stage.thinking);
    }
    return fallback;
  }
}
