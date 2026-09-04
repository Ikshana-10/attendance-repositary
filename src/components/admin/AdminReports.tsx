import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Users,
  Search
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  getDepartments,
  getStudents,
  getAllAttendance,
  calculateStatsForStudent
} from '../../services/dataService';
import { Department, Student, AttendanceRecord, StudentAttendanceSummary } from '../../types';
import { AttendanceBadge } from '../common/AttendanceBadge';

interface AdminReportsProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const AdminReports: React.FC<AdminReportsProps> = ({ onShowToast }) => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allAttendance, setAllAttendance] = useState<AttendanceRecord[]>([]);

  // Filter criteria
  const currentYearStr = String(new Date().getFullYear());
  const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');

  const [filterYear, setFilterYear] = useState<string>(currentYearStr);
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchStudent, setSearchStudent] = useState<string>('');

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [depts, studs, atts] = await Promise.all([
        getDepartments(),
        getStudents(),
        getAllAttendance()
      ]);
      setDepartments(depts);
      setStudents(studs);
      setAllAttendance(atts);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Error', 'Failed to load report metrics.');
    } finally {
      setLoading(false);
    }
  };

  // 1. Filter raw attendance records based on current controls
  const filteredAttendance = allAttendance.filter((rec) => {
    // Year filter (from date: YYYY-MM-DD)
    const recYear = rec.date.substring(0, 4);
    if (filterYear !== 'ALL' && recYear !== filterYear) return false;

    // Month filter
    const recMonth = rec.date.substring(5, 7);
    if (filterMonth !== 'ALL' && recMonth !== filterMonth) return false;

    // Dept filter
    if (filterDept !== 'ALL' && rec.departmentId !== filterDept) return false;

    // Section filter
    if (filterSection !== 'ALL' && rec.section.toUpperCase() !== filterSection.toUpperCase()) return false;

    // Status filter
    if (filterStatus !== 'ALL' && rec.status !== filterStatus) return false;

    // Student search
    if (searchStudent.trim() !== '') {
      const q = searchStudent.toLowerCase().trim();
      const matchName = rec.studentName.toLowerCase().includes(q);
      const matchReg = rec.registerNumber.toLowerCase().includes(q);
      if (!matchName && !matchReg) return false;
    }

    return true;
  });

  // 2. Compute filtered student summaries
  const targetStudents = students.filter((s) => {
    if (filterDept !== 'ALL' && s.departmentId !== filterDept) return false;
    if (filterSection !== 'ALL' && s.section.toUpperCase() !== filterSection.toUpperCase()) return false;
    if (searchStudent.trim() !== '') {
      const q = searchStudent.toLowerCase().trim();
      return s.name.toLowerCase().includes(q) || s.registerNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const studentSummaries: StudentAttendanceSummary[] = targetStudents.map((st) => {
    // only use attendance matching year/month for this student
    const studentRecords = filteredAttendance.filter((r) => r.studentId === st.studentId);
    return calculateStatsForStudent(st, studentRecords);
  });

  // Key Aggregations
  const totalStudentsEvaluated = studentSummaries.length;
  const avgAttendance = totalStudentsEvaluated > 0
    ? (
        studentSummaries.reduce((sum, s) => sum + s.percentage, 0) /
        totalStudentsEvaluated
      ).toFixed(1)
    : '0.0';

  const above90 = studentSummaries.filter((s) => s.percentage >= 90).length;
  const between75and90 = studentSummaries.filter((s) => s.percentage >= 75 && s.percentage < 90).length;
  const below75 = studentSummaries.filter((s) => s.percentage < 75 && s.totalWorkingDays > 0).length;

  const totalPresentRecords = filteredAttendance.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const totalAbsentRecords = filteredAttendance.filter((r) => r.status === 'Absent').length;

  // Pie chart data: Status breakdown
  const pieData = [
    { name: 'Present', value: filteredAttendance.filter((r) => r.status === 'Present').length, color: '#10b981' },
    { name: 'Late', value: filteredAttendance.filter((r) => r.status === 'Late').length, color: '#f59e0b' },
    { name: 'Absent', value: totalAbsentRecords, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Top performers
  const topStudents = [...studentSummaries]
    .filter((s) => s.totalWorkingDays > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);

  // Low attendance cohort
  const lowStudents = [...studentSummaries]
    .filter((s) => s.totalWorkingDays > 0 && s.percentage < 75)
    .sort((a, b) => a.percentage - b.percentage);

  // CSV Export handler
  const handleExportCSV = () => {
    if (filteredAttendance.length === 0) {
      onShowToast('info', 'No Data', 'No records match the current filter selection.');
      return;
    }

    const headers = ['Register Number', 'Student Name', 'Department', 'Year', 'Section', 'Date', 'Status', 'Check In', 'Check Out'];
    const rows = filteredAttendance.map((r) => [
      `"${r.registerNumber}"`,
      `"${r.studentName}"`,
      `"${r.departmentName || ''}"`,
      `"${r.year}"`,
      `"${r.section}"`,
      `"${r.date}"`,
      `"${r.status}"`,
      `"${r.checkInTime}"`,
      `"${r.checkOutTime}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${filterYear}_${filterMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'Report Exported', 'CSV download initiated successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-indigo-600" />
            Institutional Attendance Analytics & Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate customized attendance matrices, cohorts, audit trails, and exportable documentation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>
          <button
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs print:hidden space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-indigo-600" />
            Report Parameters
          </span>
          <button
            onClick={() => {
              setFilterYear(currentYearStr);
              setFilterMonth('ALL');
              setFilterDept('ALL');
              setFilterSection('ALL');
              setFilterStatus('ALL');
              setSearchStudent('');
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Year */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Academic Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Months</option>
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.departmentId} value={d.departmentId}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Late">Late Only</option>
            </select>
          </div>

          {/* Search Student */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Search Student</label>
            <div className="relative">
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Name / Reg No"
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 outline-hidden text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Total Students</span>
          <span className="text-xl font-bold text-slate-900 mt-1 block">{totalStudentsEvaluated}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Avg Attendance</span>
          <span className="text-xl font-bold text-indigo-600 mt-1 block">{avgAttendance}%</span>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 shadow-2xs">
          <span className="text-[11px] text-emerald-800 block font-semibold">&gt; 90% Attendance</span>
          <span className="text-xl font-bold text-emerald-700 mt-1 block">{above90}</span>
        </div>
        <div className="p-4 rounded-xl bg-sky-50/50 border border-sky-100 shadow-2xs">
          <span className="text-[11px] text-sky-800 block font-semibold">75% - 90% Bracket</span>
          <span className="text-xl font-bold text-sky-700 mt-1 block">{between75and90}</span>
        </div>
        <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100 shadow-2xs">
          <span className="text-[11px] text-rose-800 block font-semibold">&lt; 75% Low Rate</span>
          <span className="text-xl font-bold text-rose-700 mt-1 block">{below75}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Total Present</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{totalPresentRecords}</span>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-semibold">Total Absent</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{totalAbsentRecords}</span>
        </div>
      </div>

      {/* Visual Charts: Distribution & Leaders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-1">
            Status Composition Ratio
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Proportion of Present, Late, and Absent events
          </p>

          <div className="h-56 w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No logs recorded for this scope
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} sessions (${((val / (filteredAttendance.length || 1)) * 100).toFixed(1)}%)`,
                      name
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Attendance Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                Top Attendance Scholars
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Exemplary
              </span>
            </div>

            <div className="space-y-2.5">
              {topStudents.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No student data available</p>
              ) : (
                topStudents.map((item, idx) => (
                  <div
                    key={item.student.studentId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.student.name}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.student.registerNumber}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-600">
                      {item.percentage}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Low Attendance Notice */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Students Requiring Intervention
              </h3>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                &lt; 75%
              </span>
            </div>

            <div className="space-y-2.5">
              {lowStudents.length === 0 ? (
                <p className="text-xs text-emerald-600 py-6 text-center">
                  None! All matching students are above 75%.
                </p>
              ) : (
                lowStudents.slice(0, 5).map((item) => (
                  <div
                    key={item.student.studentId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 bg-rose-50/40"
                  >
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.student.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {item.student.registerNumber} &bull; {item.presentDays}/{item.totalWorkingDays} days
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-600">
                      {item.percentage}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Attendance Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Detailed Attendance Audit Log
            </h3>
            <p className="text-xs text-slate-500">
              Showing {filteredAttendance.length} matching session logs
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Generating report matrices...
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No attendance records found matching the active filters.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Dept / Year / Sec</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-In</th>
                  <th className="py-3 px-4">Check-Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.slice(0, 100).map((r) => (
                  <tr key={r.attendanceId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {r.registerNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {r.studentName}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {r.departmentName || 'Engg'} &bull; {r.year} (Sec {r.section})
                    </td>
                    <td className="py-3 px-4">
                      <AttendanceBadge status={r.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {r.checkInTime}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {r.checkOutTime}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filteredAttendance.length > 100 && (
          <div className="p-3 text-center text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
            Showing first 100 of {filteredAttendance.length} records. Export CSV to download the complete dataset.
          </div>
        )}
      </div>
    </div>
  );
};
