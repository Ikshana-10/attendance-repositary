import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Database
} from 'lucide-react';
import { seedInitialData } from '../../services/dataService';

export const LoginView: React.FC = () => {
  const { login, loginWithGoogle, loginAsDemo, register } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>('admin');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('admin@attendance.edu');
  const [password, setPassword] = useState<string>('admin123');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    if (role === 'admin') {
      setEmail('admin@attendance.edu');
      setPassword('admin123');
    } else {
      setEmail('priya.sharma@attendance.edu');
      setPassword('student123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          throw new Error('Please provide your full name');
        }
        await register(name, email, password, activeTab);
      } else {
        await login(email, password, activeTab);
      }
    } catch (err: any) {
      console.warn('Login attempt:', err);
      let msg = err.message || 'Authentication failed. Please check credentials or use Demo Login.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        msg = 'Invalid credentials. You can click One-Click Demo Admin or Demo Student below to test instantly!';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle(activeTab);
    } catch (err: any) {
      console.warn('Google sign-in status:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed.');
      } else {
        setError(err.message || 'Google authentication not available. Please use Demo 1-Click login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemo(role);
    } catch (err: any) {
      setError(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setLoading(true);
    setSeedNotice(null);
    const res = await seedInitialData(true);
    setSeedNotice(res.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative glow */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 mb-4 ring-4 ring-indigo-500/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            CampusTrack
          </h1>
          <p className="text-sm text-slate-300 mt-1.5 font-medium">
            Student Attendance Management System
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 sm:p-8">
          {/* Role Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-5 border border-slate-200">
            <button
              id="tab-role-admin"
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin Portal
            </button>
            <button
              id="tab-role-student"
              type="button"
              onClick={() => handleTabChange('student')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'student'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              Student Portal
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {seedNotice && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{seedNotice}</span>
            </div>
          )}

          {/* Google Sign-in */}
          <button
            id="btn-google-login"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full mb-4 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Account</span>
          </button>

          <div className="relative flex items-center justify-center mb-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2.5 text-[11px] font-medium text-slate-400 shrink-0">
              or credentials
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Arthur Vance / Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {activeTab === 'admin' ? 'Admin Email / Username' : 'Student Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-login-email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeTab === 'admin'
                      ? 'admin@attendance.edu'
                      : 'student@attendance.edu'
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  id="input-login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-hidden transition-all text-slate-900"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                activeTab === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/25'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'
              } disabled:opacity-50`}
            >
              <span>{loading ? 'Authenticating...' : isRegistering ? 'Create Account' : `Sign In as ${activeTab === 'admin' ? 'Admin' : 'Student'}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch between Login and Register */}
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              {isRegistering
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Register here"}
            </button>
          </div>

          {/* Quick Demo Instant Access Buttons */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Instant Demo Access
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-sm">1-Click Ready</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-demo-admin"
                type="button"
                onClick={() => handleQuickDemo('admin')}
                disabled={loading}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Demo Admin</span>
              </button>

              <button
                id="btn-demo-student"
                type="button"
                onClick={() => handleQuickDemo('student')}
                disabled={loading}
                className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>Demo Student</span>
              </button>
            </div>

            {/* Seed Database button */}
            <div className="mt-3 pt-2.5 border-t border-dashed border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Need fresh college records?</span>
              <button
                type="button"
                onClick={handleSeedDatabase}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600"
              >
                <Database className="w-3 h-3" />
                Seed Sample Data
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          CampusTrack Academic Security &bull; Role-Based Access Control
        </p>
      </div>
    </div>
  );
};
