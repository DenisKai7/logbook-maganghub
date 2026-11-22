import React, { useState } from 'react';
import {
  KanbanItem,
  User,
  MenteeSummary,
  KANBAN_STATUS_OPTIONS,
  KANBAN_PRIORITY_OPTIONS,
  KANBAN_REVIEW_OPTIONS,
  getKanbanNo,
  getKanbanTask,
  getKanbanUser,
  getKanbanPriority,
  getKanbanStatus,
  getKanbanDueDate,
  getKanbanReview,
  getKanbanEvidence,
  KanbanStatus,
  KanbanPriority,
  KanbanReview
} from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Layers,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Filter,
  UserCheck
} from 'lucide-react';

interface Props {
  items: KanbanItem[];
  users?: Array<User | MenteeSummary>;
  currentUser: User;
  editable?: boolean;
  onEdit?: (item: KanbanItem) => void;
  onDelete?: (item: KanbanItem) => void;
  deletingId?: string | null;
  onStatusChange?: (item: KanbanItem, newStatus: KanbanStatus) => void;
  // Mentor Review mode
  mentorMode?: boolean;
  onReview?: (item: KanbanItem) => void;
  onAddNew?: () => void;
  sheetTabs?: string[];
  activeSheetTab?: string;
  onSelectSheetTab?: (tab: string) => void;
  emptyMessage?: string;
}

const STATUS_CONFIG: Record<
  KanbanStatus,
  { label: string; headerBg: string; border: string; accentColor: string; badgeBg: string }
