/**
 * Page Analysis View
 * Displays Claude's journey analysis and template recommendation
 * Phase 2B: UI component for showing analysis results
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JourneyAnalysis } from '@/services/claude/ClaudePageAnalyzer';

interface PageAnalysisViewProps {
  analysis: JourneyAnalysis;
  selectedTemplate?: string;
  onTemplateSelect: (template: string) => void;
}

export function PageAnalysisView({
  analysis,
  selectedTemplate,
  onTemplateSelect,
}: PageAnalysisViewProps): React.ReactElement {
  const confidencePercent = Math.round(analysis.recommendations.confidence * 100);
  const isHighConfidence = analysis.recommendations.confidence >= 0.75;

  return (
    <div className="space-y-4">
      {/* Analysis Header */}
      <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
        <div className="flex-shrink-0 p-2 bg-indigo-500 rounded-lg">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">Claude's Analysis</h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              isHighConfidence
                ? 'bg-green-100 text-green-700'
                : 'bg-yellow-100 text-yellow-700'
            )}>
              {confidencePercent}% confident
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {analysis.recommendations.reasoning}
          </p>
        </div>
      </div>

      {/* Content Classification */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Content Type</div>
          <div className="font-semibold text-gray-900 capitalize">
            {analysis.contentType}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Complexity</div>
          <div className="font-semibold text-gray-900 capitalize">
            {analysis.complexity}
          </div>
        </div>
      </div>

      {/* Key Themes */}
      {analysis.keyThemes && analysis.keyThemes.length > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Key Themes</div>
          <div className="flex flex-wrap gap-2">
            {analysis.keyThemes.slice(0, 5).map((theme, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-700"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Template Recommendations */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Choose Template</div>

        {/* All Available Templates */}
        {['website', 'report', 'wiki', 'presentation', 'timeline', 'mindmap', 'literature', 'carousel', 'linkedin-content'].map((template) => {
          const isPrimary = analysis.recommendations.primary === template;
          const isSecondary = analysis.recommendations.secondary?.includes(template);
          const isRecommended = isPrimary || isSecondary;
          const isSelected = selectedTemplate === template;

          return (
            <button
              key={template}
              onClick={() => onTemplateSelect(template)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left',
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}
            >
              <CheckCircle2
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isSelected ? 'text-indigo-500' : 'text-gray-400'
                )}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-semibold capitalize',
                    isSelected ? 'text-gray-900' : 'text-gray-700'
                  )}>
                    {template === 'linkedin-content' ? 'LinkedIn Content' :
                     template === 'carousel' ? 'LinkedIn Carousel' :
                     template}
                  </span>
                  {isPrimary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                      Recommended
                    </span>
                  )}
                  {isSecondary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                      Alternative
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
