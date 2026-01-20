import { ReactNode, useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface NewAppLayoutProps {
  children: ReactNode;
  currentPage?: string;
}

export function NewAppLayout({ children, currentPage }: NewAppLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "light") setIsDark(false);
    else if (savedTheme === "dark" || systemPrefersDark) setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const theme = {
    bg: isDark ? "bg-[#0a0a0f]" : "bg-[#f8fafc]",
    surface: isDark ? "bg-[#12121a]" : "bg-white",
    elevated: isDark ? "bg-[#1a1a24]" : "bg-[#f1f5f9]",
    border: isDark ? "border-[#2a2a3a]" : "border-[#e2e8f0]",
    text: isDark ? "text-white" : "text-[#0f172a]",
    textMuted: "text-[#64748b]",
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/deadlines', label: 'All Deadlines' },
    { to: '/team', label: 'Team' },
    { to: '/settings', label: 'Settings' },
  ];

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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive
                    ? "text-red-500 text-sm font-medium"
                    : `${theme.textMuted} hover:text-white transition-colors text-sm`
                }
              >
                {item.label}
              </NavLink>
            ))}
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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  isActive
                    ? "block text-red-500 text-sm font-medium py-2"
                    : `block ${theme.textMuted} text-sm py-2`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button onClick={signOut} className="block text-red-500/70 text-sm py-2 w-full text-left">
              Sign out
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}

// Export theme hook for child components
export function useAppTheme() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (savedTheme === "light") setIsDark(false);
    else if (savedTheme === "dark" || systemPrefersDark) setIsDark(true);

    // Listen for storage changes (theme toggle in other tabs)
    const handleStorage = () => {
      const theme = localStorage.getItem("theme");
      setIsDark(theme !== "light");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return {
    isDark,
    theme: {
      bg: isDark ? "bg-[#0a0a0f]" : "bg-[#f8fafc]",
      surface: isDark ? "bg-[#12121a]" : "bg-white",
      elevated: isDark ? "bg-[#1a1a24]" : "bg-[#f1f5f9]",
      border: isDark ? "border-[#2a2a3a]" : "border-[#e2e8f0]",
      text: isDark ? "text-white" : "text-[#0f172a]",
      textMuted: "text-[#64748b]",
    }
  };
}

export default NewAppLayout;
