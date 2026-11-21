export type Role = 'Peserta' | 'Mentor' | 'HR';
export type ItemStatus = 'Menunggu' | 'Disetujui' | 'Revisi';

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
  Log_ID: string;
  Tanggal: string;
  User_ID: string;
  Nama_Peserta: string;
  Mentor_ID: string;
  Kategori: string;
  Deskripsi_Aktivitas: string;
  Output_Link: string;
  Kendala: string;
  Status: ItemStatus;
  Catatan_Mentor: string;
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
