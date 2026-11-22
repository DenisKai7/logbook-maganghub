import {
  User,
  WeeklyPlan,
  DailyActivity,
  ApiResponse,
  PesertaData,
  MentorData,
  HRData,
} from "./types";

const STORAGE_PREFIX = "maganghub_";
const MOCK_DB_KEY = `${STORAGE_PREFIX}mock_db_v1`;

// GANTI dengan URL /exec dari deployment Web App yang AKTIF (Deploy > Manage deployments).
// Bisa juga diatur lewat VITE_APPS_SCRIPT_URL di .env (nilai .env menimpa default ini).
const DEFAULT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzVcBBJNwRRHMfhyutoOOAd2lKyrlpMM_UBn78UW-psytnijN6gEvqc_L00ggs2VJZSHA/exec";

// Set VITE_USE_MOCK=true di .env untuk tes offline memakai localStorage (tanpa Google Apps Script).
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK || "") === "true";

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

// Memakai tanggal lokal (bukan toISOString yang UTC) supaya tidak mundur sehari sebelum pukul 07.00 WIB.
export function getTodayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Mock database (hanya dipakai jika VITE_USE_MOCK=true)
// ---------------------------------------------------------------------------

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

function saveMockDB(db: MockDB): void {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(db));
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

export function resetMockData(): void {
  saveMockDB(getInitialMockDB());
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------

const STALE_DEPLOYMENT_HINT =
  " (Server Google Apps Script yang dipanggil belum memuat action ini. " +
  "Kemungkinan URL /exec di frontend mengarah ke deployment lama, atau deployment belum diperbarui ke New version. " +
  "Periksa VITE_APPS_SCRIPT_URL / DEFAULT_SCRIPT_URL dan restart dev server.)";

async function sendRequest<T>(
  payload: Record<string, any>,
): Promise<ApiResponse<T>> {
  if (USE_MOCK) {
    return mockExecute<T>(payload);
  }

  const url = getScriptUrl();

  if (import.meta.env.DEV) {
    console.log("[api] URL:", url, "| action:", payload.action);
  }

  if (!url) {
    return {
      status: "error",
      message:
        "URL Google Apps Script belum diatur. Isi VITE_APPS_SCRIPT_URL atau DEFAULT_SCRIPT_URL.",
    };
  }

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

    // Beri petunjuk jelas jika deployment di server belum punya action tersebut.
    if (
      json.status === "error" &&
      typeof json.message === "string" &&
      json.message.startsWith("Action tidak dikenali")
    ) {
      return { ...json, message: json.message + STALE_DEPLOYMENT_HINT };
    }

    return json;
  } catch (err: any) {
    return {
      status: "error",
      message: `Gagal terhubung ke Google Apps Script: ${err.message || "CORS/Network Error"}. Periksa koneksi atau URL Web App.`,
    };
  }
}

// Cek deployment mana yang sedang dipanggil (membaca field "version" dari doGet).
export async function pingBackend(): Promise<{
  url: string;
  ok: boolean;
  version?: string;
  message?: string;
}> {
  const url = getScriptUrl();
  try {
    const res = await fetch(url, { method: "GET" });
    const json = JSON.parse(await res.text());
    return {
      url,
      ok: json.status === "success",
      version: json.version,
      message: json.message,
    };
  } catch (err: any) {
    return { url, ok: false, message: err.message || "Gagal terhubung." };
  }
}

// ---------------------------------------------------------------------------
// Mock executor (mencerminkan perilaku Apps Script)
// ---------------------------------------------------------------------------

