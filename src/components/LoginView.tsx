import React, { useState } from 'react';
import { api, getScriptUrl } from '../api';
import { User } from '../types';
import { Lock, Mail, ArrowRight, ShieldCheck, Database, KeyRound, Sparkles } from 'lucide-react';

interface Props {
  onLoginSuccess: (user: User, pin: string) => void;
  onOpenSettings: () => void;
}

const PRESET_ACCOUNTS = [
  { role: 'Peserta', name: 'Andi Pratama', email: 'andi@magang.com', pin: '1234', desc: 'Peserta Divisi IT & Digital' },
  { role: 'Mentor', name: 'Budi Santoso', email: 'budi@perusahaan.com', pin: '1234', desc: 'Mentor Divisi IT & Digital' },
  { role: 'HR', name: 'Admin HR', email: 'hr@perusahaan.com', pin: '1234', desc: 'Administrator HRD' },
];

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onOpenSettings }) => {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasScriptUrl = Boolean(getScriptUrl());

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
      setError(err.message || 'Koneksi gagal. Periksa koneksi internet atau URL API.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetEmail: string, presetPin: string) => {
    setEmail(presetEmail);
    setPin(presetPin);
    setError('');
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
          {/* Connection Status Banner */}
          {hasScriptUrl ? (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium truncate">Terhubung ke Apps Script</span>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[11px] font-semibold text-emerald-800 underline hover:no-underline shrink-0 ml-2 cursor-pointer"
              >
                Ubah URL
              </button>
            </div>
          ) : (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium truncate">Mode Simulasi Offline (Demo)</span>
              </div>
              <button
                type="button"
                onClick={onOpenSettings}
                className="text-[11px] font-semibold text-amber-900 underline hover:no-underline shrink-0 ml-2 cursor-pointer"
              >
                Hubungkan API
              </button>
            </div>
          )}

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-700">
                  Kode PIN
                </label>
                <span className="text-[11px] text-stone-400">4 digit</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••"
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

          {/* Quick preset accounts */}
          <div className="mt-6 pt-5 border-t border-stone-100">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-2.5 text-center">
              Akses Cepat Akun Uji Coba
            </p>
            <div className="space-y-1.5">
              {PRESET_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectPreset(acc.email, acc.pin)}
                  className="w-full text-left p-2.5 rounded-xl border border-stone-100 hover:border-stone-300 hover:bg-stone-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs font-semibold text-stone-800 group-hover:text-stone-950">
                        {acc.name}
                      </strong>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                        {acc.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5">{acc.desc}</p>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400 group-hover:text-stone-700">
                    PIN: {acc.pin}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer status & settings button */}
        <div className="mt-6 text-center">
          <button
            onClick={onOpenSettings}
            className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-stone-400" />
            <span>
              Backend: {hasScriptUrl ? 'Google Apps Script Aktif' : 'Simulasi Offline Aktif'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasScriptUrl ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
