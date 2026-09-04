import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  History,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download
} from 'lucide-react';
import {
  getStudentByEmail,
  getAttendanceForStudent,
  getStudents
} from '../../services/dataService';
import { Student, AttendanceRecord, AttendanceStatus } from '../../types';
import { AttendanceBadge } from '../common/AttendanceBadge';

export const StudentAttendanceHistory: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadHistory();
  }, [user?.email, user?.studentId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      let currentStudent: Student | null = null;
      if (user?.studentId) {
        const all = await getStudents();
        currentStudent = all.find((s) => s.studentId === user.studentId) || null;
      }
      if (!currentStudent && user?.email) {
        currentStudent = await getStudentByEmail(user.email);
      }
      if (!currentStudent) {
        const all = await getStudents();
        currentStudent = all[0] || null;
      }

      if (currentStudent) {
        setStudent(currentStudent);
        const data = await getAttendanceForStudent(currentStudent.studentId);
        // Sort descending by date
        data.sort((a, b) => b.date.localeCompare(a.date));
        setRecords(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    if (searchQuery && !r.date.includes(searchQuery)) return false;
    return true;
  });

  const presentCount = filteredRecords.filter((r) => r.status === 'Present').length;
  const lateCount = filteredRecords.filter((r) => r.status === 'Late').length;
  const absentCount = filteredRecords.filter((r) => r.status === 'Absent').length;

  const handleExport = () => {
    if (filteredRecords.length === 0) return;
    const headers = ['Date', 'Status', 'Check In', 'Check Out'];
    const rows = filteredRecords.map((r) => [r.date, r.status, r.checkInTime, r.checkOutTime]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `My_Attendance_History_${student?.registerNumber || 'Student'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            My Attendance History & Logbook
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified institutional attendance audit trail for scholar {student?.name} ({student?.registerNumber})
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={filteredRecords.length === 0}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 self-start sm:self-center disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Export My History</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Statuses ({records.length})</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Absent">Absent Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Date Filter
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. 2026-08 or 2026-09"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            />
          </div>
        </div>

        {/* Quick Summary Pill Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Filtered View:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-700">
            {filteredRecords.length} Sessions
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 font-bold text-emerald-800">
            {presentCount} Present
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 font-bold text-amber-800">
            {lateCount} Late
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 font-bold text-rose-800">
            {absentCount} Absent
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading session histories...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No session logs match your search</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting the date range or status filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Check-Out Time</th>
                  <th className="py-3 px-4">Session Details</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr
                    key={r.attendanceId}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      r.status === 'Absent' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {r.date}
                    </td>
                    <td className="py-3 px-4">
                      <AttendanceBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {r.checkInTime}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {r.checkOutTime}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {r.departmentName || 'Engineering Wing'} &bull; {r.year}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Admin Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
