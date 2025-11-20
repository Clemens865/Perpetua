import React from 'react';
import { cn } from '../../../utils/cn';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  success: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-900 dark:text-secondary-200',
  warning: 'bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-200',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  info: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200',
};

const dotVariantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-500',
  success: 'bg-secondary-500',
  warning: 'bg-accent-500',
  error: 'bg-red-500',
  info: 'bg-primary-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  small: 'px-2 py-0.5 text-xs',
  medium: 'px-2.5 py-1 text-sm',
  large: 'px-3 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'medium',
  dot = false,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        // Base styles
        'inline-flex items-center gap-1.5',
        'font-medium rounded-full',

        // Variant
        variantStyles[variant],

        // Size
        sizeStyles[size],

        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            dotVariantStyles[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};

Badge.displayName = 'Badge';
