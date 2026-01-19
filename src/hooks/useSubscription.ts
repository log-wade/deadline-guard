import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

export interface Subscription {
  id: string;
  user_id: string;
  organization_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanLimits {
  deadlines: number; // -1 = unlimited
  team_members: number;
  sms: number;
  recurring: boolean;
  integrations: boolean;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: { deadlines: 5, team_members: 1, sms: 0, recurring: false, integrations: false },
  pro: { deadlines: -1, team_members: 1, sms: 50, recurring: true, integrations: true },
  team: { deadlines: -1, team_members: 10, sms: 200, recurring: true, integrations: true },
  enterprise: { deadlines: -1, team_members: -1, sms: -1, recurring: true, integrations: true },
};

export function useSubscription() {
  const { user } = useAuth();

  const subscriptionQuery = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const subscription = subscriptionQuery.data;
  const planTier: PlanTier = subscription?.plan_tier || 'free';
  const limits = PLAN_LIMITS[planTier];

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrialing = subscription?.status === 'trialing';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.cancel_at_period_end || subscription?.status === 'canceled';

  const trialDaysRemaining = subscription?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Create checkout session
  const createCheckout = useMutation({
    mutationFn: async (priceKey: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            priceKey,
            successUrl: `${window.location.origin}/settings?checkout=success`,
            cancelUrl: `${window.location.origin}/settings?checkout=canceled`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      return response.json();
    },
  });

  // Open billing portal
  const openBillingPortal = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-billing-portal`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            returnUrl: `${window.location.origin}/settings`,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const { url } = await response.json();
      window.location.href = url;
    },
  });

  // Check if user can perform action based on plan
  const canUseFeature = (feature: keyof PlanLimits): boolean => {
    const limit = limits[feature];
    if (typeof limit === 'boolean') return limit;
    return true; // Numeric limits are checked elsewhere
  };

  const canCreateDeadline = async (): Promise<boolean> => {
    if (limits.deadlines === -1) return true;
    
    const { count } = await supabase
      .from('deadlines')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user?.id);

    return (count || 0) < limits.deadlines;
  };

  return {
    subscription,
    planTier,
    limits,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    trialDaysRemaining,
    isLoading: subscriptionQuery.isLoading,
    createCheckout,
    openBillingPortal,
    canUseFeature,
    canCreateDeadline,
    refetch: subscriptionQuery.refetch,
  };
}
