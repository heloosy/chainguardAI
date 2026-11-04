import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Database, 
  Trash2, 
  Server, 
  User as UserIcon, 
  LogIn, 
  LogOut,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConfirmationDialog } from '../common/ConfirmationDialog';

export const Header: React.FC = () => {
  const { 
    dataStatus, 
    health, 
    appStatus,
    currentUser,
    loginUser,
    logoutUser,
    seedFixtures, 
    clearData, 
    refreshData, 
    isLoadingStatus,
    globalSearch,
    setGlobalSearch
  } = useApp();

  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState('admin@chainguard.ai');
  const [authPassword, setAuthPassword] = useState('AdminPass123!');
  const [authLoading, setAuthLoading] = useState(false);

  const isFixtures = dataStatus?.is_fixtures_loaded ?? false;
  const isHealthy = health?.status === 'healthy';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    const ok = await loginUser(authEmail, authPassword);
    setAuthLoading(false);
    if (ok) setIsAuthModalOpen(false);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 shrink-0">
      {/* Brand & App Title */}
      <div className="flex items-center gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm ring-4 ring-blue-50">
          <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-sm tracking-tight">ChainGuard AI</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Phase 2
            </span>
          </div>
          <p className="text-[11px] text-slate-500 hidden sm:block">Supply Chain Resilience Control Tower</p>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search suppliers, SKUs, POs, shipments, disruptions..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 transition"
          />
        </div>
      </div>

      {/* Right Controls: Database Status, User Auth, Fixtures Toggle */}
      <div className="flex items-center gap-2.5">
        {/* Database Diagnostic Indicator */}
        <div 
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs"
          title={appStatus?.system_message || 'Database status'}
        >
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-600 font-mono text-[11px]">
            {health?.database_engine || 'SQLite Persistent'}
          </span>
        </div>

        {/* Fixtures / Live Mode Indicator */}
        {isFixtures ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>DEMO FIXTURES</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>LIVE (AWAITING DATA)</span>
          </div>
        )}

        {/* Auth / Current User Pill */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
                {currentUser.full_name.charAt(0)}
              </span>
              <span className="hidden sm:inline font-semibold text-slate-800 text-xs">
                {currentUser.full_name.split(' ')[0]}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={logoutUser}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}

        {/* Manual Refresh */}
        <button
          onClick={() => refreshData()}
          disabled={isLoadingStatus}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          aria-label="Refresh state"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setIsAuthModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm border border-slate-200">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Sign In to ChainGuard</h3>
                  <p className="text-xs text-slate-500">Enterprise Role-Based Access Control</p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 uppercase">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail('admin@chainguard.ai');
                      setAuthPassword('AdminPass123!');
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Quick: Admin Role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthEmail('operator@chainguard.ai');
                      setAuthPassword('OperatorPass123!');
                    }}
                    className="text-[11px] text-blue-600 hover:underline"
                  >
                    Operator
                  </button>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    {authLoading ? 'Verifying...' : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
