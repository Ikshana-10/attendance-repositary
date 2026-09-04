import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  Department,
  Student,
  AttendanceRecord,
  AttendanceStatus,
  StudentAttendanceSummary
} from '../types';

export const DEPARTMENTS_COLLECTION = 'departments';
export const STUDENTS_COLLECTION = 'students';
export const ATTENDANCE_COLLECTION = 'attendance';
export const USERS_COLLECTION = 'users';

const LS_DEPTS = 'campustrack_departments';
const LS_STUDENTS = 'campustrack_students';
const LS_ATTENDANCE = 'campustrack_attendance';

// Default Seed Data
const DEFAULT_DEPTS: Department[] = [
  { departmentId: 'dept_cse', name: 'Computer Science and Engineering', code: 'CSE', createdAt: '2026-08-01T00:00:00.000Z' },
  { departmentId: 'dept_it', name: 'Information Technology', code: 'IT', createdAt: '2026-08-01T00:00:00.000Z' },
  { departmentId: 'dept_ece', name: 'Electronics and Communication Engineering', code: 'ECE', createdAt: '2026-08-01T00:00:00.000Z' },
  { departmentId: 'dept_eee', name: 'Electrical and Electronics Engineering', code: 'EEE', createdAt: '2026-08-01T00:00:00.000Z' },
  { departmentId: 'dept_mech', name: 'Mechanical Engineering', code: 'MECH', createdAt: '2026-08-01T00:00:00.000Z' },
  { departmentId: 'dept_civil', name: 'Civil Engineering', code: 'CIVIL', createdAt: '2026-08-01T00:00:00.000Z' }
];

