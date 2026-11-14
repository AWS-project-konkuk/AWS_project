import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, controlFrame } from './styles';

const buttonVariants = cva(
  [
    controlFrame,
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-55 [&>svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default:
          'border-ui-accent bg-ui-accent font-bold text-ui-accent-ink enabled:hover:bg-ui-accent-deep',
        outline: 'enabled:hover:bg-ui-paper-3',
        destructive: 'text-ui-error enabled:hover:bg-ui-paper-3',
      },
      size: {
        default: 'min-h-[34px] px-2.5 py-[5px]',
        icon: 'size-[34px] flex-[0_0_34px] p-0',
        small: 'min-h-[30px] px-[5px] py-[3px] text-xs',
      },
    },
    defaultVariants: { variant: 'outline', size: 'default' },
  },
);

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  variant,
  size,
  asChild,
  type = 'button',
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      data-ui="button"
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
