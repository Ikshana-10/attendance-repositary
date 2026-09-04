import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  Building2,
  GraduationCap,
  Mail,
  Phone,
  CalendarCheck,
  CheckCircle2
} from 'lucide-react';
import {
  getStudents,
  getDepartments,
  createStudent,
  updateStudent,
  deleteStudent,
  getAttendanceForStudent,
  calculateStatsForStudent
} from '../../services/dataService';
import { Student, Department, StudentStatus, StudentAttendanceSummary } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

interface StudentManagementProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({ onShowToast }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    registerNumber: '',
    name: '',
    departmentId: '',
    year: '1st Year',
    section: 'A',
    email: '',
    phone: '',
    status: 'Active' as StudentStatus
  });

  // Profile View Modal State
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [profileStats, setProfileStats] = useState<StudentAttendanceSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Delete Confirm State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStudents, allDepts] = await Promise.all([
        getStudents(),
        getDepartments()
      ]);
      setStudents(allStudents);
      setDepartments(allDepts);
    } catch (err) {
      console.error(err);
      onShowToast('error', 'Failed to load students', 'Could not fetch records from database.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      registerNumber: '',
      name: '',
      departmentId: departments[0]?.departmentId || '',
      year: '1st Year',
      section: 'A',
      email: '',
      phone: '',
      status: 'Active'
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      registerNumber: student.registerNumber,
      name: student.name,
      departmentId: student.departmentId,
      year: student.year,
      section: student.section,
      email: student.email,
      phone: student.phone,
      status: student.status
    });
    setIsFormModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.registerNumber.trim() || !formData.email.trim()) {
      onShowToast('error', 'Validation Error', 'Please complete all required fields.');
      return;
    }

    const deptObj = departments.find((d) => d.departmentId === formData.departmentId);
    const departmentName = deptObj ? deptObj.name : '';

    try {
      if (editingStudent) {
        await updateStudent(editingStudent.studentId, {
          ...formData,
          departmentName
        });
        onShowToast('success', 'Student Updated', `${formData.name} record saved successfully.`);
      } else {
        await createStudent({
          ...formData,
          departmentName
        });
        onShowToast('success', 'Student Added', `${formData.name} enrolled successfully.`);
      }

      setIsFormModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      onShowToast('error', 'Operation Failed', err.message || 'Failed to save student.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    setDeleteLoading(true);
    try {
      await deleteStudent(deletingStudent.studentId);
      onShowToast('success', 'Student Removed', `${deletingStudent.name} was removed from the system.`);
      setDeletingStudent(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      onShowToast('error', 'Deletion Error', err.message || 'Could not delete student.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleViewProfile = async (student: Student) => {
    setProfileStudent(student);
    setProfileLoading(true);
    try {
      const records = await getAttendanceForStudent(student.studentId);
      const stats = calculateStatsForStudent(student, records);
      setProfileStats(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((st) => {
    const matchesDept = selectedDept === 'ALL' || st.departmentId === selectedDept;
    const matchesYear = selectedYear === 'ALL' || st.year === selectedYear;
    const matchesSection = selectedSection === 'ALL' || st.section.toUpperCase() === selectedSection.toUpperCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      st.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      st.registerNumber.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      st.email.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesDept && matchesYear && matchesSection && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Student Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage student registrations, departmental allocations, and profile dossiers.
            </p>
          </div>

          <button
            id="btn-add-student"
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Student</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="search-students-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or reg no..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-900 bg-slate-50/50"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              id="filter-dept-select"
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-700 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.departmentId} value={dept.departmentId}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              id="filter-year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-700 bg-white"
            >
              <option value="ALL">All Academic Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              id="filter-section-select"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-700 bg-white"
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Registered Scholars ({filteredStudents.length} of {students.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading student roster...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No students match criteria</p>
              <p className="text-xs text-slate-500 mt-1">
                Try changing your search keywords or clear the active filters.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200/80">
                  <th className="py-3 px-4">Register No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.studentId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {st.registerNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {st.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.departmentName || departments.find(d => d.departmentId === st.departmentId)?.name || 'General'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {st.year}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block w-6 h-6 rounded-md bg-slate-100 text-slate-700 text-center leading-6 font-bold">
                        {st.section}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{st.email}</div>
                      <div className="text-[11px] text-slate-400">{st.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          st.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewProfile(st)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View Profile Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit Student Information"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingStudent(st)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.registerNumber}
                    onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                    placeholder="e.g. 710023CSE015"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Student Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department *
                </label>
                <select
                  required
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden bg-white"
                >
                  {departments.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.name} ({dept.code || 'DEPT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Year of Study
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden bg-white"
                  >
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
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                    placeholder="A, B, or C"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden uppercase text-center font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="student@attendance.edu"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  {editingStudent ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile View Modal */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Student Academic Profile
              </h3>
              <button
                onClick={() => setProfileStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-lg flex items-center justify-center">
                  {profileStudent.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{profileStudent.name}</h4>
                  <p className="text-xs font-mono text-indigo-700">{profileStudent.registerNumber}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 mt-1 inline-block">
                    {profileStudent.status} Student
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Department</span>
                  <span className="font-semibold text-slate-800">{profileStudent.departmentName}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Class / Section</span>
                  <span className="font-semibold text-slate-800">{profileStudent.year} - Sec {profileStudent.section}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                  <span className="font-semibold text-slate-800 truncate block">{profileStudent.email}</span>
                </div>
                <div className="p-3 rounded-lg border border-slate-100 bg-white">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone</span>
                  <span className="font-semibold text-slate-800">{profileStudent.phone || 'N/A'}</span>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <CalendarCheck className="w-4 h-4 text-indigo-600" />
                    Overall Attendance Performance
                  </span>
                  {profileStats && (
                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-md ${
                        profileStats.percentage >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {profileStats.percentage}%
                    </span>
                  )}
                </div>

                {profileLoading ? (
                  <p className="text-xs text-slate-500 py-2">Computing attendance records...</p>
                ) : profileStats ? (
                  <div className="grid grid-cols-3 gap-2 text-center mt-3">
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-slate-400 block">Working Days</span>
                      <span className="text-sm font-bold text-slate-800">{profileStats.totalWorkingDays}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-emerald-600 block">Present</span>
                      <span className="text-sm font-bold text-emerald-700">{profileStats.presentDays}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-rose-600 block">Absent</span>
                      <span className="text-sm font-bold text-rose-700">{profileStats.absentDays}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No attendance records logged.</p>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setProfileStudent(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingStudent}
        title="Remove Student Record"
        message={`Are you sure you want to permanently remove "${deletingStudent?.name}" (${deletingStudent?.registerNumber})? This will also remove associated attendance records.`}
        confirmLabel="Delete Record"
        isDestructive
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudent(null)}
      />
    </div>
  );
};
