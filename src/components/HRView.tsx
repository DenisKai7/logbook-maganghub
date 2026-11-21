import React, { useState, useMemo } from 'react';
import { User, HRData, DailyActivity, WeeklyPlan, ItemStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { Modal } from './Modal';
import {
  Users,
  Download,
  Search,
  Building2,
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Layers,
  GraduationCap,
  UserCheck,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Eye,
  Filter,
  BarChart3,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  FolderGit2
} from 'lucide-react';

interface Props {
  user: User;
  data: HRData;
  onRefresh: () => void;
}

type TabType = 'overview' | 'daily' | 'weekly' | 'users';

export const HRView: React.FC<Props> = ({ user, data, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<{
    type: 'daily' | 'weekly';
    id: string;
    title: string;
    nama: string;
    divisi: string;
    tanggal: string;
    status: ItemStatus;
    content: string;
    kategori?: string;
    outputLink?: string;
    kendala?: string;
    catatanMentor?: string;
    mentorName?: string;
  } | null>(null);

  // Core entities
  const interns = useMemo(() => data.users.filter(u => u.role === 'Peserta'), [data.users]);
  const mentors = useMemo(() => data.users.filter(u => u.role === 'Mentor'), [data.users]);
  const divisions = useMemo(() => Array.from(new Set(data.users.map(u => u.divisi).filter(Boolean))), [data.users]);

  // Daily statistics
  const totalDaily = data.dailyActivities.length;
  const approvedDaily = useMemo(() => data.dailyActivities.filter(d => d.Status === 'Disetujui').length, [data.dailyActivities]);
  const pendingDaily = useMemo(() => data.dailyActivities.filter(d => d.Status === 'Menunggu').length, [data.dailyActivities]);
  const revisionDaily = useMemo(() => data.dailyActivities.filter(d => d.Status === 'Revisi').length, [data.dailyActivities]);
  const approvalRate = totalDaily > 0 ? Math.round((approvedDaily / totalDaily) * 100) : 0;

  // Weekly statistics
  const totalWeekly = data.weeklyPlans.length;
  const approvedWeekly = useMemo(() => data.weeklyPlans.filter(w => w.Status === 'Disetujui').length, [data.weeklyPlans]);
  const pendingWeekly = useMemo(() => data.weeklyPlans.filter(w => w.Status === 'Menunggu').length, [data.weeklyPlans]);

  // Category distribution
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    data.dailyActivities.forEach(d => {
      const cat = d.Kategori || 'Lainnya';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [data.dailyActivities]);

  // Division breakdown
  const divisionStats = useMemo(() => {
    return divisions.map(div => {
      const divInterns = interns.filter(i => i.divisi === div);
      const divLogs = data.dailyActivities.filter(d => {
        const u = data.users.find(x => x.userId === d.User_ID);
        return u?.divisi === div;
      });
      const divApproved = divLogs.filter(d => d.Status === 'Disetujui').length;
      return {
        division: div,
        internCount: divInterns.length,
        logCount: divLogs.length,
        approvedCount: divApproved,
        rate: divLogs.length > 0 ? Math.round((divApproved / divLogs.length) * 100) : 0
      };
    });
  }, [divisions, interns, data.dailyActivities, data.users]);

  // Mentor workload & review backlog
  const mentorWorkload = useMemo(() => {
    return mentors.map(m => {
      const mentees = interns.filter(i => i.mentorId === m.userId);
      const menteeIds = mentees.map(i => i.userId);
      const assignedLogs = data.dailyActivities.filter(d => menteeIds.includes(d.User_ID));
      const pendingLogs = assignedLogs.filter(d => d.Status === 'Menunggu');
      const assignedWeekly = data.weeklyPlans.filter(w => menteeIds.includes(w.User_ID));
      const pendingWeekly = assignedWeekly.filter(w => w.Status === 'Menunggu');

      return {
        mentor: m,
        mentees,
        totalLogs: assignedLogs.length,
        pendingReviewCount: pendingLogs.length + pendingWeekly.length
      };
    });
  }, [mentors, interns, data.dailyActivities, data.weeklyPlans]);

  // Intern leaderboard / activity counts
  const internActivityRoster = useMemo(() => {
    return interns.map(i => {
      const logs = data.dailyActivities.filter(d => d.User_ID === i.userId);
      const weekly = data.weeklyPlans.filter(w => w.User_ID === i.userId);
      const mentor = mentors.find(m => m.userId === i.mentorId);
      const lastLog = logs[0]?.Tanggal || '-';
      return {
        intern: i,
        mentorName: mentor ? mentor.nama : 'Belum Ditugaskan',
        logCount: logs.length,
        weeklyCount: weekly.length,
        approvedLogCount: logs.filter(d => d.Status === 'Disetujui').length,
        lastLogDate: lastLog
      };
    }).sort((a, b) => b.logCount - a.logCount);
  }, [interns, mentors, data.dailyActivities, data.weeklyPlans]);

  // Filtered daily activities
  const filteredDaily = useMemo(() => {
    return data.dailyActivities.filter(d => {
      const userMatch = data.users.find(u => u.userId === d.User_ID);
      if (selectedDivision !== 'all' && userMatch?.divisi !== selectedDivision) return false;
      if (selectedStatus !== 'all' && d.Status !== selectedStatus) return false;
      if (selectedCategory !== 'all' && d.Kategori !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = d.Nama_Peserta.toLowerCase().includes(q);
        const matchDesc = d.Deskripsi_Aktivitas.toLowerCase().includes(q);
        const matchCat = d.Kategori.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [data.dailyActivities, data.users, selectedDivision, selectedStatus, selectedCategory, searchQuery]);

  // Filtered weekly plans
  const filteredWeekly = useMemo(() => {
    return data.weeklyPlans.filter(w => {
      const userMatch = data.users.find(u => u.userId === w.User_ID);
      if (selectedDivision !== 'all' && userMatch?.divisi !== selectedDivision) return false;
      if (selectedStatus !== 'all' && w.Status !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = w.Nama_Peserta.toLowerCase().includes(q);
        const matchTarget = w.Target_Mingguan.toLowerCase().includes(q);
        const matchWeek = w.Minggu_Ke.toLowerCase().includes(q);
        if (!matchName && !matchTarget && !matchWeek) return false;
      }
      return true;
    });
  }, [data.weeklyPlans, data.users, selectedDivision, selectedStatus, searchQuery]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return data.users.filter(u => {
      if (selectedDivision !== 'all' && u.divisi !== selectedDivision) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return u.nama.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.userId.toLowerCase().includes(q);
      }
      return true;
    });
  }, [data.users, selectedDivision, searchQuery]);

  // Open Detail Modal
  const viewDailyDetail = (item: DailyActivity) => {
    const u = data.users.find(x => x.userId === item.User_ID);
    const m = mentors.find(x => x.userId === item.Mentor_ID);
    setDetailItem({
      type: 'daily',
      id: item.Log_ID,
      title: `Logbook Harian #${item.Log_ID}`,
      nama: item.Nama_Peserta,
      divisi: u?.divisi || '-',
      tanggal: item.Tanggal,
      status: item.Status,
      content: item.Deskripsi_Aktivitas,
      kategori: item.Kategori,
      outputLink: item.Output_Link,
      kendala: item.Kendala,
      catatanMentor: item.Catatan_Mentor,
      mentorName: m ? m.nama : '-'
    });
    setDetailModalOpen(true);
  };

  const viewWeeklyDetail = (item: WeeklyPlan) => {
    const u = data.users.find(x => x.userId === item.User_ID);
    const m = mentors.find(x => x.userId === item.Mentor_ID);
    setDetailItem({
      type: 'weekly',
      id: item.Plan_ID,
      title: `Target Mingguan ${item.Minggu_Ke}`,
      nama: item.Nama_Peserta,
      divisi: u?.divisi || '-',
      tanggal: item.Tanggal_Input,
      status: item.Status,
      content: item.Target_Mingguan,
      catatanMentor: item.Catatan_Mentor,
      mentorName: m ? m.nama : '-'
    });
    setDetailModalOpen(true);
  };

  // CSV Exporters
  const exportDailyCsv = () => {
    const headers = ['Log_ID', 'Tanggal', 'User_ID', 'Nama_Peserta', 'Divisi', 'Kategori', 'Deskripsi', 'Output_Link', 'Kendala', 'Status', 'Catatan_Mentor'];
    const rows = filteredDaily.map(d => {
      const u = data.users.find(x => x.userId === d.User_ID);
      return [
        d.Log_ID,
        d.Tanggal,
        d.User_ID,
        `"${(d.Nama_Peserta || '').replace(/"/g, '""')}"`,
        `"${(u?.divisi || '').replace(/"/g, '""')}"`,
        `"${(d.Kategori || '').replace(/"/g, '""')}"`,
        `"${(d.Deskripsi_Aktivitas || '').replace(/"/g, '""')}"`,
        `"${(d.Output_Link || '').replace(/"/g, '""')}"`,
        `"${(d.Kendala || '').replace(/"/g, '""')}"`,
        d.Status,
        `"${(d.Catatan_Mentor || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    downloadCsv([headers.join(','), ...rows].join('\n'), `rekap_logbook_harian_${data.today}.csv`);
  };

  const exportWeeklyCsv = () => {
    const headers = ['Plan_ID', 'Tanggal_Input', 'Minggu_Ke', 'User_ID', 'Nama_Peserta', 'Divisi', 'Target_Mingguan', 'Status', 'Catatan_Mentor'];
    const rows = filteredWeekly.map(w => {
      const u = data.users.find(x => x.userId === w.User_ID);
      return [
        w.Plan_ID,
        w.Tanggal_Input,
        w.Minggu_Ke,
        w.User_ID,
        `"${(w.Nama_Peserta || '').replace(/"/g, '""')}"`,
        `"${(u?.divisi || '').replace(/"/g, '""')}"`,
        `"${(w.Target_Mingguan || '').replace(/"/g, '""')}"`,
        w.Status,
        `"${(w.Catatan_Mentor || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    downloadCsv([headers.join(','), ...rows].join('\n'), `rekap_target_mingguan_${data.today}.csv`);
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Editorial Header Section */}
      <section className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-stone-500 text-xs font-semibold uppercase tracking-wider">
              <span>Admin HR &amp; Monitoring</span>
              <span className="w-1 h-1 rounded-full bg-stone-300" />
              <span>Hari Ini: {data.today}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 tracking-tight mt-1.5">
              Pusat Data &amp; Statistik Magang
            </h1>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pantau kepatuhan pengisian logbook harian, status peninjauan mentor, sebaran divisi, dan ekspor data operasional program magang.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={exportDailyCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh CSV Logbook
            </button>
            <button
              onClick={exportWeeklyCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
              CSV Mingguan
            </button>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-stone-100">
          <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Peserta Magang</span>
              <GraduationCap className="w-4 h-4 text-sky-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900 font-mono">{interns.length}</span>
              <span className="text-xs text-stone-500">orang ({divisions.length} divisi)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Mentor Pembimbing</span>
              <UserCheck className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900 font-mono">{mentors.length}</span>
              <span className="text-xs text-stone-500">
                aktif ({mentors.length > 0 ? (interns.length / mentors.length).toFixed(1) : 0} ratio)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Total Logbook</span>
              <Activity className="w-4 h-4 text-stone-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-stone-900 font-mono">{totalDaily}</span>
              <span className="text-xs text-stone-500">entri ({approvedDaily} disetujui)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Approval Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700 font-mono">{approvalRate}%</span>
              <span className="text-xs text-amber-600 font-medium">
                {pendingDaily} menunggu
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-stone-200">
        <nav className="flex space-x-6 sm:space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'overview'
                ? 'text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Statistik &amp; Analitik
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'daily'
                ? 'text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Logbook Harian ({data.dailyActivities.length})
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Target Mingguan ({data.weeklyPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'users'
                ? 'text-stone-900 border-b-2 border-stone-900'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Pengguna &amp; Mentoring ({data.users.length})
          </button>
        </nav>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & RICH STATISTICS */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Row 1: Status Distribution Bar & Category Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Breakdown Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                    Distribusi Status Peninjauan Logbook
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Proporsi verifikasi aktivitas peserta oleh mentor</p>
                </div>
                <span className="text-xs font-mono font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  {totalDaily} Total Entri
                </span>
              </div>

              {/* Multi-segment distribution bar */}
              <div className="h-4 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                {totalDaily > 0 ? (
                  <>
                    <div
                      style={{ width: `${(approvedDaily / totalDaily) * 100}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Disetujui: ${approvedDaily}`}
                    />
                    <div
                      style={{ width: `${(pendingDaily / totalDaily) * 100}%` }}
                      className="bg-stone-400 transition-all duration-500"
                      title={`Menunggu: ${pendingDaily}`}
                    />
                    <div
                      style={{ width: `${(revisionDaily / totalDaily) * 100}%` }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Revisi: ${revisionDaily}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-stone-200" />
                )}
              </div>

              {/* Status breakdown legend boxes */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/50">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Disetujui</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-emerald-950 font-mono">{approvedDaily}</span>
                    <span className="text-[11px] text-emerald-700">
                      ({totalDaily > 0 ? Math.round((approvedDaily / totalDaily) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/60">
                  <div className="flex items-center gap-1.5 text-stone-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-stone-400" />
                    <span>Menunggu Review</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-stone-900 font-mono">{pendingDaily}</span>
                    <span className="text-[11px] text-stone-500">
                      ({totalDaily > 0 ? Math.round((pendingDaily / totalDaily) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/50">
                  <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Perlu Revisi</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-amber-950 font-mono">{revisionDaily}</span>
                    <span className="text-[11px] text-amber-700">
                      ({totalDaily > 0 ? Math.round((revisionDaily / totalDaily) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Composition Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                  Komposisi Kategori Tugas
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Aktivitas paling sering dicatat peserta</p>

                <div className="space-y-3 mt-4">
                  {categoryStats.slice(0, 4).map(([cat, count]) => {
                    const pct = totalDaily > 0 ? Math.round((count / totalDaily) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-700 truncate max-w-[170px]">{cat}</span>
                          <span className="font-mono text-stone-500 font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-stone-800 rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {categoryStats.length === 0 && (
                <p className="text-xs text-stone-400 py-6 text-center">Belum ada data aktivitas.</p>
              )}
            </div>
          </div>

          {/* Row 2: Division Comparison & Mentorship Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Division Performance Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                    Kinerja Magang Berdasarkan Divisi
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Jumlah peserta &amp; pemenuhan verifikasi logbook</p>
                </div>
                <Building2 className="w-4 h-4 text-stone-400" />
              </div>

              <div className="space-y-3.5">
                {divisionStats.map(item => (
                  <div
                    key={item.division}
                    className="p-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <strong className="text-xs font-semibold text-stone-900 block">{item.division}</strong>
                      <span className="text-[11px] text-stone-500">
                        {item.internCount} Peserta • {item.logCount} Total Log
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                        {item.rate}% Approved
                      </span>
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        {item.approvedCount} dari {item.logCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentorship Workload Card */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                    Kesehatan Mentoring &amp; Beban Kerja
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">Jumlah bimbingan dan antrean review per mentor</p>
                </div>
                <UserCheck className="w-4 h-4 text-stone-400" />
              </div>

              <div className="space-y-3.5">
                {mentorWorkload.map(item => (
                  <div
                    key={item.mentor.userId}
                    className="p-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/60 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-semibold text-stone-900">{item.mentor.nama}</strong>
                        <span className="text-[10px] font-mono text-stone-400">({item.mentor.divisi})</span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Membimbing: {item.mentees.length > 0 ? item.mentees.map(m => m.nama).join(', ') : 'Belum ada'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.pendingReviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {item.pendingReviewCount} Butuh Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Up to date
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 block mt-0.5">
                        {item.totalLogs} logbook bimbingan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Intern Activity Compliance Roster */}
          <div className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">
                  Status Kepatuhan Pengisian Peserta Magang
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">Ringkasan kedisiplinan pencatatan log harian &amp; target mingguan</p>
              </div>
              <span className="text-xs text-stone-400 font-mono">Total {internActivityRoster.length} Peserta Aktif</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-y border-stone-200/60 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Nama Peserta</th>
                    <th className="py-2.5 px-3">Divisi</th>
                    <th className="py-2.5 px-3">Mentor Pembimbing</th>
                    <th className="py-2.5 px-3 text-center">Log Harian</th>
                    <th className="py-2.5 px-3 text-center">Plan Mingguan</th>
                    <th className="py-2.5 px-3">Log Terakhir</th>
                    <th className="py-2.5 px-3 text-right">Status Kepatuhan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {internActivityRoster.map(item => {
                    const isCompliant = item.logCount > 0;
                    return (
                      <tr key={item.intern.userId} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-3 font-semibold text-stone-900 whitespace-nowrap">
                          {item.intern.nama}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-stone-500">{item.intern.divisi}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-stone-600">{item.mentorName}</td>
                        <td className="py-3 px-3 text-center font-mono font-medium">
                          {item.logCount} <span className="text-stone-400 text-[10px]">({item.approvedLogCount} acc)</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium">{item.weeklyCount}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                          {item.lastLogDate}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isCompliant ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Aktif Mengisi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Belum Ada Log
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DAILY LOGBOOK DATA EXPLORER */}
      {/* ========================================================= */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama peserta, kata kunci deskripsi aktivitas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/40"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="all">Semua Divisi</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="all">Semua Status</option>
                  <option value="Menunggu">Menunggu Review</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Revisi">Perlu Revisi</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="all">Semua Kategori</option>
                  {categoryStats.map(([cat]) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Peserta &amp; Divisi</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Aktivitas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan Mentor</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredDaily.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-stone-400">
                        Tidak ada logbook yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredDaily.map(d => {
                      const u = data.users.find(x => x.userId === d.User_ID);
                      return (
                        <tr key={d.Log_ID} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                            {d.Tanggal}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <strong className="text-stone-900 font-medium block">{d.Nama_Peserta}</strong>
                            <span className="text-[11px] text-stone-400">{u?.divisi || '-'}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                              {d.Kategori}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <p className="line-clamp-2 text-stone-800">{d.Deskripsi_Aktivitas}</p>
                            {d.Output_Link && (
                              <a
                                href={d.Output_Link.startsWith('http') ? d.Output_Link : `https://${d.Output_Link}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-stone-500 underline font-mono mt-0.5 block truncate max-w-xs"
                              >
                                {d.Output_Link}
                              </a>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={d.Status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                            {d.Catatan_Mentor || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => viewDailyDetail(d)}
                              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Lihat Detail Entri"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: WEEKLY TARGET PLANS */}
      {/* ========================================================= */}
      {activeTab === 'weekly' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari target mingguan, nama peserta, minggu ISO..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/40"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="all">Semua Divisi</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="all">Semua Status</option>
                  <option value="Menunggu">Menunggu Review</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Revisi">Perlu Revisi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Minggu Ke</th>
                    <th className="py-3 px-4">Peserta &amp; Divisi</th>
                    <th className="py-3 px-4">Target Mingguan</th>
                    <th className="py-3 px-4">Tanggal Input</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan Mentor</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredWeekly.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-stone-400">
                        Tidak ada rencana mingguan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWeekly.map(w => {
                      const u = data.users.find(x => x.userId === w.User_ID);
                      return (
                        <tr key={w.Plan_ID} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-stone-800 whitespace-nowrap">
                            {w.Minggu_Ke}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <strong className="text-stone-900 font-medium block">{w.Nama_Peserta}</strong>
                            <span className="text-[11px] text-stone-400">{u?.divisi || '-'}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-md">
                            <p className="line-clamp-2 text-stone-800">{w.Target_Mingguan}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                            {w.Tanggal_Input}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={w.Status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-stone-500 max-w-xs truncate">
                            {w.Catatan_Mentor || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => viewWeeklyDetail(w)}
                              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                              title="Lihat Detail Target"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: USERS ROSTER & MENTOR DIRECTORY */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200/80 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama pengguna, ID, atau email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/40"
                />
              </div>

              <select
                value={selectedDivision}
                onChange={e => setSelectedDivision(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-stone-200 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="all">Semua Divisi</option>
                {divisions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/80 border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role Sistem</th>
                    <th className="py-3 px-4">Divisi</th>
                    <th className="py-3 px-4">Relasi Mentoring</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-stone-400">
                        Tidak ada pengguna yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const mentor = data.users.find(m => m.userId === u.mentorId);
                      const mentees = interns.filter(i => i.mentorId === u.userId);

                      return (
                        <tr key={u.userId} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                            {u.userId}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-stone-900 whitespace-nowrap">
                            {u.nama}
                          </td>
                          <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px] whitespace-nowrap">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                u.role === 'Peserta'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : u.role === 'Mentor'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-stone-100 text-stone-800 border-stone-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">{u.divisi}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-stone-600">
                            {u.role === 'Peserta' ? (
                              mentor ? (
                                <span className="font-medium text-stone-800">
                                  {mentor.nama} <span className="text-stone-400 font-mono text-[10px]">({mentor.userId})</span>
                                </span>
                              ) : (
                                <span className="text-amber-700 italic">Belum ditentukan</span>
                              )
                            ) : u.role === 'Mentor' ? (
                              <span className="text-xs text-stone-500">
                                {mentees.length} Peserta ({mentees.map(m => m.nama).join(', ') || '-'})
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DETAIL MODAL FOR ADMIN */}
      {/* ========================================================= */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={detailItem?.title || 'Detail Entri'}
        subtitle={detailItem ? `${detailItem.nama} (${detailItem.divisi}) • Tanggal: ${detailItem.tanggal}` : ''}
      >
        {detailItem && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <StatusBadge status={detailItem.status} />
                {detailItem.kategori && (
                  <span className="text-xs bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-stone-700">
                    {detailItem.kategori}
                  </span>
                )}
              </div>
              <span className="text-xs text-stone-500">
                Mentor: <strong className="text-stone-800">{detailItem.mentorName}</strong>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60 text-xs">
              <span className="font-semibold text-stone-500 uppercase tracking-wider block text-[10px] mb-1">
                {detailItem.type === 'daily' ? 'Deskripsi Aktivitas:' : 'Target Mingguan:'}
              </span>
              <p className="text-stone-800 whitespace-pre-line leading-relaxed text-sm">
                {detailItem.content}
              </p>

              {detailItem.outputLink && (
                <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center gap-1.5">
                  <span className="text-stone-500 font-medium">Tautan Output:</span>
                  <a
                    href={
                      detailItem.outputLink.startsWith('http')
                        ? detailItem.outputLink
                        : `https://${detailItem.outputLink}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-stone-800 hover:text-stone-950 font-mono underline underline-offset-2 break-all"
                  >
                    {detailItem.outputLink}
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                </div>
              )}

              {detailItem.kendala && detailItem.kendala.trim() !== '' && detailItem.kendala !== 'Tidak ada kendala.' && (
                <div className="mt-3 pt-2.5 border-t border-stone-200 text-amber-900">
                  <strong className="font-semibold">Kendala Teknis:</strong> {detailItem.kendala}
                </div>
              )}
            </div>

            {detailItem.catatanMentor ? (
              <div className="p-3.5 rounded-2xl bg-stone-100/70 border border-stone-200 text-xs">
                <strong className="text-stone-800 block mb-1">Catatan dari Mentor:</strong>
                <p className="text-stone-700 italic leading-relaxed">{detailItem.catatanMentor}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-xs text-stone-400 text-center">
                Belum ada catatan mentor untuk entri ini.
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
