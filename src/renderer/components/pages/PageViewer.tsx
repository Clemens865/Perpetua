/**
 * Page Viewer Component
 * Displays generated HTML pages in an iframe
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';
import { ipcClient } from '@/services/ipc/IPCClient';
import type { Page } from '@/types';

interface PageViewerProps {
  page: Page;
  onClose: () => void;
  className?: string;
}

export function PageViewer({ page, onClose, className }: PageViewerProps): React.ReactElement {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Write HTML content to iframe
  React.useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(page.content);
        doc.close();
      }
    }
  }, [page.content]);

  const handleDownload = React.useCallback(async () => {
    console.log('🔵 Export HTML button clicked');

    if (!ipcClient.isAvailable()) {
      console.error('❌ HTML export not available (not in Electron)');
      alert('HTML export is only available in the Electron app');
      return;
    }

    console.log('🔵 Starting HTML export...');
    setIsExporting(true);
    try {
      const defaultFilename = `${page.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
      console.log('🔵 Default filename:', defaultFilename);

      const result = await ipcClient.exportPageToHTML(page.content, defaultFilename);
      console.log('🔵 Export result:', result);

      if (result.success && result.filePath) {
        console.log(`✅ HTML exported successfully: ${result.filePath}`);
        alert(`HTML saved to:\n${result.filePath}`);
      } else if (result.canceled) {
        console.log('⚠️ HTML export canceled by user');
      }
    } catch (error) {
      console.error('❌ Failed to export HTML:', error);
      alert(`Failed to export HTML: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  }, [page.content, page.title]);

  const handleExportPDF = React.useCallback(async () => {
    console.log('🔵 Export PDF button clicked');
    console.log('🔵 IPC available?', ipcClient.isAvailable());

    if (!ipcClient.isAvailable()) {
      console.error('❌ PDF export not available (not in Electron)');
      alert('PDF export is only available in the Electron app');
      return;
    }

    console.log('🔵 Starting PDF export...');
    setIsExporting(true);
    try {
      const defaultFilename = `${page.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      console.log('🔵 Default filename:', defaultFilename);
      console.log('🔵 Content length:', page.content.length, 'chars');

      const result = await ipcClient.exportPageToPDF(page.content, defaultFilename);
      console.log('🔵 Export result:', result);

      if (result.success && result.filePath) {
        console.log(`✅ PDF exported successfully: ${result.filePath}`);
        alert(`PDF saved to:\n${result.filePath}`);
      } else if (result.canceled) {
        console.log('⚠️ PDF export canceled by user');
      }
    } catch (error) {
      console.error('❌ Failed to export PDF:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      console.log('🔵 Setting isExporting to false');
      setIsExporting(false);
    }
  }, [page.content, page.title]);

  const handleOpenExternal = React.useCallback(() => {
    const blob = new Blob([page.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    // Note: URL will be cleaned up when the window is closed
  }, [page.content]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('fixed inset-0 z-50 bg-white', className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{page.title}</h2>
          <p className="text-sm text-gray-600">
            {page.type === 'template' && page.templateName && (
              <span className="capitalize">{page.templateName} Template</span>
            )}
            {' • '}
            Generated {new Date(page.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={isExporting}
            title="Download HTML"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Download'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPDF}
            disabled={isExporting}
            title="Export to PDF"
          >
            <FileText className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            title="Open in new window"
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>

          <Button variant="ghost" size="icon" onClick={onClose} title="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content iframe */}
      <iframe
        ref={iframeRef}
        title={page.title}
        className="h-[calc(100%-73px)] w-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </motion.div>
  );
}
