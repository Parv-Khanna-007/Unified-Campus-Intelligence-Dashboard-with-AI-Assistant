'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <label className={cn('relative inline-flex items-center cursor-pointer select-none', className)}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only peer"
          ref={ref}
          {...props}
        />
        <div className="w-9 h-5 bg-secondary rounded-full border border-border transition-colors peer-focus:outline-none peer-checked:bg-primary peer-checked:border-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
