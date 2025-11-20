/**
 * Text Formatting Utilities
 * Common text transformation functions for page generation
 */

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format content for TTS optimization
 * Remove special characters, simplify punctuation, improve pronunciation
 */
export function formatForTTS(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
    .replace(/\*([^*]+)\*/g, '$1')      // Italic
    .replace(/`([^`]+)`/g, '$1')        // Code
    .replace(/#{1,6}\s+/g, '')          // Headers
    // Remove special characters that confuse TTS
    .replace(/[<>{}[\]]/g, '')
    .replace(/[\u2018\u2019]/g, "'")    // Smart quotes to regular
    .replace(/[\u201C\u201D]/g, '"')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Format content as HTML paragraphs
 */
export function formatContentAsParagraphs(text: string): string {
  // Split by double newlines to create paragraphs
  const paragraphs = text.split(/\n\n+/);

  return paragraphs
    .map((p, idx) => {
      const trimmed = p.trim();
      if (!trimmed) return '';

      // First paragraph doesn't get indent
      const className = idx === 0 ? ' class="no-indent"' : '';
      return `<p${className}>${escapeHtml(trimmed)}</p>`;
    })
    .filter(p => p)
    .join('\n      ');
}
