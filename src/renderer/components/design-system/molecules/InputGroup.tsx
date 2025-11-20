import React from 'react';
import { Input, InputProps } from '../atoms/Input';
import { Button, ButtonProps } from '../atoms/Button';
import { cn } from '../../../utils/cn';

export interface InputGroupProps extends InputProps {
  buttonProps?: ButtonProps;
  buttonText?: string;
  onButtonClick?: () => void;
}

export const InputGroup: React.FC<InputGroupProps> = ({
  buttonProps,
  buttonText,
  onButtonClick,
  className,
  ...inputProps
}) => {
  return (
    <div className={cn('flex gap-2', className)}>
      <Input {...inputProps} className="flex-1" />
      {buttonText && (
        <Button onClick={onButtonClick} {...buttonProps}>
          {buttonText}
        </Button>
      )}
    </div>
  );
};

InputGroup.displayName = 'InputGroup';
