import React, { useState } from 'react';
import { User, PesertaData, DailyActivity, WeeklyPlan } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
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
  Trash2
} from 'lucide-react';

interface Props {
  user: User;
  data: PesertaData;
  pin: string;
  onRefresh: () => void;
}

const CATEGORIES = [
  'Mengerjakan Tugas',
  'Diskusi / Rapat Tim',
  'Riset & Belajar',
  'Troubleshooting & Bugfix',
  'Dokumentasi & Laporan',
  'Presentasi / Review'
];

export const PesertaView: React.FC<Props> = ({ user, data, pin, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Daily Activity Modal state
  const [dailyModalOpen, setDailyModalOpen] = useState(false);
  const [editingDaily, setEditingDaily] = useState<DailyActivity | null>(null);
  const [dailyForm, setDailyForm] = useState({
    tanggal: data.today,
    kategori: CATEGORIES[0],
    deskripsi: '',
    outputLink: '',
    kendala: ''
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
  const approvedDaily = data.dailyActivities.filter(d => d.Status === 'Disetujui').length;
  const pendingDaily = data.dailyActivities.filter(d => d.Status === 'Menunggu').length;
  const revisionDaily = data.dailyActivities.filter(d => d.Status === 'Revisi').length;

  // Open Daily Modal
  const openNewDaily = () => {
    setEditingDaily(null);
    setDailyForm({
      tanggal: data.today,
      kategori: CATEGORIES[0],
      deskripsi: '',
      outputLink: '',
      kendala: ''
    });
    setDailyError('');
    setDailyModalOpen(true);
  };

  const openEditDaily = (item: DailyActivity) => {
    setEditingDaily(item);
    setDailyForm({
      tanggal: item.Tanggal,
      kategori: item.Kategori || CATEGORIES[0],
      deskripsi: item.Deskripsi_Aktivitas,
      outputLink: item.Output_Link || '',
      kendala: item.Kendala || ''
    });
    setDailyError('');
    setDailyModalOpen(true);
  };

  const handleSaveDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setDailyError('');
    if (!dailyForm.tanggal || !dailyForm.kategori || !dailyForm.deskripsi.trim()) {
      setDailyError('Tanggal, kategori, dan deskripsi aktivitas wajib diisi.');
      return;
    }

    setDailyLoading(true);
    try {
      const res = await api.saveDailyActivity(user.email, pin, {
        tanggal: dailyForm.tanggal,
        kategori: dailyForm.kategori,
        deskripsi: dailyForm.deskripsi.trim(),
        outputLink: dailyForm.outputLink.trim(),
        kendala: dailyForm.kendala.trim(),
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
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#858585] text-xs font-medium tracking-wide">
              <span>{user.divisi}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Mentor: <strong className="text-slate-800 dark:text-white font-semibold">{data.mentorName}</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Jurnal Magang Mandiri
            </h1>
            <p className="text-slate-500 dark:text-[#858585] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Dokumentasikan proses belajar, kendala teknis, dan hasil tugas secara berkala untuk ditinjau mentor.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            {activeTab === 'daily' ? (
              <button
                onClick={openNewDaily}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Catat Log Hari Ini
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
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">{data.dailyActivities.length}</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#1b3424] border border-emerald-200/50 dark:border-[#2e6040]">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#4ec9b0] uppercase tracking-wider block">Disetujui</span>
            <span className="text-base font-semibold text-emerald-900 dark:text-[#4ec9b0] font-mono mt-0.5 block">{approvedDaily}</span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22]">
            <span className="text-[11px] font-semibold text-amber-800 dark:text-[#dcdcaa] uppercase tracking-wider block">Menunggu / Revisi</span>
            <span className="text-base font-semibold text-slate-900 dark:text-white font-mono mt-0.5 block">
              {pendingDaily} <span className="text-xs font-normal text-slate-400 dark:text-[#858585]">/</span> {revisionDaily}
            </span>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2d2d2d]">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'daily'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Aktivitas Harian ({data.dailyActivities.length})
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Rencana Mingguan ({data.weeklyPlans.length})
          </button>
        </nav>
      </div>

      {/* TAB CONTENT: DAILY ACTIVITIES */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {data.dailyActivities.length === 0 ? (
            <div className="text-center py-14 bg-white dark:bg-[#252526] rounded-2xl border border-dashed border-slate-300 dark:border-[#383838] p-8">
              <BookOpen className="w-8 h-8 text-slate-400 dark:text-[#858585] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Belum ada aktivitas tercatat</h3>
              <p className="text-xs text-slate-500 dark:text-[#858585] max-w-sm mx-auto mt-1 mb-4">
                Catat kegiatan tugas pertama kamu hari ini agar mentor dapat memantau perkembangan magangmu.
              </p>
              <button
                onClick={openNewDaily}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Logbook
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.dailyActivities.map(item => {
                const isApproved = item.Status === 'Disetujui';
                const hasFeedback = Boolean(item.Catatan_Mentor && item.Catatan_Mentor.trim());

                return (
                  <article
                    key={item.Log_ID}
                    className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-5 shadow-xs hover:border-[#0b4e8c]/30 dark:hover:border-[#383838] transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-medium text-slate-500 dark:text-[#858585] bg-slate-100 dark:bg-[#1e1e1e] px-2 py-0.5 rounded">
                          {item.Tanggal}
                        </span>
                        <span className="text-xs font-medium text-slate-700 dark:text-[#cccccc] bg-slate-100/70 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#383838] px-2.5 py-0.5 rounded-full">
                          {item.Kategori}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={item.Status} />
                        {/* Edit: Hanya jika belum Disetujui (Menunggu atau Revisi) */}
                        {!isApproved && (
                          <button
                            onClick={() => openEditDaily(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#858585] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer"
                            title="Edit aktivitas"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Hapus: HANYA jika status Menunggu (Revisi dan Disetujui tidak bisa dihapus) */}
                        {item.Status === 'Menunggu' && (
                          <button
                            onClick={() => handleDeleteItem(item.Log_ID, 'daily', `aktivitas tanggal ${item.Tanggal}`)}
                            disabled={deletingId === item.Log_ID}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:text-[#858585] dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-[#341b1d] transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus aktivitas"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed">
                      {item.Deskripsi_Aktivitas}
                    </p>

                    {item.Output_Link && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 dark:text-[#858585] font-medium">Bukti Output:</span>
                        <a
                          href={item.Output_Link.startsWith('http') ? item.Output_Link : `https://${item.Output_Link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono text-[11px] break-all"
                        >
                          {item.Output_Link}
                          <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                        </a>
                      </div>
                    )}

                    {item.Kendala && item.Kendala.trim() !== '' && item.Kendala !== 'Tidak ada kendala.' && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22] flex items-start gap-2 text-xs text-amber-900 dark:text-[#dcdcaa]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-[#cca700] mt-0.5 shrink-0" />
                        <div>
                          <strong className="font-semibold text-amber-950 dark:text-[#e3b341]">Kendala:</strong> {item.Kendala}
                        </div>
                      </div>
                    )}

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

      {/* TAB CONTENT: WEEKLY PLANS */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
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
                        {/* Hapus: HANYA jika status Menunggu (Revisi dan Disetujui tidak bisa dihapus) */}
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

      {/* DAILY ACTIVITY MODAL */}
      <Modal
        isOpen={dailyModalOpen}
        onClose={() => setDailyModalOpen(false)}
        title={editingDaily ? 'Edit Log Aktivitas' : 'Catat Aktivitas Harian'}
        subtitle="Sampaikan aktivitas apa yang telah kamu kerjakan dengan ringkas & jelas"
      >
        <form onSubmit={handleSaveDaily} className="space-y-4">
          {dailyError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771]">
              {dailyError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={dailyForm.tanggal}
                onChange={e => setDailyForm({ ...dailyForm, tanggal: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">Kategori Aktivitas</label>
              <select
                value={dailyForm.kategori}
                onChange={e => setDailyForm({ ...dailyForm, kategori: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Deskripsi Aktivitas <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Contoh: Mengembangkan modul otentikasi login, memperbaiki bug responsif navigasi tablet, dan berdiskusi dengan tim backend."
              value={dailyForm.deskripsi}
              onChange={e => setDailyForm({ ...dailyForm, deskripsi: e.target.value })}
              className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/30 dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Tautan Hasil / Output <span className="text-slate-400 dark:text-[#858585] font-normal">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="https://github.com/..., Figma, atau link Google Docs"
              value={dailyForm.outputLink}
              onChange={e => setDailyForm({ ...dailyForm, outputLink: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
              Kendala / Hambatan <span className="text-slate-400 dark:text-[#858585] font-normal">(jika ada)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Menunggu akses database staging dari tim DevOps."
              value={dailyForm.kendala}
              onChange={e => setDailyForm({ ...dailyForm, kendala: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
            />
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
              {dailyLoading ? 'Menyimpan...' : editingDaily ? 'Simpan Perubahan' : 'Catat Aktivitas'}
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
