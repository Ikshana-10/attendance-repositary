import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { DepartmentManagement } from './components/admin/DepartmentManagement';
import { AttendanceManagement } from './components/admin/AttendanceManagement';
import { AdminReports } from './components/admin/AdminReports';
import { LowAttendanceAlert } from './components/admin/LowAttendanceAlert';
import { SystemSettings } from './components/admin/SystemSettings';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentProfile } from './components/student/StudentProfile';
import { StudentAttendanceHistory } from './components/student/StudentAttendanceHistory';
import { StudentMonthlyReport } from './components/student/StudentMonthlyReport';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { seedInitialData, getStudents } from './services/dataService';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading, loginAsDemo } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Navigation State
  const [currentView, setCurrentView] = useState<string>(
    isAdmin ? 'admin-dashboard' : 'student-dashboard'
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Adjust default view when user role changes
  useEffect(() => {
    if (user?.role === 'admin') {
      setCurrentView((prev) =>
        prev.startsWith('student') ? 'admin-dashboard' : prev
      );
    } else if (user?.role === 'student') {
      setCurrentView((prev) =>
        prev.startsWith('admin') ||
        prev === 'students' ||
        prev === 'departments' ||
        prev === 'attendance' ||
        prev === 'reports' ||
        prev === 'low-attendance' ||
        prev === 'settings'
          ? 'student-dashboard'
          : prev
      );
    }
  }, [user?.role]);

  // Initial seed check: if no students exist in DB and user is admin, auto-seed realistic data
  useEffect(() => {
    const checkAndSeed = async () => {
      if (!user || user.role !== 'admin') return;
      try {
        const students = await getStudents();
        if (students.length === 0) {
          await seedInitialData(false);
        }
      } catch (e) {
        console.warn('Initial seed check:', e);
      }
    };
    checkAndSeed();
  }, [user]);

  const handleQuickRoleSwitch = async () => {
    if (isAdmin) {
      await loginAsDemo('student');
      setCurrentView('student-dashboard');
      addToast('info', 'Switched to Student View', 'Now experiencing portal as student Priya Sharma.');
    } else {
      await loginAsDemo('admin');
      setCurrentView('admin-dashboard');
      addToast('info', 'Switched to Admin View', 'Now experiencing portal as Academic Administrator.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Initializing CampusTrack Academic System...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <LoginView />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  // Titles mapping
  const viewTitles: Record<string, string> = {
    'admin-dashboard': 'Executive Attendance Dashboard',
    students: 'Student Enrollment Roster',
    departments: 'Academic Departments',
    attendance: 'Daily Attendance Register',
    reports: 'Institutional Reports & Analytics',
    'low-attendance': 'Low Attendance Alerts & Counseling',
    settings: 'System Rules & Parameters',
    'student-dashboard': 'Student Academic Dashboard',
    'student-profile': 'Student Academic Profile',
    'student-attendance': 'Personal Attendance Log',
    'monthly-report': 'Official Monthly Statement',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Navbar
          title={viewTitles[currentView] || 'CampusTrack Attendance'}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onQuickRoleSwitch={handleQuickRoleSwitch}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Admin Views */}
          {currentView === 'admin-dashboard' && (
            <AdminDashboard onNavigate={(v) => setCurrentView(v)} />
          )}
          {currentView === 'students' && (
            <StudentManagement onShowToast={addToast} />
          )}
          {currentView === 'departments' && (
            <DepartmentManagement onShowToast={addToast} />
          )}
          {currentView === 'attendance' && (
            <AttendanceManagement onShowToast={addToast} />
          )}
          {currentView === 'reports' && (
            <AdminReports onShowToast={addToast} />
          )}
          {currentView === 'low-attendance' && (
            <LowAttendanceAlert onShowToast={addToast} />
          )}
          {currentView === 'settings' && (
            <SystemSettings onShowToast={addToast} />
          )}

          {/* Student Views */}
          {currentView === 'student-dashboard' && (
            <StudentDashboard onNavigate={(v) => setCurrentView(v)} />
          )}
          {currentView === 'student-profile' && (
            <StudentProfile />
          )}
          {currentView === 'student-attendance' && (
            <StudentAttendanceHistory />
          )}
          {currentView === 'monthly-report' && (
            <StudentMonthlyReport />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
