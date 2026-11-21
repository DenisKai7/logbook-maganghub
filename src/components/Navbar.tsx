import React from 'react';
import { User } from '../types';
import { LogOut, Sliders, Database, UserCheck, ShieldCheck, GraduationCap } from 'lucide-react';
import { getScriptUrl } from '../api';

interface Props {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<Props> = ({ user, onLogout, onOpenSettings }) => {
  const hasScriptUrl = Boolean(getScriptUrl());

  const getRoleBadge = () => {
    switch (user.role) {
      case 'Peserta':
        return {
          icon: <GraduationCap className="w-3.5 h-3.5 text-sky-600" />,
          label: 'Peserta Magang',
          bg: 'bg-sky-50 text-sky-700 border-sky-200/60',
        };
      case 'Mentor':
        return {
          icon: <UserCheck className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Mentor Pembimbing',
          bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
        };
      case 'HR':
        return {
          icon: <ShieldCheck className="w-3.5 h-3.5 text-stone-700" />,
          label: 'Admin HR',
          bg: 'bg-stone-100 text-stone-800 border-stone-200',
        };
    }
  };

  const roleMeta = getRoleBadge();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 text-base tracking-tight">MagangHub</span>
              <span className="text-xs text-stone-400 font-mono hidden sm:inline">v1.0</span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">Sistem Pemantauan & Jurnal Magang</p>
          </div>
        </div>

        {/* User & Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Connection Status Pill */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-stone-200/80 hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="Konfigurasi URL Google Apps Script"
          >
            <Database className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden md:inline font-medium">
              {hasScriptUrl ? 'Terkoneksi Apps Script' : 'Mode Demo Lokal'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                hasScriptUrl ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* User Info */}
          <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-stone-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-stone-800 leading-tight">{user.nama}</p>
              <p className="text-[11px] text-stone-500">{user.divisi}</p>
            </div>

            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${roleMeta.bg}`}>
              {roleMeta.icon}
              <span className="hidden sm:inline">{roleMeta.label}</span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-1"
              title="Keluar"
              aria-label="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
