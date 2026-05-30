'use client';

import { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-500/10 text-success-600 border border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-600 border border-warning-500/20',
  danger: 'bg-danger-500/10 text-danger-600 border border-danger-500/20',
  info: 'bg-primary-500/10 text-primary-600 border border-primary-500/20',
  default: 'bg-surface-100 text-surface-700 border border-surface-200',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
  icon,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center justify-center font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
    </span>
  );
}
