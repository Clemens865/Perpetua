/**
 * Stream Component
 * Infinite scroll container for journey stages
 */

import * as React from 'react';
import { StageCard } from './StageCard';
import { Loader } from '../ui/Loader';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import type { Journey, Artifact } from '@/types';

interface StreamProps {
  journey: Journey | null;
  onArtifactClick?: (artifact: Artifact) => void;
  className?: string;
}

export function Stream({ journey, onArtifactClick, className }: StreamProps): React.ReactElement {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = React.useState(true);
  const activeStage = useAppStore((state) => state.activeStage);

  // Auto-scroll to bottom when new stages are added
  React.useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [journey?.stages.length, autoScroll]);

  // Handle manual scrolling
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100;
    setAutoScroll(isAtBottom);
  }, []);

  if (!journey) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">No active journey</h2>
          <p className="mt-2 text-gray-600">Start a new journey to begin exploring</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative h-full', className)}>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-6 py-8 md:px-16"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Journey header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-900">{journey.input}</h1>
            <p className="mt-2 text-sm text-gray-600">
              {journey.stages.length} stage{journey.stages.length !== 1 ? 's' : ''} completed
            </p>
          </div>

          {/* Stages */}
          {journey.stages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              isActive={false}
              onArtifactClick={onArtifactClick}
            />
          ))}

          {/* Active stage (real-time streaming) */}
          {activeStage && activeStage.journeyId === journey.id && (
            <StageCard
              key={`active-${activeStage.id}`}
              stage={activeStage}
              isActive={true}
              onArtifactClick={onArtifactClick}
            />
          )}

          {/* Loading indicator */}
          {journey.status === 'running' && !activeStage && (
            <div className="flex items-center justify-center py-8">
              <Loader size="md" />
            </div>
          )}

          {/* Journey complete message */}
          {journey.status === 'complete' && (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900">Journey Complete</h3>
              <p className="mt-2 text-sm text-gray-600">
                Explored {journey.stages.length} stages
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {!autoScroll && (
        <button
          onClick={() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              setAutoScroll(true);
            }
          }}
          className={cn(
            'absolute bottom-6 right-6 rounded-full bg-primary-500 p-3 text-white shadow-lg',
            'transition-transform hover:scale-110 active:scale-95'
          )}
          aria-label="Scroll to bottom"
        >
          ↓
        </button>
      )}
    </div>
  );
}
