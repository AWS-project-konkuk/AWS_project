import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const controlFrame =
  'min-w-0 rounded-(--radius-input) border border-solid border-ui-rule-2 bg-ui-paper text-ui-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-focus)';

export const inputFrame = 'min-h-[34px] px-2 py-1 disabled:cursor-not-allowed disabled:opacity-55';
