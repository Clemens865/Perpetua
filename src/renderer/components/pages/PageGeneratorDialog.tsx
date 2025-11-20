/**
 * Page Generator Dialog
 * Modal for selecting page generation options
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Layout, Presentation, Clock, Network, Loader2, Globe, BookOpen, Sparkles, Palette, Layers, Linkedin, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '@/lib/utils';
import type { Journey, Page } from '@/types';
import { pageGeneratorService } from '@/services/PageGeneratorService';
import { ipcClient } from '@/services/ipc/IPCClient';
import { PageAnalysisView } from './PageAnalysisView';
import type { JourneyAnalysis } from '@/services/claude/ClaudePageAnalyzer';
import type { DesignStyle } from '@/types/design-language';
import { exportJourneyToMarkdown } from '@/utils/markdown-export';

interface PageGeneratorDialogProps {
  journey: Journey;
  isOpen: boolean;
  onClose: () => void;
  onPageGenerated?: (page: Page) => void;
}

type TemplateType = 'report' | 'wiki' | 'presentation' | 'timeline' | 'mindmap' | 'website' | 'literature' | 'carousel' | 'linkedin-content';

interface TemplateOption {
  type: TemplateType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    type: 'website',
    name: 'Website',
    description: 'Comprehensive multi-section website with rich content',
    icon: Globe,
    available: true,
  },
  {
    type: 'report',
    name: 'Report',
    description: 'Professional report with stages and artifacts',
    icon: FileText,
    available: true,
  },
  {
    type: 'wiki',
    name: 'Wiki',
    description: 'Wikipedia-style article with navigation',
    icon: Layout,
    available: true,
  },
  {
    type: 'presentation',
    name: 'Presentation',
    description: 'Interactive slide deck with custom animations',
    icon: Presentation,
    available: true,
  },
  {
    type: 'timeline',
    name: 'Timeline',
    description: 'Interactive timeline with visual storytelling',
    icon: Clock,
    available: true,
  },
  {
    type: 'mindmap',
    name: 'Mind Map',
    description: 'Interactive concept graph with relationships',
    icon: Network,
    available: true,
  },
  {
    type: 'literature',
    name: 'Literature',
    description: 'Book-style narrative for podcast/TTS conversion',
    icon: BookOpen,
    available: true,
  },
  {
    type: 'carousel',
    name: 'LinkedIn Carousel',
    description: 'Eye-catching 5-10 slide carousel optimized for social media',
    icon: Layers,
    available: true,
  },
  {
    type: 'linkedin-content',
    name: 'LinkedIn Content',
    description: 'One article + 4-5 post drafts following LinkedIn best practices',
    icon: Linkedin,
    available: true,
  },
];

interface StyleOption {
  style: DesignStyle | null; // null = auto
  name: string;
  description: string;
  colorPreview: string; // Tailwind color class
  icon: React.ComponentType<{ className?: string }>;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    style: null,
    name: 'Auto (Smart Random)',
    description: 'Let Claude choose the best style for your content',
    colorPreview: 'bg-gradient-to-br from-purple-500 to-pink-500',
    icon: Sparkles,
  },
  {
    style: 'Neubrutalism',
    name: 'Neubrutalism',
    description: 'Bold, raw, high-contrast with heavy borders',
    colorPreview: 'bg-black',
    icon: Layout,
  },
  {
    style: 'Glassmorphism',
    name: 'Glassmorphism',
    description: 'Frosted glass effects with soft transparency',
    colorPreview: 'bg-gradient-to-br from-blue-400/30 to-purple-400/30 backdrop-blur',
    icon: Layout,
  },
  {
    style: 'Futuristic Cyber',
    name: 'Futuristic Cyber',
    description: 'Chrome surfaces, LED lights, hexagonal patterns',
    colorPreview: 'bg-gradient-to-br from-gray-900 via-cyan-500/20 to-gray-900',
    icon: Palette,
  },
  {
    style: 'Dark Mode First',
    name: 'Dark Mode First',
    description: 'Deep backgrounds with neon accents',
    colorPreview: 'bg-gradient-to-br from-gray-950 to-indigo-900',
    icon: Layout,
  },
  {
    style: 'Minimal Monochrome',
    name: 'Minimal Monochrome',
    description: 'Pure black and white with single accent',
    colorPreview: 'bg-white border-2 border-black',
    icon: Layout,
  },
  {
    style: 'Gradient Explosion',
    name: 'Gradient Explosion',
    description: 'Vibrant, bold gradient backgrounds',
    colorPreview: 'bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500',
    icon: Palette,
  },
  {
    style: 'Retro Vaporwave',
    name: 'Retro Vaporwave',
    description: '80s/90s nostalgia with neon colors',
    colorPreview: 'bg-gradient-to-br from-purple-600 via-pink-500 to-cyan-400',
    icon: Palette,
  },
  {
    style: 'Organic Modernism',
    name: 'Organic Modernism',
    description: 'Natural curves with earth tones',
    colorPreview: 'bg-gradient-to-br from-amber-100 to-green-200',
    icon: Layout,
  },
  {
    style: 'Maximalist Typography',
    name: 'Maximalist Typography',
    description: 'Huge, experimental text as the star',
    colorPreview: 'bg-gradient-to-br from-gray-900 via-red-600 to-blue-600',
    icon: Palette,
  },
  {
    style: '3D Elements & Depth',
    name: '3D Elements & Depth',
    description: 'Isometric views with parallax effects',
    colorPreview: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700',
    icon: Layout,
  },
  {
    style: 'Kinetic Typography',
    name: 'Kinetic Typography',
    description: 'Animated, interactive text that moves',
    colorPreview: 'bg-gradient-to-br from-gray-950 via-cyan-500 to-gray-950',
    icon: Palette,
  },
];

export function PageGeneratorDialog({
  journey,
  isOpen,
  onClose,
  onPageGenerated,
}: PageGeneratorDialogProps): React.ReactElement | null {
  const [selectedTemplate, setSelectedTemplate] = React.useState<TemplateType>('website');
  const [selectedStyle, setSelectedStyle] = React.useState<DesignStyle | null>(null); // null = auto
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<JourneyAnalysis | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Analyze journey when dialog opens
  React.useEffect(() => {
    if (isOpen && !analysis && ipcClient.isAvailable()) {
      analyzeJourney();
    }
  }, [isOpen]);

  const analyzeJourney = React.useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Try to get cached analysis first
      const cachedAnalysis = await pageGeneratorService.getCachedAnalysis(journey.id);

      if (cachedAnalysis) {
        console.log('✅ Using cached analysis');
        setAnalysis(cachedAnalysis);
        setSelectedTemplate(cachedAnalysis.recommendations.primary as TemplateType);
      } else {
        console.log('🧠 No cache found, analysis will run during generation');
        // Analysis will happen during generation
      }
    } catch (err) {
      console.warn('Failed to load analysis:', err);
      // Continue without analysis
    } finally {
      setIsAnalyzing(false);
    }
  }, [journey.id]);

  const handleExportMarkdown = React.useCallback(() => {
    try {
      exportJourneyToMarkdown(journey);
      console.log('✅ Journey exported to markdown');
    } catch (err) {
      console.error('Failed to export markdown:', err);
      setError(err instanceof Error ? err.message : 'Failed to export markdown');
    }
  }, [journey]);

  const handleGenerate = React.useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Debug: Check journey data
      console.log('📊 Journey object being sent to generator:', {
        id: journey.id,
        input: journey.input,
        stageCount: journey.stages?.length || 0,
        stages: journey.stages?.map(s => ({
          type: s.type,
          resultLength: s.result?.length || 0,
          artifactCount: s.artifacts?.length || 0,
        })) || [],
      });

      if (!journey.stages || journey.stages.length === 0) {
        throw new Error('Cannot generate page: Journey has no stages loaded');
      }

      // Generate the page
      const page = await pageGeneratorService.generatePage(journey, {
        type: 'template',
        templateType: selectedTemplate,
        designStyle: selectedStyle || undefined, // Pass selected style, undefined = auto
      });

      // Save to database
      if (ipcClient.isAvailable()) {
        await ipcClient.createPage(page);
        console.log(`💾 Page saved to database and file system`);
        console.log(`📁 Location: ~/Library/Application Support/perpetua/pages/${journey.id}/`);
        console.log(`📄 File: ${page.filePath}`);
      }

      // For interactive templates and literature, open in browser
      if (['website', 'presentation', 'timeline', 'mindmap', 'literature'].includes(selectedTemplate)) {
        // Add generation timestamp to content for debugging
        const timestampComment = `<!-- Generated: ${new Date(page.createdAt).toISOString()} | Page ID: ${page.id} -->`;
        const contentWithTimestamp = page.content.replace('</body>', `${timestampComment}\n</body>`);

        const blob = new Blob([contentWithTimestamp], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        // Open with unique window name to prevent browser from reusing window
        const windowName = `perpetua_${page.id}_${Date.now()}`;
        window.open(url, windowName);

        console.log(`🚀 Opened NEW ${selectedTemplate} page`);
        console.log(`📝 Page ID: ${page.id}`);
        console.log(`⏰ Generated at: ${new Date(page.createdAt).toLocaleString()}`);
        console.log(`🔗 Blob URL: ${url}`);

        // Clean up blob URL after a delay to prevent memory leaks
        setTimeout(() => {
          URL.revokeObjectURL(url);
          console.log(`🧹 Cleaned up blob URL for ${page.id}`);
        }, 5000);
      }

      // Notify parent
      onPageGenerated?.(page);
      onClose();
    } catch (err) {
      console.error('Failed to generate page:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate page');
    } finally {
      setIsGenerating(false);
    }
  }, [journey, selectedTemplate, onPageGenerated, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative z-10 w-full max-w-4xl mx-4 my-8"
        >
          <Card className="p-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Generate Page</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Choose a template to visualize your journey
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Analysis Loading State */}
            {isAnalyzing && (
              <div className="flex items-center justify-center gap-3 p-6 bg-gray-50 rounded-lg border border-gray-200 mb-6">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                <div className="text-sm text-gray-700">
                  Analyzing journey with Claude...
                </div>
              </div>
            )}

            {/* Generation Loading State */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                <div className="text-center">
                  <div className="text-sm font-medium text-indigo-900">
                    Generating custom page with Extended Thinking...
                  </div>
                  <div className="text-xs text-indigo-700 mt-1">
                    This may take 5-15 minutes for complex journeys. Please keep this window open.
                  </div>
                </div>
              </div>
            )}

            {/* Analysis View (Phase 2B) */}
            {analysis && !isAnalyzing && (
              <div className="mb-6">
                <PageAnalysisView
                  analysis={analysis}
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={(template) => setSelectedTemplate(template as TemplateType)}
                />
              </div>
            )}

            {/* Template options (Manual Selection) */}
            {!analysis && !isAnalyzing && (
              <>
                <div className="mb-2 text-sm text-gray-600 font-medium">
                  Choose Template ({TEMPLATE_OPTIONS.length} available)
                </div>
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto pr-2 border border-gray-200 rounded-lg p-3">
                  {TEMPLATE_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedTemplate === option.type;

                  return (
                    <button
                      key={option.type}
                      onClick={() => option.available && setSelectedTemplate(option.type)}
                      disabled={!option.available}
                      className={cn(
                        'w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all',
                        'text-left',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-gray-300',
                        !option.available && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          isSelected ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{option.name}</h3>
                          {!option.available && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>

                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="h-6 w-6 rounded-full bg-primary-500 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
                </div>
              </>
            )}

            {/* Design Style Selection */}
            {!isAnalyzing && selectedTemplate && (
              <div className="mb-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Palette className="h-5 w-5 text-indigo-600" />
                    Design Style (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Choose a visual style or let Claude decide automatically
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {STYLE_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isSelected = selectedStyle === option.style;

                    return (
                      <button
                        key={option.name}
                        onClick={() => setSelectedStyle(option.style)}
                        className={cn(
                          'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all text-center',
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        )}
                      >
                        {/* Color Preview */}
                        <div
                          className={cn(
                            'w-full h-12 rounded-md',
                            option.colorPreview
                          )}
                        />

                        {/* Style Name */}
                        <div className="w-full">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {option.name}
                          </div>
                          <div className="text-xs text-gray-600 line-clamp-2">
                            {option.description}
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={handleExportMarkdown}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export as Markdown
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={onClose} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleGenerate}
                  disabled={isGenerating || !TEMPLATE_OPTIONS.find(o => o.type === selectedTemplate)?.available}
                >
                  {isGenerating ? 'Generating (this may take 5-15 minutes)...' : 'Generate Page'}
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