function mockExecute<T>(req: Record<string, any>): ApiResponse<T> {
  const db = loadMockDB();
  const action = req.action;

  const cleanEmail = String(req.email || "")
    .trim()
    .toLowerCase();
  const cleanPin = String(req.pin || "").trim();
  const user = db.users.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.pin === cleanPin,
  );

  if (action === "login") {
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

    return { status: "error", message: "Role tidak valid." };
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
    }

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
    }

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

    const target =
      payload.type === "weekly"
        ? db.weeklyPlans.find((w) => w.Plan_ID === payload.id)
        : db.dailyActivities.find((d) => d.Log_ID === payload.id);

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

  if (action === "deleteItem") {
    const payload = req.data || {};
    if (!payload.id || !["weekly", "daily"].includes(payload.type)) {
      return { status: "error", message: "Payload hapus tidak valid." };
    }
    if (user.role !== "Peserta" && user.role !== "HR") {
      return {
        status: "error",
        message: "Role tidak memiliki izin menghapus item.",
      };
    }

    const isWeekly = payload.type === "weekly";
    const list: Array<WeeklyPlan | DailyActivity> = isWeekly
      ? db.weeklyPlans
      : db.dailyActivities;
    const idx = list.findIndex((item) =>
      isWeekly
        ? (item as WeeklyPlan).Plan_ID === payload.id
        : (item as DailyActivity).Log_ID === payload.id,
    );
    if (idx === -1)
      return { status: "error", message: "Item tidak ditemukan." };

    const item = list[idx];
    if (user.role === "Peserta") {
      if (item.User_ID !== user.userId)
        return { status: "error", message: "Akses ditolak." };
      if (item.Status === "Disetujui") {
        return {
          status: "error",
          message: "Item yang sudah disetujui tidak bisa dihapus.",
        };
      }
    }

    list.splice(idx, 1);
    saveMockDB(db);
    return { status: "success", message: "Data berhasil dihapus." };
  }

  if (action === "resetPin") {
    if (user.role !== "HR") {
      return {
        status: "error",
        message: "Hanya HR yang dapat mereset PIN pengguna.",
      };
    }
    const payload = req.data || {};
    if (!payload.userId && !payload.email) {
      return {
        status: "error",
        message: "Target userId atau email wajib diisi.",
      };
    }
    const nextPin = String(payload.newPin || "1234").trim();
    if (!/^\d{4,8}$/.test(nextPin)) {
      return {
        status: "error",
        message: "PIN harus terdiri dari 4 sampai 8 digit angka.",
      };
    }
    const target = db.users.find(
      (u) =>
        (payload.userId && u.userId === String(payload.userId).trim()) ||
        (payload.email &&
          u.email.toLowerCase() === String(payload.email).trim().toLowerCase()),
    );
    if (!target)
      return { status: "error", message: "Pengguna tidak ditemukan." };
    target.pin = nextPin;
    saveMockDB(db);
    return {
      status: "success",
      message: "PIN berhasil direset.",
      data: {
        userId: target.userId,
        email: target.email,
        resetPin: nextPin,
      } as unknown as T,
    };
  }

  if (action === "changePin") {
    const payload = req.data || {};
    if (!payload.currentPin || !payload.newPin) {
      return { status: "error", message: "PIN lama dan PIN baru wajib diisi." };
    }
    const currentPin = String(payload.currentPin).trim();
    const newPin = String(payload.newPin).trim();
    if (!/^\d{4,8}$/.test(newPin)) {
      return {
        status: "error",
        message: "PIN baru harus terdiri dari 4 sampai 8 digit angka.",
      };
    }
    const target = db.users.find((u) => u.userId === user.userId);
    if (!target)
      return { status: "error", message: "Akun pengguna tidak ditemukan." };
    if (target.pin !== currentPin) {
      return { status: "error", message: "PIN lama tidak sesuai." };
    }
    target.pin = newPin;
    saveMockDB(db);
    return {
      status: "success",
      message:
        "PIN berhasil diubah. Silakan gunakan PIN baru saat login berikutnya.",
    };
  }

  return { status: "error", message: "Action tidak dikenali: " + action };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

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
  resetPin: (
    email: string,
    pin: string,
    data: { userId?: string; email?: string; newPin?: string },
  ) =>
    sendRequest<{ userId: string; email: string; resetPin: string }>({
      action: "resetPin",
      email,
      pin,
      data,
    }),
  changePin: (
    email: string,
    pin: string,
    data: { currentPin: string; newPin: string },
  ) => sendRequest({ action: "changePin", email, pin, data }),
};
