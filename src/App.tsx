import React, { useState, useEffect, useCallback } from 'react';
import { User, PesertaData, MentorData, HRData } from './types';
import { api } from './api';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { PesertaView } from './components/PesertaView';
import { MentorView } from './components/MentorView';
import { HRView } from './components/HRView';
import { SettingsModal } from './components/SettingsModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

const SESSION_USER_KEY = 'maganghub_user';
const SESSION_PIN_KEY = 'maganghub_pin';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [pin, setPin] = useState<string>(() => {
    return sessionStorage.getItem(SESSION_PIN_KEY) || '';
  });

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!user || !pin) return;
    setLoading(true);
    setError(null);

    try {
      const res = await api.getData(user.email, pin);
      if (res.status === 'success') {
        setDashboardData(res.data);
      } else {
        setError(res.message || 'Gagal mengambil data dari server.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi gangguan jaringan.');
    } finally {
      setLoading(false);
    }
  }, [user, pin]);

  useEffect(() => {
    if (user && pin) {
      fetchData();
    }
  }, [user, pin, fetchData]);

  const handleLoginSuccess = (authUser: User, authPin: string) => {
    setUser(authUser);
    setPin(authPin);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(authUser));
    sessionStorage.setItem(SESSION_PIN_KEY, authPin);
  };

  const handleLogout = () => {
    setUser(null);
    setPin('');
    setDashboardData(null);
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(SESSION_PIN_KEY);
  };

  if (!user) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          onRefreshData={() => {}}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 flex flex-col font-sans">
      <Navbar
        user={user}
        onLogout={handleLogout}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1 font-semibold text-rose-900 underline hover:no-underline cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Coba Lagi
            </button>
          </div>
        )}

        {loading && !dashboardData ? (
          <div className="py-24 text-center">
            <div className="w-7 h-7 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-stone-500 font-medium tracking-wide">Memuat data logbook...</p>
          </div>
        ) : dashboardData ? (
          <>
            {user.role === 'Peserta' && (
              <PesertaView
                user={user}
                data={dashboardData as PesertaData}
                pin={pin}
                onRefresh={fetchData}
              />
            )}
            {user.role === 'Mentor' && (
              <MentorView
                user={user}
                data={dashboardData as MentorData}
                pin={pin}
                onRefresh={fetchData}
              />
            )}
            {user.role === 'HR' && (
              <HRView
                user={user}
                data={dashboardData as HRData}
                onRefresh={fetchData}
              />
            )}
          </>
        ) : null}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200/60 py-6 text-center text-xs text-stone-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} MagangHub — Dirancang sederhana, fokus pada progres.</p>
          <div className="flex items-center gap-4 text-stone-500">
            <button
              onClick={() => setSettingsOpen(true)}
              className="hover:text-stone-800 cursor-pointer"
            >
              Pengaturan API
            </button>
            <span>•</span>
            <button
              onClick={fetchData}
              className="hover:text-stone-800 cursor-pointer"
            >
              Sinkronisasi Ulang
            </button>
          </div>
        </div>
      </footer>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onRefreshData={fetchData}
      />
    </div>
  );
}
