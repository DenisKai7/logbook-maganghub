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
      <section className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-stone-500 text-xs font-medium tracking-wide">
              <span>{user.divisi}</span>
              <span>•</span>
              <span>{data.mentees.length} Peserta Bimbingan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight mt-1">
              Portal Pembimbing Magang
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Tinjau logbook harian & target mingguan peserta. Berikan apresiasi atau catatan perbaikan yang konstruktif.
            </p>
          </div>

          {totalPending > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs font-medium self-start sm:self-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{totalPending} item menunggu tinjauan Anda</span>
            </div>
          )}
        </div>

        {/* Mentees Selector */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 mr-1">Peserta:</span>
          <button
            onClick={() => setSelectedMentee('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedMentee === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
            }`}
          >
            Semua ({data.mentees.length})
          </button>
          {data.mentees.map(m => (
            <button
              key={m.userId}
              onClick={() => setSelectedMentee(m.userId)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedMentee === m.userId
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200/80 text-stone-700'
              }`}
            >
              {m.nama}
            </button>
          ))}
        </div>
      </section>

      {/* Control Bar: Tabs & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-2">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'daily'
                ? 'text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Log Aktivitas ({filteredDaily.length})
            {pendingDailyCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {pendingDailyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-2 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Target Mingguan ({filteredWeekly.length})
            {pendingWeeklyCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {pendingWeeklyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-stone-400 font-medium">Status:</span>
          {['all', 'Menunggu', 'Disetujui', 'Revisi'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-2.5 py-0.5 text-xs rounded-md transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-stone-800 text-white font-medium'
                  : 'text-stone-600 hover:bg-stone-100'
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
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200/80 p-8">
              <Layers className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-stone-800">Tidak ada log aktivitas sesuai filter</h3>
              <p className="text-xs text-stone-500 mt-0.5">Semua laporan telah tertinjau atau belum ada entri baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDaily.map(item => {
                const isPending = item.Status === 'Menunggu';

                return (
                  <article
                    key={item.Log_ID}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-colors ${
                      isPending ? 'border-amber-200/90 bg-amber-50/15' : 'border-stone-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold text-stone-900">{item.Nama_Peserta}</strong>
                        <span className="text-stone-300">•</span>
                        <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          {item.Tanggal}
                        </span>
                        <span className="text-xs font-medium text-stone-700 bg-stone-100 border border-stone-200/60 px-2 py-0.5 rounded-full">
                          {item.Kategori}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.Status} />
                      </div>
                    </div>

                    <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                      {item.Deskripsi_Aktivitas}
                    </p>

                    {item.Output_Link && (
                      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center gap-1.5 text-xs">
                        <span className="text-stone-400 font-medium">Hasil:</span>
                        <a
                          href={item.Output_Link.startsWith('http') ? item.Output_Link : `https://${item.Output_Link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 font-mono text-[11px] underline underline-offset-2 break-all"
                        >
                          {item.Output_Link}
                          <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
                        </a>
                      </div>
                    )}

                    {item.Kendala && item.Kendala.trim() !== '' && item.Kendala !== 'Tidak ada kendala.' && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                        <strong className="font-semibold text-amber-950">Kendala:</strong> {item.Kendala}
                      </div>
                    )}

                    {item.Catatan_Mentor && (
                      <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                        <strong>Catatan Anda:</strong> {item.Catatan_Mentor}
                      </div>
                    )}

                    {/* Mentor Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleQuickApprove(item.Log_ID, 'daily')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
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
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200/80 p-8">
              <Layers className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-stone-800">Tidak ada rencana mingguan sesuai filter</h3>
              <p className="text-xs text-stone-500 mt-0.5">Semua target telah ditinjau atau belum diajukan peserta.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWeekly.map(item => {
                const isPending = item.Status === 'Menunggu';

                return (
                  <article
                    key={item.Plan_ID}
                    className={`bg-white rounded-2xl border p-5 shadow-xs transition-colors ${
                      isPending ? 'border-amber-200/90 bg-amber-50/15' : 'border-stone-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold text-stone-900">{item.Nama_Peserta}</strong>
                        <span className="text-stone-300">•</span>
                        <span className="text-xs font-mono font-medium text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                          {item.Minggu_Ke}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">Diinput: {item.Tanggal_Input}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.Status} />
                      </div>
                    </div>

                    <p className="text-sm text-stone-800 whitespace-pre-line leading-relaxed">
                      {item.Target_Mingguan}
                    </p>

                    {item.Catatan_Mentor && (
                      <div className="mt-3 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                        <strong>Catatan Anda:</strong> {item.Catatan_Mentor}
                      </div>
                    )}

                    {/* Mentor Actions */}
                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => handleQuickApprove(item.Plan_ID, 'weekly')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
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
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {reviewError}
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
              <span className="font-semibold text-stone-500 uppercase tracking-wider block text-[10px]">
                Deskripsi Peserta:
              </span>
              <p className="text-stone-800 whitespace-pre-line leading-relaxed">{reviewTarget.content}</p>

              {reviewTarget.outputLink && (
                <div className="pt-2 border-t border-stone-200 flex items-center gap-1">
                  <span className="text-stone-500">Output:</span>
                  <a
                    href={
                      reviewTarget.outputLink.startsWith('http')
                        ? reviewTarget.outputLink
                        : `https://${reviewTarget.outputLink}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-stone-700 hover:text-stone-900 underline font-mono break-all"
                  >
                    {reviewTarget.outputLink}
                  </a>
                </div>
              )}

              {reviewTarget.kendala && (
                <div className="pt-2 border-t border-stone-200 text-amber-900">
                  <span className="font-semibold">Kendala:</span> {reviewTarget.kendala}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">Keputusan Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewStatus('Disetujui')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    reviewStatus === 'Disetujui'
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Disetujui
                </button>

                <button
                  type="button"
                  onClick={() => setReviewStatus('Revisi')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    reviewStatus === 'Revisi'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 ring-2 ring-amber-500/20'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Perlu Revisi
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Catatan / Feedback untuk Peserta <span className="text-stone-400 font-normal">(opsional)</span>
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
                className="w-full p-3 text-xs sm:text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={reviewLoading}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
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
