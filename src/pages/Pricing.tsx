import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  priceKey: { monthly: string; yearly: string };
  features: string[];
  limits: { deadlines: string; users: string; sms: string };
  popular?: boolean;
  color: string;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    description: 'For individuals getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceKey: { monthly: '', yearly: '' },
    color: 'blue',
    limits: { deadlines: '5 deadlines', users: '1 user', sms: 'Email only' },
    features: ['5 active deadlines', 'Email reminders', 'Basic categories', 'Mobile responsive'],
  },
  {
    name: 'Pro',
    description: "For professionals who can't afford to miss deadlines",
    monthlyPrice: 19,
    yearlyPrice: 190,
    priceKey: { monthly: 'pro_monthly', yearly: 'pro_yearly' },
    color: 'red',
    popular: true,
    limits: { deadlines: 'Unlimited', users: '1 user', sms: '50 SMS/mo' },
    features: ['Unlimited deadlines', 'Email + SMS reminders', 'Recurring deadlines', 'A/E/C industry templates', 'Cost tracking', 'Document notes', 'Priority support'],
  },
  {
    name: 'Team',
    description: 'For teams managing compliance together',
    monthlyPrice: 49,
    yearlyPrice: 490,
    priceKey: { monthly: 'team_monthly', yearly: 'team_yearly' },
    color: 'green',
    limits: { deadlines: 'Unlimited', users: 'Up to 10', sms: '200 SMS/mo' },
    features: ['Everything in Pro', 'Up to 10 team members', 'Shared deadlines', 'Role-based permissions', 'Team dashboard', 'Activity audit log', 'Deadline assignments'],
  },
  {
    name: 'Enterprise',
    description: 'For organizations with advanced needs',
    monthlyPrice: 99,
    yearlyPrice: 990,
    priceKey: { monthly: 'team_monthly', yearly: 'team_yearly' },
    color: 'purple',
    limits: { deadlines: 'Unlimited', users: 'Unlimited', sms: 'Unlimited' },
    features: ['Everything in Team', 'Unlimited team members', 'Unlimited SMS', 'API access', 'SSO (coming soon)', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const { user } = useAuth();
  const { planTier, isActive, createCheckout } = useSubscription();
  const navigate = useNavigate();

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

  const handleSelectPlan = async (tier: PricingTier) => {
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }
    if (tier.monthlyPrice === 0) {
      navigate('/dashboard');
      return;
    }
    if (planTier === tier.name.toLowerCase() && isActive) {
      navigate('/settings?tab=billing');
      return;
    }

    setLoadingTier(tier.name);
    try {
      const priceKey = isYearly ? tier.priceKey.yearly : tier.priceKey.monthly;
      const result = await createCheckout.mutateAsync(priceKey);
      if (result.url) window.location.href = result.url;
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingTier(null);
    }
  };

  const getButtonText = (tier: PricingTier) => {
    if (!user) return 'Get Started';
    if (tier.monthlyPrice === 0) {
      if (planTier === 'free') return 'Current Plan';
      return 'Downgrade';
    }
    if (planTier === tier.name.toLowerCase() && isActive) return 'Current Plan';
    if (planTier === 'free' || !isActive) return 'Start Free Trial';
    return 'Switch Plan';
  };

  const isCurrentPlan = (tier: PricingTier) => planTier === tier.name.toLowerCase() && isActive;

  const getColorClasses = (color: string, type: 'border' | 'bg' | 'text' | 'glow') => {
    const colors: Record<string, Record<string, string>> = {
      blue: { border: 'border-blue-500/30', bg: 'bg-blue-500', text: 'text-blue-500', glow: 'shadow-[0_0_60px_-12px_rgba(59,130,246,0.4)]' },
      red: { border: 'border-red-500/30', bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-[0_0_60px_-12px_rgba(239,68,68,0.4)]' },
      green: { border: 'border-green-500/30', bg: 'bg-green-500', text: 'text-green-500', glow: 'shadow-[0_0_60px_-12px_rgba(34,197,94,0.4)]' },
      purple: { border: 'border-purple-500/30', bg: 'bg-purple-500', text: 'text-purple-500', glow: 'shadow-[0_0_60px_-12px_rgba(168,85,247,0.4)]' },
    };
    return colors[color]?.[type] || '';
  };

  return (
    <div className={`${theme.bg} ${theme.text} font-sans min-h-screen transition-colors duration-300`}>
      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-[1000]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
      }} />

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
            <Link to="/" className={`${theme.textMuted} hover:text-white transition-colors text-sm`}>Home</Link>
            <span className="text-red-500 text-sm font-medium">Pricing</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className={`relative w-14 h-7 rounded-full ${theme.elevated} border ${theme.border} cursor-pointer transition-all duration-300`}>
              <div className={`absolute top-[3px] w-5 h-5 rounded-full transition-all duration-300 shadow-md ${isDark ? "left-[27px] bg-indigo-500" : "left-[3px] bg-amber-500"}`} />
              <svg className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500 transition-opacity ${isDark ? "opacity-40" : "opacity-100"}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
              <svg className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 transition-opacity ${isDark ? "opacity-100" : "opacity-40"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

            {user ? (
              <Link to="/dashboard" className="bg-red-500 hover:bg-red-500/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]">
                Dashboard
              </Link>
            ) : (
              <Link to="/auth" className="bg-red-500 hover:bg-red-500/90 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-[1.02]">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-mono rounded-full mb-6">
            SIMPLE PRICING
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className={`bg-gradient-to-br ${isDark ? "from-white to-slate-400" : "from-slate-900 to-slate-500"} bg-clip-text text-transparent`}>
              Protection That Pays
            </span>
            <br />
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              For Itself
            </span>
          </h1>
          <p className={`text-xl ${theme.textMuted} max-w-2xl mx-auto mb-8`}>
            One missed deadline can cost thousands. Choose a plan that protects your business.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isYearly ? theme.text : theme.textMuted}`}>Monthly</span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full ${theme.elevated} border ${theme.border} cursor-pointer transition-all duration-300`}
            >
              <div className={`absolute top-[3px] w-5 h-5 rounded-full bg-red-500 transition-all duration-300 shadow-md ${isYearly ? "left-[27px]" : "left-[3px]"}`} />
            </button>
            <span className={`text-sm ${isYearly ? theme.text : theme.textMuted}`}>
              Yearly <span className="text-green-500 text-xs font-mono ml-1">SAVE 17%</span>
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`${theme.surface} border ${tier.popular ? getColorClasses(tier.color, 'border') + ' ' + getColorClasses(tier.color, 'glow') : theme.border} rounded-2xl p-6 relative transition-all duration-300 hover:-translate-y-1 flex flex-col`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`${getColorClasses(tier.color, 'bg')} text-white text-xs font-mono px-3 py-1 rounded-full`}>
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className={`text-sm ${theme.textMuted}`}>{tier.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice}
                  </span>
                  <span className={theme.textMuted}>/mo</span>
                </div>
                {tier.monthlyPrice > 0 && (
                  <p className={`text-xs ${theme.textMuted} mt-1`}>
                    {isYearly ? `$${tier.yearlyPrice}/year billed annually` : `$${tier.monthlyPrice * 12}/year billed monthly`}
                  </p>
                )}
              </div>

              {/* Limits */}
              <div className={`${theme.elevated} rounded-lg p-3 mb-6 space-y-2`}>
                <div className="flex justify-between text-sm">
                  <span className={theme.textMuted}>Deadlines</span>
                  <span className="font-mono">{tier.limits.deadlines}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme.textMuted}>Users</span>
                  <span className="font-mono">{tier.limits.users}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={theme.textMuted}>Alerts</span>
                  <span className="font-mono">{tier.limits.sms}</span>
                </div>
              </div>

              {/* Features */}
              <div className="flex-1 mb-6">
                <ul className="space-y-3">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <svg className={`w-5 h-5 flex-shrink-0 ${getColorClasses(tier.color, 'text')}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={theme.textMuted}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(tier)}
                disabled={isCurrentPlan(tier) || loadingTier === tier.name}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
                  isCurrentPlan(tier)
                    ? `${theme.elevated} ${theme.textMuted} cursor-not-allowed`
                    : tier.popular
                    ? `${getColorClasses(tier.color, 'bg')} text-white hover:opacity-90 hover:scale-[1.02] hover:shadow-lg`
                    : `${theme.elevated} border ${theme.border} hover:border-red-500/50`
                }`}
              >
                {loadingTier === tier.name ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  getButtonText(tier)
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className={`${theme.surface} border-t ${theme.border} py-20 px-6`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { q: 'Can I cancel anytime?', a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period." },
              { q: 'What happens after my trial?', a: "After your 14-day trial, you'll be charged for the plan you selected. You can downgrade to Free anytime before that." },
              { q: 'Do you offer refunds?', a: "We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund." },
              { q: 'Can I switch plans?', a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately." },
            ].map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className={`text-sm ${theme.textMuted}`}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className={`max-w-3xl mx-auto text-center ${theme.surface} border ${theme.border} rounded-2xl p-10`}>
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className={`${theme.textMuted} mb-6`}>
            We're here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <button className={`${theme.elevated} border ${theme.border} px-6 py-3 rounded-lg font-medium text-sm hover:border-red-500/50 transition-all`}>
            Contact Sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t ${theme.border} py-8 px-6`}>
        <div className="max-w-7xl mx-auto text-center">
          <p className={`text-sm ${theme.textMuted}`}>© 2026 DeadlineGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
