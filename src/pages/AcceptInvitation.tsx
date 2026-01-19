import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useInvitation } from '@/hooks/useTeam';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Building2, Loader2, Check, X, UserPlus, AlertTriangle } from 'lucide-react';

export default function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { invitation, isLoading, isValid, acceptInvitation } = useInvitation(token);
  
  const [accepted, setAccepted] = useState(false);

  const handleAccept = async () => {
    try {
      await acceptInvitation.mutateAsync();
      setAccepted(true);
      // Redirect to team page after short delay
      setTimeout(() => {
        navigate('/team');
      }, 2000);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invitation...</p>
        </div>
      </div>
    );
  }

  // Not logged in - prompt to sign in/up
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>You've Been Invited!</CardTitle>
            <CardDescription>
              Sign in or create an account to accept this invitation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitation && (
              <div className="p-4 bg-muted rounded-lg text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">You're invited to join</p>
                <p className="font-semibold text-lg">{(invitation as any).organizations?.name}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full" asChild>
              <Link to={`/auth?redirect=/invite/${token}`}>
                Sign In to Accept
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link to={`/auth?redirect=/invite/${token}`} className="text-primary hover:underline">
                Create one
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Invalid or expired invitation
  if (!isValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Invitations expire after 7 days. Ask the organization admin to send a new invitation.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Check if email matches
  const invitationEmail = invitation?.email?.toLowerCase();
  const userEmail = user.email?.toLowerCase();
  const emailMismatch = invitationEmail && userEmail && invitationEmail !== userEmail;

  if (emailMismatch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <CardTitle>Email Mismatch</CardTitle>
            <CardDescription>
              This invitation was sent to a different email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-1">Invitation sent to:</p>
                <p className="font-medium">{invitationEmail}</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-1">You're signed in as:</p>
                <p className="font-medium">{userEmail}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Sign in with the invited email address, or ask for a new invitation to your current email.
            </p>
            <Button className="w-full" variant="outline" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Successfully accepted
  if (accepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>
              You've successfully joined {(invitation as any).organizations?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirecting you to the team page...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show invitation acceptance UI
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Join Organization</CardTitle>
          <CardDescription>
            You've been invited to join a team on DeadlineGuard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg text-center mb-4">
            <p className="text-sm text-muted-foreground mb-1">Organization</p>
            <p className="font-semibold text-lg">{(invitation as any).organizations?.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center text-sm">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Your Role</p>
              <p className="font-medium capitalize">
                {invitation?.role === 'org_admin' ? 'Admin' : 'Member'}
              </p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">Joining as</p>
              <p className="font-medium truncate">{user.email}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            className="w-full"
            onClick={handleAccept}
            disabled={acceptInvitation.isPending}
          >
            {acceptInvitation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Accept Invitation
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/dashboard">Decline</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
