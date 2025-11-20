/**
 * ControlPanel Component
 * Sidebar for journey management and controls
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Square, Plus, Settings, X, FileText, Globe, Presentation, Clock, Network, Layout, ExternalLink, Download, FileDown, Trash2, Eye, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn, formatRelativeTime, formatDuration } from '@/lib/utils';
import { STAGE_META } from '@/lib/constants';
import type { Journey, Page } from '@/types';
import { ipcClient } from '@/services/ipc/IPCClient';

interface ControlPanelProps {
  journey: Journey | null;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onNewJourney: () => void;
  onGeneratePage?: () => void;
  onSettings?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ControlPanel({
  journey,
  onPause,
  onResume,
  onStop,
  onNewJourney,
  onGeneratePage,
  onSettings,
  onClose,
  className,
}: ControlPanelProps): React.ReactElement {
  const [generatedPages, setGeneratedPages] = React.useState<Page[]>([]);
  const [loadingPages, setLoadingPages] = React.useState(false);

  // Fetch generated pages for this journey
  React.useEffect(() => {
    if (!journey || !ipcClient.isAvailable()) return;

    const fetchPages = async () => {
      try {
        setLoadingPages(true);
        const pages = await ipcClient.listPages(journey.id);
        setGeneratedPages(pages);
      } catch (error) {
        console.error('Failed to fetch pages:', error);
      } finally {
        setLoadingPages(false);
      }
    };

    fetchPages();
  }, [journey?.id]);

  const handleOpenPage = React.useCallback((page: Page) => {
    // Open page in browser
    const blob = new Blob([page.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    console.log(`🚀 Opened ${page.templateName} page`);
  }, []);

  const handleDownloadHTML = React.useCallback(async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the page

    if (!ipcClient.isAvailable()) {
      alert('HTML export is only available in the Electron app');
      return;
    }

    try {
      const defaultFilename = `${page.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
      const result = await ipcClient.exportPageToHTML(page.content, defaultFilename);

      if (result.success && result.filePath) {
        console.log(`✅ HTML exported: ${result.filePath}`);
        // Could show a success toast here
      } else if (result.canceled) {
        console.log('HTML export canceled by user');
      }
    } catch (error) {
      console.error('Failed to export HTML:', error);
      alert(`Failed to export HTML: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const handleExportPDF = React.useCallback(async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the page

    if (!ipcClient.isAvailable()) {
      alert('PDF export is only available in the Electron app');
      return;
    }

    try {
      const defaultFilename = `${page.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      const result = await ipcClient.exportPageToPDF(page.content, defaultFilename);

      if (result.success && result.filePath) {
        console.log(`✅ PDF exported: ${result.filePath}`);
        // Could show a success toast here
      } else if (result.canceled) {
        console.log('PDF export canceled by user');
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const handleDeletePage = React.useCallback(async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the page

    if (!ipcClient.isAvailable()) {
      return;
    }

    const confirmed = confirm(`Are you sure you want to delete "${page.title}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      await ipcClient.deletePage(page.id);
      console.log(`🗑️ Deleted page: ${page.title}`);

      // Refresh the pages list
      setGeneratedPages(prev => prev.filter(p => p.id !== page.id));
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert(`Failed to delete page: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, []);

  const getTemplateIcon = (templateName?: string) => {
    switch (templateName) {
      case 'website':
        return Globe;
      case 'presentation':
        return Presentation;
      case 'timeline':
        return Clock;
      case 'mindmap':
        return Network;
      case 'wiki':
        return Layout;
      case 'literature':
        return BookOpen;
      case 'report':
      default:
        return FileText;
    }
  };

  const stats = React.useMemo(() => {
    if (!journey) return null;

    const stageTypeCounts = journey.stages.reduce(
      (acc, stage) => {
        acc[stage.type] = (acc[stage.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const duration = journey.updatedAt - journey.createdAt;

    return {
      totalStages: journey.stages.length,
      stageTypeCounts,
      duration,
    };
  }, [journey]);

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex h-full w-80 flex-col border-l border-gray-200 bg-white',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">Control Panel</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close panel">
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Journey controls */}
        <Card>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Journey Controls</h3>

            <div className="grid grid-cols-2 gap-2">
              {journey?.status === 'running' ? (
                <>
                  <Button variant="secondary" size="sm" onClick={onPause} className="w-full">
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button variant="danger" size="sm" onClick={onStop} className="w-full">
                    <Square className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              ) : (
                <>
                  {journey?.status === 'paused' && (
                    <Button variant="primary" size="sm" onClick={onResume} className="w-full col-span-2">
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                  )}
                  <Button variant="primary" size="sm" onClick={onNewJourney} className="w-full col-span-2">
                    <Plus className="h-4 w-4" />
                    New Journey
                  </Button>
                  {journey && (journey.status === 'complete' || journey.status === 'stopped') && onGeneratePage && (
                    <Button variant="secondary" size="sm" onClick={onGeneratePage} className="w-full col-span-2">
                      <FileText className="h-4 w-4" />
                      Generate Page
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Generated Pages */}
        {journey && generatedPages.length > 0 && (
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Generated Pages ({generatedPages.length})
              </h3>

              <div className="space-y-2">
                {generatedPages.map((page) => {
                  const TemplateIcon = getTemplateIcon(page.templateName);
                  return (
                    <div
                      key={page.id}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      {/* Main page info - clickable */}
                      <button
                        onClick={() => handleOpenPage(page)}
                        className="flex-1 flex items-center gap-3 min-w-0 text-left"
                      >
                        <div className="flex-shrink-0 p-2 bg-primary-50 rounded-lg group-hover:bg-primary-100 transition-colors">
                          <TemplateIcon className="h-4 w-4 text-primary-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 capitalize truncate">
                              {page.templateName || 'Page'}
                            </span>
                            <Eye className="h-3 w-3 text-gray-400 group-hover:text-primary-500 transition-colors" />
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {formatRelativeTime(page.createdAt)}
                          </p>
                        </div>
                      </button>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleDownloadHTML(page, e)}
                          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                          title="Download HTML"
                        >
                          <Download className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => handleExportPDF(page, e)}
                          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                          title="Export to PDF"
                        >
                          <FileDown className="h-3.5 w-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePage(page, e)}
                          className="p-1.5 rounded hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Journey stats */}
        {journey && stats && (
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Journey Stats</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status</span>
                  <span
                    className={cn(
                      'font-medium capitalize',
                      journey.status === 'running' && 'text-primary-500',
                      journey.status === 'paused' && 'text-accent-500',
                      journey.status === 'complete' && 'text-success',
                      journey.status === 'stopped' && 'text-gray-500'
                    )}
                  >
                    {journey.status}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Stages</span>
                  <span className="font-medium text-gray-900">{stats.totalStages}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium text-gray-900">{formatDuration(stats.duration)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Started</span>
                  <span className="font-medium text-gray-900">{formatRelativeTime(journey.createdAt)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Stage distribution */}
        {journey && stats && Object.keys(stats.stageTypeCounts).length > 0 && (
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Stage Distribution</h3>

              <div className="space-y-2">
                {Object.entries(stats.stageTypeCounts).map(([type, count]) => {
                  const metadata = STAGE_META[type as keyof typeof STAGE_META];
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: metadata.color }}
                        />
                        <span className="capitalize text-gray-700">{type}</span>
                      </div>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Settings */}
        {journey && (
          <Card>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Settings</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Auto Continue</span>
                  <span className={cn(
                    'font-medium',
                    journey.settings.autoContinue ? 'text-success' : 'text-gray-500'
                  )}>
                    {journey.settings.autoContinue ? 'On' : 'Off'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Max Stages</span>
                  <span className="font-medium text-gray-900">{journey.settings.maxStages}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Extended Thinking</span>
                  <span className={cn(
                    'font-medium',
                    journey.settings.extendedThinking ? 'text-success' : 'text-gray-500'
                  )}>
                    {journey.settings.extendedThinking ? 'On' : 'Off'}
                  </span>
                </div>
              </div>

              {onSettings && (
                <Button variant="ghost" size="sm" onClick={onSettings} className="w-full">
                  <Settings className="h-4 w-4" />
                  Configure
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
