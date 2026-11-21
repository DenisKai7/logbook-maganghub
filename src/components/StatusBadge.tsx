import React from 'react';
import { ItemStatus } from '../types';

interface Props {
  status: ItemStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'Disetujui':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Disetujui
        </span>
      );
    case 'Revisi':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-900 border border-amber-200/70 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Perlu Revisi
        </span>
      );
    case 'Menunggu':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-stone-100 text-stone-700 border border-stone-200 ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          Menunggu Review
        </span>
      );
  }
};
