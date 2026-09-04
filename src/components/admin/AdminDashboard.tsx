import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  Percent,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  CalendarCheck2,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Cell
} from 'recharts';
import { StatCard } from '../common/StatCard';
import { AttendanceBadge } from '../common/AttendanceBadge';
import {
  getStudents,
  getDepartments,
  getAllAttendance,
  calculateStatsForStudent,
  seedInitialData
} from '../../services/dataService';
import { Student, Department, AttendanceRecord, StudentAttendanceSummary } from '../../types';

interface AdminDashboardProps {
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allDepts, allStudents, allRecords] = await Promise.all([
        getDepartments(),
        getStudents(),
        getAllAttendance()
      ]);

      setDepartments(allDepts);
      setStudents(allStudents);
      setAttendance(allRecords);

      // Calculate individual attendance rates for students
      const summaries = allStudents.map((st) =>
        calculateStatsForStudent(st, allRecords)
      );
      setStudentSummaries(summaries);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    await seedInitialData(true);
    await loadData();
    setSeeding(false);
  };

  // Today's Date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  // Today's records
  const todayRecords = attendance.filter((a) => a.date === todayStr);
  const todayPresent = todayRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
  const todayAbsent = todayRecords.filter((a) => a.status === 'Absent').length;

  // Overall metrics
  const totalStudents = students.length;
  const totalDepartments = departments.length;

  const lowAttendanceStudents = studentSummaries.filter((s) => s.isLowAttendance);
  const avgAttendance = studentSummaries.length > 0
    ? (
        studentSummaries.reduce((acc, curr) => acc + curr.percentage, 0) /
        studentSummaries.length
      ).toFixed(1)
    : '0.0';

  // Department-wise data for BarChart
  const deptData = departments.map((dept) => {
    const deptStudents = students.filter((s) => s.departmentId === dept.departmentId);
    const deptStudentIds = new Set(deptStudents.map((s) => s.studentId));
    const deptRecords = attendance.filter((a) => deptStudentIds.has(a.studentId));

    const totalDays = deptRecords.length;
    const presentDays = deptRecords.filter(
      (r) => r.status === 'Present' || r.status === 'Late'
    ).length;
    const rate = totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(1)) : 0;

    return {
      name: dept.code || dept.name.slice(0, 4),
      fullName: dept.name,
      students: deptStudents.length,
      attendanceRate: rate
    };
  });

  // Recent 5-month trend
  const monthMap: Record<string, { present: number; total: number }> = {};
  attendance.forEach((r) => {
    const m = r.date.substring(0, 7); // YYYY-MM
    if (!monthMap[m]) monthMap[m] = { present: 0, total: 0 };
    monthMap[m].total += 1;
    if (r.status === 'Present' || r.status === 'Late') {
      monthMap[m].present += 1;
    }
  });

  const monthlyTrendData = Object.keys(monthMap)
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
        month: `${monthName} ${year.slice(2)}`,
        rate,
        records: entry.total
      };
    });

  // Recent attendance activity logs (latest 6 records)
  const recentActivity = [...attendance]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Academic Year 2026-2027
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Administrative Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Monitor real-time institutional attendance, department performance, and identify students requiring academic attendance counseling.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              id="btn-dash-mark-attendance"
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm flex items-center gap-2"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>Mark Attendance</span>
            </button>
            <button
              id="btn-dash-view-reports"
              onClick={() => onNavigate('reports')}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Full Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          id="stat-total-students"
          title="Total Students"
          value={loading ? '...' : totalStudents}
          subtitle="Enrolled active scholars"
          icon={Users}
          colorScheme="indigo"
        />
        <StatCard
          id="stat-total-departments"
          title="Departments"
          value={loading ? '...' : totalDepartments}
          subtitle="Active academic wings"
          icon={Building2}
          colorScheme="purple"
        />
        <StatCard
          id="stat-today-present"
          title="Today's Present"
          value={loading ? '...' : todayPresent}
          subtitle={todayRecords.length > 0 ? `${todayRecords.length} recorded today` : 'No logs yet today'}
          icon={UserCheck}
          colorScheme="emerald"
        />
        <StatCard
          id="stat-today-absent"
          title="Today's Absent"
          value={loading ? '...' : todayAbsent}
          subtitle={todayRecords.length > 0 ? `${todayAbsent} students absent` : 'Awaiting records'}
          icon={UserX}
          colorScheme="rose"
        />
        <StatCard
          id="stat-avg-attendance"
          title="Average Attendance"
          value={loading ? '...' : `${avgAttendance}%`}
          subtitle="Across all departments"
          icon={Percent}
          colorScheme="sky"
        />
        <StatCard
          id="stat-low-attendance"
          title="Low Attendance"
          value={loading ? '...' : lowAttendanceStudents.length}
          subtitle="Below 75% threshold"
          icon={AlertTriangle}
          colorScheme="amber"
        />
      </div>

      {/* Low Attendance Warning Alert if any */}
      {lowAttendanceStudents.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-950">
                Low Attendance Alert: {lowAttendanceStudents.length} Students Below 75%
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Students below the university 75% mandatory threshold are at risk of exam debarment.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('low-attendance')}
            className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3.5 py-1.5 rounded-lg border border-amber-300 transition-colors flex items-center gap-1 self-end sm:self-center"
          >
            <span>View Affected Students</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Attendance Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Department Attendance Comparison
              </h3>
              <p className="text-xs text-slate-500">
                Average attendance percentage by academic department
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {departments.length} Departments
            </span>
          </div>

          <div className="h-64 w-full">
            {deptData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No department records available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Attendance Rate']}
                    labelFormatter={(label: any) => {
                      const item = deptData.find((d) => d.name === label);
                      return item ? item.fullName : label;
                    }}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                  />
                  <Bar dataKey="attendanceRate" radius={[6, 6, 0, 0]}>
                    {deptData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.attendanceRate >= 75 ? '#4f46e5' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Attendance Trend */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Monthly Attendance Trend
              </h3>
              <p className="text-xs text-slate-500">
                Institutional attendance trajectory over time
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Target: 85%</span>
            </div>
          </div>

          <div className="h-64 w-full">
            {monthlyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No monthly attendance trend data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
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
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5' }}
                    activeDot={{ r: 6, fill: '#4338ca' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Activity + Low Attendance Quick List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attendance Activity */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Recent Attendance Logs
              </h3>
              <p className="text-xs text-slate-500">
                Latest student check-in/out activities registered
              </p>
            </div>
            <button
              onClick={() => onNavigate('attendance')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Manage Logs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No attendance records found. Click below to generate sample data.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-semibold">
                    <th className="pb-2.5">Date</th>
                    <th className="pb-2.5">Student</th>
                    <th className="pb-2.5">Reg. No</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Check-In</th>
                    <th className="pb-2.5">Check-Out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentActivity.map((r) => (
                    <tr key={r.attendanceId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 text-slate-700 font-medium whitespace-nowrap">
                        {r.date}
                      </td>
                      <td className="py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                        {r.studentName}
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono">
                        {r.registerNumber}
                      </td>
                      <td className="py-2.5">
                        <AttendanceBadge status={r.status} size="sm" />
                      </td>
                      <td className="py-2.5 text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {r.checkInTime}
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {r.checkOutTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Attendance Quick Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Low Attendance Focus
                  </h3>
                  <p className="text-xs text-slate-500">Students &lt; 75% attendance</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                {lowAttendanceStudents.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {lowAttendanceStudents.length === 0 ? (
                <div className="text-center py-8 text-xs text-emerald-600 font-medium">
                  Excellent! All students currently satisfy or exceed the 75% threshold.
                </div>
              ) : (
                lowAttendanceStudents.map((item) => (
                  <div
                    key={item.student.studentId}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.student.name}
                      </p>
                      <span className="text-xs font-extrabold text-rose-600">
                        {item.percentage}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                      <span>{item.student.registerNumber}</span>
                      <span>{item.presentDays}/{item.totalWorkingDays} days</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('low-attendance')}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors text-center"
            >
              Open Full Low Attendance Center &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Database Quick Seed Banner if database is empty */}
      {students.length === 0 && !loading && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-indigo-950">
              No students or attendance records found
            </h4>
            <p className="text-xs text-indigo-800">
              Would you like to seed standard sample college departments, students, and attendance logs?
            </p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            {seeding ? 'Seeding...' : 'Populate Sample Data'}
          </button>
        </div>
      )}
    </div>
  );
};
