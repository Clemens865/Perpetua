import React from 'react';
import { Button, ButtonProps } from '../atoms/Button';
import { cn } from '../../../utils/cn';

export interface IconButtonProps extends Omit<ButtonProps, 'icon' | 'iconPosition'> {
  icon: React.ReactNode;
  label: string; // For accessibility
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, label, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn('!px-3 !py-3', className)}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
