/**
 * ADD THIS METHOD TO ExplorationEngine CLASS
 * Insert this method before the final closing brace of the class
 * (After the getSummary() method, around line 1270)
 */

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
