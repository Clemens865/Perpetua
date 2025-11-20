#!/bin/bash
#
# Script to integrate Context Summarization into ExplorationEngine
# Medium #1: Hierarchical Context Summarization
#

set -e

ENGINE_FILE="src/renderer/lib/engine/ExplorationEngine.ts"

echo "🔄 Applying Context Summarization Integration..."

# 1. Add ContextSummarizationService import (if not already present)
if ! grep -q "ContextSummarizationService" "$ENGINE_FILE"; then
    echo "📝 Adding ContextSummarizationService import..."
    sed -i.bak '/QuestionTrackingService/a\
import { ContextSummarizationService } from '"'"'./services/ContextSummarizationService'"'"';
' "$ENGINE_FILE"
fi

# 2. Add ContextSummary to type imports
if ! grep -q "ContextSummary" "$ENGINE_FILE"; then
    echo "📝 Adding ContextSummary to type imports..."
    sed -i.bak 's/TrackedQuestion, RichArtifact/TrackedQuestion, RichArtifact, ContextSummary/' "$ENGINE_FILE"
fi

# 3. Add contextSummary field to ExplorationContext (if not present)
if ! grep -q "contextSummary" "$ENGINE_FILE"; then
    echo "📝 Adding contextSummary field to ExplorationContext..."
    sed -i.bak '/richInsights.*Optional/a\
  contextSummary?: ContextSummary | null; // Medium #1: Hierarchical context summarization
' "$ENGINE_FILE"
fi

# 4. Add private contextSummarizer field to class (after "private context")
if ! grep -q "private contextSummarizer" "$ENGINE_FILE"; then
    echo "📝 Adding contextSummarizer service field..."
    sed -i.bak '/private context: ExplorationContext;/a\
  private contextSummarizer: ContextSummarizationService; // Medium #1
' "$ENGINE_FILE"
fi

# 5. Initialize contextSummarizer in constructor (if not present)
if ! grep -q "this.contextSummarizer = new ContextSummarizationService()" "$ENGINE_FILE"; then
    echo "📝 Initializing contextSummarizer in constructor..."
    sed -i.bak '/this.context = {/,/};/{
        /chasedTopics: \[\],/a\
      contextSummary: null, // Medium #1: Initialize null context summary
    }

After the closing brace, add:
    this.contextSummarizer = new ContextSummarizationService(); // Medium #1
}' "$ENGINE_FILE"
fi

echo "✅ Context Summarization imports and initialization complete!"
echo ""
echo "📋 Manual steps required:"
echo "1. Add updateContextSummary() method to ExplorationEngine class"
echo "2. Call updateContextSummary() after stage completion (every 3 stages)"
echo "3. Update STAGE_PROMPTS to use hierarchical context"
echo "4. Run 'npm run build' to test"
