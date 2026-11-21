import React, { useState } from 'react';
import { api } from '../api';
import { User } from '../types';
import { Mail, ArrowRight, KeyRound } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User, pin: string) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !pin.trim()) {
      setError('Email dan PIN wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email.trim(), pin.trim());
      if (res.status === 'success' && res.user) {
        onLoginSuccess(res.user, pin.trim());
      } else {
        setError(res.message || 'Email atau PIN salah.');
      }
    } catch (err: any) {
      setError(err.message || 'Koneksi gagal. Periksa koneksi internet atau server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Icon */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            M
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
          MagangHub
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-stone-500">
          Sistem Pemantauan Logbook &amp; Aktivitas Magang
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-stone-200/80 shadow-xl shadow-stone-200/30">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Kode PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  maxLength={20}
                  placeholder="••••••"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-stone-50/40 tracking-widest font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 active:scale-[0.99] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
