/**
 * Loader Component
 * Animated loading indicator
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Loader({ size = 'md', className }: LoaderProps): React.ReactElement {
  return (
    <div
      className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary-500', sizeClasses[size], className)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="rounded-lg bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center gap-4">
          <Loader size="lg" />
          {message && <p className="text-sm text-gray-700">{message}</p>}
        </div>
      </div>
    </div>
  );
}
