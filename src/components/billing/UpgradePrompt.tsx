import { useNavigate } from 'react-router-dom';
import { useSubscription, PlanTier } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Zap, Lock, AlertTriangle, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  feature: 'deadlines' | 'recurring' | 'sms' | 'team' | 'templates';
  currentUsage?: number;
  limit?: number;
}

const FEATURE_INFO: Record<string, {
  title: string;
  description: string;
  requiredPlan: PlanTier;
  benefits: string[];
}> = {
  deadlines: {
    title: "You've reached your deadline limit",
    description: "Upgrade to Pro for unlimited deadline tracking.",
    requiredPlan: 'pro',
    benefits: [
      'Unlimited deadlines',
      'Email + SMS reminders',
      'Recurring deadlines',
      'A/E/C industry templates',
    ],
  },
  recurring: {
    title: "Recurring deadlines require Pro",
    description: "Set it once, get reminded every renewal cycle automatically.",
    requiredPlan: 'pro',
    benefits: [
      'Auto-renewing deadlines',
      'Annual, bi-annual, custom cycles',
      'Never miss a recurring renewal',
      'Perfect for licenses & insurance',
    ],
  },
  sms: {
    title: "SMS notifications require Pro",
    description: "Get text alerts for critical deadlines that can't wait.",
    requiredPlan: 'pro',
    benefits: [
      '50 SMS per month',
      'Critical deadline alerts',
      'Never miss urgent deadlines',
      'Works alongside email reminders',
    ],
  },
  team: {
    title: "Team features require Team plan",
    description: "Collaborate with your team on deadline management.",
    requiredPlan: 'team',
    benefits: [
      'Up to 10 team members',
      'Shared deadline management',
      'Role-based permissions',
      'Team activity audit log',
    ],
  },
  templates: {
    title: "Industry templates require Pro",
    description: "Pre-built templates for A/E/C professionals.",
    requiredPlan: 'pro',
    benefits: [
      '25+ industry templates',
      'Licenses, insurance, bonds',
      'Pre-filled renewal instructions',
      'Typical recurrence patterns',
    ],
  },
};

export function UpgradePrompt({ feature, currentUsage, limit }: UpgradePromptProps) {
  const navigate = useNavigate();
  const { planTier } = useSubscription();
  const info = FEATURE_INFO[feature];

  return (
    <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-full bg-amber-500/10">
            <Lock className="h-4 w-4 text-amber-600" />
          </div>
          <CardTitle className="text-lg">{info.title}</CardTitle>
        </div>
        {currentUsage !== undefined && limit !== undefined && (
          <CardDescription>
            You're using {currentUsage} of {limit} available on the {planTier} plan.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-4">{info.description}</p>
        <div className="grid grid-cols-2 gap-2">
          {info.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => navigate('/pricing')} className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          Upgrade to {info.requiredPlan === 'team' ? 'Team' : 'Pro'}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// Inline alert version for smaller spaces
export function UpgradeAlert({ feature }: { feature: keyof typeof FEATURE_INFO }) {
  const navigate = useNavigate();
  const info = FEATURE_INFO[feature];

  return (
    <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
      <Lock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">{info.title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between mt-2">
        <span className="text-sm">{info.description}</span>
        <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
          Upgrade
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Modal version for blocking actions
interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: keyof typeof FEATURE_INFO;
}

export function UpgradeModal({ open, onOpenChange, feature }: UpgradeModalProps) {
  const navigate = useNavigate();
  const info = FEATURE_INFO[feature];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 p-3 rounded-full bg-amber-500/10 w-fit">
            <Lock className="h-6 w-6 text-amber-600" />
          </div>
          <DialogTitle className="text-center">{info.title}</DialogTitle>
          <DialogDescription className="text-center">
            {info.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm font-medium mb-3">Upgrade to unlock:</p>
          <div className="space-y-2">
            {info.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleUpgrade} className="w-full">
            <Zap className="h-4 w-4 mr-2" />
            View Plans & Upgrade
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Trial banner for header
export function TrialBanner() {
  const navigate = useNavigate();
  const { isTrialing, trialDaysRemaining, planTier } = useSubscription();

  if (!isTrialing || planTier === 'free') return null;

  return (
    <div className={cn(
      "px-4 py-2 text-center text-sm",
      trialDaysRemaining <= 3 
        ? "bg-red-500 text-white" 
        : "bg-amber-500 text-white"
    )}>
      <span className="font-medium">
        {trialDaysRemaining <= 0 
          ? "Your trial has ended. " 
          : `${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left in your trial. `}
      </span>
      <button 
        onClick={() => navigate('/settings?tab=billing')}
        className="underline underline-offset-2 hover:no-underline"
      >
        {trialDaysRemaining <= 0 ? "Reactivate now" : "Add payment method"}
      </button>
    </div>
  );
}

// Past due banner
export function PastDueBanner() {
  const navigate = useNavigate();
  const { isPastDue } = useSubscription();

  if (!isPastDue) return null;

  return (
    <div className="px-4 py-2 text-center text-sm bg-red-500 text-white">
      <AlertTriangle className="h-4 w-4 inline mr-2" />
      <span className="font-medium">Payment failed. </span>
      <span>Update your payment method to avoid service interruption. </span>
      <button 
        onClick={() => navigate('/settings?tab=billing')}
        className="underline underline-offset-2 hover:no-underline"
      >
        Update now
      </button>
    </div>
  );
}
