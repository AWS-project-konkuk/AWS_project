import type { ComponentProps } from 'react';
import { cn, controlFrame, inputFrame } from './styles';

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlFrame, inputFrame, 'resize-y', className)} {...props} />;
}
