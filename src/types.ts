export type UserRole = 'admin' | 'student';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  createdAt?: string;
}

export interface Department {
  departmentId: string;
  name: string;
  code?: string;
  createdAt?: string;
  studentCount?: number;
}

export type StudentStatus = 'Active' | 'Inactive';

export interface Student {
  studentId: string;
  registerNumber: string;
  name: string;
  departmentId: string;
  departmentName?: string;
  year: string; // '1st Year', '2nd Year', '3rd Year', '4th Year' or '1', '2', '3', '4'
  section: string; // 'A', 'B', 'C', etc.
  email: string;
  phone: string;
  status: StudentStatus;
  createdAt?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AttendanceRecord {
  attendanceId: string; // Format: `${studentId}_${date}`
  studentId: string;
  studentName: string;
  registerNumber: string;
  departmentId: string;
  departmentName?: string;
  year: string;
  section: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime: string;
  checkOutTime: string;
  markedBy?: string;
  updatedAt?: string;
}

export interface StudentAttendanceSummary {
  student: Student;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  percentage: number;
  isLowAttendance: boolean;
}

export interface DailyReportRow {
  date: string;
  day: string;
  status: AttendanceStatus | 'Holiday' | 'Not Marked';
  checkInTime: string;
  checkOutTime: string;
}
