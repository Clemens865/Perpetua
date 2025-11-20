/**
 * Seeded Random Number Generator
 *
 * Provides deterministic pseudo-random numbers based on a seed string.
 * Same seed always produces same sequence of numbers.
 */

/**
 * Simple hash function to convert string to number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a seeded random number generator
 * Returns a function that generates numbers between 0 and 1
 */
export function seededRandom(seed: string): () => number {
  let state = hashString(seed);

  // Linear Congruential Generator (LCG)
  // Using parameters from Numerical Recipes
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);

  return function random(): number {
    state = (a * state + c) % m;
    return state / m;
  };
}

/**
 * Get a random integer between min (inclusive) and max (exclusive)
 */
export function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min)) + min;
}

/**
 * Get a random element from an array
 */
export function randomChoice<T>(random: () => number, array: T[]): T {
  return array[Math.floor(random() * array.length)];
}

/**
 * Get N random elements from an array (without replacement)
 */
export function randomSample<T>(random: () => number, array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => random() - 0.5);
  return shuffled.slice(0, n);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffle<T>(random: () => number, array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a random color in hex format
 */
export function randomColor(random: () => number): string {
  const r = Math.floor(random() * 256);
  const g = Math.floor(random() * 256);
  const b = Math.floor(random() * 256);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate a unique seed from journey data
 */
export function generateSeed(journeyId: string, templateType: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  return `${journeyId}-${templateType}-${ts}`;
}
