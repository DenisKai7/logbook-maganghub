import React, { useState, useEffect } from 'react';
import {
  User,
  PesertaData,
  DailyActivity,
  WeeklyPlan,
  ACTIVITY_STATUS_OPTIONS,
  TARGET_STATUS_OPTIONS,
  getDailyDate,
  getDailyStart,
  getDailyEnd,
  getDailyDuration,
  getDailyActivities,
  getDailyActivitiesStatus,
  getDailyTargetDesc,
  getDailyTargetStatus,
  getDailyNote,
  getDailyEvidence,
  getDailyNo
} from '../types';
import { api, formatIndonesianDate, computeDurationMinutes } from '../api';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import { SpreadsheetDailyTable } from './SpreadsheetDailyTable';
import {
  Calendar,
  Clock,
  Plus,
  ExternalLink,
  Edit3,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  FolderGit2,
  Target,
  Sparkles,
  BookOpen,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  user: User;
  data: PesertaData;
  pin: string;
  onRefresh: () => void;
}

export const PesertaView: React.FC<Props> = ({ user, data, pin, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Daily Activity Modal state matching the Google Sheet columns
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [editingDaily, setEditingDaily] = useState<DailyActivity | null>(null);
  const [dailyForm, setDailyForm] = useState({
    date: data.today,
    start: '08:00',
    end: '09:00',
    duration: 60 as number | string,
    activities: '',
    activitiesStatus: 'Done',
    targetDesc: '',
    targetStatus: 'Achieved',
    note: '',
    evidence: '',
  });
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState('');

  // Weekly Plan Modal state
  const [weeklyModalOpen, setWeeklyModalOpen] = useState(false);
  const [editingWeekly, setEditingWeekly] = useState<WeeklyPlan | null>(null);
  const [weeklyForm, setWeeklyForm] = useState({
    mingguKe: data.currentWeek,
    targetMingguan: ''
  });
  const [weeklyLoading, setWeeklyLoading] = useState(false);
  const [weeklyError, setWeeklyError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Auto-calculate duration whenever start or end changes
  const handleTimeChange = (type: 'start' | 'end', val: string) => {
    const updated = { ...dailyForm, [type]: val };
    const dur = computeDurationMinutes(
      type === 'start' ? val : dailyForm.start,
      type === 'end' ? val : dailyForm.end
    );
    if (dur !== '') {
      updated.duration = dur;
    }
    setDailyForm(updated);
  };

  const handleDeleteItem = async (id: string, type: 'daily' | 'weekly', label: string) => {
    if (!window.confirm(`Hapus ${label}? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.deleteItem(user.email, pin, { id, type });
      if (res.status === 'success') {
        onRefresh();
      } else {
        alert(res.message || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDeletingId(null);
    }
  };

  // Stats calculation
  const approvedDaily = data.dailyActivities.filter(d => {
    const st = getDailyActivitiesStatus(d);
    return st === 'Done' || d.Status === 'Disetujui';
  }).length;
  const inProgressDaily = data.dailyActivities.filter(d => {
    const st = getDailyActivitiesStatus(d);
    return st === 'On Progress' || d.Status === 'Menunggu';
  }).length;
  const totalMinutes = data.dailyActivities.reduce((acc, d) => {
    const dur = Number(d.Duration);
    return isNaN(dur) ? acc : acc + dur;
  }, 0);

  // Open Daily Modal
  const openNewDaily = () => {
    setEditingDaily(null);
    const dur = computeDurationMinutes('08:00', '09:00') || 60;
    setDailyForm({
      date: data.today,
      start: '08:00',
      end: '09:00',
      duration: dur,
      activities: '',
      activitiesStatus: 'Done',
      targetDesc: '',
      targetStatus: 'Achieved',
      note: '',
      evidence: '',
    });
    setDailyError('');
    setDailyModalOpen(true);
  };

  const openEditDaily = (item: DailyActivity) => {
    setEditingDaily(item);
    const rawDate = item.Date || item.Tanggal || data.today;
    const durVal = item.Duration !== undefined && item.Duration !== '' ? item.Duration : computeDurationMinutes(item.Start || '08:00', item.End || '09:00');
    setDailyForm({
      date: rawDate,
      start: item.Start || '08:00',
      end: item.End || '09:00',
      duration: durVal || 60,
      activities: getDailyActivities(item),
      activitiesStatus: getDailyActivitiesStatus(item) || 'Done',
      targetDesc: getDailyTargetDesc(item) !== '-' ? getDailyTargetDesc(item) : '',
      targetStatus: getDailyTargetStatus(item) !== '-' ? getDailyTargetStatus(item) : '',
      note: getDailyNote(item) !== '-' ? getDailyNote(item) : '',
      evidence: getDailyEvidence(item) !== '-' ? getDailyEvidence(item) : '',
    });
    setDailyError('');
    setDailyModalOpen(true);
  };

  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setDailyError('');
    if (!dailyForm.date || !dailyForm.activities.trim()) {
      setDailyError('Date dan Activities wajib diisi.');
      return;
    }

    setDailyLoading(true);
    try {
      const dur = dailyForm.duration !== '' ? Number(dailyForm.duration) : computeDurationMinutes(dailyForm.start, dailyForm.end);
      const formattedDate = formatIndonesianDate(dailyForm.date) || dailyForm.date;

      const res = await api.saveDailyActivity(user.email, pin, {
        no: editingDaily ? (editingDaily.No || editingDaily.Log_ID) : undefined,
        date: formattedDate,
        start: dailyForm.start,
        end: dailyForm.end,
        duration: dur !== '' ? dur : undefined,
        activities: dailyForm.activities.trim(),
        activitiesStatus: dailyForm.activitiesStatus,
        targetDesc: dailyForm.targetDesc.trim(),
        targetStatus: dailyForm.targetStatus,
        note: dailyForm.note.trim(),
        evidence: dailyForm.evidence.trim(),
        // compatibility
        tanggal: dailyForm.date,
        deskripsi: dailyForm.activities.trim(),
        kategori: 'Mengerjakan Tugas',
        outputLink: dailyForm.evidence.trim(),
        kendala: dailyForm.note.trim(),
        logId: editingDaily?.Log_ID
      });

      if (res.status === 'success') {
        setDailyModalOpen(false);
        onRefresh();
      } else {
        setDailyError(res.message || 'Gagal menyimpan aktivitas.');
      }
    } catch (err: any) {
      setDailyError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setDailyLoading(false);
    }
  };

  // Open Weekly Modal
  const openNewWeekly = () => {
    setEditingWeekly(null);
    setWeeklyForm({
      mingguKe: data.currentWeek,
      targetMingguan: ''
    });
    setWeeklyError('');
    setWeeklyModalOpen(true);
  };

  const openEditWeekly = (item: WeeklyPlan) => {
    setEditingWeekly(item);
    setWeeklyForm({
      mingguKe: item.Minggu_Ke,
      targetMingguan: item.Target_Mingguan
    });
    setWeeklyError('');
    setWeeklyModalOpen(true);
  };

  const handleSaveWeekly = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeeklyError('');
    if (!weeklyForm.mingguKe || !weeklyForm.targetMingguan.trim()) {
      setWeeklyError('Minggu ke dan target mingguan wajib diisi.');
      return;
    }

    setWeeklyLoading(true);
    try {
      const res = await api.saveWeeklyPlan(user.email, pin, {
        mingguKe: weeklyForm.mingguKe.trim(),
        targetMingguan: weeklyForm.targetMingguan.trim(),
        planId: editingWeekly?.Plan_ID
      });

      if (res.status === 'success') {
        setWeeklyModalOpen(false);
        onRefresh();
      } else {
        setWeeklyError(res.message || 'Gagal menyimpan rencana mingguan.');
      }
    } catch (err: any) {
      setWeeklyError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setWeeklyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Overview Header */}
      <section className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-5 sm:p-7 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#858585] text-xs font-semibold uppercase tracking-wider">
              <span>PT. Shelter Indonesia Gemilang</span>
              <span>•</span>
              <span>{user.divisi}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Mentor: <strong className="text-slate-800 dark:text-white font-semibold">{data.mentorName}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Personal Daily Activities
            </h1>
            <p className="text-slate-500 dark:text-[#858585] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Pencatatan lembar aktivitas harian berbasis format resmi spreadsheet PT. Shelter Indonesia Gemilang.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {activeTab === 'daily' ? (
              <button
                onClick={openNewDaily}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Baris Aktivitas
              </button>
            ) : (
              <button
                onClick={openNewWeekly}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Target Minggu Baru
              </button>
            )}
          </div>
        </div>

        {/* Quiet Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-[#2d2d2d]">
          <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1e2733] border border-blue-200/50 dark:border-[#264f78]">
            <span className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] uppercase tracking-wider block">Minggu Ini</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{data.currentWeek}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/70 dark:border-[#2d2d2d]">
            <span className="text-[11px] font-medium text-slate-500 dark:text-[#858585] uppercase tracking-wider block">Total Aktivitas</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{data.dailyActivities.length} Baris</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#1b3424] border border-emerald-200/50 dark:border-[#2e6040]">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#4ec9b0] uppercase tracking-wider block">Status 'Done'</span>
            <span className="text-base font-semibold text-emerald-900 dark:text-[#4ec9b0] font-mono mt-0.5 block">{approvedDaily}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22]">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-[#dcdcaa] uppercase tracking-wider block">Total Durasi</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {totalMinutes} <span className="text-xs font-normal text-slate-400 dark:text-[#858585]">menit ({(totalMinutes / 60).toFixed(1)} jam)</span>
            </span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2d2d2d]">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'daily'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Lembar Daily Activities ({data.dailyActivities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer flex items-center gap-2 ${
              activeTab === 'weekly'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Rencana Mingguan ({data.weeklyPlans.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT: DAILY ACTIVITIES IN SPREADSHEET VIEW */}
      {activeTab === 'daily' && (
        <div className="space-y-4 animate-fade-in-up">
          <SpreadsheetDailyTable
            activities={data.dailyActivities}
            editable={true}
            onEdit={openEditDaily}
            onDelete={(item) =>
              handleDeleteItem(
                String(item.No || item.Log_ID),
                'daily',
                `baris aktivitas #${getDailyNo(item)}`
              )
            }
            deletingId={deletingId}
            sheetTabs={[user.nama]}
            activeSheetTab={user.nama}
            onAddNew={openNewDaily}
            emptyMessage="Belum ada aktivitas tercatat di lembar Personal Daily Activities Anda."
          />
        </div>
      )}

      {/* TAB CONTENT: WEEKLY PLANS */}
      {activeTab === 'weekly' && (
        <div className="space-y-4 animate-fade-in-up">
          {data.weeklyPlans.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-[#252526] rounded-2xl border border-dashed border-slate-300 dark:border-[#383838] p-8">
              <Target className="w-8 h-8 text-slate-400 dark:text-[#858585] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Belum ada target mingguan</h3>
              <p className="text-xs text-slate-500 dark:text-[#858585] max-w-sm mx-auto mt-1 mb-4">
                Tetapkan target mingguan agar kegiatan harianmu terarah dan selaras dengan ekspektasi divisi.
              </p>
              <button
                onClick={openNewWeekly}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Buat Target Minggu Ini
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.weeklyPlans.map(item => {
                const isApproved = item.Status === 'Disetujui';
                const hasFeedback = Boolean(item.Catatan_Mentor && item.Catatan_Mentor.trim());

                return (
                  <article
                    key={item.Plan_ID}
                    className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-5 shadow-xs hover:border-[#0b4e8c]/30 dark:hover:border-[#383838] transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] bg-blue-50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] px-2.5 py-1 rounded">
                          {item.Minggu_Ke}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-[#858585] font-mono">Diinput: {item.Tanggal_Input}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={item.Status} />
                        {/* Edit: Hanya jika belum Disetujui (Menunggu atau Revisi) */}
                        {!isApproved && (
                          <button
                            onClick={() => openEditWeekly(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#858585] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer"
                            title="Edit rencana mingguan"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Hapus: HANYA jika status Menunggu */}
                        {item.Status === 'Menunggu' && (
                          <button
                            onClick={() => handleDeleteItem(item.Plan_ID, 'weekly', `rencana minggu ${item.Minggu_Ke}`)}
                            disabled={deletingId === item.Plan_ID}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-[#858585] dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-[#341b1d] transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus rencana mingguan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed">
                      {item.Target_Mingguan}
                    </p>

                    {hasFeedback && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50/50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] text-xs">
                        <div className="flex items-center gap-1.5 text-[#0b4e8c] dark:text-[#9cdcfe] font-semibold mb-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Catatan Mentor:</span>
                        </div>
                        <p className="text-slate-700 dark:text-[#cccccc] italic pl-5 leading-relaxed">{item.Catatan_Mentor}</p>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* DAILY ACTIVITY MODAL (PERSONAL DAILY ACTIVITIES SPECIFICATION) */}
      <Modal
        isOpen={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
        title={editingDaily ? 'Edit Baris Aktivitas Harian' : 'Catat Aktivitas Harian Baru'}
        subtitle="Sesuai kolom spreadsheet Personal Daily Activities PT. Shelter Indonesia Gemilang"
      >
        <form onSubmit={handleSaveDaily} className="space-y-4">
          {dailyError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771]">
              {dailyError}
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dailyForm.date.includes('-') && dailyForm.date.length === 10 ? dailyForm.date : data.today}
                onChange={e => setDailyForm({ ...dailyForm, date: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
              <span className="text-[10px] text-slate-400 dark:text-[#858585] block mt-0.5 truncate">
                {formatIndonesianDate(dailyForm.date)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Start Time
              </label>
              <input
                type="time"
                required
                value={dailyForm.start}
                onChange={e => handleTimeChange('start', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                End Time
              </label>
              <input
                type="time"
                required
                value={dailyForm.end}
                onChange={e => handleTimeChange('end', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          {/* Duration & Activities Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4]">
                  Duration (Menit)
                </label>
                <span className="text-[10px] text-slate-400 dark:text-[#858585]">
                  Otomatis terhitung
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={dailyForm.duration}
                onChange={e => setDailyForm({ ...dailyForm, duration: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Activities Status
              </label>
              <select
                value={dailyForm.activitiesStatus}
                onChange={e => setDailyForm({ ...dailyForm, activitiesStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              >
                {ACTIVITY_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Activities Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Activities <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Koordinasi dg Bp GM mengenai arsip dokumen legal dan persiapan berkas onboarding."
              value={dailyForm.activities}
              onChange={e => setDailyForm({ ...dailyForm, activities: e.target.value })}
              className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/30 dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          {/* Target Desc & Target Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Target Desc <span className="text-slate-400 dark:text-[#858585] font-normal">(opsional)</span>
              </label>
              <input
                type="text"
                placeholder="Target keluaran kegiatan"
                value={dailyForm.targetDesc}
                onChange={e => setDailyForm({ ...dailyForm, targetDesc: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Target Status
              </label>
              <select
                value={dailyForm.targetStatus}
                onChange={e => setDailyForm({ ...dailyForm, targetStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              >
                <option value="">- Pilih Status Target -</option>
                {TARGET_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Note & Evidence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Note <span className="text-slate-400 dark:text-[#858585] font-normal">(catatan / kendala)</span>
              </label>
              <input
                type="text"
                placeholder="Catatan tambahan"
                value={dailyForm.note}
                onChange={e => setDailyForm({ ...dailyForm, note: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Achieved Target Evidence
              </label>
              <input
                type="text"
                placeholder="Link file drive / dokumen / git"
                value={dailyForm.evidence}
                onChange={e => setDailyForm({ ...dailyForm, evidence: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDailyModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={dailyLoading}
              className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {dailyLoading ? 'Menyimpan...' : editingDaily ? 'Simpan Perubahan' : 'Simpan Baris Aktivitas'}
            </button>
          </div>
        </form>
      </Modal>

      {/* WEEKLY PLAN MODAL */}
      <Modal
        isOpen={weeklyModalOpen}
        onClose={() => setWeeklyModalOpen(false)}
        title={editingWeekly ? 'Edit Rencana Mingguan' : 'Buat Rencana Mingguan'}
        subtitle="Tentukan target capaian utama untuk minggu ini"
      >
        <form onSubmit={handleSaveWeekly} className="space-y-4">
          {weeklyError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771]">
              {weeklyError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Minggu Ke (Format ISO)</label>
            <input
              type="text"
              required
              placeholder="Contoh: 2026-W47"
              value={weeklyForm.mingguKe}
              onChange={e => setWeeklyForm({ ...weeklyForm, mingguKe: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Target Mingguan <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Contoh: Menyelesaikan arsitektur state management dan integrasi API review mentor."
              value={weeklyForm.targetMingguan}
              onChange={e => setWeeklyForm({ ...weeklyForm, targetMingguan: e.target.value })}
              className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/30 dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setWeeklyModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={weeklyLoading}
              className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {weeklyLoading ? 'Menyimpan...' : editingWeekly ? 'Simpan Perubahan' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
