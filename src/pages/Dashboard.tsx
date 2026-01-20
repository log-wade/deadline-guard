import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDeadlines } from '@/hooks/useDeadlines';
import { DeadlineForm, DeadlineFormData } from '@/components/deadline/DeadlineForm';
import {
  Deadline,
  getDeadlineStatus,
  getDaysUntil,
  sortDeadlinesByUrgency,
} from '@/lib/deadline-utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const { profile, signOut } = useAuth();
  const { deadlines, isLoading, createDeadline, updateDeadline, deleteDeadline } = useDeadlines();
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deletingDeadline, setDeletingDeadline] = useState<Deadline | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "light") {
      setIsDark(false);
    } else if (savedTheme === "dark" || systemPrefersDark) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const sortedDeadlines = sortDeadlinesByUrgency(deadlines);
  
  const criticalDeadlines = deadlines.filter(
    (d) => getDeadlineStatus(d.due_date, d.consequence_level) === 'overdue'
  );
  const warningDeadlines = deadlines.filter(
    (d) => getDeadlineStatus(d.due_date, d.consequence_level) === 'upcoming'
  );
  const safeDeadlines = deadlines.filter(
    (d) => getDeadlineStatus(d.due_date, d.consequence_level) === 'safe'
  );

  const handleCreateDeadline = (data: DeadlineFormData) => {
    createDeadline.mutate(data, {
      onSuccess: () => setFormOpen(false),
    });
  };

  const handleUpdateDeadline = (data: DeadlineFormData) => {
    if (!editingDeadline) return;
    updateDeadline.mutate(
      { id: editingDeadline.id, ...data },
      { onSuccess: () => setEditingDeadline(null) }
    );
  };

  const handleDeleteDeadline = () => {
    if (!deletingDeadline) return;
    deleteDeadline.mutate(deletingDeadline.id, {
      onSuccess: () => setDeletingDeadline(null),
    });
  };

  // Theme colors
  const theme = {
    bg: isDark ? "bg-[#0a0a0f]" : "bg-[#f8fafc]",
    surface: isDark ? "bg-[#12121a]" : "bg-white",
    elevated: isDark ? "bg-[#1a1a24]" : "bg-[#f1f5f9]",
    border: isDark ? "border-[#2a2a3a]" : "border-[#e2e8f0]",
    text: isDark ? "text-white" : "text-[#0f172a]",
    textMuted: "text-[#64748b]",
  };

  const getStatusIcon = (status: string) => {
    if (status === 'overdue') return (
      <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
    if (status === 'upcoming') return (
      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
    return (
      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const formatDaysUntil = (dueDate: string) => {
    const days = getDaysUntil(dueDate);
    if (days < 0) return `${Math.abs(days)} DAYS OVERDUE`;
    if (days === 0) return 'TODAY';
    if (days === 1) return '1 DAY';
    return `${days} DAYS`;
  };

  const getStatusColor = (status: string) => {
    if (status === 'overdue') return 'text-red-500';
    if (status === 'upcoming') return 'text-amber-500';
    return 'text-green-500';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'overdue') return { bg: 'bg-red-500/20', text: 'text-red-500', label: 'OVERDUE' };
    if (status === 'upcoming') return { bg: 'bg-amber-500/20', text: 'text-amber-500', label: 'DUE SOON' };
    return { bg: 'bg-green-500/20', text: 'text-green-500', label: 'ON TRACK' };
  };

  return (
    <div className={`${theme.bg} ${theme.text} font-sans min-h-screen transition-colors duration-300`}>
      {/* Noise overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.015] z-[1000]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 ${theme.bg}/80 backdrop-blur-xl border-b ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">Deadline<span className="text-red-500">Guard</span></span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-red-500 text-sm font-medium">Dashboard</Link>
            <Link to="/deadlines" className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>All Deadlines</Link>
            <Link to="/team" className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>Team</Link>
            <Link to="/settings" className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>Settings</Link>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full ${theme.elevated} border ${theme.border} cursor-pointer transition-all duration-300`}
              aria-label="Toggle dark mode"
            >
              <div className={`absolute top-[3px] w-5 h-5 rounded-full transition-all duration-300 shadow-md ${isDark ? "left-[27px] bg-indigo-500" : "left-[3px] bg-amber-500"}`} />
              <svg className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 transition-opacity ${isDark ? "opacity-40" : "opacity-100"}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              <svg className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 transition-opacity ${isDark ? "opacity-100" : "opacity-40"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

            {/* User Avatar */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                <span className="text-sm font-medium text-red-500">
                  {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button onClick={signOut} className={`${theme.textMuted} hover:text-red-500 transition-colors text-sm`}>
                Sign out
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden ${theme.surface} border-t ${theme.border} px-6 py-4 space-y-3`}>
            <Link to="/dashboard" className="block text-red-500 text-sm font-medium py-2">Dashboard</Link>
            <Link to="/deadlines" className={`block ${theme.textMuted} text-sm py-2`}>All Deadlines</Link>
            <Link to="/team" className={`block ${theme.textMuted} text-sm py-2`}>Team</Link>
            <Link to="/settings" className={`block ${theme.textMuted} text-sm py-2`}>Settings</Link>
            <button onClick={signOut} className="block text-red-500/70 text-sm py-2 w-full text-left">Sign out</button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {/* Status Bar */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className={`flex items-center gap-4 px-6 py-3 rounded-full border ${theme.border} ${theme.surface}`} style={{
            background: "linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 50%, rgba(34, 197, 94, 0.1) 100%)"
          }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-500">{criticalDeadlines.length} CRITICAL</span>
            </div>
            <div className={`w-px h-4 ${isDark ? "bg-[#2a2a3a]" : "bg-[#e2e8f0]"}`} />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-mono text-amber-500">{warningDeadlines.length} WARNING</span>
            </div>
            <div className={`w-px h-4 ${isDark ? "bg-[#2a2a3a]" : "bg-[#e2e8f0]"}`} />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-green-500">{safeDeadlines.length} OK</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              <span className={`bg-gradient-to-br ${isDark ? "from-white to-slate-400" : "from-slate-900 to-slate-500"} bg-clip-text text-transparent`}>
                Command Center
              </span>
            </h1>
            <p className={theme.textMuted}>Welcome back, {profile?.name?.split(' ')[0] || 'there'}. Here's your deadline status.</p>
          </div>
          <button 
            onClick={() => setFormOpen(true)}
            className="bg-red-500 hover:bg-red-500/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)] flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Deadline
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className={`${theme.surface} border border-red-500/30 rounded-xl p-5 shadow-[0_0_60px_-12px_rgba(239,68,68,0.3)]`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>Critical</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
            <div className="text-4xl font-bold text-red-500 tabular-nums">{criticalDeadlines.length}</div>
            <div className="text-xs text-red-500/70 mt-1">Requires immediate action</div>
          </div>

          <div className={`${theme.surface} border border-amber-500/30 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>Warning</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-4xl font-bold text-amber-500 tabular-nums">{warningDeadlines.length}</div>
            <div className="text-xs text-amber-500/70 mt-1">Due within 30 days</div>
          </div>

          <div className={`${theme.surface} border border-green-500/30 rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>On Track</span>
              <span className="w-2 h-2 rounded-full bg-green-500" />
            </div>
            <div className="text-4xl font-bold text-green-500 tabular-nums">{safeDeadlines.length}</div>
            <div className="text-xs text-green-500/70 mt-1">More than 30 days out</div>
          </div>

          <div className={`${theme.surface} border ${theme.border} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>Total Protected</span>
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="text-4xl font-bold tabular-nums">{deadlines.length}</div>
            <div className={`text-xs ${theme.textMuted} mt-1`}>Active deadlines</div>
          </div>
        </div>

        {/* Deadline List */}
        <div className={`${theme.surface} border ${theme.border} rounded-2xl overflow-hidden`}>
          <div className={`px-6 py-4 border-b ${theme.border} flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Upcoming Deadlines</span>
              <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-mono rounded">LIVE</span>
            </div>
            <div className={`flex items-center gap-2 text-xs ${theme.textMuted} font-mono`}>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Sorted by urgency
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`${theme.elevated} rounded-xl p-4 animate-pulse`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-500/20" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-500/20 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-500/20 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedDeadlines.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No deadlines yet</h3>
              <p className={`${theme.textMuted} mb-6 max-w-sm mx-auto`}>
                Start tracking your important deadlines to stay protected from costly oversights.
              </p>
              <button 
                onClick={() => setFormOpen(true)}
                className="bg-red-500 hover:bg-red-500/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)] inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Your First Deadline
              </button>
            </div>
          ) : (
            <div>
              {sortedDeadlines.map((deadline) => {
                const status = getDeadlineStatus(deadline.due_date, deadline.consequence_level);
                const badge = getStatusBadge(status);
                const days = getDaysUntil(deadline.due_date);
                
                return (
                  <div 
                    key={deadline.id}
                    className={`px-6 py-5 border-b ${theme.border} last:border-b-0 hover:${status === 'overdue' ? 'bg-red-500/5' : status === 'upcoming' ? 'bg-amber-500/5' : 'bg-green-500/5'} transition-colors cursor-pointer group`}
                    onClick={() => setEditingDeadline(deadline)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        status === 'overdue' ? 'bg-red-500/20 border border-red-500/30' :
                        status === 'upcoming' ? 'bg-amber-500/20 border border-amber-500/30' :
                        'bg-green-500/20 border border-green-500/30'
                      }`}>
                        {getStatusIcon(status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-semibold truncate">{deadline.title}</span>
                          <span className={`px-2 py-0.5 ${badge.bg} ${badge.text} text-xs font-mono rounded`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className={`text-sm ${theme.textMuted} truncate`}>
                          {deadline.category} {deadline.notes && `• ${deadline.notes}`}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold font-mono ${getStatusColor(status)}`}>
                          {days < 0 ? `-${Math.abs(days)}` : days} {days === 1 || days === -1 ? 'DAY' : 'DAYS'}
                        </div>
                        <div className={`text-xs ${theme.textMuted}`}>
                          {new Date(deadline.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingDeadline(deadline);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-all`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick tip */}
        {deadlines.length > 0 && deadlines.length < 3 && (
          <div className={`mt-6 ${theme.surface} border ${theme.border} rounded-xl p-4 flex items-center gap-4`}>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-0.5">Pro tip: Add more deadlines</p>
              <p className={`text-xs ${theme.textMuted}`}>
                The more deadlines you track, the better protected your business is. Try adding insurance renewals, license expirations, and contract deadlines.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Forms */}
      <DeadlineForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateDeadline}
        isLoading={createDeadline.isPending}
      />

      <DeadlineForm
        open={!!editingDeadline}
        onOpenChange={(open) => !open && setEditingDeadline(null)}
        onSubmit={handleUpdateDeadline}
        deadline={editingDeadline}
        isLoading={updateDeadline.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDeadline} onOpenChange={(open) => !open && setDeletingDeadline(null)}>
        <AlertDialogContent className={`${theme.surface} border ${theme.border}`}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deadline</AlertDialogTitle>
            <AlertDialogDescription className={theme.textMuted}>
              Are you sure you want to delete "{deletingDeadline?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={`${theme.elevated} border ${theme.border} hover:bg-[#2a2a3a]`}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeadline} className="bg-red-500 text-white hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
