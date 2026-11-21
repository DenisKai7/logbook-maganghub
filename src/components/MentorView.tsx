import React, { useState } from 'react';
import { User, MentorData, DailyActivity, WeeklyPlan, ItemStatus } from '../types';
import { api } from '../api';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  Check,
  RotateCcw
} from 'lucide-react';

interface Props {
  user: User;
  data: MentorData;
  pin: string;
  onRefresh: () => void;
}

export const MentorView: React.FC<Props> = ({ user, data, pin, onRefresh }) => {
  const [selectedMentee, setSelectedMentee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    type: 'weekly' | 'daily';
    title: string;
    peserta: string;
    content: string;
    outputLink?: string;
    kendala?: string;
    currentStatus: ItemStatus;
    catatan: string;
  } | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Disetujui' | 'Revisi'>('Disetujui');
  const [reviewNote, setReviewNote] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Filtering
  const filteredDaily = data.dailyActivities.filter(d => {
    if (selectedMentee !== 'all' && d.User_ID !== selectedMentee) return false;
    if (filterStatus !== 'all' && d.Status !== filterStatus) return false;
    return true;
  });

  const filteredWeekly = data.weeklyPlans.filter(w => {
    if (selectedMentee !== 'all' && w.User_ID !== selectedMentee) return false;
    if (filterStatus !== 'all' && w.Status !== filterStatus) return false;
    return true;
  });

  const pendingDailyCount = data.dailyActivities.filter(d => d.Status === 'Menunggu').length;
  const pendingWeeklyCount = data.weeklyPlans.filter(w => w.Status === 'Menunggu').length;
  const totalPending = pendingDailyCount + pendingWeeklyCount;

  // Quick Review trigger
  const openReview = (
    id: string,
    type: 'weekly' | 'daily',
    peserta: string,
    title: string,
    content: string,
    currentStatus: ItemStatus,
    catatan = '',
    outputLink?: string,
    kendala?: string
  ) => {
    setReviewTarget({
      id,
      type,
      peserta,
      title,
      content,
      outputLink,
      kendala,
      currentStatus,
      catatan
    });
    setReviewStatus(currentStatus === 'Revisi' ? 'Revisi' : 'Disetujui');
    setReviewNote(catatan || '');
    setReviewError('');
    setReviewModalOpen(true);
  };

  const handleQuickApprove = async (id: string, type: 'weekly' | 'daily') => {
    try {
      const res = await api.reviewItem(user.email, pin, {
        id,
        type,
        status: 'Disetujui',
        catatan: 'Disetujui oleh mentor.'
      });
      if (res.status === 'success') {
        onRefresh();
      } else {
        alert(res.message || 'Gagal mengubah status.');
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan sistem.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTarget) return;

    setReviewLoading(true);
    setReviewError('');

    try {
      const res = await api.reviewItem(user.email, pin, {
        id: reviewTarget.id,
        type: reviewTarget.type,
        status: reviewStatus,
        catatan: reviewNote.trim()
      });

      if (res.status === 'success') {
        setReviewModalOpen(false);
        onRefresh();
      } else {
        setReviewError(res.message || 'Gagal menyimpan tinjauan.');
      }
    } catch (err: any) {
      setReviewError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mentor Hero Card */}
      <section className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-5 sm:p-7 shadow-xs transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#858585] text-xs font-medium tracking-wide">
              <span>{user.divisi}</span>
              <span>•</span>
              <span>{data.mentees.length} Peserta Bimbingan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Portal Pembimbing Magang
            </h1>
            <p className="text-slate-500 dark:text-[#858585] text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Tinjau logbook harian &amp; target mingguan peserta. Berikan apresiasi atau catatan perbaikan yang konstruktif.
            </p>
          </div>

          {totalPending > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 dark:bg-[#342c15] border border-amber-200/80 dark:border-[#5a4d22] rounded-xl text-amber-900 dark:text-[#dcdcaa] text-xs font-medium self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{totalPending} item menunggu tinjauan Anda</span>
            </div>
          )}
        </div>

        {/* Mentees Selector */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-[#2d2d2d] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-[#858585] mr-1">Peserta:</span>
          <button
            onClick={() => setSelectedMentee('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedMentee === 'all'
                ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-[#cccccc]'
            }`}
          >
            Semua ({data.mentees.length})
          </button>
          {data.mentees.map(m => (
            <button
              key={m.userId}
              onClick={() => setSelectedMentee(m.userId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedMentee === m.userId
                  ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-[#cccccc]'
              }`}
            >
              {m.nama}
            </button>
          ))}
        </div>
      </section>

      {/* Control Bar: Tabs & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[#2d2d2d] pb-2">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'daily'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Log Aktivitas ({filteredDaily.length})
            {pendingDailyCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-[#342c15] text-amber-800 dark:text-[#dcdcaa] font-bold">
                {pendingDailyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Target Mingguan ({filteredWeekly.length})
            {pendingWeeklyCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-[#342c15] text-amber-800 dark:text-[#dcdcaa] font-bold">
                {pendingWeeklyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 dark:text-[#858585] font-medium">Status:</span>
          {['all', 'Menunggu', 'Disetujui', 'Revisi'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#0b4e8c] dark:bg-[#0e639c] text-white font-medium shadow-xs'
                  : 'text-slate-600 dark:text-[#858585] hover:bg-slate-100 dark:hover:bg-[#252526]'
              }`}
            >
              {st === 'all' ? 'Semua' : st}
            </button>
          ))}
        </div>
      </div>

      {/* DAILY TAB FOR MENTOR */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {filteredDaily.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-8">
              <Layers className="w-8 h-8 text-slate-400 dark:text-[#858585] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Tidak ada log aktivitas sesuai filter</h3>
              <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Semua laporan telah tertinjau atau belum ada entri baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDaily.map(item => {
                const isPending = item.Status === 'Menunggu';

                return (
                  <article
                    key={item.Log_ID}
                    className={`bg-white dark:bg-[#252526] rounded-2xl border p-5 shadow-xs transition-colors ${
                      isPending
                        ? 'border-amber-200/90 dark:border-[#5a4d22] bg-amber-50/15 dark:bg-[#2a2415]/40'
                        : 'border-slate-200/90 dark:border-[#2d2d2d]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold text-slate-900 dark:text-white">{item.Nama_Peserta}</strong>
                        <span className="text-slate-300 dark:text-[#383838]">•</span>
                        <span className="text-xs font-mono text-slate-500 dark:text-[#858585] bg-slate-100 dark:bg-[#1e1e1e] px-2 py-0.5 rounded">
                          {item.Tanggal}
                        </span>
                        <span className="text-xs font-medium text-slate-700 dark:text-[#cccccc] bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#383838] px-2.5 py-0.5 rounded-full">
                          {item.Kategori}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.Status} />
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed">
                      {item.Deskripsi_Aktivitas}
                    </p>

                    {item.Output_Link && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 dark:text-[#858585] font-medium">Hasil:</span>
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
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 dark:bg-[#342c15] border border-amber-200/60 dark:border-[#5a4d22] text-xs text-amber-900 dark:text-[#dcdcaa]">
                        <strong className="font-semibold text-amber-950 dark:text-[#e3b341]">Kendala:</strong> {item.Kendala}
                      </div>
                    )}

                    {item.Catatan_Mentor && (
                      <div className="mt-3 p-2.5 rounded-xl bg-blue-50/50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] text-xs text-slate-700 dark:text-[#cccccc]">
                        <strong className="text-[#0b4e8c] dark:text-[#9cdcfe]">Catatan Anda:</strong> {item.Catatan_Mentor}
                      </div>
                    )}

                    {/* Mentor Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleQuickApprove(item.Log_ID, 'daily')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-[#4ec9b0] bg-emerald-50 dark:bg-[#1b3424] hover:bg-emerald-100 dark:hover:bg-[#23452f] border border-emerald-200 dark:border-[#2e6040] rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#4ec9b0]" />
                          Setujui Langsung
                        </button>
                      )}
                      <button
                        onClick={() =>
                          openReview(
                            item.Log_ID,
                            'daily',
                            item.Nama_Peserta,
                            `Aktivitas Tanggal ${item.Tanggal}`,
                            item.Deskripsi_Aktivitas,
                            item.Status,
                            item.Catatan_Mentor,
                            item.Output_Link,
                            item.Kendala
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#cccccc] hover:text-[#0b4e8c] dark:hover:text-white bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-[#858585]" />
                        {item.Catatan_Mentor ? 'Ubah Tinjauan' : 'Beri Catatan / Revisi'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WEEKLY TAB FOR MENTOR */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {filteredWeekly.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-8">
              <Layers className="w-8 h-8 text-slate-400 dark:text-[#858585] mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Tidak ada rencana mingguan sesuai filter</h3>
              <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Semua target telah ditinjau atau belum diajukan peserta.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWeekly.map(item => {
                const isPending = item.Status === 'Menunggu';

                return (
                  <article
                    key={item.Plan_ID}
                    className={`bg-white dark:bg-[#252526] rounded-2xl border p-5 shadow-xs transition-colors ${
                      isPending
                        ? 'border-amber-200/90 dark:border-[#5a4d22] bg-amber-50/15 dark:bg-[#2a2415]/40'
                        : 'border-slate-200/90 dark:border-[#2d2d2d]'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold text-slate-900 dark:text-white">{item.Nama_Peserta}</strong>
                        <span className="text-slate-300 dark:text-[#383838]">•</span>
                        <span className="text-xs font-mono font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] bg-blue-50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] px-2 py-0.5 rounded">
                          {item.Minggu_Ke}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-[#858585] font-mono">Diinput: {item.Tanggal_Input}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.Status} />
                      </div>
                    </div>

                    <p className="text-sm text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed">
                      {item.Target_Mingguan}
                    </p>

                    {item.Catatan_Mentor && (
                      <div className="mt-3 p-2.5 rounded-xl bg-blue-50/50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] text-xs text-slate-700 dark:text-[#cccccc]">
                        <strong className="text-[#0b4e8c] dark:text-[#9cdcfe]">Catatan Anda:</strong> {item.Catatan_Mentor}
                      </div>
                    )}

                    {/* Mentor Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-[#2d2d2d] flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleQuickApprove(item.Plan_ID, 'weekly')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:text-[#4ec9b0] bg-emerald-50 dark:bg-[#1b3424] hover:bg-emerald-100 dark:hover:bg-[#23452f] border border-emerald-200 dark:border-[#2e6040] rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#4ec9b0]" />
                          Setujui Langsung
                        </button>
                      )}
                      <button
                        onClick={() =>
                          openReview(
                            item.Plan_ID,
                            'weekly',
                            item.Nama_Peserta,
                            `Target Mingguan ${item.Minggu_Ke}`,
                            item.Target_Mingguan,
                            item.Status,
                            item.Catatan_Mentor
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-[#cccccc] hover:text-[#0b4e8c] dark:hover:text-white bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-500 dark:text-[#858585]" />
                        {item.Catatan_Mentor ? 'Ubah Tinjauan' : 'Beri Catatan / Revisi'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* REVIEW MODAL */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Tinjau Entri Peserta"
        subtitle={reviewTarget ? `${reviewTarget.peserta} — ${reviewTarget.title}` : ''}
      >
        {reviewTarget && (
          <form onSubmit={handleSubmitReview} className="space-y-4">
            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771]">
                {reviewError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs space-y-2">
              <span className="font-semibold text-slate-500 dark:text-[#858585] uppercase tracking-wider block text-[10px]">
                Deskripsi Peserta:
              </span>
              <p className="text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed">{reviewTarget.content}</p>

              {reviewTarget.outputLink && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#2d2d2d] flex items-center gap-1">
                  <span className="text-slate-500 dark:text-[#858585]">Output:</span>
                  <a
                    href={
                      reviewTarget.outputLink.startsWith('http')
                        ? reviewTarget.outputLink
                        : `https://${reviewTarget.outputLink}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono break-all"
                  >
                    {reviewTarget.outputLink}
                  </a>
                </div>
              )}

              {reviewTarget.kendala && (
                <div className="pt-2 border-t border-slate-200 dark:border-[#2d2d2d] text-amber-900 dark:text-[#dcdcaa]">
                  <span className="font-semibold text-amber-950 dark:text-[#e3b341]">Kendala:</span> {reviewTarget.kendala}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1.5">Keputusan Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('Disetujui')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    reviewStatus === 'Disetujui'
                      ? 'bg-emerald-50 dark:bg-[#1b3424] text-emerald-900 dark:text-[#4ec9b0] border-emerald-300 dark:border-[#2e6040] ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-[#858585] border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#252526]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#4ec9b0]" />
                  Disetujui
                </button>

                <button
                  type="button"
                  onClick={() => setReviewStatus('Revisi')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    reviewStatus === 'Revisi'
                      ? 'bg-amber-50 dark:bg-[#342c15] text-amber-900 dark:text-[#dcdcaa] border-amber-300 dark:border-[#5a4d22] ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-[#1e1e1e] text-slate-600 dark:text-[#858585] border-slate-200 dark:border-[#383838] hover:bg-slate-50 dark:hover:bg-[#252526]'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-amber-600 dark:text-[#cca700]" />
                  Perlu Revisi
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4] mb-1">
                Catatan / Feedback untuk Peserta <span className="text-slate-400 dark:text-[#858585] font-normal">(opsional)</span>
              </label>
              <textarea
                rows={3}
                placeholder={
                  reviewStatus === 'Revisi'
                    ? 'Jelaskan apa yang perlu diperbaiki atau dilengkapi oleh peserta...'
                    : 'Tulis apresiasi atau saran pengembangan lebih lanjut...'
                }
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                className="w-full p-3 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={reviewLoading}
                className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {reviewLoading ? 'Menyimpan...' : 'Simpan Tinjauan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
