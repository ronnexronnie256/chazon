import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-100 text-green-700',
        warning: 'border-transparent bg-yellow-100 text-yellow-700',
        danger: 'border-transparent bg-red-100 text-red-700',
        info: 'border-transparent bg-blue-100 text-blue-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function CountBadge({
  count,
  max = 99,
  variant = 'danger',
  className = '',
}: CountBadgeProps) {
  if (count <= 0) return null;

  const variants = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  };

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5',
        'text-white text-xs font-bold rounded-full',
        variants[variant],
        className
      )}
    >
      {displayCount}
    </span>
  );
}

interface StatusBadgeProps {
  status:
    | 'pending'
    | 'active'
    | 'completed'
    | 'cancelled'
    | 'disputed'
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'DONE'
    | 'ASSIGNED';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig: Record<
    string,
    {
      variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
      label: string;
    }
  > = {
    pending: { variant: 'warning', label: 'Pending' },
    OPEN: { variant: 'warning', label: 'Open' },
    active: { variant: 'info', label: 'Active' },
    IN_PROGRESS: { variant: 'info', label: 'In Progress' },
    ASSIGNED: { variant: 'info', label: 'Assigned' },
    completed: { variant: 'success', label: 'Completed' },
    DONE: { variant: 'success', label: 'Done' },
    cancelled: { variant: 'danger', label: 'Cancelled' },
    disputed: { variant: 'danger', label: 'Disputed' },
  };

  const config = statusConfig[status] || {
    variant: 'default' as const,
    label: status,
  };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export { Badge, badgeVariants };
