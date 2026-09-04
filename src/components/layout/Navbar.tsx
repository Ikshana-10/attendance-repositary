import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Calendar,
  ShieldCheck,
  GraduationCap,
  ArrowLeftRight
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
  title: string;
  onQuickRoleSwitch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  title,
  onQuickRoleSwitch
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const todayStr = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {title}
          </h2>
          <p className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Academic Session: {todayStr}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Role Toggle for easy testing */}
        <button
          id="btn-quick-role-switch"
          onClick={onQuickRoleSwitch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          title="Quickly toggle between Admin and Student views"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Switch to:</span>
          <span className="font-bold text-indigo-600">
            {isAdmin ? 'Student View' : 'Admin View'}
          </span>
        </button>

        {/* Role badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              isAdmin
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {isAdmin ? (
              <ShieldCheck className="w-4 h-4" />
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-none">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-slate-500 capitalize mt-0.5">
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
