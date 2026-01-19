import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam, useInvitation, UserRole } from '@/hooks/useTeam';
import { useSubscription } from '@/hooks/useSubscription';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Crown,
  Loader2,
  Clock,
  X,
  Check,
  AlertTriangle,
  Settings,
  LogOut,
  Trash2,
  Zap,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const ROLE_LABELS: Record<UserRole, string> = {
  individual: 'Individual',
  org_admin: 'Admin',
  org_member: 'Member',
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  individual: <Shield className="h-4 w-4" />,
  org_admin: <Crown className="h-4 w-4 text-amber-500" />,
  org_member: <Users className="h-4 w-4" />,
};

const INDUSTRY_OPTIONS = [
  { value: 'construction', label: 'Construction' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'aec', label: 'A/E/C (Combined)' },
  { value: 'other', label: 'Other' },
];

export default function Team() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const {
    organization,
    teamMembers,
    invitations,
    isOrgAdmin,
    hasOrganization,
    isLoading,
    createOrganization,
    updateOrganization,
    sendInvitation,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    leaveOrganization,
  } = useTeam();
  const { planTier, limits } = useSubscription();

  // State for dialogs
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEditOrg, setShowEditOrg] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  // Form state
  const [orgName, setOrgName] = useState('');
  const [orgIndustry, setOrgIndustry] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('org_member');

  const canInviteMore = limits.team_members === -1 || teamMembers.length < limits.team_members;
  const isTeamPlan = planTier === 'team' || planTier === 'enterprise';

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) return;
    
    await createOrganization.mutateAsync({
      name: orgName.trim(),
      industry: orgIndustry || undefined,
    });
    
    setShowCreateOrg(false);
    setOrgName('');
    setOrgIndustry('');
  };

  const handleUpdateOrganization = async () => {
    if (!orgName.trim()) return;
    
    await updateOrganization.mutateAsync({
      name: orgName.trim(),
      industry: orgIndustry || undefined,
    });
    
    setShowEditOrg(false);
  };

  const handleSendInvitation = async () => {
    if (!inviteEmail.trim()) return;
    
    await sendInvitation.mutateAsync({
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    });
    
    setShowInvite(false);
    setInviteEmail('');
    setInviteRole('org_member');
  };

  const handleLeaveOrganization = async () => {
    await leaveOrganization.mutateAsync();
    setShowLeaveConfirm(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    await removeMember.mutateAsync(memberId);
    setShowRemoveConfirm(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  // No organization - show create/join options
  if (!hasOrganization) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Team Management</h1>
            <p className="text-muted-foreground">
              Create or join an organization to collaborate with your team
            </p>
          </div>

          {!isTeamPlan && (
            <Alert className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
              <Zap className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between">
                <span>Team features require the Team plan or higher.</span>
                <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
                  Upgrade
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Create an Organization</CardTitle>
              <CardDescription>
                Set up your company or team to share deadlines and collaborate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="Acme Construction LLC"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-industry">Industry</Label>
                <Select value={orgIndustry} onValueChange={setOrgIndustry}>
                  <SelectTrigger id="org-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleCreateOrganization}
                disabled={!orgName.trim() || createOrganization.isPending || !isTeamPlan}
              >
                {createOrganization.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                Create Organization
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Received an invitation?
            </p>
            <p className="text-sm text-muted-foreground">
              Check your email for an invitation link to join an existing organization.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Has organization - show team management
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{organization?.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {organization?.industry ? INDUSTRY_OPTIONS.find(i => i.value === organization.industry)?.label : 'Organization'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOrgAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={() => {
                  setOrgName(organization?.name || '');
                  setOrgIndustry(organization?.industry || '');
                  setShowEditOrg(true);
                }}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button size="sm" onClick={() => setShowInvite(true)} disabled={!canInviteMore}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{teamMembers.length}</p>
                  <p className="text-sm text-muted-foreground">
                    {limits.team_members === -1 ? 'Unlimited' : `of ${limits.team_members}`} members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Mail className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{invitations.length}</p>
                  <p className="text-sm text-muted-foreground">Pending invites</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {teamMembers.filter(m => m.role === 'org_admin').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Capacity Warning */}
        {!canInviteMore && (
          <Alert className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="flex items-center justify-between">
              <span>You've reached your team member limit ({limits.team_members} members).</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
                Upgrade Plan
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Team Members */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => {
                  const isCurrentUser = member.id === user?.id;
                  const canManage = isOrgAdmin && !isCurrentUser;
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(member.name || member.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {member.name || 'No name'}
                              {isCurrentUser && (
                                <span className="text-muted-foreground ml-2">(you)</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          {ROLE_ICONS[member.role]}
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(member.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {canManage && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => updateMemberRole.mutate({
                                  memberId: member.id,
                                  role: member.role === 'org_admin' ? 'org_member' : 'org_admin',
                                })}
                              >
                                {member.role === 'org_admin' ? (
                                  <>
                                    <Users className="h-4 w-4 mr-2" />
                                    Make Member
                                  </>
                                ) : (
                                  <>
                                    <Crown className="h-4 w-4 mr-2" />
                                    Make Admin
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setShowRemoveConfirm(member.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from team
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {isOrgAdmin && invitations.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>
                Invitations that haven't been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span>{invitation.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {ROLE_ICONS[invitation.role]}
                          {ROLE_LABELS[invitation.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => cancelInvitation.mutate(invitation.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Leave Organization */}
        {!isOrgAdmin && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Leave Organization</CardTitle>
              <CardDescription>
                Remove yourself from this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You will lose access to all shared deadlines and team features. 
                Your personal deadlines will be preserved.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowLeaveConfirm(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave Organization
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Organization Dialog */}
        <Dialog open={showEditOrg} onOpenChange={setShowEditOrg}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Organization Settings</DialogTitle>
              <DialogDescription>
                Update your organization's information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-org-name">Organization Name</Label>
                <Input
                  id="edit-org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-org-industry">Industry</Label>
                <Select value={orgIndustry} onValueChange={setOrgIndustry}>
                  <SelectTrigger id="edit-org-industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditOrg(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateOrganization}
                disabled={!orgName.trim() || updateOrganization.isPending}
              >
                {updateOrganization.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Invite Member Dialog */}
        <Dialog open={showInvite} onOpenChange={setShowInvite}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {organization?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="org_member">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Member</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="org_admin">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteRole === 'org_admin' 
                    ? 'Admins can invite and manage team members.'
                    : 'Members can view and manage shared deadlines.'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendInvitation}
                disabled={!inviteEmail.trim() || sendInvitation.isPending}
              >
                {sendInvitation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Leave Confirmation Dialog */}
        <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Organization?</DialogTitle>
              <DialogDescription>
                Are you sure you want to leave {organization?.name}?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                You will lose access to all shared deadlines and team features.
                This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveOrganization}
                disabled={leaveOrganization.isPending}
              >
                {leaveOrganization.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Leave Organization
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation Dialog */}
        <Dialog open={!!showRemoveConfirm} onOpenChange={() => setShowRemoveConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Team Member?</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this member from the organization?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                They will lose access to all shared deadlines and team features.
                Their personal deadlines will be preserved.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => showRemoveConfirm && handleRemoveMember(showRemoveConfirm)}
                disabled={removeMember.isPending}
              >
                {removeMember.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Remove Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