> = {
  'To Do': {
    label: 'To Do',
    headerBg: 'bg-slate-100 dark:bg-[#1e1e1e]',
    border: 'border-slate-300 dark:border-[#383838]',
    accentColor: '#64748b',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-[#2d2d2d] dark:text-[#cccccc]'
  },
  'In Progress': {
    label: 'In Progress',
    headerBg: 'bg-blue-50/70 dark:bg-[#162a3f]',
    border: 'border-blue-200 dark:border-[#264f78]',
    accentColor: '#0b4e8c',
    badgeBg: 'bg-blue-100 text-[#0b4e8c] dark:bg-[#1e2733] dark:text-[#9cdcfe]'
  },
  'In Review': {
    label: 'In Review',
    headerBg: 'bg-amber-50/70 dark:bg-[#342c15]',
    border: 'border-amber-200 dark:border-[#5a4d22]',
    accentColor: '#f59e0b',
    badgeBg: 'bg-amber-100 text-amber-900 dark:bg-[#342c15] dark:text-[#dcdcaa]'
  },
  'Done': {
    label: 'Done',
    headerBg: 'bg-emerald-50/70 dark:bg-[#173022]',
    border: 'border-emerald-200 dark:border-[#2e6040]',
    accentColor: '#10b981',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-[#1b3424] dark:text-[#4ec9b0]'
  },
  'Blocked': {
    label: 'Blocked',
    headerBg: 'bg-rose-50/70 dark:bg-[#331c1e]',
    border: 'border-rose-200 dark:border-[#5c2427]',
    accentColor: '#f43f5e',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-[#341b1d] dark:text-[#f48771]'
  }
};

const PRIORITY_BADGE_STYLE: Record<KanbanPriority, string> = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#252526] dark:text-[#858585] dark:border-[#383838]',
  Medium: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-[#162738] dark:text-[#9cdcfe] dark:border-[#264f78]',
  High: 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]',
  Urgent: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-[#341b1d] dark:text-[#f48771] dark:border-[#5c2427]'
};

export const KanbanBoard: React.FC<Props> = ({
  items,
  users,
  currentUser,
  editable = false,
  onEdit,
  onDelete,
  deletingId,
  onStatusChange,
  mentorMode = false,
  onReview,
  onAddNew,
  sheetTabs,
  activeSheetTab,
  onSelectSheetTab,
  emptyMessage = 'Belum ada task di lembar Kanban.'
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  return (
    <div className="space-y-4">
      {/* View Switcher & Action Bar */}
      <div className="bg-white dark:bg-[#252526] p-4 rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-slate-100 dark:bg-[#1e1e1e] rounded-xl border border-slate-200 dark:border-[#383838] flex items-center">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-[#252526] text-[#0b4e8c] dark:text-[#3794ff] shadow-xs'
                  : 'text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#252526] text-[#0b4e8c] dark:text-[#3794ff] shadow-xs'
                  : 'text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Sheet Table</span>
            </button>
          </div>

          <span className="text-xs text-slate-400 dark:text-[#858585] font-mono pl-2">
            {items.length} Task Terdaftar
          </span>
        </div>

        {onAddNew && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Task Kanban</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* 1. KANBAN BOARD VIEW (5 INTERACTIVE COLUMNS) */}
      {/* ========================================================= */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
          {KANBAN_STATUS_OPTIONS.map((statusKey) => {
            const cfg = STATUS_CONFIG[statusKey];
            const columnItems = items.filter((item) => getKanbanStatus(item) === statusKey);

            return (
              <div
                key={statusKey}
                className="bg-slate-50/70 dark:bg-[#1e1e1e] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] flex flex-col min-h-[420px] shadow-xs transition-colors duration-200"
              >
                {/* Column Header */}
                <div
                  className={`p-3.5 rounded-t-2xl border-b ${cfg.headerBg} ${cfg.border} flex items-center justify-between transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      style={{ backgroundColor: cfg.accentColor }}
                      className="w-2.5 h-2.5 rounded-full"
                    />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white tracking-tight">
                      {cfg.label}
                    </h3>
                  </div>
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}
                  >
                    {columnItems.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[640px]">
                  {columnItems.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200 dark:border-[#2d2d2d] rounded-xl flex items-center justify-center text-center p-3 text-[11px] text-slate-400 dark:text-[#666666]">
                      Tidak ada task
                    </div>
                  ) : (
                    columnItems.map((item, idx) => {
                      const no = getKanbanNo(item, idx);
                      const task = getKanbanTask(item);
                      const userStr = getKanbanUser(item, users);
                      const priority = getKanbanPriority(item);
                      const dueDate = getKanbanDueDate(item);
                      const review = getKanbanReview(item);
                      const evidence = getKanbanEvidence(item);
                      const isApproved = review === 'Disetujui';

                      return (
                        <div
                          key={item.Plan_ID || `${no}-${idx}`}
                          className="bg-white dark:bg-[#252526] p-4 rounded-xl border border-slate-200/80 dark:border-[#383838] shadow-xs hover:border-[#0b4e8c]/40 dark:hover:border-[#007acc]/40 transition-all space-y-2.5 group"
                        >
                          {/* Card Top: No, Priority, & Review */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-[#858585] bg-slate-100 dark:bg-[#1e1e1e] px-1.5 py-0.5 rounded">
                              #{no}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE_STYLE[priority]}`}
                              >
                                {priority}
                              </span>
                              <StatusBadge status={review} size="sm" />
                            </div>
                          </div>

                          {/* Task Description */}
                          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed line-clamp-3">
                            {task}
                          </p>

                          {/* User & Due Date */}
                          <div className="pt-2 border-t border-slate-100 dark:border-[#2d2d2d] space-y-1.5 text-[11px] text-slate-500 dark:text-[#858585]">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 dark:text-[#666666]">Assigned:</span>
                              <span className="font-medium text-slate-800 dark:text-[#cccccc] truncate max-w-[120px]">
                                {userStr}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 dark:text-[#666666]">Due Date:</span>
                              <span className="font-mono text-slate-700 dark:text-[#cccccc]">
                                {dueDate}
                              </span>
                            </div>

                            {item.Start && item.End && (
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 dark:text-[#666666]">Jam:</span>
                                <span className="font-mono text-slate-600 dark:text-[#858585]">
                                  {item.Start} - {item.End}
                                </span>
                              </div>
                            )}

                            {evidence && (
                              <div className="pt-1">
                                <a
                                  href={evidence.startsWith('http') ? evidence : `https://${evidence}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono text-[10px] truncate max-w-full"
                                  title={evidence}
                                >
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{evidence}</span>
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Quick Status Mover (Dropdown / Next/Prev) */}
                          {onStatusChange && (
                            <div className="pt-1.5 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 dark:text-[#666666]">Pindah:</span>
                              <select
                                value={statusKey}
                                onChange={(e) => onStatusChange(item, e.target.value as KanbanStatus)}
                                className="text-[10px] font-semibold rounded px-1.5 py-0.5 border border-slate-200 dark:border-[#383838] bg-slate-50 dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none cursor-pointer"
                              >
                                {KANBAN_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Actions: Edit / Delete / Review */}
                          <div className="pt-2 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center justify-end gap-1.5">
                            {editable && !isApproved && onEdit && (
                              <button
                                type="button"
                                onClick={() => onEdit(item)}
                                className="p-1 text-slate-400 hover:text-[#0b4e8c] dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer"
                                title="Edit Task"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {editable && review === 'Menunggu' && onDelete && (
                              <button
                                type="button"
                                onClick={() => onDelete(item)}
                                disabled={deletingId === (item.Plan_ID || String(no))}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-[#341b1d] transition-colors cursor-pointer disabled:opacity-50"
                                title="Hapus Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {mentorMode && onReview && (
                              <button
                                type="button"
                                onClick={() => onReview(item)}
                                className="px-2 py-0.5 text-[10px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] bg-blue-50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] rounded hover:bg-blue-100 transition-colors cursor-pointer"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================= */
        /* 2. SPREADSHEET TABLE VIEW (MATCHING 'Kanban' SHEET) */
        /* ========================================================= */
        <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-2xl border border-slate-300 dark:border-[#2d2d2d] shadow-sm overflow-hidden transition-colors duration-200">
          {/* Header Banner */}
          <div className="bg-slate-50 dark:bg-[#252526] px-4 py-2 border-b border-slate-200 dark:border-[#2d2d2d] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="font-semibold text-xs text-slate-800 dark:text-white">
                Kanban
              </span>
              <span className="text-[11px] text-slate-400 dark:text-[#858585]">
                (Project &amp; Weekly Kanban Sheet)
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#858585]">
              {items.length} Baris Task
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#16325B] dark:bg-[#0f243d] text-white font-bold text-[11px] tracking-wide select-none">
                  <th className="py-2.5 px-3 text-center border-r border-blue-900/50 w-12 font-bold">
                    No
                  </th>
                  <th className="py-2.5 px-4 border-r border-blue-900/50 min-w-[240px]">
                    <div className="flex items-center justify-between gap-1">
                      <span>Task</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[140px] whitespace-nowrap">
                    <div className="flex items-center justify-between gap-1">
                      <span>User</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[100px] whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>Priority</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[110px] whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 border-r border-blue-900/50 min-w-[120px] whitespace-nowrap">
                    <div className="flex items-center justify-between gap-1">
                      <span>Due Date</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-20 whitespace-nowrap">
                    <span>Start</span>
                  </th>
                  <th className="py-2.5 px-2.5 text-center border-r border-blue-900/50 w-20 whitespace-nowrap">
                    <span>End</span>
                  </th>
                  <th className="py-2.5 px-3.5 border-r border-blue-900/50 min-w-[160px]">
                    <div className="flex items-center justify-between gap-1">
                      <span>Evidence</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center border-r border-blue-900/50 min-w-[120px] whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span>Review</span>
                      <ChevronDown className="w-3 h-3 text-blue-200/70" />
                    </div>
                  </th>
                  {(editable || mentorMode) && (
                    <th className="py-2.5 px-3 text-center w-28 whitespace-nowrap">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-[#2d2d2d] text-slate-800 dark:text-[#cccccc]">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={editable || mentorMode ? 11 : 10}
                      className="py-12 text-center text-slate-400 dark:text-[#858585] bg-slate-50/50 dark:bg-[#252526]"
                    >
                      Belum ada task di lembar Kanban.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const no = getKanbanNo(item, idx);
                    const task = getKanbanTask(item);
                    const userStr = getKanbanUser(item, users);
                    const priority = getKanbanPriority(item);
                    const status = getKanbanStatus(item);
                    const dueDate = getKanbanDueDate(item);
                    const review = getKanbanReview(item);
                    const evidence = getKanbanEvidence(item);
                    const isApproved = review === 'Disetujui';

                    return (
                      <tr
                        key={item.Plan_ID || `${no}-${idx}`}
                        className="hover:bg-blue-50/70 dark:hover:bg-[#2a2d2e] bg-[#edf7ed] even:bg-[#e4f3e2] dark:bg-[#1e1e1e] dark:even:bg-[#252526] transition-colors border-b border-[#cfe6ce] dark:border-[#2d2d2d]"
                      >
                        <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-700 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                          {no}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                          <div className="whitespace-pre-line max-w-sm">
                            {task}
                          </div>
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-800 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                          {userStr}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${PRIORITY_BADGE_STYLE[priority]}`}
                          >
                            {priority}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-slate-800 dark:text-white">
                            {status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                          {dueDate}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                          {item.Start || '-'}
                        </td>
                        <td className="py-2.5 px-2.5 text-center font-mono text-slate-700 dark:text-[#cccccc] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                          {item.End || '-'}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-[#858585] border-r border-[#cfe6ce] dark:border-[#2d2d2d]">
                          {evidence ? (
                            <a
                              href={evidence.startsWith('http') ? evidence : `https://${evidence}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono text-[11px] truncate max-w-[150px]"
                            >
                              <span className="truncate">{evidence}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-[#666666]">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-[#cfe6ce] dark:border-[#2d2d2d] whitespace-nowrap">
                          <StatusBadge status={review} size="sm" />
                        </td>
                        {(editable || mentorMode) && (
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {editable && !isApproved && onEdit && (
                                <button
                                  type="button"
                                  onClick={() => onEdit(item)}
                                  className="p-1.5 text-slate-500 hover:text-[#0b4e8c] dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-[#383838] transition-colors cursor-pointer border border-slate-300 dark:border-[#383838]"
                                  title="Edit Task"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {editable && review === 'Menunggu' && onDelete && (
                                <button
                                  type="button"
                                  onClick={() => onDelete(item)}
                                  disabled={deletingId === (item.Plan_ID || String(no))}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-[#341b1d] transition-colors cursor-pointer disabled:opacity-50 border border-slate-300 dark:border-[#383838]"
                                  title="Hapus Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {mentorMode && onReview && (
                                <button
                                  type="button"
                                  onClick={() => onReview(item)}
                                  className="p-1.5 text-slate-600 dark:text-[#cccccc] hover:text-[#0b4e8c] dark:hover:text-white rounded hover:bg-white dark:hover:bg-[#252526] border border-slate-300 dark:border-[#383838] transition-colors cursor-pointer"
                                  title="Tinjau Task"
                                >
                                  Review
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Sheet Tabs (for Mentor & HR filter) */}
      {sheetTabs && sheetTabs.length > 0 && (
        <div className="bg-slate-100 dark:bg-[#181818] border border-slate-300 dark:border-[#2d2d2d] rounded-xl px-3 py-1.5 flex items-center justify-between gap-3 text-xs overflow-x-auto select-none">
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-[#858585] mr-1">
              Tab Sheet:
            </span>
            {sheetTabs.map((tab) => {
              const isActive = activeSheetTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onSelectSheetTab && onSelectSheetTab(tab)}
                  className={`px-3 py-1 rounded-md font-medium transition-all text-xs border cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white dark:bg-[#252526] text-[#0b4e8c] dark:text-[#3794ff] border-slate-300 dark:border-[#383838] font-bold shadow-xs'
                      : 'bg-transparent text-slate-600 dark:text-[#858585] border-transparent hover:bg-slate-200/70 dark:hover:bg-[#252526]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
