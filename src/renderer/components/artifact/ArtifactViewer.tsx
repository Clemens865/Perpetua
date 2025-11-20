/**
 * ArtifactViewer Component
 * Modal for viewing artifact details
 */

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Copy, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { copyToClipboard, downloadFile } from '@/lib/utils';
import type { Artifact } from '@/types';

interface ArtifactViewerProps {
  artifact: Artifact;
  onClose: () => void;
}

export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(artifact.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const extension = artifact.type === 'code' ? artifact.metadata.language || 'txt' : 'txt';
    const filename = `${artifact.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    downloadFile(artifact.content, filename, 'text/plain');
  };

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed left-1/2 top-1/2 z-50 h-[80vh] w-[90vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div className="flex-1">
                <Dialog.Title className="text-xl font-semibold text-gray-900">
                  {artifact.title}
                </Dialog.Title>
                {artifact.metadata.language && (
                  <p className="mt-1 text-sm text-gray-600">
                    Language: {artifact.metadata.language}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                >
                  <Copy className="h-5 w-5" />
                </Button>

                <Button variant="ghost" size="icon" onClick={handleDownload} title="Download file">
                  <Download className="h-5 w-5" />
                </Button>

                <Dialog.Close asChild>
                  <Button variant="ghost" size="icon" aria-label="Close">
                    <X className="h-5 w-5" />
                  </Button>
                </Dialog.Close>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="rounded-lg bg-gray-50 p-4 text-sm">
                <code className="font-mono text-gray-900">{artifact.content}</code>
              </pre>
            </div>

            {/* Footer */}
            {copied && (
              <div className="border-t border-gray-200 p-4">
                <p className="text-center text-sm text-success">Copied to clipboard!</p>
              </div>
            )}
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
