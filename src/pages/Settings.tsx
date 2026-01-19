import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription, PlanTier } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  CreditCard, 
  Bell, 
  Shield, 
  Loader2, 
  Check, 
  AlertTriangle,
  ExternalLink,
  Zap,
  Calendar,
  Mail,
  Smartphone
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
};

const PLAN_COLORS: Record<PlanTier, string> = {
  free: 'bg-gray-500',
  pro: 'bg-blue-500',
  team: 'bg-purple-500',
  enterprise: 'bg-amber-500',
};

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  const {
    subscription,
    planTier,
    limits,
    isActive,
    isTrialing,
    isPastDue,
    isCanceled,
    trialDaysRemaining,
    isLoading: subscriptionLoading,
    openBillingPortal,
    refetch: refetchSubscription,
  } = useSubscription();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [deadlineCount, setDeadlineCount] = useState(0);

  // Handle checkout success/cancel from URL params
  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast({
        title: 'Subscription activated!',
        description: 'Welcome to DeadlineGuard Pro. Your trial has started.',
      });
      refetchSubscription();
      setSearchParams({});
      setActiveTab('billing');
    } else if (checkout === 'canceled') {
      toast({
        title: 'Checkout canceled',
        description: 'No changes were made to your account.',
        variant: 'destructive',
      });
      setSearchParams({});
    }
  }, [searchParams, toast, refetchSubscription, setSearchParams]);

  // Fetch deadline count for usage display
  useEffect(() => {
    const fetchDeadlineCount = async () => {
      if (!user) return;
      const { count } = await supabase
        .from('deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      setDeadlineCount(count || 0);
    };
    fetchDeadlineCount();
  }, [user]);

  // Update name when profile loads
  useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    }
  }, [profile?.name]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenBillingPortal = async () => {
    try {
      await openBillingPortal.mutateAsync();
    } catch (error: any) {
      toast({
        title: 'Error opening billing portal',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const usagePercentage = limits.deadlines === -1 
    ? 0 
    : Math.min(100, (deadlineCount / limits.deadlines) * 100);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="account" className="gap-2">
              <User className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleUpdateProfile} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Save Changes
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible account actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sign out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" disabled>
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>
                      Manage your subscription and billing
                    </CardDescription>
                  </div>
                  <Badge className={cn(PLAN_COLORS[planTier], 'text-white')}>
                    {PLAN_DISPLAY_NAMES[planTier]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Alerts */}
                {isTrialing && trialDaysRemaining > 0 && (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      You're on a free trial. <strong>{trialDaysRemaining} days</strong> remaining.
                      {subscription?.current_period_end && (
                        <span className="text-muted-foreground ml-1">
                          (Ends {format(new Date(subscription.current_period_end), 'MMM d, yyyy')})
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {isPastDue && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your payment is past due. Please update your payment method to avoid service interruption.
                    </AlertDescription>
                  </Alert>
                )}

                {isCanceled && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Your subscription is set to cancel at the end of the billing period.
                      {subscription?.current_period_end && (
                        <span className="text-muted-foreground ml-1">
                          (Access until {format(new Date(subscription.current_period_end), 'MMM d, yyyy')})
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Plan Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Plan</p>
                      <p className="text-2xl font-bold">{PLAN_DISPLAY_NAMES[planTier]}</p>
                    </div>
                    
                    {subscription?.current_period_end && planTier !== 'free' && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {isCanceled ? 'Access until' : 'Next billing date'}
                        </p>
                        <p className="font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(subscription.current_period_end), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Usage */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Deadlines used</p>
                        <p className="text-sm font-medium">
                          {deadlineCount} / {limits.deadlines === -1 ? '∞' : limits.deadlines}
                        </p>
                      </div>
                      <Progress 
                        value={usagePercentage} 
                        className={cn(
                          "h-2",
                          usagePercentage >= 90 && "bg-red-200 [&>div]:bg-red-500"
                        )}
                      />
                      {limits.deadlines !== -1 && usagePercentage >= 80 && (
                        <p className="text-xs text-amber-600 mt-1">
                          {usagePercentage >= 100 
                            ? "You've reached your limit. Upgrade for more."
                            : "You're approaching your limit."}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Your plan includes:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{limits.deadlines === -1 ? 'Unlimited' : limits.deadlines} deadlines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{limits.team_members === -1 ? 'Unlimited' : limits.team_members} user{limits.team_members !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {limits.sms > 0 ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{limits.sms === -1 ? 'Unlimited' : limits.sms} SMS/mo</span>
                        </>
                      ) : (
                        <>
                          <span className="h-4 w-4 text-muted-foreground">—</span>
                          <span className="text-muted-foreground">No SMS</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {limits.recurring ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Recurring deadlines</span>
                        </>
                      ) : (
                        <>
                          <span className="h-4 w-4 text-muted-foreground">—</span>
                          <span className="text-muted-foreground">No recurring</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-3">
                {planTier === 'free' ? (
                  <Button asChild>
                    <a href="/pricing">
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleOpenBillingPortal}
                      disabled={openBillingPortal.isPending}
                    >
                      {openBillingPortal.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Manage Subscription
                    </Button>
                    <Button variant="ghost" asChild>
                      <a href="/pricing">View Plans</a>
                    </Button>
                  </>
                )}
              </CardFooter>
            </Card>

            {/* Payment Method (for paid users) */}
            {planTier !== 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>
                    Manage your payment method and billing details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">Payment method on file</p>
                        <p className="text-sm text-muted-foreground">
                          Managed through Stripe
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleOpenBillingPortal}
                      disabled={openBillingPortal.isPending}
                    >
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoices */}
            {planTier !== 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View and download your past invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    onClick={handleOpenBillingPortal}
                    disabled={openBillingPortal.isPending}
                  >
                    {openBillingPortal.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    View Invoices in Stripe
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>
                  Configure when and how you receive deadline reminders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">Email reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Receive deadline reminders via email
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Always On</Badge>
                </div>

                <Separator />

                <div className="space-y-4">
                  <p className="text-sm font-medium">Reminder schedule based on consequence level:</p>
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Critical deadlines</span>
                      <span className="text-muted-foreground">90, 30, 14, 7, 3, 1 days before</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>High priority</span>
                      <span className="text-muted-foreground">60, 14, 7, 3, 1 days before</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Medium priority</span>
                      <span className="text-muted-foreground">30, 7, 3, 1 days before</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span>Low priority</span>
                      <span className="text-muted-foreground">14, 3, 1 days before</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SMS Notifications</CardTitle>
                <CardDescription>
                  Get text message alerts for critical deadlines
                </CardDescription>
              </CardHeader>
              <CardContent>
                {limits.sms > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">SMS alerts</p>
                          <p className="text-sm text-muted-foreground">
                            For critical and high-priority deadlines
                          </p>
                        </div>
                      </div>
                      <Badge>Coming Soon</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Your plan includes {limits.sms === -1 ? 'unlimited' : limits.sms} SMS messages per month.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Smartphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="font-medium mb-1">SMS not available on Free plan</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upgrade to Pro for SMS notifications on critical deadlines
                    </p>
                    <Button asChild size="sm">
                      <a href="/pricing">Upgrade to Pro</a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
