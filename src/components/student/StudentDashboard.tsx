import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  CalendarCheck,
  CalendarX,
  Clock,
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Percent
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { AttendanceBadge } from '../common/AttendanceBadge';
import {
  getStudentByEmail,
  getAttendanceForStudent,
  calculateStatsForStudent,
  getStudents
} from '../../services/dataService';
import { Student, AttendanceRecord, StudentAttendanceSummary } from '../../types';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [user?.email, user?.studentId]);

  const loadStudentData = async () => {
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

      // If still not found (e.g. demo mode or unregistered email), pick the first active student
      if (!currentStudent) {
        const all = await getStudents();
        currentStudent = all[0] || null;
      }

      if (currentStudent) {
        setStudent(currentStudent);
        const records = await getAttendanceForStudent(currentStudent.studentId);
        setAttendance(records);
        const computed = calculateStatsForStudent(currentStudent, records);
        setStats(computed);
      }
    } catch (err) {
      console.error('Error fetching student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group by month for chart
  const monthMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach((r) => {
    const m = r.date.substring(0, 7); // YYYY-MM
    if (!monthMap[m]) monthMap[m] = { present: 0, total: 0 };
    monthMap[m].total += 1;
    if (r.status === 'Present' || r.status === 'Late') {
      monthMap[m].present += 1;
    }
  });

  const chartData = Object.keys(monthMap)
    .sort()
    .slice(-6)
    .map((monthKey) => {
      const entry = monthMap[monthKey];
      const rate = entry.total > 0 ? Number(((entry.present / entry.total) * 100).toFixed(1)) : 0;
      const [year, month] = monthKey.split('-');
      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', {
        month: 'short'
      });
      return {
        month: `${monthName} '${year.slice(2)}`,
        rate,
        totalDays: entry.total,
        presentDays: entry.present
      };
    });

  // Recent 6 records
  const recentLogs = [...attendance]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // Classes needed calculation for < 75%
  const classesNeeded = stats && stats.isLowAttendance
    ? Math.max(0, Math.ceil(3 * stats.totalWorkingDays - 4 * stats.presentDays))
    : 0;

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 font-extrabold text-xl shadow-inner">
              {student?.name?.charAt(0) || 'S'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Welcome, {student?.name || user?.name || 'Student'}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {student?.status || 'Active'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-mono">
                {student?.registerNumber || 'REG-PENDING'} &bull; {student?.departmentName || 'Engineering'} &bull; {student?.year} ({student?.section})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => onNavigate('student-attendance')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm flex items-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Full History</span>
            </button>
            <button
              onClick={() => onNavigate('monthly-report')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Monthly Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low Attendance Warning Box if applicable */}
      {stats && stats.isLowAttendance && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Attendance Shortage Notice: {stats.percentage}%
              </h4>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Your attendance is below the mandatory university threshold of <strong>75%</strong>. You need to attend the next <strong>{classesNeeded}</strong> consecutive working days without absence to restore eligibility.
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-3 py-1 rounded-lg bg-rose-200/80 text-rose-900 border border-rose-300 self-end sm:self-center whitespace-nowrap">
            {classesNeeded} Days Needed
          </span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          id="stat-student-pct"
          title="Attendance Rate"
          value={loading ? '...' : `${stats?.percentage ?? 0}%`}
          subtitle={
            (stats?.percentage ?? 0) >= 75
              ? 'Meets eligibility threshold'
              : 'Below 75% requirement'
          }
          icon={Percent}
          colorScheme={(stats?.percentage ?? 0) >= 75 ? 'emerald' : 'rose'}
        />
        <StatCard
          id="stat-student-total-days"
          title="Total Working Days"
          value={loading ? '...' : (stats?.totalWorkingDays ?? 0)}
          subtitle="Classes conducted to date"
          icon={Calendar}
          colorScheme="indigo"
        />
        <StatCard
          id="stat-student-present-days"
          title="Days Present"
          value={loading ? '...' : (stats?.presentDays ?? 0)}
          subtitle="Attended lecture sessions"
          icon={CalendarCheck}
          colorScheme="emerald"
        />
        <StatCard
          id="stat-student-absent-days"
          title="Days Absent"
          value={loading ? '...' : (stats?.absentDays ?? 0)}
          subtitle="Missed academic sessions"
          icon={CalendarX}
          colorScheme="rose"
        />
        <StatCard
          id="stat-student-late-days"
          title="Late Check-Ins"
          value={loading ? '...' : (stats?.lateDays ?? 0)}
          subtitle="Recorded past grace window"
          icon={Clock}
          colorScheme="amber"
        />
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Attendance Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Percentage of classes attended each academic month
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
              Threshold: 75%
            </span>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No attendance logs found yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.rate >= 75 ? '#10b981' : '#f43f5e'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Academic Standing Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Examination Eligibility
                </h3>
                <p className="text-xs text-slate-500">Board Regulations</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-[11px] text-slate-500 block uppercase font-bold">
                  Status
                </span>
                <span
                  className={`text-sm font-extrabold ${
                    (stats?.percentage ?? 0) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {(stats?.percentage ?? 0) >= 75
                    ? 'Eligible for Regular Examinations'
                    : 'Warning: Shortage of Attendance'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70">
                <span className="text-[11px] text-slate-500 block uppercase font-bold">
                  University Condonation Buffer
                </span>
                <p className="text-xs text-slate-700 mt-0.5">
                  Scholars between 65% - 74% require medical certification approved by the Dean to sit for exams.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('student-profile')}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center"
            >
              View Full Academic Profile &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Recent Session Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recent Class Attendance Logs
            </h3>
            <p className="text-xs text-slate-500">
              Your most recent check-in and check-out timestamps
            </p>
          </div>
          <button
            onClick={() => onNavigate('student-attendance')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Full Calendar &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent attendance logs recorded.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Status</th>
                  <th className="pb-2.5">Check-In Time</th>
                  <th className="pb-2.5">Check-Out Time</th>
                  <th className="pb-2.5">Academic Session</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.map((r) => (
                  <tr key={r.attendanceId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 font-mono text-slate-700 font-medium">
                      {r.date}
                    </td>
                    <td className="py-2.5">
                      <AttendanceBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-2.5 text-slate-600 font-mono">
                      {r.checkInTime}
                    </td>
                    <td className="py-2.5 text-slate-600 font-mono">
                      {r.checkOutTime}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      Regular Academic Hours
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
