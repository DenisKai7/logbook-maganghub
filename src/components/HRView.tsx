import React, { useState, useMemo } from 'react';
import { User, HRData, DailyActivity, WeeklyPlan, ItemStatus } from '../types';
import { api } from '../api';
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
  FolderGit2,
  KeyRound,
  Check
} from 'lucide-react';

interface Props {
  user: User;
  data: HRData;
  pin: string;
  onRefresh: () => void;
}

type TabType = 'overview' | 'daily' | 'weekly' | 'users';

export const HRView: React.FC<Props> = ({ user, data, pin, onRefresh }) => {
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

  // Reset PIN Modal State (Admin HR)
  const [resetPinModalOpen, setResetPinModalOpen] = useState(false);
  const [resetPinTarget, setResetPinTarget] = useState<User | null>(null);
  const [resetPinValue, setResetPinValue] = useState('1234');
  const [resetPinLoading, setResetPinLoading] = useState(false);
  const [resetPinError, setResetPinError] = useState('');
  const [resetPinSuccess, setResetPinSuccess] = useState('');

  const openResetPinModal = (targetUser: User) => {
    setResetPinTarget(targetUser);
    setResetPinValue('1234');
    setResetPinError('');
    setResetPinSuccess('');
    setResetPinModalOpen(true);
  };

  const handleExecuteResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPinTarget) return;

    if (!/^\d{4,8}$/.test(resetPinValue.trim())) {
      setResetPinError('PIN baru harus berupa 4 sampai 8 digit angka.');
      return;
    }

    setResetPinLoading(true);
    setResetPinError('');
    setResetPinSuccess('');

    try {
      const res = await api.resetPin(user.email, pin, {
        userId: resetPinTarget.userId,
        newPin: resetPinValue.trim()
      });

      if (res.status === 'success') {
        setResetPinSuccess(`PIN ${resetPinTarget.nama} berhasil direset ke "${resetPinValue.trim()}". Sampaikan PIN ini kepada pengguna.`);
        setTimeout(() => {
          onRefresh();
        }, 1800);
      } else {
        setResetPinError(res.message || 'Gagal mereset PIN.');
      }
    } catch (err: any) {
      setResetPinError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setResetPinLoading(false);
    }
  };

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
      <section className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 sm:p-8 shadow-xs transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 text-slate-500 dark:text-[#858585] text-xs font-semibold uppercase tracking-wider">
              <span>PT. Shelter Indonesia Gemilang</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-[#383838]" />
              <span>Admin HR &amp; Monitoring</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-[#383838]" />
              <span>Hari Ini: {data.today}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1.5">
              Pusat Data &amp; Statistik Magang
            </h1>
            <p className="text-slate-500 dark:text-[#858585] text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Pantau kepatuhan pengisian logbook harian, status peninjauan mentor, sebaran divisi, dan ekspor data operasional program magang.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              onClick={exportDailyCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh CSV Logbook
            </button>
            <button
              onClick={exportWeeklyCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-[#1e1e1e] dark:hover:bg-[#2d2d2d] text-slate-700 dark:text-[#cccccc] text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200/70 dark:border-[#383838]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0b4e8c] dark:text-[#9cdcfe]" />
              CSV Mingguan
            </button>
          </div>
        </div>

        {/* Executive KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-slate-100 dark:border-[#2d2d2d]">
          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] uppercase tracking-wider">Peserta Magang</span>
              <GraduationCap className="w-4 h-4 text-[#0b4e8c] dark:text-[#9cdcfe]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{interns.length}</span>
              <span className="text-xs text-slate-500 dark:text-[#858585]">orang ({divisions.length} divisi)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#858585] uppercase tracking-wider">Mentor Pembimbing</span>
              <UserCheck className="w-4 h-4 text-amber-600 dark:text-[#dcdcaa]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{mentors.length}</span>
              <span className="text-xs text-slate-500 dark:text-[#858585]">
                aktif ({mentors.length > 0 ? (interns.length / mentors.length).toFixed(1) : 0} ratio)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-[#858585] uppercase tracking-wider">Total Logbook</span>
              <Activity className="w-4 h-4 text-[#0b4e8c] dark:text-[#9cdcfe]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{totalDaily}</span>
              <span className="text-xs text-slate-500 dark:text-[#858585]">entri ({approvedDaily} disetujui)</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-[#1b3424] border border-emerald-200/60 dark:border-[#2e6040] transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800 dark:text-[#4ec9b0] uppercase tracking-wider">Approval Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-[#4ec9b0]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-800 dark:text-[#4ec9b0] font-mono">{approvalRate}%</span>
              <span className="text-xs text-amber-600 dark:text-[#dcdcaa] font-medium">
                {pendingDaily} menunggu
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2d2d2d]">
        <nav className="flex space-x-6 sm:space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'overview'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Statistik &amp; Analitik
          </button>
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'daily'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Logbook Harian ({data.dailyActivities.length})
          </button>
          <button
            onClick={() => setActiveTab('weekly')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'weekly'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
            }`}
          >
            Target Mingguan ({data.weeklyPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-semibold transition-colors relative cursor-pointer ${
              activeTab === 'users'
                ? 'text-[#0b4e8c] dark:text-[#3794ff] border-b-2 border-[#0b4e8c] dark:border-[#3794ff]'
                : 'text-slate-500 dark:text-[#858585] hover:text-slate-800 dark:hover:text-[#cccccc]'
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
            <div className="lg:col-span-2 bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                    Distribusi Status Peninjauan Logbook
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Proporsi verifikasi aktivitas peserta oleh mentor</p>
                </div>
                <span className="text-xs font-mono font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] bg-blue-50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] px-2 py-0.5 rounded">
                  {totalDaily} Total Entri
                </span>
              </div>

              {/* Multi-segment distribution bar */}
              <div className="h-4 w-full bg-slate-100 dark:bg-[#1e1e1e] rounded-full overflow-hidden flex shadow-inner">
                {totalDaily > 0 ? (
                  <>
                    <div
                      style={{ width: `${(approvedDaily / totalDaily) * 100}%` }}
                      className="bg-emerald-500 dark:bg-[#4ec9b0] transition-all duration-500"
                      title={`Disetujui: ${approvedDaily}`}
                    />
                    <div
                      style={{ width: `${(pendingDaily / totalDaily) * 100}%` }}
                      className="bg-[#0b4e8c] dark:bg-[#0e639c] transition-all duration-500"
                      title={`Menunggu: ${pendingDaily}`}
                    />
                    <div
                      style={{ width: `${(revisionDaily / totalDaily) * 100}%` }}
                      className="bg-amber-500 dark:bg-[#cca700] transition-all duration-500"
                      title={`Revisi: ${revisionDaily}`}
                    />
                  </>
                ) : (
                  <div className="w-full bg-slate-200 dark:bg-[#2d2d2d]" />
                )}
              </div>

              {/* Status breakdown legend boxes */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#1b3424] border border-emerald-200/50 dark:border-[#2e6040]">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-[#4ec9b0] text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-[#4ec9b0]" />
                    <span>Disetujui</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-emerald-950 dark:text-white font-mono">{approvedDaily}</span>
                    <span className="text-[11px] text-emerald-700 dark:text-[#4ec9b0]/80">
                      ({totalDaily > 0 ? Math.round((approvedDaily / totalDaily) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78]">
                  <div className="flex items-center gap-1.5 text-[#0b4e8c] dark:text-[#9cdcfe] text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#0b4e8c] dark:bg-[#3794ff]" />
                    <span>Menunggu Review</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{pendingDaily}</span>
                    <span className="text-[11px] text-slate-500 dark:text-[#858585]">
                      ({totalDaily > 0 ? Math.round((pendingDaily / totalDaily) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-[#342c15] border border-amber-200/50 dark:border-[#5a4d22]">
                  <div className="flex items-center gap-1.5 text-amber-800 dark:text-[#dcdcaa] text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-[#cca700]" />
                    <span>Perlu Revisi</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-bold text-amber-950 dark:text-white font-mono">{revisionDaily}</span>
                    <span className="text-[11px] text-amber-700 dark:text-[#dcdcaa]/80">
                      ({totalDaily > 0 ? Math.round((revisionDaily / totalDaily) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Composition Card */}
            <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  Komposisi Kategori Tugas
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Aktivitas paling sering dicatat peserta</p>

                <div className="space-y-3 mt-4">
                  {categoryStats.slice(0, 4).map(([cat, count]) => {
                    const pct = totalDaily > 0 ? Math.round((count / totalDaily) * 100) : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700 dark:text-[#cccccc] truncate max-w-[170px]">{cat}</span>
                          <span className="font-mono text-slate-500 dark:text-[#858585] font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-[#1e1e1e] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-[#0b4e8c] dark:bg-[#0e639c] rounded-full"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {categoryStats.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-[#858585] py-6 text-center">Belum ada data aktivitas.</p>
              )}
            </div>
          </div>

          {/* Row 2: Division Comparison & Mentorship Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Division Performance Card */}
            <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                    Kinerja Magang Berdasarkan Divisi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Jumlah peserta &amp; pemenuhan verifikasi logbook</p>
                </div>
                <Building2 className="w-4 h-4 text-[#0b4e8c] dark:text-[#9cdcfe]" />
              </div>

              <div className="space-y-3.5">
                {divisionStats.map(item => (
                  <div
                    key={item.division}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] flex items-center justify-between gap-4"
                  >
                    <div>
                      <strong className="text-xs font-semibold text-slate-900 dark:text-white block">{item.division}</strong>
                      <span className="text-[11px] text-slate-500 dark:text-[#858585]">
                        {item.internCount} Peserta • {item.logCount} Total Log
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-emerald-800 dark:text-[#4ec9b0] bg-emerald-50 dark:bg-[#1b3424] border border-emerald-200/60 dark:border-[#2e6040] px-2 py-0.5 rounded">
                        {item.rate}% Approved
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-[#858585] block mt-0.5">
                        {item.approvedCount} dari {item.logCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mentorship Workload Card */}
            <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                    Kesehatan Mentoring &amp; Beban Kerja
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Jumlah bimbingan dan antrean review per mentor</p>
                </div>
                <UserCheck className="w-4 h-4 text-[#0b4e8c] dark:text-[#9cdcfe]" />
              </div>

              <div className="space-y-3.5">
                {mentorWorkload.map(item => (
                  <div
                    key={item.mentor.userId}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-semibold text-slate-900 dark:text-white">{item.mentor.nama}</strong>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-[#858585]">({item.mentor.divisi})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-[#858585] mt-0.5">
                        Membimbing: {item.mentees.length > 0 ? item.mentees.map(m => m.nama).join(', ') : 'Belum ada'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {item.pendingReviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-amber-800 dark:text-[#dcdcaa] bg-amber-50 dark:bg-[#342c15] border border-amber-200 dark:border-[#5a4d22] px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          {item.pendingReviewCount} Butuh Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium text-emerald-800 dark:text-[#4ec9b0] bg-emerald-50 dark:bg-[#1b3424] border border-emerald-200 dark:border-[#2e6040] px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#4ec9b0]" />
                          Up to date
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-[#858585] block mt-0.5">
                        {item.totalLogs} logbook bimbingan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Intern Activity Compliance Roster */}
          <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                  Status Kepatuhan Pengisian Peserta Magang
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#858585] mt-0.5">Ringkasan kedisiplinan pencatatan log harian &amp; target mingguan</p>
              </div>
              <span className="text-xs text-slate-400 dark:text-[#858585] font-mono">Total {internActivityRoster.length} Peserta Aktif</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#181818] border-y border-slate-200/60 dark:border-[#2d2d2d] text-slate-500 dark:text-[#858585] uppercase tracking-wider font-semibold text-[10px]">
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
                <tbody className="divide-y divide-slate-100 dark:divide-[#2d2d2d] text-slate-700 dark:text-[#cccccc]">
                  {internActivityRoster.map(item => {
                    const isCompliant = item.logCount > 0;
                    return (
                      <tr key={item.intern.userId} className="hover:bg-slate-50/70 dark:hover:bg-[#2a2d2e] transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {item.intern.nama}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-500 dark:text-[#858585]">{item.intern.divisi}</td>
                        <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-[#cccccc]">{item.mentorName}</td>
                        <td className="py-3 px-3 text-center font-mono font-medium">
                          {item.logCount} <span className="text-slate-400 dark:text-[#858585] text-[10px]">({item.approvedLogCount} acc)</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium">{item.weeklyCount}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-[#858585] whitespace-nowrap">
                          {item.lastLogDate}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isCompliant ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 dark:text-[#4ec9b0] bg-emerald-50 dark:bg-[#1b3424] border border-emerald-200/60 dark:border-[#2e6040] px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#4ec9b0]" />
                              Aktif Mengisi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-[#dcdcaa] bg-amber-50 dark:bg-[#342c15] border border-amber-200/60 dark:border-[#5a4d22] px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3 text-amber-600 dark:text-[#cca700]" />
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
          <div className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#858585] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama peserta, kata kunci deskripsi aktivitas..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
                >
                  <option value="all">Semua Divisi</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
                >
                  <option value="all">Semua Status</option>
                  <option value="Menunggu">Menunggu Review</option>
                  <option value="Disetujui">Disetujui</option>
                  <option value="Revisi">Perlu Revisi</option>
                </select>

                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
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
          <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#181818] border-b border-slate-200 dark:border-[#2d2d2d] text-slate-500 dark:text-[#858585] uppercase tracking-wider font-semibold text-[10px]">
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
                <tbody className="divide-y divide-slate-100 dark:divide-[#2d2d2d] text-slate-700 dark:text-[#cccccc]">
                  {filteredDaily.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-[#858585]">
                        Tidak ada logbook yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredDaily.map(d => {
                      const u = data.users.find(x => x.userId === d.User_ID);
                      return (
                        <tr key={d.Log_ID} className="hover:bg-slate-50/70 dark:hover:bg-[#2a2d2e] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-[#858585] whitespace-nowrap">
                            {d.Tanggal}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <strong className="text-slate-900 dark:text-white font-medium block">{d.Nama_Peserta}</strong>
                            <span className="text-[11px] text-slate-400 dark:text-[#858585]">{u?.divisi || '-'}</span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#383838] text-slate-700 dark:text-[#cccccc] px-2 py-0.5 rounded text-[11px]">
                              {d.Kategori}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <p className="line-clamp-2 text-slate-800 dark:text-[#cccccc]">{d.Deskripsi_Aktivitas}</p>
                            {d.Output_Link && (
                              <a
                                href={d.Output_Link.startsWith('http') ? d.Output_Link : `https://${d.Output_Link}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-[#0b4e8c] dark:text-[#9cdcfe] underline font-mono mt-0.5 block truncate max-w-xs"
                              >
                                {d.Output_Link}
                              </a>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={d.Status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-[#858585] max-w-xs truncate">
                            {d.Catatan_Mentor || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => viewDailyDetail(d)}
                              className="p-1.5 text-slate-400 hover:text-[#0b4e8c] dark:text-[#858585] dark:hover:text-[#3794ff] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#858585] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari target mingguan, nama peserta, minggu ISO..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDivision}
                  onChange={e => setSelectedDivision(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
                >
                  <option value="all">Semua Divisi</option>
                  {divisions.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
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
          <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#181818] border-b border-slate-200 dark:border-[#2d2d2d] text-slate-500 dark:text-[#858585] uppercase tracking-wider font-semibold text-[10px]">
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
                <tbody className="divide-y divide-slate-100 dark:divide-[#2d2d2d] text-slate-700 dark:text-[#cccccc]">
                  {filteredWeekly.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-[#858585]">
                        Tidak ada rencana mingguan yang sesuai filter.
                      </td>
                    </tr>
                  ) : (
                    filteredWeekly.map(w => {
                      const u = data.users.find(x => x.userId === w.User_ID);
                      return (
                        <tr key={w.Plan_ID} className="hover:bg-slate-50/70 dark:hover:bg-[#2a2d2e] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-[#0b4e8c] dark:text-[#9cdcfe] whitespace-nowrap">
                            {w.Minggu_Ke}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <strong className="text-slate-900 dark:text-white font-medium block">{w.Nama_Peserta}</strong>
                            <span className="text-[11px] text-slate-400 dark:text-[#858585]">{u?.divisi || '-'}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-md">
                            <p className="line-clamp-2 text-slate-800 dark:text-[#cccccc]">{w.Target_Mingguan}</p>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-[#858585] whitespace-nowrap">
                            {w.Tanggal_Input}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge status={w.Status} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-[#858585] max-w-xs truncate">
                            {w.Catatan_Mentor || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => viewWeeklyDetail(w)}
                              className="p-1.5 text-slate-400 hover:text-[#0b4e8c] dark:text-[#858585] dark:hover:text-[#3794ff] rounded-lg hover:bg-slate-100 dark:hover:bg-[#1e1e1e] transition-colors cursor-pointer"
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
          <div className="bg-white dark:bg-[#252526] rounded-2xl border border-slate-200/90 dark:border-[#2d2d2d] p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-[#858585] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama pengguna, ID, atau email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-slate-50/50 dark:bg-[#1e1e1e] text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={selectedDivision}
                onChange={e => setSelectedDivision(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#383838] bg-white dark:bg-[#1e1e1e] text-slate-700 dark:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc]"
              >
                <option value="all">Semua Divisi</option>
                {divisions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-[#252526] rounded-3xl border border-slate-200/90 dark:border-[#2d2d2d] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#181818] border-b border-slate-200 dark:border-[#2d2d2d] text-slate-500 dark:text-[#858585] uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role Sistem</th>
                    <th className="py-3 px-4">Divisi</th>
                    <th className="py-3 px-4">Relasi Mentoring</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#2d2d2d] text-slate-700 dark:text-[#cccccc]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-[#858585]">
                        Tidak ada pengguna yang sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => {
                      const mentor = data.users.find(m => m.userId === u.mentorId);
                      const mentees = interns.filter(i => i.mentorId === u.userId);

                      return (
                        <tr key={u.userId} className="hover:bg-slate-50/70 dark:hover:bg-[#2a2d2e] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-[#858585] whitespace-nowrap">
                            {u.userId}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {u.nama}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-[#cccccc] font-mono text-[11px] whitespace-nowrap">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                u.role === 'Peserta'
                                  ? 'bg-blue-50 text-[#0b4e8c] border-blue-200/70 dark:bg-[#1e2733] dark:text-[#9cdcfe] dark:border-[#264f78]'
                                  : u.role === 'Mentor'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200/70 dark:bg-[#342c15] dark:text-[#dcdcaa] dark:border-[#5a4d22]'
                                  : 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-[#1e1e1e] dark:text-[#cccccc] dark:border-[#383838]'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">{u.divisi}</td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-[#cccccc]">
                            {u.role === 'Peserta' ? (
                              mentor ? (
                                <span className="font-medium text-slate-800 dark:text-white">
                                  {mentor.nama} <span className="text-slate-400 dark:text-[#858585] font-mono text-[10px]">({mentor.userId})</span>
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-[#dcdcaa] italic">Belum ditentukan</span>
                              )
                            ) : u.role === 'Mentor' ? (
                              <span className="text-xs text-slate-500 dark:text-[#858585]">
                                {mentees.length} Peserta ({mentees.map(m => m.nama).join(', ') || '-'})
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => openResetPinModal(u)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-[#cccccc] hover:text-[#0b4e8c] dark:hover:text-white bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200/80 dark:hover:bg-[#2d2d2d] rounded-lg transition-colors cursor-pointer border border-slate-200/60 dark:border-[#383838]"
                              title={`Reset PIN ${u.nama}`}
                            >
                              <KeyRound className="w-3.5 h-3.5 text-[#0b4e8c] dark:text-[#9cdcfe]" />
                              <span>Reset PIN</span>
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2d2d2d]">
              <div className="flex items-center gap-2">
                <StatusBadge status={detailItem.status} />
                {detailItem.kategori && (
                  <span className="text-xs bg-slate-100 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] px-2 py-0.5 rounded text-slate-700 dark:text-[#cccccc]">
                    {detailItem.kategori}
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-500 dark:text-[#858585]">
                Mentor: <strong className="text-slate-800 dark:text-white">{detailItem.mentorName}</strong>
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-[#1e1e1e] border border-slate-200/60 dark:border-[#2d2d2d] text-xs">
              <span className="font-semibold text-slate-500 dark:text-[#858585] uppercase tracking-wider block text-[10px] mb-1">
                {detailItem.type === 'daily' ? 'Deskripsi Aktivitas:' : 'Target Mingguan:'}
              </span>
              <p className="text-slate-800 dark:text-[#cccccc] whitespace-pre-line leading-relaxed text-sm">
                {detailItem.content}
              </p>

              {detailItem.outputLink && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#2d2d2d] flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-[#858585] font-medium">Tautan Output:</span>
                  <a
                    href={
                      detailItem.outputLink.startsWith('http')
                        ? detailItem.outputLink
                        : `https://${detailItem.outputLink}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#0b4e8c] dark:text-[#9cdcfe] hover:underline font-mono break-all"
                  >
                    {detailItem.outputLink}
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              )}

              {detailItem.kendala && detailItem.kendala.trim() !== '' && detailItem.kendala !== 'Tidak ada kendala.' && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-[#2d2d2d] text-amber-900 dark:text-[#dcdcaa]">
                  <strong className="font-semibold text-amber-950 dark:text-[#e3b341]">Kendala Teknis:</strong> {detailItem.kendala}
                </div>
              )}
            </div>

            {detailItem.catatanMentor ? (
              <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-[#1e2733] border border-blue-200/60 dark:border-[#264f78] text-xs">
                <strong className="text-[#0b4e8c] dark:text-[#9cdcfe] block mb-1">Catatan dari Mentor:</strong>
                <p className="text-slate-700 dark:text-[#cccccc] italic leading-relaxed">{detailItem.catatanMentor}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-dashed border-slate-200 dark:border-[#2d2d2d] text-xs text-slate-400 dark:text-[#858585] text-center">
                Belum ada catatan mentor untuk entri ini.
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* RESET PIN MODAL (ADMIN HR) */}
      <Modal
        isOpen={resetPinModalOpen}
        onClose={() => setResetPinModalOpen(false)}
        title="Reset PIN Pengguna"
        subtitle={resetPinTarget ? `${resetPinTarget.nama} (${resetPinTarget.email})` : ''}
      >
        {resetPinTarget && (
          <form onSubmit={handleExecuteResetPin} className="space-y-4">
            {resetPinError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-[#341b1d] border border-rose-200 dark:border-[#5c2427] text-xs text-rose-800 dark:text-[#f48771] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-[#f48771] shrink-0" />
                <span>{resetPinError}</span>
              </div>
            )}

            {resetPinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-[#1b3424] border border-emerald-200 dark:border-[#2e6040] text-xs text-emerald-800 dark:text-[#4ec9b0] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 dark:text-[#4ec9b0] shrink-0" />
                <span>{resetPinSuccess}</span>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#383838] text-xs space-y-1">
              <span className="text-slate-500 dark:text-[#858585] font-medium">Pengguna yang direset:</span>
              <p className="font-semibold text-slate-800 dark:text-white">{resetPinTarget.nama} ({resetPinTarget.userId})</p>
              <p className="text-slate-500 dark:text-[#858585]">{resetPinTarget.email} • {resetPinTarget.role} ({resetPinTarget.divisi})</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#d4d4d4]">
                  PIN Baru Pengguna
                </label>
                <span className="text-[11px] text-slate-400 dark:text-[#858585]">Default: 1234 (4-8 digit)</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-[#858585]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="1234"
                  value={resetPinValue}
                  onChange={(e) => setResetPinValue(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#383838] focus:outline-none focus:ring-2 focus:ring-[#0b4e8c] dark:focus:ring-[#007acc] bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white tracking-widest font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-[#858585] mt-1">
                Sistem akan menyimpan PIN ini ke Google Spreadsheet. Sampaikan PIN ini kepada pemilik akun.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetPinModalOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-[#858585] hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={resetPinLoading}
                className="px-4 py-2 bg-[#0b4e8c] hover:bg-[#083b6b] dark:bg-[#0e639c] dark:hover:bg-[#1177bb] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {resetPinLoading ? 'Mereset...' : 'Simpan & Reset PIN'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
