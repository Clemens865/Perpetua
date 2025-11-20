import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../../utils/cn';

export interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  hoverable?: boolean;
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  elevated: 'bg-white dark:bg-gray-800 shadow-md',
  outlined: 'border-2 border-gray-300 dark:border-gray-600',
};

const paddingStyles = {
  none: '',
  small: 'p-4',
  medium: 'p-6',
  large: 'p-8',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'medium',
      hoverable = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { borderColor: 'rgb(46, 150, 255)' } : undefined}
        transition={{ duration: 0.2 }}
        className={cn(
          // Base styles
          'rounded-lg transition-colors duration-200',

          // Variant
          variantStyles[variant],

          // Padding
          paddingStyles[padding],

          // Hoverable
          hoverable && 'cursor-pointer',

          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
