/**
 * StageCard Component
 * Displays a single stage in the journey stream
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Target, Lightbulb, AlertCircle, HelpCircle, Globe, Sparkles, Hammer } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { cn, formatRelativeTime } from '@/lib/utils';
import { STAGE_META } from '@/lib/constants';
import type { Stage, Artifact } from '@/types';

const stageIcons = {
  discovering: Search,
  chasing: Target,
  solving: Lightbulb,
  challenging: AlertCircle,
  questioning: HelpCircle,
  searching: Globe,
  imagining: Sparkles,
  building: Hammer,
};

interface StageCardProps {
  stage: Stage;
  isActive?: boolean;
  onArtifactClick?: (artifact: Artifact) => void;
}

export function StageCard({ stage, isActive = false, onArtifactClick }: StageCardProps): React.ReactElement {
  const Icon = stageIcons[stage.type];
  const metadata = STAGE_META[stage.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-l-4 transition-all duration-200',
          isActive && 'border-l-primary-500 shadow-md',
          !isActive && 'border-l-gray-300'
        )}
        style={{
          borderLeftColor: isActive ? metadata.color : undefined,
        }}
      >
        {/* Active indicator pulse */}
        {isActive && (
          <motion.div
            className="absolute left-0 top-0 h-full w-1 bg-current"
            style={{ color: metadata.color }}
            animate={{ opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${metadata.color}20`,
                  color: metadata.color,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-wide text-gray-900">
                  {stage.type}
                </h3>
                <p className="text-xs text-gray-500">{metadata.description}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">{formatRelativeTime(stage.createdAt)}</span>
              {isActive && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary-500" />
                  <span className="text-xs font-medium text-primary-500">Running</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Thinking process */}
          {stage.thinking && (
            <div className="rounded-lg bg-accent-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-accent-900">Extended Thinking</h4>
              <p className="whitespace-pre-wrap text-sm text-accent-800">{stage.thinking}</p>
            </div>
          )}

          {/* Main result */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-800">{stage.result}</p>
          </div>

          {/* Artifacts */}
          {stage.artifacts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-900">Artifacts</h4>
              <div className="grid gap-2">
                {stage.artifacts.map((artifact) => (
                  <ArtifactPreview
                    key={artifact.id}
                    artifact={artifact}
                    onClick={() => onArtifactClick?.(artifact)}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ArtifactPreviewProps {
  artifact: Artifact;
  onClick?: () => void;
}

function ArtifactPreview({ artifact, onClick }: ArtifactPreviewProps): React.ReactElement {
  const getArtifactIcon = () => {
    switch (artifact.type) {
      case 'code':
        return '💻';
      case 'document':
        return '📄';
      case 'visualization':
        return '📊';
      case 'mindmap':
        return '🗺️';
      default:
        return '📎';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3',
        'transition-all duration-150 hover:border-primary-500 hover:bg-white hover:shadow-sm',
        'text-left'
      )}
    >
      <span className="text-2xl">{getArtifactIcon()}</span>
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium text-gray-900">{artifact.title}</p>
        {artifact.metadata.language && (
          <p className="text-xs text-gray-500">{artifact.metadata.language}</p>
        )}
      </div>
      <span className="text-gray-400">→</span>
    </button>
  );
}
