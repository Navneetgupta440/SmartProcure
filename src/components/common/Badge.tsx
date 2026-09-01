import React from 'react';
import { UserRole } from '../../types';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', children, className = '', size = 'md' }) => {
  const variantStyles = {
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
    md: 'px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'APPROVED':
    case 'DELIVERED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'SUPPLIER_ACCEPTED':
      return <Badge variant="success">{status.replace(/_/g, ' ')}</Badge>;

    case 'PENDING_APPROVAL':
    case 'SUBMITTED':
    case 'PROCESSING':
    case 'UNDER_REVIEW':
      return <Badge variant="warning">{status.replace(/_/g, ' ')}</Badge>;

    case 'REJECTED':
    case 'CANCELLED':
    case 'FAILED':
    case 'SUPPLIER_REJECTED':
      return <Badge variant="danger">{status.replace(/_/g, ' ')}</Badge>;

    case 'IN_TRANSIT':
    case 'OUT_FOR_DELIVERY':
    case 'PICKED_UP':
    case 'DISPATCHED':
      return <Badge variant="info">{status.replace(/_/g, ' ')}</Badge>;

    case 'CONVERTED_TO_PO':
    case 'SENT_TO_SUPPLIER':
      return <Badge variant="purple">{status.replace(/_/g, ' ')}</Badge>;

    case 'DRAFT':
    default:
      return <Badge variant="neutral">{status.replace(/_/g, ' ')}</Badge>;
  }
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  switch (role) {
    case UserRole.ADMIN:
      return <Badge variant="purple">ADMINISTRATOR</Badge>;
    case UserRole.PROCUREMENT_MANAGER:
      return <Badge variant="primary">PROCUREMENT MGR</Badge>;
    case UserRole.MANAGER:
      return <Badge variant="info">DEPT MANAGER</Badge>;
    case UserRole.EMPLOYEE:
      return <Badge variant="neutral">EMPLOYEE</Badge>;
    case UserRole.CUSTOMER:
      return <Badge variant="success">CUSTOMER</Badge>;
    case UserRole.SUPPLIER:
      return <Badge variant="warning">SUPPLIER VENDOR</Badge>;
    case UserRole.DELIVERY_AGENT:
      return <Badge variant="info">DELIVERY AGENT</Badge>;
    default:
      return <Badge variant="neutral">{role}</Badge>;
  }
};

