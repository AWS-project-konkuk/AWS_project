import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { Button } from './button';
import { cn } from './styles';

export function Pagination({ className, ...props }: ComponentProps<'nav'>) {
  return <nav data-slot="pagination" className={cn('flex justify-center', className)} {...props} />;
}

export function PaginationContent({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn(
        'm-0 flex list-none flex-wrap items-center justify-center gap-1 p-0',
        className,
      )}
      {...props}
    />
  );
}

export function PaginationItem(props: ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = ComponentProps<typeof Link> & {
  isActive?: boolean;
  disabled?: boolean;
};

export function PaginationLink({
  isActive,
  disabled,
  className,
  children,
  ...props
}: PaginationLinkProps) {
  const styles = cn(
    'h-9 min-w-9 border-transparent bg-transparent px-2 text-sm tabular-nums no-underline',
    isActive && 'border-ui-rule-2 bg-ui-accent-wash font-bold text-ui-accent',
    className,
  );

  if (disabled) {
    return (
      <Button
        data-slot="pagination-link"
        className={styles}
        aria-label={props['aria-label']}
        disabled
      >
        {children}
      </Button>
    );
  }

  return (
    <Button asChild data-slot="pagination-link" className={styles}>
      <Link aria-current={isActive ? 'page' : undefined} {...props}>
        {children}
      </Link>
    </Button>
  );
}
