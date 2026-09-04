import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  Download,
  Filter,
  Users,
  Search,
  CheckCircle2,
  BellRing,
  Calculator
} from 'lucide-react';
import {
  getStudents,
  getDepartments,
  getAllAttendance,
  calculateStatsForStudent
} from '../../services/dataService';
import { Department, Student, AttendanceRecord, StudentAttendanceSummary } from '../../types';

interface LowAttendanceAlertProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const LowAttendanceAlert: React.FC<LowAttendanceAlertProps> = ({ onShowToast }) => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lowAttendanceList, setLowAttendanceList] = useState<StudentAttendanceSummary[]>([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifiedMap, setNotifiedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allDepts, allStudents, allAttendance] = await Promise.all([
        getDepartments(),
        getStudents(),
        getAllAttendance()
      ]);

      setDepartments(allDepts);

      // Calculate all summaries
      const summaries = allStudents.map((st) => calculateStatsForStudent(st, allAttendance));

      // Filter to only those with < 75% who have at least 1 working day logged
      const lowOnes = summaries
        .filter((s) => s.totalWorkingDays > 0 && s.percentage < 75)
        .sort((a, b) => a.percentage - b.percentage);

      setLowAttendanceList(lowOnes);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Error', 'Failed to calculate low attendance records.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyStudent = (studentId: string, studentName: string) => {
    setNotifiedMap((prev) => ({ ...prev, [studentId]: true }));
    onShowToast(
      'info',
      'Notice Dispatched',
      `Official low-attendance warning letter dispatched to ${studentName}.`
    );
  };

  const handleNotifyAll = () => {
    const newNotified: Record<string, boolean> = { ...notifiedMap };
    lowAttendanceList.forEach((item) => {
      newNotified[item.student.studentId] = true;
    });
    setNotifiedMap(newNotified);
    onShowToast(
      'success',
      'Batch Notice Dispatched',
      `Dispatched warning notifications to ${lowAttendanceList.length} students below 75%.`
    );
  };

  const handleExportList = () => {
    if (lowAttendanceList.length === 0) return;
    const headers = ['Register Number', 'Student Name', 'Department', 'Year', 'Section', 'Working Days', 'Present Days', 'Absent Days', 'Attendance %', 'Classes Needed for 75%'];
    const rows = lowAttendanceList.map((item) => {
      // Calculate how many more consecutive classes needed to hit 75%:
      // (P + x) / (T + x) >= 0.75 => P + x >= 0.75T + 0.75x => 0.25x >= 0.75T - P => x = ceil(3T - 4P)
      const classesNeeded = Math.max(0, Math.ceil(3 * item.totalWorkingDays - 4 * item.presentDays));
      return [
        `"${item.student.registerNumber}"`,
        `"${item.student.name}"`,
        `"${item.student.departmentName}"`,
        `"${item.student.year}"`,
        `"${item.student.section}"`,
        item.totalWorkingDays,
        item.presentDays,
        item.absentDays,
        `${item.percentage}%`,
        classesNeeded
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Low_Attendance_Audit_List.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('success', 'Export Complete', 'Low attendance audit list downloaded.');
  };

  const filteredList = lowAttendanceList.filter((item) => {
    const matchesDept = selectedDept === 'ALL' || item.student.departmentId === selectedDept;
    const matchesSection = selectedSection === 'ALL' || item.student.section.toUpperCase() === selectedSection.toUpperCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === '' ||
      item.student.name.toLowerCase().includes(q) ||
      item.student.registerNumber.toLowerCase().includes(q);

    return matchesDept && matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-rose-600 text-white rounded-2xl shadow-md shadow-rose-600/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-rose-950">
                Low Attendance Alert & Counseling Desk
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200/70 text-rose-900 border border-rose-300">
                {lowAttendanceList.length} At-Risk Scholars
              </span>
            </div>
            <p className="text-xs text-rose-800 mt-1 max-w-2xl leading-relaxed">
              University statutory regulations mandate a minimum attendance of <strong>75%</strong> to be eligible to sit for semester examinations. Students highlighted below are subject to exam detention unless condonation is authorized.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={handleExportList}
            disabled={lowAttendanceList.length === 0}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-rose-200 transition-colors shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </button>
          <button
            onClick={handleNotifyAll}
            disabled={lowAttendanceList.length === 0}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm shadow-rose-600/25 flex items-center gap-1.5 disabled:opacity-50"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span>Notify All Guardians</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search low-attendance student..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-900"
            />
          </div>

          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
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
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-hidden bg-white text-slate-800"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table of At-Risk Students */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Auditing student registers for low attendance...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">
                No Low Attendance Flag Found
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                All queried students possess an attendance rate of 75% or higher.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department &amp; Class</th>
                  <th className="py-3 px-4 text-center">Current Rate</th>
                  <th className="py-3 px-4 text-center">Classes Attended</th>
                  <th className="py-3 px-4 text-center">Classes Needed to Reach 75%</th>
                  <th className="py-3 px-4 text-right">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  const neededClasses = Math.max(0, Math.ceil(3 * item.totalWorkingDays - 4 * item.presentDays));
                  const isNotified = !!notifiedMap[item.student.studentId];

                  return (
                    <tr key={item.student.studentId} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {item.student.registerNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.student.name}</div>
                        <div className="text-[11px] text-slate-400">{item.student.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{item.student.departmentName}</div>
                        <div className="text-[11px] text-slate-400">{item.student.year} &bull; Sec {item.student.section}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200">
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 font-medium">
                        <span className="text-emerald-700 font-bold">{item.presentDays}</span> / {item.totalWorkingDays} days
                        <span className="block text-[10px] text-rose-600 font-medium">({item.absentDays} missed)</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <Calculator className="w-3.5 h-3.5" />
                          <span>+{neededClasses} consecutive days</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleNotifyStudent(item.student.studentId, item.student.name)}
                          disabled={isNotified}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                            isNotified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                          }`}
                        >
                          {isNotified ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Notice Sent</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Notice</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
