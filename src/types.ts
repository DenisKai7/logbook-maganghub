export type Role = 'Peserta' | 'Mentor' | 'HR';
export type ItemStatus = 'Menunggu' | 'Disetujui' | 'Revisi';

export const ACTIVITY_STATUS_OPTIONS = [
  'Done',
  'On Progress',
  'Cancelled',
  'Rescheduled'
] as const;
export type ActivityStatus = typeof ACTIVITY_STATUS_OPTIONS[number];

export const TARGET_STATUS_OPTIONS = [
  'Achieved',
  'In Progress',
  'Not Achieved',
  'Exceeded',
  'N/A'
] as const;
export type TargetStatus = typeof TARGET_STATUS_OPTIONS[number];

export interface User {
  userId: string;
  nama: string;
  email: string;
  role: Role;
  divisi: string;
  mentorId?: string;
}

export interface MenteeSummary {
  userId: string;
  nama: string;
  divisi: string;
}

export interface WeeklyPlan {
  Plan_ID: string;
  Tanggal_Input: string;
  Minggu_Ke: string;
  User_ID: string;
  Nama_Peserta: string;
  Mentor_ID: string;
  Target_Mingguan: string;
  Status: ItemStatus;
  Catatan_Mentor: string;
}

export interface DailyActivity {
  // New Spreadsheet Schema (Personal Daily Activities)
  No?: string | number;
  Date?: string;
  Start?: string;
  End?: string;
  Duration?: string | number;
  Activities?: string;
  'Activities Status'?: string;
  Activities_Status?: string;
  'Target Desc'?: string;
  Target_Desc?: string;
  'Target Status'?: string;
  Target_Status?: string;
  Note?: string;
  'Achieved Target Evidence'?: string;
  Achieved_Target_Evidence?: string;

  // Legacy & Compatibility Fields
  Log_ID?: string;
  Tanggal?: string;
  User_ID?: string;
  Nama_Peserta?: string;
  Mentor_ID?: string;
  Kategori?: string;
  Deskripsi_Aktivitas?: string;
  Output_Link?: string;
  Kendala?: string;
  Status?: ItemStatus | string;
  Catatan_Mentor?: string;
  rowIndex?: number;
}

// Accessor helpers to seamlessly support both new and legacy formats
export function getDailyNo(d: DailyActivity, index?: number): string {
  if (d.No !== undefined && d.No !== '') return String(d.No);
  if (d.Log_ID) return String(d.Log_ID).replace('DA-', '');
  return index !== undefined ? String(index + 1) : '1';
}

export function getDailyDate(d: DailyActivity): string {
  return d.Date || d.Tanggal || '-';
}

export function getDailyStart(d: DailyActivity): string {
  return d.Start || '-';
}

export function getDailyEnd(d: DailyActivity): string {
  return d.End || '-';
}

export function getDailyDuration(d: DailyActivity): string {
  if (d.Duration !== undefined && d.Duration !== '' && d.Duration !== null) {
    return String(d.Duration);
  }
  return '-';
}

export function getDailyActivities(d: DailyActivity): string {
  return d.Activities || d.Deskripsi_Aktivitas || '-';
}

export function getDailyActivitiesStatus(d: DailyActivity): string {
  return (
    d['Activities Status'] ||
    d.Activities_Status ||
    d.Status ||
    'Done'
  );
}

export function getDailyTargetDesc(d: DailyActivity): string {
  return d['Target Desc'] || d.Target_Desc || '-';
}

export function getDailyTargetStatus(d: DailyActivity): string {
  return d['Target Status'] || d.Target_Status || '-';
}

export function getDailyNote(d: DailyActivity): string {
  return d.Note || d.Catatan_Mentor || d.Kendala || '-';
}

export function getDailyEvidence(d: DailyActivity): string {
  return d['Achieved Target Evidence'] || d.Achieved_Target_Evidence || d.Output_Link || '';
}

export function isTotalSummaryRow(d: DailyActivity): boolean {
  const no = String(d.No || '').toUpperCase();
  const acts = String(d.Activities || d.Deskripsi_Aktivitas || '').toLowerCase();
  return no.includes('TOTAL') || acts.includes('0 aktivitas') || acts.includes('total aktivitas');
}

export function getDailyMenteeName(d: DailyActivity, users?: Array<User | MenteeSummary>): string {
  if (d.Nama_Peserta && d.Nama_Peserta.trim() !== '' && d.Nama_Peserta !== '-') {
    return d.Nama_Peserta.trim();
  }
  if (d.User_ID && users) {
    const found = users.find(u => String(u.userId).trim() === String(d.User_ID).trim());
    if (found) return found.nama;
  }
  return '-';
}

export interface PesertaData {
  mentorName: string;
  currentWeek: string;
  today: string;
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

export interface MentorData {
  mentees: MenteeSummary[];
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

export interface HRData {
  today: string;
  users: User[];
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  user?: User;
  data?: T;
}
