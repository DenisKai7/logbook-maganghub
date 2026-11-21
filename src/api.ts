import {
  User,
  WeeklyPlan,
  DailyActivity,
  ApiResponse,
  PesertaData,
  MentorData,
  HRData,
} from "./types";

// ponytail: in-memory + localStorage mock store covers offline test; upgrade to full GAS proxy when CORS requires it
const STORAGE_PREFIX = "maganghub_";
const SCRIPT_URL_KEY = `${STORAGE_PREFIX}script_url`;
const MOCK_DB_KEY = `${STORAGE_PREFIX}mock_db_v1`;

const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzZrxTZOvllQ8CjfMZH9sDguEEgwmbMsQ3OCWEC71sbP4XRlQS-Cv4KwnkFBiQdBI0udA/exec";

export function getScriptUrl(): string {
  const envUrl = (import.meta.env.VITE_APPS_SCRIPT_URL as string) || "";
  return envUrl.trim() || DEFAULT_SCRIPT_URL;
}

export function getCurrentIsoWeek(d = new Date()): string {
  const target = new Date(d.valueOf());
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((target.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    );
  return `${target.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export function getTodayStr(d = new Date()): string {
  return d.toISOString().split("T")[0];
}

// Initial seed matching the Apps Script setupDatabase()
interface MockDB {
  users: Array<User & { pin: string }>;
  weeklyPlans: WeeklyPlan[];
  dailyActivities: DailyActivity[];
}

function getInitialMockDB(): MockDB {
  return {
    users: [
      {
        userId: "HR001",
        nama: "Admin HR",
        email: "hr@perusahaan.com",
        pin: "1234",
        role: "HR",
        divisi: "HRD",
        mentorId: "",
      },
      {
        userId: "MNT01",
        nama: "Budi Santoso",
        email: "budi@perusahaan.com",
        pin: "1234",
        role: "Mentor",
        divisi: "IT & Digital",
        mentorId: "",
      },
      {
        userId: "MNT02",
        nama: "Siti Aminah",
        email: "siti@perusahaan.com",
        pin: "1234",
        role: "Mentor",
        divisi: "Operasional",
        mentorId: "",
      },
      {
        userId: "INT01",
        nama: "Andi Pratama",
        email: "andi@magang.com",
        pin: "1234",
        role: "Peserta",
        divisi: "IT & Digital",
        mentorId: "MNT01",
      },
      {
        userId: "INT02",
        nama: "Rina Wijaya",
        email: "rina@magang.com",
        pin: "1234",
        role: "Peserta",
        divisi: "Operasional",
        mentorId: "MNT02",
      },
    ],
    weeklyPlans: [
      {
        Plan_ID: "WP-001",
        Tanggal_Input: getTodayStr(),
        Minggu_Ke: getCurrentIsoWeek(),
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Target_Mingguan:
          "Menyelesaikan desain antarmuka dashboard dan integrasi API autentikasi peserta.",
        Status: "Menunggu",
        Catatan_Mentor: "",
      },
    ],
    dailyActivities: [
      {
        Log_ID: "DA-001",
        Tanggal: getTodayStr(),
        User_ID: "INT01",
        Nama_Peserta: "Andi Pratama",
        Mentor_ID: "MNT01",
        Kategori: "Mengerjakan Tugas",
        Deskripsi_Aktivitas:
          "Merancang komponen formulir pengisian logbook harian dengan validasi input dan tampilan adaptif mobile.",
        Output_Link: "https://github.com/contoh/dashboard-magang",
        Kendala: "Tidak ada kendala berarti.",
        Status: "Menunggu",
        Catatan_Mentor: "",
      },
    ],
  };
}

function loadMockDB(): MockDB {
  const raw = localStorage.getItem(MOCK_DB_KEY);
  if (!raw) {
    const seed = getInitialMockDB();
    saveMockDB(seed);
    return seed;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seed = getInitialMockDB();
    saveMockDB(seed);
    return seed;
  }
}

function saveMockDB(db: MockDB): void {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
}

export function resetMockData(): void {
  saveMockDB(getInitialMockDB());
}

async function sendRequest<T>(
  payload: Record<string, any>,
): Promise<ApiResponse<T>> {
  const url = getScriptUrl();

  // If live URL exists, try network call
  if (url) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: ApiResponse<T>;
      try {
        json = JSON.parse(text);
      } catch {
        if (
          text.includes("Halaman Tidak Ditemukan") ||
          text.includes("not found") ||
          text.includes("Error 404")
        ) {
          return {
            status: "error",
            message:
              'URL Google Apps Script mengembalikan 404 (Halaman Tidak Ditemukan). Pastikan deployment Web App aktif dan Who has access diset ke "Anyone".',
          };
        }
        if (text.includes("accounts.google.com") || text.includes("Sign in")) {
          return {
            status: "error",
            message:
              'Izin ditolak Google. Pastikan saat Deploy Web App, opsi "Who has access" dipilih "Anyone" (bukan "Only myself").',
          };
        }
        return {
          status: "error",
          message:
            "Respons dari server Google bukan format JSON. Periksa izin deployment Google Apps Script Anda.",
        };
      }

      return json;
    } catch (err: any) {
      return {
        status: "error",
        message: `Gagal terhubung ke Google Apps Script: ${err.message || "CORS/Network Error"}. Periksa koneksi atau URL Web App.`,
      };
    }
  }

  // Local storage mock implementation ONLY when url is completely empty
  return mockExecute(payload);
}

function mockExecute<T>(req: Record<string, any>): ApiResponse<T> {
  const db = loadMockDB();
  const action = req.action;

  if (action === "login") {
    const cleanEmail = String(req.email || "")
      .trim()
      .toLowerCase();
    const cleanPin = String(req.pin || "").trim();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.pin === cleanPin,
    );
    if (!user) {
      return { status: "error", message: "Email atau PIN salah." };
    }
    const safeUser: User = {
      userId: user.userId,
      nama: user.nama,
      email: user.email,
      role: user.role,
      divisi: user.divisi,
      mentorId: user.mentorId,
    };
    return { status: "success", user: safeUser };
  }

  // Auth check for non-login actions
  const cleanEmail = String(req.email || "")
    .trim()
    .toLowerCase();
  const cleanPin = String(req.pin || "").trim();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.pin === cleanPin,
  );
  if (!user) {
    return {
      status: "error",
      message: "Sesi tidak valid atau PIN berubah. Silakan login ulang.",
    };
  }

  if (action === "getData") {
    if (user.role === "Peserta") {
      const mentor = db.users.find((u) => u.userId === user.mentorId);
      const data: PesertaData = {
        mentorName: mentor ? mentor.nama : "-",
        currentWeek: getCurrentIsoWeek(),
        today: getTodayStr(),
        weeklyPlans: db.weeklyPlans
          .filter((w) => w.User_ID === user.userId)
          .slice()
          .reverse(),
        dailyActivities: db.dailyActivities
          .filter((d) => d.User_ID === user.userId)
          .slice()
          .reverse(),
      };
      return { status: "success", data: data as unknown as T };
    }

    if (user.role === "Mentor") {
      const mentees = db.users
        .filter((u) => u.role === "Peserta" && u.mentorId === user.userId)
        .map((u) => ({ userId: u.userId, nama: u.nama, divisi: u.divisi }));

      const data: MentorData = {
        mentees,
        weeklyPlans: db.weeklyPlans
          .filter((w) => w.Mentor_ID === user.userId)
          .slice()
          .reverse(),
        dailyActivities: db.dailyActivities
          .filter((d) => d.Mentor_ID === user.userId)
          .slice()
          .reverse(),
      };
      return { status: "success", data: data as unknown as T };
    }

    if (user.role === "HR") {
      const safeUsers: User[] = db.users.map((u) => ({
        userId: u.userId,
        nama: u.nama,
        email: u.email,
        role: u.role,
        divisi: u.divisi,
        mentorId: u.mentorId,
      }));

      const data: HRData = {
        today: getTodayStr(),
        users: safeUsers,
        weeklyPlans: db.weeklyPlans.slice().reverse(),
        dailyActivities: db.dailyActivities.slice().reverse(),
      };
      return { status: "success", data: data as unknown as T };
    }
  }

  if (action === "saveWeeklyPlan") {
    if (user.role !== "Peserta") {
      return {
        status: "error",
        message: "Hanya Peserta yang dapat mengisi Weekly Plan.",
      };
    }
    const payload = req.data || {};
    if (!payload.mingguKe || !payload.targetMingguan) {
      return {
        status: "error",
        message: "Minggu dan target mingguan wajib diisi.",
      };
    }

    if (payload.planId) {
      const target = db.weeklyPlans.find((w) => w.Plan_ID === payload.planId);
      if (!target)
        return {
          status: "error",
          message: "Data Weekly Plan tidak ditemukan.",
        };
      if (target.User_ID !== user.userId)
        return { status: "error", message: "Akses ditolak." };
      if (target.Status === "Disetujui")
        return {
          status: "error",
          message: "Plan yang sudah disetujui tidak bisa diedit.",
        };

      target.Tanggal_Input = getTodayStr();
      target.Minggu_Ke = String(payload.mingguKe).trim();
      target.Target_Mingguan = String(payload.targetMingguan).trim();
      target.Status = "Menunggu";
      saveMockDB(db);
      return { status: "success", message: "Weekly Plan berhasil diperbarui." };
    } else {
      const dup = db.weeklyPlans.find(
        (w) =>
          w.User_ID === user.userId &&
          w.Minggu_Ke === String(payload.mingguKe).trim(),
      );
      if (dup) {
        return {
          status: "error",
          message: `Weekly Plan untuk ${payload.mingguKe} sudah ada. Silakan edit data yang tersedia.`,
        };
      }
      const newPlan: WeeklyPlan = {
        Plan_ID: "WP-" + Date.now().toString().slice(-8),
        Tanggal_Input: getTodayStr(),
        Minggu_Ke: String(payload.mingguKe).trim(),
        User_ID: user.userId,
        Nama_Peserta: user.nama,
        Mentor_ID: user.mentorId || "",
        Target_Mingguan: String(payload.targetMingguan).trim(),
        Status: "Menunggu",
        Catatan_Mentor: "",
      };
      db.weeklyPlans.push(newPlan);
      saveMockDB(db);
      return { status: "success", message: "Weekly Plan berhasil disimpan." };
    }
  }

  if (action === "saveDailyActivity") {
    if (user.role !== "Peserta") {
      return {
        status: "error",
        message: "Hanya Peserta yang dapat mengisi Daily Activity.",
      };
    }
    const payload = req.data || {};
    if (!payload.tanggal || !payload.kategori || !payload.deskripsi) {
      return {
        status: "error",
        message: "Tanggal, kategori, dan deskripsi aktivitas wajib diisi.",
      };
    }

    if (payload.logId) {
      const target = db.dailyActivities.find((d) => d.Log_ID === payload.logId);
      if (!target)
        return {
          status: "error",
          message: "Data Daily Activity tidak ditemukan.",
        };
      if (target.User_ID !== user.userId)
        return { status: "error", message: "Akses ditolak." };
      if (target.Status === "Disetujui")
        return {
          status: "error",
          message: "Aktivitas yang sudah disetujui tidak bisa diedit.",
        };

      target.Tanggal = String(payload.tanggal).trim();
      target.Kategori = String(payload.kategori).trim();
      target.Deskripsi_Aktivitas = String(payload.deskripsi).trim();
      target.Output_Link = String(payload.outputLink || "").trim();
      target.Kendala = String(payload.kendala || "").trim();
      target.Status = "Menunggu";
      saveMockDB(db);
      return {
        status: "success",
        message: "Daily Activity berhasil diperbarui.",
      };
    } else {
      const newAct: DailyActivity = {
        Log_ID: "DA-" + Date.now().toString().slice(-8),
        Tanggal: String(payload.tanggal).trim() || getTodayStr(),
        User_ID: user.userId,
        Nama_Peserta: user.nama,
        Mentor_ID: user.mentorId || "",
        Kategori: String(payload.kategori).trim(),
        Deskripsi_Aktivitas: String(payload.deskripsi).trim(),
        Output_Link: String(payload.outputLink || "").trim(),
        Kendala: String(payload.kendala || "").trim(),
        Status: "Menunggu",
        Catatan_Mentor: "",
      };
      db.dailyActivities.push(newAct);
      saveMockDB(db);
      return { status: "success", message: "Daily Activity berhasil dicatat." };
    }
  }

  if (action === "reviewItem") {
    if (user.role !== "Mentor") {
      return {
        status: "error",
        message: "Hanya Mentor yang dapat melakukan review.",
      };
    }
    const payload = req.data || {};
    if (!payload.id || !["Disetujui", "Revisi"].includes(payload.status)) {
      return { status: "error", message: "Payload review tidak valid." };
    }

    if (payload.type === "weekly") {
      const target = db.weeklyPlans.find((w) => w.Plan_ID === payload.id);
      if (!target) return { status: "error", message: "Item tidak ditemukan." };
      if (target.Mentor_ID !== user.userId)
        return {
          status: "error",
          message: "Anda bukan mentor dari peserta ini.",
        };

      target.Status = payload.status;
      target.Catatan_Mentor = String(payload.catatan || "").trim();
      saveMockDB(db);
      return {
        status: "success",
        message: `Status berhasil diubah menjadi ${payload.status}.`,
      };
    } else {
      const target = db.dailyActivities.find((d) => d.Log_ID === payload.id);
      if (!target) return { status: "error", message: "Item tidak ditemukan." };
      if (target.Mentor_ID !== user.userId)
        return {
          status: "error",
          message: "Anda bukan mentor dari peserta ini.",
        };

      target.Status = payload.status;
      target.Catatan_Mentor = String(payload.catatan || "").trim();
      saveMockDB(db);
      return {
        status: "success",
        message: `Status berhasil diubah menjadi ${payload.status}.`,
      };
    }
  }

  if (action === "deleteItem") {
    if (user.role !== "Peserta") {
      return {
        status: "error",
        message: "Hanya Peserta yang dapat menghapus data.",
      };
    }
    const payload = req.data || {};
    if (!payload.id || !payload.type) {
      return { status: "error", message: "Payload hapus tidak valid." };
    }

    if (payload.type === "weekly") {
      const idx = db.weeklyPlans.findIndex((w) => w.Plan_ID === payload.id);
      if (idx === -1)
        return { status: "error", message: "Item tidak ditemukan." };
      if (db.weeklyPlans[idx].User_ID !== user.userId)
        return { status: "error", message: "Akses ditolak." };
      if (db.weeklyPlans[idx].Status !== "Menunggu") {
        return {
          status: "error",
          message: "Hanya item dengan status Menunggu yang dapat dihapus.",
        };
      }
      db.weeklyPlans.splice(idx, 1);
      saveMockDB(db);
      return {
        status: "success",
        message: "Rencana mingguan berhasil dihapus.",
      };
    } else {
      const idx = db.dailyActivities.findIndex((d) => d.Log_ID === payload.id);
      if (idx === -1)
        return { status: "error", message: "Item tidak ditemukan." };
      if (db.dailyActivities[idx].User_ID !== user.userId)
        return { status: "error", message: "Akses ditolak." };
      if (db.dailyActivities[idx].Status !== "Menunggu") {
        return {
          status: "error",
          message: "Hanya item dengan status Menunggu yang dapat dihapus.",
        };
      }
      db.dailyActivities.splice(idx, 1);
      saveMockDB(db);
      return {
        status: "success",
        message: "Aktivitas harian berhasil dihapus.",
      };
    }
  }

  return { status: "error", message: "Action tidak dikenali: " + action };
}

export const api = {
  login: (email: string, pin: string) =>
    sendRequest<{ user: User }>({ action: "login", email, pin }),
  getData: <T>(email: string, pin: string) =>
    sendRequest<T>({ action: "getData", email, pin }),
  saveWeeklyPlan: (
    email: string,
    pin: string,
    data: { mingguKe: string; targetMingguan: string; planId?: string },
  ) => sendRequest({ action: "saveWeeklyPlan", email, pin, data }),
  saveDailyActivity: (
    email: string,
    pin: string,
    data: {
      tanggal: string;
      kategori: string;
      deskripsi: string;
      outputLink?: string;
      kendala?: string;
      logId?: string;
    },
  ) => sendRequest({ action: "saveDailyActivity", email, pin, data }),
  reviewItem: (
    email: string,
    pin: string,
    data: {
      id: string;
      type: "weekly" | "daily";
      status: "Disetujui" | "Revisi";
      catatan: string;
    },
  ) => sendRequest({ action: "reviewItem", email, pin, data }),
  deleteItem: (
    email: string,
    pin: string,
    data: { id: string; type: "weekly" | "daily" },
  ) => sendRequest({ action: "deleteItem", email, pin, data }),
};
