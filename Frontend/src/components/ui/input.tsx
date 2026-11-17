import type { ComponentProps } from 'react';
import { cn, controlFrame, inputFrame } from './styles';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input data-ui="input" className={cn(controlFrame, inputFrame, className)} {...props} />;
}
