import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Calendar,
  Save,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Users,
  Sparkles
} from 'lucide-react';
import {
  getDepartments,
  getStudents,
  getAttendanceByDate,
  saveBatchAttendance
} from '../../services/dataService';
import { Department, Student, AttendanceRecord, AttendanceStatus } from '../../types';

interface AttendanceManagementProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

interface StudentAttendanceRow {
  student: Student;
  status: AttendanceStatus;
  checkInTime: string;
  checkOutTime: string;
  isExisting: boolean;
}

export const AttendanceManagement: React.FC<AttendanceManagementProps> = ({ onShowToast }) => {
  // Today formatted as YYYY-MM-DD
  const todayDateStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState<string>(todayDateStr());
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  // Filter Selectors
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Attendance Working State
  const [attendanceRows, setAttendanceRows] = useState<StudentAttendanceRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    initialLoad();
  }, []);

  useEffect(() => {
    loadAttendanceForSelection();
  }, [date, selectedDept, selectedYear, selectedSection, allStudents]);

  const initialLoad = async () => {
    setLoading(true);
    try {
      const [depts, students] = await Promise.all([
        getDepartments(),
        getStudents()
      ]);
      setDepartments(depts);
      setAllStudents(students);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Load Error', 'Failed to load student registers.');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceForSelection = async () => {
    if (allStudents.length === 0) return;
    setLoading(true);

    try {
      // 1. Filter students according to current dropdowns
      const filtered = allStudents.filter((st) => {
        const matchesDept = selectedDept === 'ALL' || st.departmentId === selectedDept;
        const matchesYear = selectedYear === 'ALL' || st.year === selectedYear;
        const matchesSection = selectedSection === 'ALL' || st.section.toUpperCase() === selectedSection.toUpperCase();
        return matchesDept && matchesYear && matchesSection;
      });

      // 2. Fetch existing records for this date
      const existingRecords = await getAttendanceByDate(date);
      const recordMap = new Map<string, AttendanceRecord>();
      existingRecords.forEach((r) => recordMap.set(r.studentId, r));

      // 3. Merge into rows
      const rows: StudentAttendanceRow[] = filtered.map((student) => {
        const existing = recordMap.get(student.studentId);
        if (existing) {
          return {
            student,
            status: existing.status,
            checkInTime: existing.checkInTime || (existing.status === 'Present' ? '08:55 AM' : '-'),
            checkOutTime: existing.checkOutTime || (existing.status === 'Present' ? '04:30 PM' : '-'),
            isExisting: true
          };
        } else {
          return {
            student,
            status: 'Present',
            checkInTime: '08:55 AM',
            checkOutTime: '04:30 PM',
            isExisting: false
          };
        }
      });

      setAttendanceRows(rows);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Attendance Error', 'Could not fetch attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setAttendanceRows((prev) =>
      prev.map((row) => {
        if (row.student.studentId === studentId) {
          let checkIn = row.checkInTime;
          let checkOut = row.checkOutTime;

          if (newStatus === 'Absent') {
            checkIn = '-';
            checkOut = '-';
          } else if (newStatus === 'Present' && (checkIn === '-' || !checkIn)) {
            checkIn = '08:55 AM';
            checkOut = '04:30 PM';
          } else if (newStatus === 'Late' && (checkIn === '-' || !checkIn)) {
            checkIn = '09:30 AM';
            checkOut = '04:30 PM';
          }

          return {
            ...row,
            status: newStatus,
            checkInTime: checkIn,
            checkOutTime: checkOut
          };
        }
        return row;
      })
    );
  };

  const handleTimeChange = (studentId: string, field: 'checkInTime' | 'checkOutTime', value: string) => {
    setAttendanceRows((prev) =>
      prev.map((row) => {
        if (row.student.studentId === studentId) {
          return { ...row, [field]: value };
        }
        return row;
      })
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setAttendanceRows((prev) =>
      prev.map((row) => ({
        ...row,
        status,
        checkInTime: status === 'Absent' ? '-' : (row.checkInTime !== '-' ? row.checkInTime : '08:55 AM'),
        checkOutTime: status === 'Absent' ? '-' : (row.checkOutTime !== '-' ? row.checkOutTime : '04:30 PM')
      }))
    );
  };

  const handleSaveAttendance = async () => {
    if (attendanceRows.length === 0) {
      onShowToast('info', 'No Students', 'There are no students listed in the current selection.');
      return;
    }

    setSaving(true);
    try {
      const recordsToSave: AttendanceRecord[] = attendanceRows.map((row) => ({
        attendanceId: `${row.student.studentId}_${date}`,
        studentId: row.student.studentId,
        studentName: row.student.name,
        registerNumber: row.student.registerNumber,
        departmentId: row.student.departmentId,
        departmentName: row.student.departmentName,
        year: row.student.year,
        section: row.student.section,
        date: date,
        status: row.status,
        checkInTime: row.checkInTime,
        checkOutTime: row.checkOutTime,
        markedBy: 'admin',
        updatedAt: new Date().toISOString()
      }));

      await saveBatchAttendance(recordsToSave);
      onShowToast(
        'success',
        'Attendance Recorded',
        `Successfully logged attendance for ${recordsToSave.length} students on ${date}.`
      );

      // Re-flag rows as existing
      setAttendanceRows((prev) => prev.map((r) => ({ ...r, isExisting: true })));
    } catch (err: any) {
      console.error(err);
      onShowToast('error', 'Failed to Save Attendance', err.message || 'Error saving records.');
    } finally {
      setSaving(false);
    }
  };

  // Summary counts
  const presentCount = attendanceRows.filter((r) => r.status === 'Present').length;
  const absentCount = attendanceRows.filter((r) => r.status === 'Absent').length;
  const lateCount = attendanceRows.filter((r) => r.status === 'Late').length;

  return (
    <div className="space-y-6">
      {/* Top Filter & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-5 h-5 text-indigo-600" />
              Daily Attendance Register
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select date, department, year, and section to record or update attendance rolls.
            </p>
          </div>

          <button
            id="btn-save-attendance"
            onClick={handleSaveAttendance}
            disabled={saving || attendanceRows.length === 0}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Records...' : 'Save Attendance Roll'}</span>
          </button>
        </div>

        {/* Filters and Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Attendance Date
            </label>
            <input
              id="attendance-date-input"
              type="date"
              value={date}
              max={todayDateStr()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden font-medium text-slate-900 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department
            </label>
            <select
              id="attendance-dept-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden text-slate-700 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Academic Year
            </label>
            <select
              id="attendance-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden text-slate-700 bg-white"
            >
              <option value="ALL">All Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Section
            </label>
            <select
              id="attendance-section-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden text-slate-700 bg-white"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {/* Batch Quick Buttons & Counters */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">
              Batch Actions:
            </span>
            <button
              type="button"
              onClick={() => handleMarkAll('Present')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll('Absent')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark All Absent</span>
            </button>
          </div>

          {/* Counts */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
              Total: {attendanceRows.length}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
              Present: {presentCount}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
              Absent: {absentCount}
            </span>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
              Late: {lateCount}
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading roll sheet for selected cohort...
            </div>
          ) : attendanceRows.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No students found</p>
              <p className="text-xs text-slate-500 mt-1">
                No students enrolled under the selected Department, Year, or Section.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Dept / Year / Sec</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Check-Out Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceRows.map((row) => (
                  <tr
                    key={row.student.studentId}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      row.status === 'Absent' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {row.student.registerNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {row.student.name}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {row.student.departmentName || 'Engg'} &bull; {row.student.year} (Sec {row.student.section})
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student.studentId, 'Present')}
                          className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                            row.status === 'Present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student.studentId, 'Late')}
                          className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                            row.status === 'Late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(row.student.studentId, 'Absent')}
                          className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all ${
                            row.status === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={row.status === 'Absent'}
                        value={row.checkInTime}
                        onChange={(e) => handleTimeChange(row.student.studentId, 'checkInTime', e.target.value)}
                        placeholder="09:00 AM"
                        className="w-24 px-2 py-1 text-xs rounded-md border border-slate-200 focus:border-indigo-500 outline-hidden font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        disabled={row.status === 'Absent'}
                        value={row.checkOutTime}
                        onChange={(e) => handleTimeChange(row.student.studentId, 'checkOutTime', e.target.value)}
                        placeholder="04:30 PM"
                        className="w-24 px-2 py-1 text-xs rounded-md border border-slate-200 focus:border-indigo-500 outline-hidden font-mono text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Save Bar */}
        {attendanceRows.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Preventing duplicates: Records for {date} will update automatically.
            </span>
            <button
              onClick={handleSaveAttendance}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save & Confirm Records'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
