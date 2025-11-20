/**
 * Partial result caching for chunked page generation
 */

import type { CachedGeneration, GenerationStage } from '../types/generation-progress';

export class GenerationCache {
  private cache: Map<string, CachedGeneration> = new Map();
  private readonly CACHE_EXPIRY_MS = 3600000; // 1 hour

  /**
   * Get cache key for a journey + template combination
   */
  private getCacheKey(journeyId: string, templateType: string): string {
    return `${journeyId}-${templateType}`;
  }

  /**
   * Save partial generation progress
   */
  save(
    journeyId: string,
    templateType: string,
    partial: Partial<CachedGeneration>
  ): void {
    const key = this.getCacheKey(journeyId, templateType);
    const existing = this.cache.get(key);

    const updated: CachedGeneration = {
      journeyId,
      templateType,
      timestamp: Date.now(),
      sections: {
        ...existing?.sections,
        ...partial.sections
      },
      completedSteps: partial.completedSteps || existing?.completedSteps || []
    };

    this.cache.set(key, updated);

    console.log(`💾 Saved progress for ${journeyId}:`, {
      completedSteps: updated.completedSteps,
      sectionsCount: Object.keys(updated.sections).length
    });
  }

  /**
   * Get cached generation if available and not expired
   */
  get(journeyId: string, templateType: string): CachedGeneration | null {
    const key = this.getCacheKey(journeyId, templateType);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Check if cache has expired
    const age = Date.now() - cached.timestamp;
    if (age > this.CACHE_EXPIRY_MS) {
      console.log(`🗑️  Cache expired for ${journeyId} (age: ${Math.round(age / 60000)}min)`);
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Found cached progress for ${journeyId}:`, {
      completedSteps: cached.completedSteps,
      age: `${Math.round(age / 1000)}s`
    });

    return cached;
  }

  /**
   * Clear cache for specific journey
   */
  clear(journeyId: string, templateType: string): void {
    const key = this.getCacheKey(journeyId, templateType);
    this.cache.delete(key);
    console.log(`🗑️  Cleared cache for ${journeyId}`);
  }

  /**
   * Clear all expired cache entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_EXPIRY_MS) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: Array<{ key: string; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      age: now - cached.timestamp
    }));

    return {
      size: this.cache.size,
      entries
    };
  }
}
