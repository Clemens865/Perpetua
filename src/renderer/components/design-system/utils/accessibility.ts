/**
 * Accessibility utilities for Perpetua design system
 */

/**
 * Generate unique IDs for form fields and ARIA relationships
 */
export function generateId(prefix: string = 'perpetua'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Check if element is keyboard focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];

  return focusableSelectors.some((selector) => element.matches(selector));
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Get the next focusable element in the DOM
 */
export function getNextFocusableElement(
  current: HTMLElement,
  container: HTMLElement = document.body
): HTMLElement | null {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(current);

  if (currentIndex === -1) return null;

  return elements[currentIndex + 1] || elements[0];
}

/**
 * Get the previous focusable element in the DOM
 */
export function getPreviousFocusableElement(
  current: HTMLElement,
  container: HTMLElement = document.body
): HTMLElement | null {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(current);

  if (currentIndex === -1) return null;

  return elements[currentIndex - 1] || elements[elements.length - 1];
}

/**
 * Check color contrast ratio (WCAG AA requires 4.5:1 for normal text)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = ((rgb >> 0) & 0xff) / 255;

    const [rs, gs, bs] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if contrast ratio meets WCAG standards
 */
export function meetsWCAGStandard(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  large: boolean = false
): boolean {
  if (level === 'AAA') {
    return large ? ratio >= 4.5 : ratio >= 7;
  }
  return large ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Create screen reader only text
 */
export function srOnly(text: string): { 'aria-label': string; className: string } {
  return {
    'aria-label': text,
    className: 'sr-only',
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Format time for screen readers
 */
export function formatTimeForScreenReader(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * Create ARIA label for progress
 */
export function createProgressLabel(current: number, total: number): string {
  const percentage = Math.round((current / total) * 100);
  return `Progress: ${current} of ${total} complete, ${percentage} percent`;
}
