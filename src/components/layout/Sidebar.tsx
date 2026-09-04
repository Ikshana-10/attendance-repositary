import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck2,
  FileBarChart,
  AlertTriangle,
  Settings,
  LogOut,
  GraduationCap,
  UserCheck,
  History,
  CalendarDays,
  X
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onClose
}) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminNavItems: NavItem[] = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'departments', label: 'Departments', icon: Building2 },
    { id: 'attendance', label: 'Attendance', icon: CalendarCheck2 },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
    { id: 'low-attendance', label: 'Low Attendance', icon: AlertTriangle, badge: 'Alert' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const studentNavItems: NavItem[] = [
    { id: 'student-dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'student-profile', label: 'My Profile', icon: UserCheck },
    { id: 'student-attendance', label: 'My Attendance', icon: History },
    { id: 'monthly-report', label: 'Monthly Report', icon: CalendarDays },
  ];

  const items: NavItem[] = isAdmin ? adminNavItems : studentNavItems;

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* College / App Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                CampusTrack
              </h1>
              <p className="text-[11px] font-medium text-indigo-300">
                Attendance System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Role Tag */}
        <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {isAdmin ? 'Academic Administration' : 'Student Portal'}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isAdmin
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isAdmin ? 'ADMIN' : 'STUDENT'}
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/25 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Current user badge & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-slate-800/40">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold flex items-center justify-center text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            id="btn-sidebar-logout"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
