/**
 * JourneyList Component
 * Left sidebar showing all past journeys
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Search, X, ChevronLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Journey } from '@/types';

interface JourneyListProps {
  journeys: Journey[];
  currentJourneyId: string | null;
  onSelectJourney: (journey: Journey) => void;
  onNewJourney: () => void;
  onDeleteJourney: (journeyId: string) => void;
  onClose?: () => void;
  className?: string;
}

export function JourneyList({
  journeys,
  currentJourneyId,
  onSelectJourney,
  onNewJourney,
  onDeleteJourney,
  onClose,
  className,
}: JourneyListProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredJourneys = React.useMemo(() => {
    if (!searchQuery.trim()) return journeys;

    const query = searchQuery.toLowerCase();
    return journeys.filter((journey) =>
      journey.input.toLowerCase().includes(query)
    );
  }, [journeys, searchQuery]);

  return (
    <motion.div
      initial={{ x: -320 }}
      animate={{ x: 0 }}
      exit={{ x: -320 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'flex h-full w-80 flex-col border-r border-gray-200 bg-white',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Journey History</h2>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* New Journey Button */}
      <div className="p-4 border-b border-gray-200">
        <Button
          variant="primary"
          className="w-full"
          onClick={onNewJourney}
        >
          <Plus className="h-4 w-4" />
          New Journey
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search journeys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Journey List */}
      <div className="flex-1 overflow-y-auto">
        {filteredJourneys.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <div>
              <History className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-600">
                {searchQuery ? 'No journeys found' : 'No journeys yet'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {searchQuery ? 'Try a different search term' : 'Start your first exploration'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredJourneys.map((journey) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                isActive={journey.id === currentJourneyId}
                onClick={() => onSelectJourney(journey)}
                onDelete={() => onDeleteJourney(journey.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 p-4">
        <div className="text-xs text-gray-500">
          {journeys.length} {journeys.length === 1 ? 'journey' : 'journeys'} total
          {searchQuery && ` • ${filteredJourneys.length} filtered`}
        </div>
      </div>
    </motion.div>
  );
}

interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function JourneyCard({ journey, isActive, onClick, onDelete }: JourneyCardProps): React.ReactElement {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const statusColors = {
    running: 'bg-primary-500',
    paused: 'bg-accent-500',
    complete: 'bg-success',
    stopped: 'bg-gray-400',
  };

  const statusColor = statusColors[journey.status as keyof typeof statusColors] || 'bg-gray-400';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div
      className={cn(
        'group relative w-full rounded-lg transition-all',
        isActive
          ? 'bg-primary-50 shadow-sm ring-1 ring-primary-500/20'
          : 'hover:bg-gray-50'
      )}
    >
      <button
        onClick={onClick}
        className="w-full p-3 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={cn(
              'truncate text-sm font-medium',
              isActive ? 'text-primary-900' : 'text-gray-900'
            )}>
              {journey.input}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className={cn(
                'inline-block h-2 w-2 rounded-full',
                statusColor
              )} />
              <span className="text-xs text-gray-500 capitalize">
                {journey.status}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs text-gray-500">
                {journey.stages.length} stages
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400">
              {formatRelativeTime(journey.createdAt)}
            </span>
          </div>
        </div>
      </button>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className={cn(
          'absolute right-2 top-2 rounded p-1.5 transition-all',
          showDeleteConfirm
            ? 'bg-error text-white'
            : 'bg-white text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-error'
        )}
        title={showDeleteConfirm ? 'Click again to confirm deletion' : 'Delete journey'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {/* Confirmation Message */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-0 right-0 top-full mt-1 z-10 rounded-md bg-error px-3 py-2 text-xs text-white shadow-lg"
        >
          Click delete again to confirm
        </motion.div>
      )}
    </div>
  );
}
