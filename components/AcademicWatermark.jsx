'use client';

import { useState, useEffect } from 'react';

export default function AcademicWatermark() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState({
    studentName: 'Rananto Aji Pradana',
    studentNIM: '251011700421',
    university: 'Universitas / Institut',
    course: 'Pemrograman Web & Rekayasa Perangkat Lunak',
    academicYear: '2025/2026'
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('juragan_bakso_watermark');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.studentName && parsed.studentName !== 'Nama Mahasiswa') {
          setData(parsed);
        } else {
          // Update to student's real data
          setData({
            ...parsed,
            studentName: 'Rananto Aji Pradana',
            studentNIM: '251011700421'
          });
          localStorage.setItem('juragan_bakso_watermark', JSON.stringify({
            ...parsed,
            studentName: 'Rananto Aji Pradana',
            studentNIM: '251011700421'
          }));
        }
      }
    } catch (e) {}
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('juragan_bakso_watermark', JSON.stringify(data));
    setIsEditing(false);
    alert('Data identitas mahasiswa berhasil disimpan!');
  };

  return (
    <>
      {/* Floating Pill Badge */}
      <div 
        onClick={() => setIsOpen(true)}
        className="academic-watermark-pill"
        title="Klik untuk melihat detail tugas kuliah & kelompok"
      >
        <span className="material-symbols-outlined text-[16px] text-primary-fixed">school</span>
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] text-primary-fixed opacity-90">Tugas Proyek Web (Next.js + MySQL)</span>
          <span className="text-[11px] font-bold text-white">{data.studentName} ({data.studentNIM})</span>
        </div>
        <span className="academic-watermark-badge">Demo</span>
      </div>

      {/* Detail Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-outline-variant/30 animate-fadeIn">
            
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-primary via-primary-container to-primary text-on-primary flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                  <span className="material-symbols-outlined text-[24px]">school</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-fixed">Informasi Tugas Akademik</span>
                  <h3 className="font-headline-sm text-lg font-bold text-white">Proyek Website Juragan Bakso</h3>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col gap-4 text-on-surface">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Mata Kuliah:</span>
                  <strong className="text-on-surface">{data.course}</strong>
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Perguruan Tinggi:</span>
                  <strong className="text-on-surface">{data.university}</strong>
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Tech Stack:</span>
                  <strong className="text-primary font-semibold">Next.js 14 + Node.js Backend + MySQL DB</strong>
                </div>
                <div className="w-full h-px bg-surface-container-highest my-0.5"></div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>Nama Mahasiswa:</span>
                  <strong className="text-primary font-bold text-sm">{data.studentName}</strong>
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant">
                  <span>NIM / NPM:</span>
                  <strong className="text-on-surface font-mono">{data.studentNIM}</strong>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed">
                Platform ini dibangun dengan arsitektur <strong>Next.js (App Router)</strong>, <strong>Node.js API Route Handlers</strong>, dan integrasi database <strong>MySQL</strong> dengan dukungan deployment instan di <strong>Vercel</strong>.
              </p>

              {/* Form Sesuaikan Data Mahasiswa */}
              <div className="border border-surface-container rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full p-3 bg-surface-container-high hover:bg-surface-container text-left text-xs font-bold text-on-surface flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-primary">edit</span>
                    Sesuaikan Nama &amp; NIM Anda (Untuk Dinilai Dosen)
                  </span>
                  <span className="material-symbols-outlined text-[16px]">
                    {isEditing ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {isEditing && (
                  <form onSubmit={handleSave} className="p-4 bg-surface-container-low flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-on-surface-variant">Nama Lengkap Mahasiswa / Kelompok:</label>
                      <input 
                        type="text" 
                        value={data.studentName}
                        onChange={(e) => setData({ ...data, studentName: e.target.value })}
                        className="px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface outline-none focus:border-primary" 
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-on-surface-variant">NIM / NPM:</label>
                        <input 
                          type="text" 
                          value={data.studentNIM}
                          onChange={(e) => setData({ ...data, studentNIM: e.target.value })}
                          className="px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface outline-none focus:border-primary" 
                          required 
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-on-surface-variant">Universitas / Kampus:</label>
                        <input 
                          type="text" 
                          value={data.university}
                          onChange={(e) => setData({ ...data, university: e.target.value })}
                          className="px-3 py-1.5 text-xs rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-on-surface outline-none focus:border-primary" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button 
                        type="submit" 
                        className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary text-xs font-bold rounded-lg transition-colors shadow-sm"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface-container border-t border-surface-container-high flex justify-between items-center text-xs">
              <span className="text-tertiary flex items-center gap-1 font-semibold">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Ready for Vercel Deploy
              </span>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-surface-container-highest hover:bg-surface-dim text-on-surface font-semibold rounded-lg transition-colors"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
