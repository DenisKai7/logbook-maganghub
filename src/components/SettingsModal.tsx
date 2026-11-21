import React, { useState } from 'react';
import { Modal } from './Modal';
import { getScriptUrl, setScriptUrl, resetMockData } from '../api';
import { Check, RefreshCw, AlertCircle, Link2, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onRefreshData }) => {
  const [url, setUrl] = useState(getScriptUrl());
  const [saved, setSaved] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleSave = () => {
    setScriptUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onRefreshData();
  };

  const handleClear = () => {
    setUrl('');
    setScriptUrl('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onRefreshData();
  };

  const handleResetData = () => {
    if (confirm('Reset data lokal ke sampel awal? Perubahan data offline yang belum tersinkronisasi akan kembali ke awal.')) {
      resetMockData();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2500);
      onRefreshData();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfigurasi Backend API"
      subtitle="Hubungkan frontend ini ke Google Apps Script Web App atau gunakan mode offline"
    >
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1.5">
            URL Google Apps Script (Web App)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Link2 className="w-4 h-4" />
            </div>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-stone-900 transition-colors bg-stone-50/50"
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
            Dapatkan URL ini dari menu <strong>Deploy &gt; New deployment &gt; Web app</strong> di Google Apps Script (Access: Anyone).
            Jika dikosongkan, aplikasi otomatis beralih ke <strong>Mode Demo Lokal</strong> dengan sampel bawaan.
          </p>
        </div>

        {saved && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            Pengaturan URL tersimpan. Memuat ulang data...
          </div>
        )}

        {resetDone && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            Data simulasi berhasil direset ke kondisi awal.
          </div>
        )}

        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Sampel Lokal
          </button>

          <div className="flex items-center gap-2">
            {url && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-xs font-medium text-stone-500 hover:text-stone-700 cursor-pointer"
              >
                Gunakan Demo Lokal
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Simpan URL
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
