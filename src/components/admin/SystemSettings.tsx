import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Building,
  Clock,
  Percent,
  Database,
  Save,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { seedInitialData } from '../../services/dataService';

interface SystemSettingsProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ onShowToast }) => {
  const [institutionName, setInstitutionName] = useState('Apex Institute of Technology & Engineering');
  const [academicTerm, setAcademicTerm] = useState('Academic Year 2026 - 2027 (Odd Semester)');
  const [minThreshold, setMinThreshold] = useState('75');
  const [standardCheckIn, setStandardCheckIn] = useState('09:00 AM');
  const [standardCheckOut, setStandardCheckOut] = useState('04:30 PM');
  const [gracePeriod, setGracePeriod] = useState('15');
  const [isResetting, setIsResetting] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onShowToast('success', 'Settings Updated', 'Academic rules and institutional parameters have been saved.');
  };

  const handleReSeed = async () => {
    setIsResetting(true);
    try {
      const res = await seedInitialData(true);
      onShowToast('success', 'Database Seeded', res.message);
    } catch (err: any) {
      onShowToast('error', 'Seeding Failed', err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          Academic Institution Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure institutional thresholds, session timings, and database administrative tools.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" />
            Institutional Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College / University Name
              </label>
              <input
                type="text"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Academic Term
              </label>
              <input
                type="text"
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-900"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Percent className="w-4 h-4 text-indigo-600" />
            Attendance Rules & Thresholds
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Mandatory Attendance (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-900 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Scholars below this figure are flagged for low-attendance interventions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Late Arrival Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={gracePeriod}
                onChange={(e) => setGracePeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-900 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tolerance buffer before check-ins are registered as &quot;Late&quot;.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Standard Timings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Morning Check-In Time
              </label>
              <input
                type="text"
                value={standardCheckIn}
                onChange={(e) => setStandardCheckIn(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Evening Check-Out Time
              </label>
              <input
                type="text"
                value={standardCheckOut}
                onChange={(e) => setStandardCheckOut(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* Database Reset & Sample Data Tools */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-600" />
          Data Seeding &amp; Reset Desk
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Need fresh sample departments, students, and 20 days of realistic attendance history (including low-attendance scenarios)? Click below to re-seed the system.
        </p>

        <button
          type="button"
          onClick={handleReSeed}
          disabled={isResetting}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-2"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Populating Database...' : 'Re-Seed Sample Academic Data'}</span>
        </button>
      </div>
    </div>
  );
};
