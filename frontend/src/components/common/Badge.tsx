import React from 'react';
import { Shield, ArrowUpRight, ArrowDownRight, Minus, Flame } from 'lucide-react';
import { IssuePriority, IssueStatus } from '../../types/issue';
import { ProjectRole } from '../../types/project';

interface StatusBadgeProps {
  variant: 'status';
  status: IssueStatus;
  size?: 'sm' | 'md';
}

interface PriorityBadgeProps {
  variant: 'priority';
  priority: IssuePriority;
  size?: 'sm' | 'md';
}

interface RoleBadgeProps {
  variant: 'role';
  role: ProjectRole;
  size?: 'sm' | 'md';
}

interface KeyBadgeProps {
  variant: 'key';
  label: string;
  size?: 'sm' | 'md';
}

export type BadgeProps = StatusBadgeProps | PriorityBadgeProps | RoleBadgeProps | KeyBadgeProps;

export const Badge: React.FC<BadgeProps> = (props) => {
  if (props.variant === 'key') {
    return (
      <span className="badge-code font-mono" style={{ fontSize: props.size === 'sm' ? '0.72rem' : '0.8rem' }}>
        {props.label}
      </span>
    );
  }

  if (props.variant === 'role') {
    const isOwner = props.role === 'OWNER';
    return (
      <span className={`badge ${isOwner ? 'badge-primary' : 'badge-subtle'}`}>
        {isOwner && <Shield size={12} />}
        {props.role}
      </span>
    );
  }

  if (props.variant === 'status') {
    const statusClass = `badge-${props.status.toLowerCase().replace('_', '-')}`;
    const label = props.status.replace('_', ' ');
    return (
      <span className={`badge ${statusClass}`}>
        <span className="status-dot"></span>
        {label}
      </span>
    );
  }

  if (props.variant === 'priority') {
    const p = props.priority;
    const prioClass = `badge-${p.toLowerCase()}`;
    return (
      <span className={`badge ${prioClass}`}>
        {p === 'URGENT' && <Flame size={12} />}
        {p === 'HIGH' && <ArrowUpRight size={12} />}
        {p === 'MEDIUM' && <Minus size={12} />}
        {p === 'LOW' && <ArrowDownRight size={12} />}
        {p}
      </span>
    );
  }

  return null;
};
