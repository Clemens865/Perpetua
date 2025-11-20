#!/bin/bash

# Mini-Synthesis Integration Script
# This script adds the mini-synthesis feature to ExplorationEngine.ts

set -e

FILE="/Users/clemenshoenig/Documents/My-Coding-Programs/Odyssey/src/renderer/lib/engine/ExplorationEngine.ts"
BACKUP="${FILE}.backup-$(date +%Y%m%d-%H%M%S)"

# Create backup
cp "$FILE" "$BACKUP"
echo "✅ Created backup: $BACKUP"

# Step 1: Import is already added

# Step 2: Update ExplorationConfig type
echo "📝 Updating ExplorationConfig type..."
perl -i -pe 's/(saveArtifacts\?\: boolean;.*\/\/ Save artifacts to database.*\n)/$1  enableMiniSynthesis?: boolean; \/\/ Enable mini-synthesis every N stages (default: true)\n  synthesisInterval?: number;   \/\/ Create synthesis every N stages (default: 3)\n/' "$FILE"

# Step 3: Update ExplorationContext type
echo "📝 Updating ExplorationContext type..."
perl -i -pe 's/(richInsights\?\: RichInsight\[\];.*\n)/$1  synthesisCount?: number; \/\/ Phase 1 Quick Win #3: Track number of synthesis reports created\n/' "$FILE"

# Step 4a: Add private field to class
echo "📝 Adding synthesisService private field..."
perl -i -pe 's/(private questionTracker: QuestionTrackingService;.*\n)/$1  private synthesisService: MiniSynthesisService;\n/' "$FILE"

# Step 4b: Update config initialization
echo "📝 Updating config initialization..."
perl -i -pe 's/(saveArtifacts: config\.saveArtifacts \?\? true,)/$1\n      enableMiniSynthesis: config.enableMiniSynthesis ?? true,\n      synthesisInterval: config.synthesisInterval ?? 3,/' "$FILE"

# Step 4c: Update context initialization
echo "📝 Updating context initialization..."
perl -i -pe 's/(richInsights: \[\],.*Initialize empty rich insights.*\n)/$1      synthesisCount: 0, \/\/ Phase 1 Quick Win #3: Initialize synthesis counter\n/' "$FILE"

# Step 4d: Initialize service
echo "📝 Adding synthesisService initialization..."
perl -i -pe 's/(this\.questionTracker = new QuestionTrackingService\(\);)/$1\n    this.synthesisService = new MiniSynthesisService();/' "$FILE"

# Step 5: Add createMiniSynthesis method (insert before last closing brace of class)
echo "📝 Adding createMiniSynthesis method..."

# Find line number of last method before closing brace
LINE_NUM=$(grep -n "^}" "$FILE" | tail -1 | cut -d: -f1)
LINE_NUM=$((LINE_NUM - 1))

# Insert the method
cat >> /tmp/mini_synthesis_method.txt << 'EOF'

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
      console.log(\`⏭️  Skipping mini-synthesis - need at least \${interval} stages\`);
      return;
    }

    console.log(\`\n\${'='.repeat(60)}\`);
    console.log(\`🔮 CREATING MINI-SYNTHESIS (Stages \${totalStages - interval + 1}-\${totalStages})\`);
    console.log(\`\${'='.repeat(60)}\n\`);

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
      this.context.insights.push(\`[SYNTHESIS] \${synthesisReport.summary}\`);

      // Increment synthesis counter
      this.context.synthesisCount = (this.context.synthesisCount || 0) + 1;

      console.log(\`✅ Mini-synthesis #\${this.context.synthesisCount} created successfully\`);
      console.log(\`📊 Quality: \${synthesisReport.synthesisQuality.toFixed(1)}/10\`);
      console.log(\`🔗 Key connections: \${synthesisReport.connections.substring(0, 100)}...\`);
      console.log(\`📈 Emerging patterns: \${synthesisReport.patterns.substring(0, 100)}...\`);

      // Log synthesis details for debugging
      console.log(\`\n📝 SYNTHESIS DETAILS:\`);
      console.log(\`Summary: \${synthesisReport.summary}\`);
      console.log(\`Connections: \${synthesisReport.connections}\`);
      console.log(\`Patterns: \${synthesisReport.patterns}\`);
      console.log(\`Contradictions: \${synthesisReport.contradictions}\`);
      console.log(\`Forward Look: \${synthesisReport.forwardLook}\`);
      console.log(\`Key Insights: \${synthesisReport.keyInsights.join(', ')}\`);
      console.log(\`\n\${'='.repeat(60)}\n\`);

    } catch (error) {
      console.error('❌ Failed to create mini-synthesis:', error);
      // Don't throw - allow journey to continue even if synthesis fails
    }
  }
EOF

sed -i '' "${LINE_NUM}r /tmp/mini_synthesis_method.txt" "$FILE"
rm /tmp/mini_synthesis_method.txt

# Step 6: Add synthesis trigger in executeStage
echo "📝 Adding synthesis trigger in executeStage..."
perl -i -pe 's/(this\.context\.currentStage = stageNumber - 1;)/$1\n\n    \/\/ Phase 1: Create mini-synthesis every N stages (if enabled and not a summary stage)\n    if (\n      this.config.enableMiniSynthesis \&\&\n      !isSummary \&\&\n      stage.status === '\''complete'\'' \&\&\n      this.context.previousStages.length % this.config.synthesisInterval === 0 \&\&\n      this.context.previousStages.length >= this.config.synthesisInterval\n    ) {\n      try {\n        await this.createMiniSynthesis();\n      } catch (error) {\n        console.error('\''Failed to create mini-synthesis, continuing journey:'\'', error);\n      }\n    }/' "$FILE"

echo "✅ Integration complete!"
echo "📄 Backup saved at: $BACKUP"
echo "🔧 Run 'npm run build' to test the changes"