const DEFAULT_STUDENTS: Student[] = [
  {
    studentId: 'stu_1',
    registerNumber: '710023CSE001',
    name: 'Priya Sharma',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science and Engineering',
    year: '3rd Year',
    section: 'A',
    email: 'priya.sharma@attendance.edu',
    phone: '+91 98451 23456',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_2',
    registerNumber: '710023CSE002',
    name: 'Rahul Verma',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science and Engineering',
    year: '3rd Year',
    section: 'A',
    email: 'rahul.verma@attendance.edu',
    phone: '+91 98452 34567',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_3',
    registerNumber: '710023CSE003',
    name: 'Ananya Patel',
    departmentId: 'dept_cse',
    departmentName: 'Computer Science and Engineering',
    year: '3rd Year',
    section: 'B',
    email: 'ananya.patel@attendance.edu',
    phone: '+91 98453 45678',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_4',
    registerNumber: '710023IT001',
    name: 'Karthik Raja',
    departmentId: 'dept_it',
    departmentName: 'Information Technology',
    year: '2nd Year',
    section: 'A',
    email: 'karthik.raja@attendance.edu',
    phone: '+91 98454 56789',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_5',
    registerNumber: '710023IT002',
    name: 'Sneha Reddy',
    departmentId: 'dept_it',
    departmentName: 'Information Technology',
    year: '2nd Year',
    section: 'A',
    email: 'sneha.reddy@attendance.edu',
    phone: '+91 98455 67890',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_6',
    registerNumber: '710023ECE001',
    name: 'Vikram Sundaram',
    departmentId: 'dept_ece',
    departmentName: 'Electronics and Communication Engineering',
    year: '4th Year',
    section: 'A',
    email: 'vikram.sundaram@attendance.edu',
    phone: '+91 98456 78901',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_7',
    registerNumber: '710023ECE002',
    name: 'Meera Nambiar',
    departmentId: 'dept_ece',
    departmentName: 'Electronics and Communication Engineering',
    year: '4th Year',
    section: 'B',
    email: 'meera.nambiar@attendance.edu',
    phone: '+91 98457 89012',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_8',
    registerNumber: '710023EEE001',
    name: 'Deepak Krishnan',
    departmentId: 'dept_eee',
    departmentName: 'Electrical and Electronics Engineering',
    year: '1st Year',
    section: 'A',
    email: 'deepak.krishnan@attendance.edu',
    phone: '+91 98458 90123',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_9',
    registerNumber: '710023MECH001',
    name: 'Arjun Das',
    departmentId: 'dept_mech',
    departmentName: 'Mechanical Engineering',
    year: '3rd Year',
    section: 'A',
    email: 'arjun.das@attendance.edu',
    phone: '+91 98459 01234',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    studentId: 'stu_10',
    registerNumber: '710023CIVIL001',
    name: 'Divya Prakash',
    departmentId: 'dept_civil',
    departmentName: 'Civil Engineering',
    year: '2nd Year',
    section: 'A',
    email: 'divya.prakash@attendance.edu',
    phone: '+91 98460 12345',
    status: 'Active',
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

function generateDefaultAttendance(): AttendanceRecord[] {
  const dates: string[] = [];
  const today = new Date();
  let d = new Date(today);
  d.setDate(d.getDate() - 28); // start 4 weeks ago

  while (d <= today) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${yyyy}-${mm}-${dd}`);
    }
    d.setDate(d.getDate() + 1);
  }

  const list: AttendanceRecord[] = [];
  DEFAULT_STUDENTS.forEach((student, index) => {
    dates.forEach((dateStr, dateIdx) => {
      let status: AttendanceStatus = 'Present';
      let checkIn = '08:55 AM';
      let checkOut = '04:30 PM';

      if (student.studentId === 'stu_2') {
        if (dateIdx % 3 === 0) {
          status = 'Absent';
          checkIn = '-';
          checkOut = '-';
        } else if (dateIdx % 5 === 0) {
          status = 'Late';
          checkIn = '09:35 AM';
          checkOut = '04:30 PM';
        }
      } else if (student.studentId === 'stu_9') {
        if (dateIdx % 2 === 0) {
          status = 'Absent';
          checkIn = '-';
          checkOut = '-';
        }
      } else {
        if ((index + dateIdx) % 11 === 0) {
          status = 'Absent';
          checkIn = '-';
          checkOut = '-';
        } else if ((index + dateIdx) % 7 === 0) {
          status = 'Late';
          checkIn = '09:20 AM';
          checkOut = '04:30 PM';
        }
      }

      const id = `${student.studentId}_${dateStr}`;
      list.push({
        attendanceId: id,
        studentId: student.studentId,
        studentName: student.name,
        registerNumber: student.registerNumber,
        departmentId: student.departmentId,
        departmentName: student.departmentName,
        year: student.year,
        section: student.section,
        date: dateStr,
        status,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        markedBy: 'admin',
        updatedAt: new Date().toISOString()
      });
    });
  });

  return list;
}

// Local Storage Helpers
function getLocalDepts(): Department[] {
  try {
    const raw = localStorage.getItem(LS_DEPTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Local storage read error:', e);
  }
  localStorage.setItem(LS_DEPTS, JSON.stringify(DEFAULT_DEPTS));
  return DEFAULT_DEPTS;
}

function setLocalDepts(data: Department[]) {
  try {
    localStorage.setItem(LS_DEPTS, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage write error:', e);
  }
}

function getLocalStudents(): Student[] {
  try {
    const raw = localStorage.getItem(LS_STUDENTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Local storage read error:', e);
  }
  localStorage.setItem(LS_STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  return DEFAULT_STUDENTS;
}

function setLocalStudents(data: Student[]) {
  try {
    localStorage.setItem(LS_STUDENTS, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage write error:', e);
  }
}

function getLocalAttendance(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(LS_ATTENDANCE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Local storage read error:', e);
  }
  const generated = generateDefaultAttendance();
  try {
    localStorage.setItem(LS_ATTENDANCE, JSON.stringify(generated));
  } catch (e) {
    console.warn('Local storage write error:', e);
  }
  return generated;
}

function setLocalAttendance(data: AttendanceRecord[]) {
  try {
    localStorage.setItem(LS_ATTENDANCE, JSON.stringify(data));
  } catch (e) {
    console.warn('Local storage write error:', e);
  }
}

// ==================== DEPARTMENTS ====================

export async function getDepartments(): Promise<Department[]> {
  if (auth.currentUser) {
    try {
      const q = query(collection(db, DEPARTMENTS_COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const departments: Department[] = [];
      snapshot.forEach((d) => {
        departments.push({ departmentId: d.id, ...d.data() } as Department);
      });
      if (departments.length > 0) {
        setLocalDepts(departments);
        return departments;
      }
    } catch (error) {
      console.warn('Firestore departments fetch note:', error);
    }
  }
  return getLocalDepts().sort((a, b) => a.name.localeCompare(b.name));
}

export async function createDepartment(name: string, code?: string): Promise<Department> {
  const newDept: Department = {
    departmentId: 'dept_' + Date.now().toString().slice(-6),
    name: name.trim(),
    code: code ? code.trim().toUpperCase() : name.split(' ').map(w => w[0]).join('').toUpperCase(),
    createdAt: new Date().toISOString()
  };

  if (auth.currentUser) {
    try {
      const deptRef = doc(collection(db, DEPARTMENTS_COLLECTION));
      newDept.departmentId = deptRef.id;
      await setDoc(deptRef, newDept);
    } catch (e) {
      console.warn('Firestore createDepartment note:', e);
    }
  }

  const local = getLocalDepts();
  local.push(newDept);
  setLocalDepts(local);
  return newDept;
}

export async function updateDepartment(departmentId: string, data: Partial<Department>): Promise<void> {
  if (auth.currentUser) {
    try {
      const deptRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
      await updateDoc(deptRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore updateDepartment note:', e);
    }
  }

  const local = getLocalDepts().map((d) =>
    d.departmentId === departmentId ? { ...d, ...data, updatedAt: new Date().toISOString() } : d
  );
  setLocalDepts(local);
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  if (auth.currentUser) {
    try {
      const deptRef = doc(db, DEPARTMENTS_COLLECTION, departmentId);
      await deleteDoc(deptRef);
    } catch (e) {
      console.warn('Firestore deleteDepartment note:', e);
    }
  }

  const local = getLocalDepts().filter((d) => d.departmentId !== departmentId);
  setLocalDepts(local);
}

// ==================== STUDENTS ====================

export async function getStudents(filters?: {
  departmentId?: string;
  year?: string;
  section?: string;
  search?: string;
}): Promise<Student[]> {
  let students: Student[] = [];

  if (auth.currentUser) {
    try {
      const snapshot = await getDocs(collection(db, STUDENTS_COLLECTION));
      snapshot.forEach((d) => {
        students.push({ studentId: d.id, ...d.data() } as Student);
      });
      if (students.length > 0) {
        setLocalStudents(students);
      }
    } catch (error) {
      console.warn('Firestore getStudents note (using local cache):', error);
      students = getLocalStudents();
    }
  }

  if (students.length === 0) {
    students = getLocalStudents();
  }

  if (filters) {
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      students = students.filter(s => s.departmentId === filters.departmentId);
    }
    if (filters.year && filters.year !== 'ALL') {
      students = students.filter(s => s.year === filters.year);
    }
    if (filters.section && filters.section !== 'ALL') {
      students = students.filter(s => s.section.toUpperCase() === filters.section?.toUpperCase());
    }
    if (filters.search && filters.search.trim() !== '') {
      const queryStr = filters.search.toLowerCase().trim();
      students = students.filter(
        s => s.name.toLowerCase().includes(queryStr) ||
             s.registerNumber.toLowerCase().includes(queryStr) ||
             s.email.toLowerCase().includes(queryStr)
      );
    }
  }

  return students.sort((a, b) => a.registerNumber.localeCompare(b.registerNumber));
}

export async function getStudentById(studentId: string): Promise<Student | null> {
  if (auth.currentUser) {
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, studentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { studentId: snap.id, ...snap.data() } as Student;
      }
    } catch (error) {
      console.warn('Firestore getStudentById note:', error);
    }
  }

  const local = getLocalStudents();
  return local.find(s => s.studentId === studentId) || null;
}

export async function getStudentByEmail(email: string): Promise<Student | null> {
  const normEmail = email.toLowerCase().trim();
  if (auth.currentUser) {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), where('email', '==', normEmail));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const first = snapshot.docs[0];
        return { studentId: first.id, ...first.data() } as Student;
      }
    } catch (error) {
      console.warn('Firestore getStudentByEmail note:', error);
    }
  }

  const local = getLocalStudents();
  return local.find(s => s.email.toLowerCase().trim() === normEmail) || null;
}

export async function createStudent(studentData: Omit<Student, 'studentId' | 'createdAt'>): Promise<Student> {
  const newStudent: Student = {
    ...studentData,
    studentId: 'stu_' + Date.now().toString().slice(-6),
    createdAt: new Date().toISOString()
  };

  if (auth.currentUser) {
    try {
      const studentRef = doc(collection(db, STUDENTS_COLLECTION));
      newStudent.studentId = studentRef.id;
      await setDoc(studentRef, newStudent);
    } catch (e) {
      console.warn('Firestore createStudent note:', e);
    }
  }

  const local = getLocalStudents();
  local.push(newStudent);
  setLocalStudents(local);
  return newStudent;
}

export async function updateStudent(studentId: string, data: Partial<Student>): Promise<void> {
  if (auth.currentUser) {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
      await updateDoc(studentRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Firestore updateStudent note:', e);
    }
  }

  const local = getLocalStudents().map(s =>
    s.studentId === studentId ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
  );
  setLocalStudents(local);
}

export async function deleteStudent(studentId: string): Promise<void> {
  if (auth.currentUser) {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
      await deleteDoc(studentRef);

      const q = query(collection(db, ATTENDANCE_COLLECTION), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      console.warn('Firestore deleteStudent note:', e);
    }
  }

  const localStudents = getLocalStudents().filter(s => s.studentId !== studentId);
  setLocalStudents(localStudents);

  const localAttendance = getLocalAttendance().filter(a => a.studentId !== studentId);
  setLocalAttendance(localAttendance);
}

// ==================== ATTENDANCE ====================

export async function getAttendanceByDate(
  date: string,
  filters?: { departmentId?: string; year?: string; section?: string }
): Promise<AttendanceRecord[]> {
  let records: AttendanceRecord[] = [];

  if (auth.currentUser) {
    try {
      const q = query(collection(db, ATTENDANCE_COLLECTION), where('date', '==', date));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        records.push({ attendanceId: d.id, ...d.data() } as AttendanceRecord);
      });
    } catch (error) {
      console.warn('Firestore getAttendanceByDate note:', error);
    }
  }

  if (records.length === 0) {
    records = getLocalAttendance().filter(r => r.date === date);
  }

  if (filters) {
    if (filters.departmentId && filters.departmentId !== 'ALL') {
      records = records.filter(r => r.departmentId === filters.departmentId);
    }
    if (filters.year && filters.year !== 'ALL') {
      records = records.filter(r => r.year === filters.year);
    }
    if (filters.section && filters.section !== 'ALL') {
      records = records.filter(r => r.section.toUpperCase() === filters.section?.toUpperCase());
    }
  }

  return records;
}

export async function getAttendanceForStudent(
  studentId: string,
  monthPrefix?: string
): Promise<AttendanceRecord[]> {
  let records: AttendanceRecord[] = [];

  if (auth.currentUser) {
    try {
      const q = query(collection(db, ATTENDANCE_COLLECTION), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      snap.forEach((d) => {
        records.push({ attendanceId: d.id, ...d.data() } as AttendanceRecord);
      });
    } catch (error) {
      console.warn('Firestore getAttendanceForStudent note:', error);
    }
  }

  if (records.length === 0) {
    records = getLocalAttendance().filter(r => r.studentId === studentId);
  }

  if (monthPrefix) {
    records = records.filter(r => r.date.startsWith(monthPrefix));
  }

  return records.sort((a, b) => a.date.localeCompare(b.date));
}

export async function getAllAttendance(): Promise<AttendanceRecord[]> {
  let records: AttendanceRecord[] = [];

  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(db, ATTENDANCE_COLLECTION));
      snap.forEach((d) => {
        records.push({ attendanceId: d.id, ...d.data() } as AttendanceRecord);
      });
      if (records.length > 0) {
        setLocalAttendance(records);
        return records;
      }
    } catch (error) {
      console.warn('Firestore getAllAttendance note:', error);
    }
  }

  return getLocalAttendance();
}

export async function saveBatchAttendance(records: AttendanceRecord[]): Promise<void> {
  if (!records || records.length === 0) return;

  const now = new Date().toISOString();

  // Save to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const batch = writeBatch(db);
      records.forEach((record) => {
        const id = record.attendanceId || `${record.studentId}_${record.date}`;
        const docRef = doc(db, ATTENDANCE_COLLECTION, id);
        batch.set(docRef, {
          ...record,
          attendanceId: id,
          updatedAt: now
        }, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.warn('Firestore batch save note:', e);
    }
  }

  // Update local storage
  const current = getLocalAttendance();
  const map = new Map<string, AttendanceRecord>();
  current.forEach(r => map.set(r.attendanceId, r));
  records.forEach(r => {
    const id = r.attendanceId || `${r.studentId}_${r.date}`;
    map.set(id, { ...r, attendanceId: id, updatedAt: now });
  });
  setLocalAttendance(Array.from(map.values()));
}

// ==================== ANALYTICS & STATS HELPERS ====================

export function calculateStatsForStudent(
  student: Student,
  allStudentAttendance: AttendanceRecord[]
): StudentAttendanceSummary {
  const records = allStudentAttendance.filter(r => r.studentId === student.studentId);
  const totalWorkingDays = records.length;
  const presentDays = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
  const absentDays = records.filter(r => r.status === 'Absent').length;
  const lateDays = records.filter(r => r.status === 'Late').length;

  const percentage = totalWorkingDays > 0
    ? Number(((presentDays / totalWorkingDays) * 100).toFixed(2))
    : 0;

  return {
    student,
    totalWorkingDays,
    presentDays,
    absentDays,
    lateDays,
    percentage,
    isLowAttendance: totalWorkingDays > 0 && percentage < 75
  };
}

// ==================== DATA SEEDING ====================

export async function seedInitialData(force = false): Promise<{ success: boolean; message: string }> {
  try {
    const generatedAttendance = generateDefaultAttendance();
    setLocalDepts(DEFAULT_DEPTS);
    setLocalStudents(DEFAULT_STUDENTS);
    setLocalAttendance(generatedAttendance);

    if (auth.currentUser) {
      const existingDepts = await getDocs(collection(db, DEPARTMENTS_COLLECTION));
      if (!force && !existingDepts.empty) {
        return { success: true, message: 'Cloud database already contains attendance records.' };
      }

      // Seed Departments
      const deptBatch = writeBatch(db);
      DEFAULT_DEPTS.forEach((d) => {
        const ref = doc(db, DEPARTMENTS_COLLECTION, d.departmentId);
        deptBatch.set(ref, d);
      });
      await deptBatch.commit();

      // Seed Students
      const studentBatch = writeBatch(db);
      DEFAULT_STUDENTS.forEach((st) => {
        const ref = doc(db, STUDENTS_COLLECTION, st.studentId);
        studentBatch.set(ref, st);
      });
      await studentBatch.commit();

      // Seed Attendance in batches of 200
      const chunkSize = 200;
      for (let i = 0; i < generatedAttendance.length; i += chunkSize) {
        const chunk = generatedAttendance.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach((rec) => {
          const ref = doc(db, ATTENDANCE_COLLECTION, rec.attendanceId);
          batch.set(ref, rec);
        });
        await batch.commit();
      }

      return { success: true, message: 'Seeded cloud Firebase Firestore and local memory successfully!' };
    }

    return { success: true, message: 'Initialized local demo attendance dataset with 10 students and full attendance records!' };
  } catch (error: any) {
    console.warn('Seed operation status:', error);
    return { success: true, message: 'Default demo dataset is active and ready in memory.' };
  }
}
