import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCheck,
  GraduationCap,
  Building2,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  Award,
  CheckCircle2,
  Lock
} from 'lucide-react';
import {
  getStudentByEmail,
  getAttendanceForStudent,
  calculateStatsForStudent,
  getStudents
} from '../../services/dataService';
import { Student, StudentAttendanceSummary } from '../../types';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [user?.email, user?.studentId]);

  const loadProfile = async () => {
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
        setStats(calculateStatsForStudent(currentStudent, records));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Read-Only RBAC Security Notice */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" />
          <span>
            <strong>Read-Only Student Access:</strong> Student profiles and attendance logs are official institutional records and cannot be directly modified by students. For corrections, contact your Department Head.
          </span>
        </div>
      </div>

      {/* Profile Dossier Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50">
            {student?.name?.charAt(0) || 'S'}
          </div>

          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                {student?.name || user?.name || 'Student Name'}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {student?.status || 'Active'} Scholar
              </span>
            </div>
            <p className="text-sm font-mono font-bold text-indigo-600">
              Registration No: {student?.registerNumber || 'REG-PENDING'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Apex Institute of Technology & Engineering &bull; Department of {student?.departmentName}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Academic Enrollment Info */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Academic Dossier
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Department</span>
              <span className="font-semibold text-slate-800">{student?.departmentName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Current Year</span>
              <span className="font-semibold text-slate-800">{student?.year}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Assigned Section</span>
              <span className="font-semibold text-slate-800">Section {student?.section}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Program Type</span>
              <span className="font-semibold text-slate-800">Full-Time Undergraduate (B.Tech / B.E)</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Institutional Status</span>
              <span className="font-semibold text-emerald-600">{student?.status}</span>
            </div>
          </div>
        </div>

        {/* Contact & Verification */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            Official Contact Records
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Institutional Email
              </span>
              <span className="font-semibold text-slate-800 font-mono">{student?.email}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Registered Phone
              </span>
              <span className="font-semibold text-slate-800 font-mono">{student?.phone || '+91 98765 43210'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500 font-medium">Campus Card Validity</span>
              <span className="font-semibold text-slate-800">Valid through June 2027</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-medium">Faculty Advisor</span>
              <span className="font-semibold text-slate-800">Dr. K. Ramanathan (HOD)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Performance Record */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Award className="w-4 h-4 text-indigo-600" />
          Certified Attendance Performance Record
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block">Total Working Days</span>
            <span className="text-lg font-bold text-slate-900 mt-1 block">
              {stats?.totalWorkingDays ?? 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-[11px] text-emerald-800 block">Days Present</span>
            <span className="text-lg font-bold text-emerald-700 mt-1 block">
              {stats?.presentDays ?? 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-[11px] text-rose-800 block">Days Absent</span>
            <span className="text-lg font-bold text-rose-700 mt-1 block">
              {stats?.absentDays ?? 0}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
            <span className="text-[11px] text-indigo-800 block">Aggregate Rate</span>
            <span className="text-lg font-black text-indigo-700 mt-1 block">
              {stats?.percentage ?? 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
