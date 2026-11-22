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

export const KANBAN_PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type KanbanPriority = typeof KANBAN_PRIORITY_OPTIONS[number];

export const KANBAN_STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done', 'Blocked'] as const;
export type KanbanStatus = typeof KANBAN_STATUS_OPTIONS[number];

export const KANBAN_REVIEW_OPTIONS = ['Menunggu', 'Disetujui', 'Revisi'] as const;
export type KanbanReview = typeof KANBAN_REVIEW_OPTIONS[number];

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

export interface KanbanItem {
  No?: string | number;
  Task?: string;
  User?: string;
  Priority?: KanbanPriority | string;
  Status?: KanbanStatus | string;
  'Due Date'?: string;
  Due_Date?: string;
  dueDate?: string;
  Start?: string;
  End?: string;
  Evidence?: string;
  Review?: KanbanReview | string;
  User_ID?: string;
  Mentor_ID?: string;
  _rowIndex?: number;

  // Backward compatibility fields with WeeklyPlan
  Plan_ID?: string;
  Tanggal_Input?: string;
  Minggu_Ke?: string;
  Nama_Peserta?: string;
  Target_Mingguan?: string;
  Catatan_Mentor?: string;
}

// Accessor helpers for Kanban
export function getKanbanNo(k: KanbanItem, index?: number): string {
  if (k.No !== undefined && k.No !== '') return String(k.No);
  if (k.Plan_ID) return String(k.Plan_ID).replace('WP-', '');
  return index !== undefined ? String(index + 1) : '1';
}

export function getKanbanTask(k: KanbanItem): string {
  return k.Task || k.Target_Mingguan || '-';
}

export function getKanbanUser(k: KanbanItem, users?: Array<User | MenteeSummary>): string {
  if (k.User && k.User.trim() !== '') return k.User.trim();
  if (k.Nama_Peserta && k.Nama_Peserta.trim() !== '') return k.Nama_Peserta.trim();
  if (k.User_ID && users) {
    const found = users.find(u => String(u.userId).trim() === String(k.User_ID).trim());
    if (found) return found.nama;
  }
  return '-';
}

export function getKanbanPriority(k: KanbanItem): KanbanPriority {
  const p = (k.Priority || 'Medium') as KanbanPriority;
  return KANBAN_PRIORITY_OPTIONS.includes(p) ? p : 'Medium';
}

export function getKanbanStatus(k: KanbanItem): KanbanStatus {
  const s = (k.Status || 'To Do') as KanbanStatus;
  if (KANBAN_STATUS_OPTIONS.includes(s)) return s;
  if ((s as string) === 'Disetujui') return 'Done';
  if ((s as string) === 'Revisi') return 'In Review';
  return 'To Do';
}

export function getKanbanDueDate(k: KanbanItem): string {
  return k['Due Date'] || k.Due_Date || k.dueDate || k.Minggu_Ke || '-';
}

export function getKanbanReview(k: KanbanItem): KanbanReview {
  const r = (k.Review || k.Catatan_Mentor || 'Menunggu') as KanbanReview;
  if (KANBAN_REVIEW_OPTIONS.includes(r)) return r;
  if (k.Status && KANBAN_REVIEW_OPTIONS.includes(k.Status as any)) {
    return k.Status as KanbanReview;
  }
  return 'Menunggu';
}

export function getKanbanEvidence(k: KanbanItem): string {
  return k.Evidence || '';
}

// Aliased for legacy code
export type WeeklyPlan = KanbanItem;

export interface DailyActivity {
  // Spreadsheet Schema (Personal Daily Activities)
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
  User_ID?: string;
  Nama_Peserta?: string;
  Mentor_ID?: string;
  _rowIndex?: number;

  // Legacy & Compatibility Fields
  Log_ID?: string;
  Tanggal?: string;
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
  kanbanItems?: KanbanItem[];
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

export interface MentorData {
  mentees: MenteeSummary[];
  kanbanItems?: KanbanItem[];
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

export interface HRData {
  today: string;
  users: User[];
  kanbanItems?: KanbanItem[];
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  user?: User;
  data?: T;
}
