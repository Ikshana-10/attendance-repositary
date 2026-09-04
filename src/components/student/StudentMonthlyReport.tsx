import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarDays,
  Printer,
  CalendarCheck,
  CalendarX,
  Clock,
  Award,
  AlertTriangle,
  Percent,
  CheckCircle2
} from 'lucide-react';
import {
  getStudentByEmail,
  getAttendanceForStudent,
  getStudents
} from '../../services/dataService';
import { Student, AttendanceRecord } from '../../types';
import { AttendanceBadge } from '../common/AttendanceBadge';

export const StudentMonthlyReport: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Month & Year selection
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState<string>(String(today.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>(
    String(today.getMonth() + 1).padStart(2, '0')
  );

  useEffect(() => {
    loadData();
  }, [user?.email, user?.studentId]);

  const loadData = async () => {
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
        const records = await getAttendanceForStudent(currentStudent.studentId);
        setAllRecords(records);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthPrefix = `${selectedYear}-${selectedMonth}`;
  const monthRecords = allRecords
    .filter((r) => r.date.startsWith(monthPrefix))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalDays = monthRecords.length;
  const presentDays = monthRecords.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const absentDays = monthRecords.filter((r) => r.status === 'Absent').length;
  const lateDays = monthRecords.filter((r) => r.status === 'Late').length;

  const percentage = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0;
  const isEligible = percentage >= 75;

  const monthNames = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const currentMonthLabel = monthNames.find((m) => m.value === selectedMonth)?.label || 'Month';

  return (
    <div className="space-y-6">
      {/* Header with Print */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            Monthly Attendance Statement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Detailed monthly breakdown and official attendance certificate
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Statement</span>
          </button>
        </div>
      </div>

      {/* Month Selection Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white font-medium text-slate-800"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white font-medium text-slate-800"
            >
              {monthNames.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Printable Statement Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Certificate / Statement Title */}
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Apex Institute of Technology &amp; Engineering
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Office of Academic Dean &bull; Official Student Attendance Record
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 block">
              {currentMonthLabel} {selectedYear}
            </span>
          </div>
        </div>

        {/* Scholar Identification */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Student Name</span>
            <span className="font-bold text-slate-900">{student?.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Register Number</span>
            <span className="font-mono font-bold text-slate-900">{student?.registerNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
            <span className="font-semibold text-slate-900">{student?.departmentName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Class / Section</span>
            <span className="font-semibold text-slate-900">{student?.year} &bull; Sec {student?.section}</span>
          </div>
        </div>

        {/* Monthly Summary Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 bg-white text-center">
            <span className="text-xs text-slate-500 block">Working Sessions</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{totalDays}</span>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-center">
            <span className="text-xs text-emerald-800 block">Days Present</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">{presentDays}</span>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 text-center">
            <span className="text-xs text-rose-800 block">Days Absent</span>
            <span className="text-2xl font-bold text-rose-700 mt-1 block">{absentDays}</span>
          </div>

          <div
            className={`p-4 rounded-xl border text-center ${
              isEligible
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            }`}
          >
            <span className="text-xs block font-semibold">Monthly Percentage</span>
            <span className="text-2xl font-black mt-1 block">{percentage}%</span>
            <span className="text-[10px] font-bold block mt-0.5">
              {totalDays === 0
                ? 'No sessions'
                : isEligible
                ? 'Eligible (>=75%)'
                : 'Below Standard (<75%)'}
            </span>
          </div>
        </div>

        {/* Day-by-Day Roster for Selected Month */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Day-by-Day Session Logs for {currentMonthLabel} {selectedYear}
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            {monthRecords.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No attendance sessions logged for {currentMonthLabel} {selectedYear}.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Check-In</th>
                    <th className="py-2.5 px-4">Check-Out</th>
                    <th className="py-2.5 px-4 text-right">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthRecords.map((r) => (
                    <tr key={r.attendanceId} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                        {r.date}
                      </td>
                      <td className="py-2.5 px-4">
                        <AttendanceBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {r.checkInTime}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-600">
                        {r.checkOutTime}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500">
                        {r.status === 'Present'
                          ? 'Full Attendance'
                          : r.status === 'Late'
                          ? 'Late check-in recorded'
                          : 'Unexcused Absence'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Official Certification Signature Area */}
        <div className="pt-8 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-800">System Generated Document</p>
            <p className="text-[11px] text-slate-400">CampusTrack Secure Academic Engine</p>
          </div>
          <div className="text-right">
            <div className="w-36 border-b border-slate-300 pb-1 mb-1" />
            <p className="font-semibold text-slate-800">Head of Department</p>
            <p className="text-[11px] text-slate-400">Authorized Academic Seal</p>
          </div>
        </div>
      </div>
    </div>
  );
};
