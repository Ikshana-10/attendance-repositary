import React from 'react';
import { AttendanceStatus } from '../../types';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface AttendanceBadgeProps {
  status: AttendanceStatus | 'Holiday' | 'Not Marked' | string;
  size?: 'sm' | 'md';
}

export const AttendanceBadge: React.FC<AttendanceBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const sizeClass = isSm ? 'text-xs px-2 py-0.5 gap-1' : 'text-xs px-2.5 py-1 gap-1.5 font-medium';
  const iconSize = isSm ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'Present':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold ${sizeClass}`}>
          <CheckCircle2 className={iconSize} />
          Present
        </span>
      );
    case 'Absent':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 font-semibold ${sizeClass}`}>
          <XCircle className={iconSize} />
          Absent
        </span>
      );
    case 'Late':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold ${sizeClass}`}>
          <Clock className={iconSize} />
          Late
        </span>
      );
    case 'Holiday':
      return (
        <span className={`inline-flex items-center rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 font-semibold ${sizeClass}`}>
          Holiday
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 ${sizeClass}`}>
          {status || 'Not Marked'}
        </span>
      );
  }
};
