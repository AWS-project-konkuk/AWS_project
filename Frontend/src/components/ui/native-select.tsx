import type { ComponentProps } from 'react';
import { cn, controlFrame, inputFrame } from './styles';

export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      data-ui="native-select"
      className={cn(controlFrame, inputFrame, className)}
      {...props}
    />
  );
}
