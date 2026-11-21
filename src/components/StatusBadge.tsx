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
          className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          } bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-[#1b3424] dark:text-[#4ec9b0] dark:border-[#2e6040]`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-[#4ec9b0] animate-pulse" />
          Disetujui
        </span>
      );
    case 'Revisi':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          } bg-amber-50 text-amber-900 border border-amber-200/80 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#cca700]" />
          Perlu Revisi
        </span>
      );
    case 'Menunggu':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${
            isSm ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          } bg-blue-50 text-[#0b4e8c] border border-blue-200/70 dark:bg-[#1e2733] dark:text-[#9cdcfe] dark:border-[#264f78]`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#0b4e8c] dark:bg-[#3794ff]" />
          Menunggu Review
        </span>
      );
  }
};
