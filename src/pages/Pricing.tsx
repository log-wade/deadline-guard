import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Check, X, Shield, Zap, Users, Building2, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  priceKey: {
    monthly: string;
    yearly: string;
  };
  features: {
    text: string;
    included: boolean;
    highlight?: boolean;
  }[];
  limits: {
    deadlines: string;
    users: string;
    sms: string;
  };
  popular?: boolean;
  icon: React.ReactNode;
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    description: 'For individuals getting started',
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceKey: { monthly: '', yearly: '' },
    icon: <Shield className="h-5 w-5" />,
    limits: {
      deadlines: '5 deadlines',
      users: '1 user',
      sms: 'Email only',
    },
    features: [
      { text: '5 active deadlines', included: true },
      { text: 'Email reminders', included: true },
      { text: 'Basic categories', included: true },
      { text: 'Mobile responsive', included: true },
      { text: 'Recurring deadlines', included: false },
      { text: 'SMS notifications', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'A/E/C templates', included: false },
    ],
  },
  {
    name: 'Pro',
    description: 'For professionals who can\'t afford to miss deadlines',
    monthlyPrice: 19,
    yearlyPrice: 190,
    priceKey: { monthly: 'pro_monthly', yearly: 'pro_yearly' },
    icon: <Zap className="h-5 w-5" />,
    popular: true,
    limits: {
      deadlines: 'Unlimited',
      users: '1 user',
      sms: '50 SMS/mo',
    },
    features: [
      { text: 'Unlimited deadlines', included: true, highlight: true },
      { text: 'Email + SMS reminders', included: true, highlight: true },
      { text: 'Recurring deadlines', included: true, highlight: true },
      { text: 'A/E/C industry templates', included: true, highlight: true },
      { text: 'Cost tracking', included: true },
      { text: 'Document notes', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team collaboration', included: false },
    ],
  },
  {
    name: 'Team',
    description: 'For teams managing compliance together',
    monthlyPrice: 49,
    yearlyPrice: 490,
    priceKey: { monthly: 'team_monthly', yearly: 'team_yearly' },
    icon: <Users className="h-5 w-5" />,
    limits: {
      deadlines: 'Unlimited',
      users: 'Up to 10',
      sms: '200 SMS/mo',
    },
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Up to 10 team members', included: true, highlight: true },
      { text: 'Shared deadlines', included: true, highlight: true },
      { text: 'Role-based permissions', included: true, highlight: true },
      { text: 'Team dashboard', included: true },
      { text: 'Activity audit log', included: true },
      { text: 'Deadline assignments', included: true },
      { text: 'Priority support', included: true },
    ],
  },
  {
    name: 'Enterprise',
    description: 'For organizations with advanced needs',
    monthlyPrice: 99,
    yearlyPrice: 990,
    priceKey: { monthly: 'team_monthly', yearly: 'team_yearly' }, // Same as team for now
    icon: <Building2 className="h-5 w-5" />,
    limits: {
      deadlines: 'Unlimited',
      users: 'Unlimited',
      sms: 'Unlimited',
    },
    features: [
      { text: 'Everything in Team', included: true },
      { text: 'Unlimited team members', included: true, highlight: true },
      { text: 'Unlimited SMS', included: true, highlight: true },
      { text: 'API access', included: true, highlight: true },
      { text: 'SSO (coming soon)', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'SLA guarantee', included: true },
    ],
  },
];

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { user } = useAuth();
  const { planTier, isActive, createCheckout } = useSubscription();
  const navigate = useNavigate();

  const handleSelectPlan = async (tier: PricingTier) => {
    // If not logged in, redirect to auth
    if (!user) {
      navigate('/auth?redirect=/pricing');
      return;
    }

    // If free tier, no action needed
    if (tier.monthlyPrice === 0) {
      navigate('/dashboard');
      return;
    }

    // If already on this plan, go to settings
    if (planTier === tier.name.toLowerCase() && isActive) {
      navigate('/settings?tab=billing');
      return;
    }

    // Start checkout
    setLoadingTier(tier.name);
    try {
      const priceKey = isYearly ? tier.priceKey.yearly : tier.priceKey.monthly;
      const result = await createCheckout.mutateAsync(priceKey);
      
      // Redirect to Stripe Checkout
      if (result.url) {
        window.location.href = result.url;
      }
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

  const isCurrentPlan = (tier: PricingTier) => {
    return planTier === tier.name.toLowerCase() && isActive;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">DeadlineGuard</span>
          </a>
          <div className="flex items-center gap-4">
            {user ? (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose the plan that's right for you
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you need more. All paid plans include a 14-day free trial.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label 
            htmlFor="billing-toggle" 
            className={cn(
              "text-sm font-medium cursor-pointer",
              !isYearly && "text-foreground",
              isYearly && "text-muted-foreground"
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label 
            htmlFor="billing-toggle" 
            className={cn(
              "text-sm font-medium cursor-pointer",
              isYearly && "text-foreground",
              !isYearly && "text-muted-foreground"
            )}
          >
            Yearly
          </Label>
          {isYearly && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              Save ~17%
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.name}
              className={cn(
                "relative flex flex-col",
                tier.popular && "border-primary shadow-lg scale-[1.02]",
                isCurrentPlan(tier) && "ring-2 ring-primary"
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    tier.popular ? "bg-primary/10 text-primary" : "bg-muted"
                  )}>
                    {tier.icon}
                  </div>
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${isYearly ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {tier.yearlyPrice > 0 && isYearly && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${tier.yearlyPrice} billed yearly
                    </p>
                  )}
                  {tier.monthlyPrice === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Free forever
                    </p>
                  )}
                </div>

                {/* Limits Summary */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg mb-6 text-center text-xs">
                  <div>
                    <div className="font-semibold">{tier.limits.deadlines}</div>
                    <div className="text-muted-foreground">Deadlines</div>
                  </div>
                  <div>
                    <div className="font-semibold">{tier.limits.users}</div>
                    <div className="text-muted-foreground">Users</div>
                  </div>
                  <div>
                    <div className="font-semibold">{tier.limits.sms}</div>
                    <div className="text-muted-foreground">SMS</div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      {feature.included ? (
                        <Check className={cn(
                          "h-4 w-4 mt-0.5 flex-shrink-0",
                          feature.highlight ? "text-primary" : "text-green-500"
                        )} />
                      ) : (
                        <X className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={cn(
                        feature.included ? "text-foreground" : "text-muted-foreground/50",
                        feature.highlight && "font-medium"
                      )}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                  disabled={isCurrentPlan(tier) || loadingTier === tier.name}
                  onClick={() => handleSelectPlan(tier)}
                >
                  {loadingTier === tier.name ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {getButtonText(tier)}
                      {!isCurrentPlan(tier) && tier.monthlyPrice > 0 && (
                        <ArrowRight className="h-4 w-4 ml-2" />
                      )}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ / Trust Section */}
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-6 text-left mt-8">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after my trial?</h3>
              <p className="text-sm text-muted-foreground">
                After your 14-day trial, you'll be charged for the plan you selected. You can downgrade to Free anytime before that.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer refunds?</h3>
              <p className="text-sm text-muted-foreground">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact us for a full refund.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I switch plans?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center p-8 bg-muted/50 rounded-2xl">
          <h2 className="text-2xl font-bold mb-2">Still have questions?</h2>
          <p className="text-muted-foreground mb-4">
            We're here to help. Reach out and we'll get back to you within 24 hours.
          </p>
          <Button variant="outline">Contact Sales</Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>© 2026 DeadlineGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
