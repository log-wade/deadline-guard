import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';

const Index = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check for saved preference or system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "light") {
      setIsDark(false);
    } else if (savedTheme === "dark" || systemPrefersDark) {
      setIsDark(true);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Theme-aware color classes
  const theme = {
    bg: isDark ? "bg-[#0a0a0f]" : "bg-[#f8fafc]",
    surface: isDark ? "bg-[#12121a]" : "bg-white",
    elevated: isDark ? "bg-[#1a1a24]" : "bg-[#f1f5f9]",
    border: isDark ? "border-[#2a2a3a]" : "border-[#e2e8f0]",
    text: isDark ? "text-white" : "text-[#0f172a]",
    textMuted: "text-[#64748b]",
  };

  return (
    <div className={`${theme.bg} ${theme.text} font-sans overflow-x-hidden min-h-screen transition-colors duration-300`}>
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

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection("features")} className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>Features</button>
            <button onClick={() => scrollToSection("dashboard")} className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>Dashboard</button>
            <button onClick={() => scrollToSection("pricing")} className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>Pricing</button>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full ${theme.elevated} border ${theme.border} cursor-pointer transition-all duration-300`}
              aria-label="Toggle dark mode"
            >
              <div
                className={`absolute top-[3px] w-5 h-5 rounded-full transition-all duration-300 shadow-md ${
                  isDark ? "left-[27px] bg-indigo-500" : "left-[3px] bg-amber-500"
                }`}
              />
              <svg className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 transition-opacity ${isDark ? "opacity-40" : "opacity-100"}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              <svg className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 transition-opacity ${isDark ? "opacity-100" : "opacity-40"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

            <Link to="/auth" className={`hidden sm:block ${theme.textMuted} hover:text-white transition-colors text-sm`}>Sign in</Link>
            <Link to="/auth" className="bg-red-500 hover:bg-red-500/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]">
              Get Protected
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen pt-32 pb-20 relative overflow-hidden" style={{
        backgroundImage: isDark 
          ? "linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)"
          : "linear-gradient(rgba(59, 130, 246, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.015) 1px, transparent 1px)",
        backgroundSize: "50px 50px"
      }}>
        {/* Ambient glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Status Bar */}
          <div className="flex items-center justify-center gap-6 mb-12 animate-[fadeInUp_0.8s_ease-out]">
            <div className={`flex items-center gap-4 px-6 py-3 rounded-full border ${theme.border} ${theme.surface}`} style={{
              background: "linear-gradient(90deg, rgba(239, 68, 68, 0.1) 0%, rgba(245, 158, 11, 0.1) 50%, rgba(34, 197, 94, 0.1) 100%)"
            }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-red-500">3 CRITICAL</span>
              </div>
              <div className={`w-px h-4 ${isDark ? "bg-[#2a2a3a]" : "bg-[#e2e8f0]"}`} />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-xs font-mono text-amber-500">7 WARNING</span>
              </div>
              <div className={`w-px h-4 ${isDark ? "bg-[#2a2a3a]" : "bg-[#e2e8f0]"}`} />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-mono text-green-500">12 OK</span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-8 animate-[fadeInUp_0.8s_ease-out_0.1s_both]">
              <span className={`bg-gradient-to-br ${isDark ? "from-white to-slate-400" : "from-slate-900 to-slate-500"} bg-clip-text text-transparent`}>Never Miss a</span><br />
              <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Critical Deadline</span><br />
              <span className={`bg-gradient-to-br ${isDark ? "from-white to-slate-400" : "from-slate-900 to-slate-500"} bg-clip-text text-transparent`}>Again</span>
            </h1>

            <p className={`text-xl ${theme.textMuted} max-w-2xl mx-auto mb-8 font-light leading-relaxed animate-[fadeInUp_0.8s_ease-out_0.2s_both]`}>
              Track licenses, insurance renewals, contracts, and compliance deadlines. Smart alerts based on consequence level—<span className="text-red-500 font-medium">critical dates get critical attention.</span>
            </p>

            {/* Terminal-style urgency message */}
            <div className={`${theme.surface} border ${theme.border} rounded-lg p-4 max-w-xl mx-auto mb-10 animate-[fadeInUp_0.8s_ease-out_0.3s_both]`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-red-500/50" />
                <span className="w-3 h-3 rounded-full bg-amber-500/50" />
                <span className="w-3 h-3 rounded-full bg-green-500/50" />
              </div>
              <div className="font-mono text-sm text-left">
                <span className={theme.textMuted}>$</span> <span className="text-blue-500">deadline-guard</span> <span>--scan-business</span><br />
                <span className="text-red-500">⚠ ALERT:</span> <span>Business License expires in</span> <span className="text-red-500 font-bold">3 days</span><br />
                <span className="text-amber-500">⚡ WARNING:</span> <span>Insurance renewal due in</span> <span className="text-amber-500 font-bold">12 days</span><br />
                <span className="text-green-500">✓ OK:</span> <span className={theme.textMuted}>Contract review in 45 days</span>
                <span className="border-r-2 border-blue-500/70 animate-pulse ml-1">&nbsp;</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_0.8s_ease-out_0.4s_both]">
              <Link to="/auth" className="bg-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg w-full sm:w-auto flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Start Protecting Now
              </Link>
              <button onClick={() => scrollToSection("dashboard")} className={`${theme.textMuted} hover:text-white transition-colors font-medium flex items-center gap-2`}>
                <span>See Dashboard</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className={`mt-12 flex items-center justify-center gap-6 text-sm ${theme.textMuted} animate-[fadeInUp_0.8s_ease-out_0.5s_both]`}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Free 14-day trial
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div id="dashboard" className="mt-20 relative animate-[fadeInUp_0.8s_ease-out_0.5s_both]">
            <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-[#0a0a0f]" : "from-[#f8fafc]"} via-transparent to-transparent z-10 pointer-events-none`} />
            
            <div className={`${theme.surface} border ${theme.border} rounded-2xl p-2 shadow-[0_0_40px_-12px_rgba(59,130,246,0.4)]`}>
              <div className={`${theme.elevated} rounded-xl overflow-hidden`}>
                {/* Dashboard Header */}
                <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.border}`}>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">Command Center</span>
                    <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-mono rounded">LIVE</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${theme.textMuted} font-mono`}>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Last sync: 2 min ago
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6">
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    {/* Stat Cards */}
                    <div className={`${theme.surface} border border-red-500/30 rounded-xl p-4 shadow-[0_0_60px_-12px_rgba(239,68,68,0.4)]`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>Critical</span>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      </div>
                      <div className="text-3xl font-bold text-red-500 tabular-nums">3</div>
                      <div className="text-xs text-red-500/70 mt-1">Requires immediate action</div>
                    </div>

                    <div className={`${theme.surface} border border-amber-500/30 rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>Warning</span>
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      </div>
                      <div className="text-3xl font-bold text-amber-500 tabular-nums">7</div>
                      <div className="text-xs text-amber-500/70 mt-1">Due within 30 days</div>
                    </div>

                    <div className={`${theme.surface} border border-green-500/30 rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>On Track</span>
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <div className="text-3xl font-bold text-green-500 tabular-nums">12</div>
                      <div className="text-xs text-green-500/70 mt-1">More than 30 days out</div>
                    </div>

                    <div className={`${theme.surface} border ${theme.border} rounded-xl p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs ${theme.textMuted} uppercase tracking-wider`}>Total Protected</span>
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div className="text-3xl font-bold tabular-nums">22</div>
                      <div className={`text-xs ${theme.textMuted} mt-1`}>Active deadlines</div>
                    </div>
                  </div>

                  {/* Deadline List */}
                  <div className={`${theme.surface} border ${theme.border} rounded-xl overflow-hidden`}>
                    <div className={`px-4 py-3 border-b ${theme.border} flex items-center justify-between`}>
                      <span className="text-sm font-medium">Upcoming Deadlines</span>
                      <span className={`text-xs ${theme.textMuted}`}>Sorted by urgency</span>
                    </div>

                    {/* Critical Item */}
                    <div className={`px-4 py-4 border-b ${theme.border} bg-red-500/5 hover:bg-red-500/10 transition-colors cursor-pointer`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Business License Renewal</span>
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs font-mono rounded">OVERDUE</span>
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>Texas Department of Licensing</div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-500 font-bold font-mono">-3 DAYS</div>
                          <div className="text-xs text-red-500/70">$500 penalty/day</div>
                        </div>
                      </div>
                    </div>

                    {/* Warning Item */}
                    <div className={`px-4 py-4 border-b ${theme.border} hover:bg-amber-500/5 transition-colors cursor-pointer`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">General Liability Insurance</span>
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs font-mono rounded">DUE SOON</span>
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>State Farm Policy #4821</div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-500 font-bold font-mono">12 DAYS</div>
                          <div className={`text-xs ${theme.textMuted}`}>Renewal: $2,400/yr</div>
                        </div>
                      </div>
                    </div>

                    {/* Safe Item */}
                    <div className="px-4 py-4 hover:bg-green-500/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Vendor Contract Review</span>
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-500 text-xs font-mono rounded">ON TRACK</span>
                          </div>
                          <div className={`text-sm ${theme.textMuted}`}>Acme Corp Service Agreement</div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-500 font-bold font-mono">45 DAYS</div>
                          <div className={`text-xs ${theme.textMuted}`}>Auto-renews if not cancelled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-500 text-sm font-mono rounded-full mb-6">SYSTEM CAPABILITIES</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className={`bg-gradient-to-br ${isDark ? "from-white to-slate-400" : "from-slate-900 to-slate-500"} bg-clip-text text-transparent`}>Built for Business-Critical</span><br />
              <span>Deadline Protection</span>
            </h2>
            <p className={`text-xl ${theme.textMuted} max-w-2xl mx-auto`}>
              Enterprise-grade monitoring for every deadline that matters to your business.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className={`${theme.surface} border ${theme.border} rounded-2xl p-8 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50`}>
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Consequence-Based Alerts</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Critical deadlines get critical attention. Our system prioritizes alerts based on the actual business impact of missing each deadline.
              </p>
              <div className={`mt-6 pt-6 border-t ${theme.border}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className={theme.textMuted}>High penalty = Earlier alerts</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className={`${theme.surface} border ${theme.border} rounded-2xl p-8 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50`}>
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Multi-Channel Notifications</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Email, SMS, Slack, mobile push—get notified where you'll actually see it. Escalation paths ensure nothing falls through the cracks.
              </p>
              <div className={`mt-6 pt-6 border-t ${theme.border}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className={theme.textMuted}>Escalate to manager if ignored</span>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className={`${theme.surface} border ${theme.border} rounded-2xl p-8 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50`}>
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-3">
                <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Team Coordination</h3>
              <p className={`${theme.textMuted} leading-relaxed`}>
                Assign owners, add notes, track who's handling what. Everyone stays aligned on critical dates without endless email chains.
              </p>
              <div className={`mt-6 pt-6 border-t ${theme.border}`}>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className={theme.textMuted}>Full audit trail included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Consequences Section */}
      <section className={`py-32 ${theme.surface} border-y ${theme.border} relative overflow-hidden`}>
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono rounded-full mb-6">THE COST OF MISSING DEADLINES</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                <span>One Missed Deadline</span><br />
                <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Can Cost Everything</span>
              </h2>
              <p className={`text-xl ${theme.textMuted} mb-10 leading-relaxed`}>
                Late fees, license suspensions, legal exposure, lost contracts—the consequences add up fast. Deadline Guard is your insurance against costly oversights.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Avoid Late Fees & Penalties</h4>
                    <p className={theme.textMuted}>Some licenses carry $500+/day penalties for operating without renewal.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Prevent License Suspensions</h4>
                    <p className={theme.textMuted}>Keep your business operating legally without interruption.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Stay Compliant Automatically</h4>
                    <p className={theme.textMuted}>Never worry about regulatory deadlines slipping through the cracks.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Calculator Visual */}
            <div id="pricing" className={`${theme.elevated} border ${theme.border} rounded-2xl p-8`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Annual Risk Without Protection</h3>
                <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs font-mono rounded">ESTIMATED</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className={`flex items-center justify-between py-3 border-b ${theme.border}`}>
                  <span className={theme.textMuted}>Average late fee per deadline</span>
                  <span className="font-mono text-red-500">$1,500</span>
                </div>
                <div className={`flex items-center justify-between py-3 border-b ${theme.border}`}>
                  <span className={theme.textMuted}>Deadlines typically tracked</span>
                  <span className="font-mono">15-25</span>
                </div>
                <div className={`flex items-center justify-between py-3 border-b ${theme.border}`}>
                  <span className={theme.textMuted}>Average missed per year (manual)</span>
                  <span className="font-mono text-amber-500">2-3</span>
                </div>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <div className="text-sm text-red-500 mb-2">Potential Annual Loss</div>
                <div className="text-4xl font-bold text-red-500 font-mono">$3,000 - $4,500</div>
                <div className={`text-sm ${theme.textMuted} mt-2`}>Not including legal exposure or lost business</div>
              </div>

              <div className="mt-6 text-center">
                <div className={`text-sm ${theme.textMuted} mb-2`}>Deadline Guard costs</div>
                <div className="text-2xl font-bold text-green-500 font-mono">$19/month</div>
                <div className="text-sm text-green-500 mt-1">228x potential ROI</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden" style={{
        backgroundImage: isDark 
          ? "linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)"
          : "linear-gradient(rgba(59, 130, 246, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.015) 1px, transparent 1px)",
        backgroundSize: "50px 50px"
      }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono text-red-500">PROTECTION STARTS TODAY</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8">
            <span>Stop Gambling With</span><br />
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Critical Deadlines</span>
          </h2>

          <p className={`text-xl ${theme.textMuted} max-w-2xl mx-auto mb-12 leading-relaxed`}>
            Join thousands of businesses who never miss a license renewal, insurance deadline, or compliance date.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link to="/auth" className="bg-red-500 text-white px-8 py-4 rounded-lg font-semibold text-lg w-full sm:w-auto flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.5)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Get Started Free
            </Link>
            <Link to="/auth" className={`${theme.textMuted} hover:text-white transition-colors font-medium`}>
              Schedule a demo →
            </Link>
          </div>

          <p className={`text-sm ${theme.textMuted}`}>
            14-day free trial • No credit card required • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${theme.surface} border-t ${theme.border} py-16`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="font-semibold text-lg">Deadline<span className="text-red-500">Guard</span></span>
            </div>

            <div className={`flex items-center gap-8 text-sm ${theme.textMuted}`}>
              <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link to="#" className="hover:text-white transition-colors">Terms</Link>
              <Link to="#" className="hover:text-white transition-colors">Support</Link>
            </div>

            <div className={`text-sm ${theme.textMuted}`}>
              © {new Date().getFullYear()} Deadline Guard. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Global styles for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Index;
