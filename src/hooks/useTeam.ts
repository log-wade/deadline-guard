import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'individual' | 'org_admin' | 'org_member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Organization {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

export function useTeam() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOrgAdmin = profile?.role === 'org_admin';
  const hasOrganization = !!profile?.organization_id;

  // Fetch organization details
  const organizationQuery = useQuery({
    queryKey: ['organization', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();

      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }

      return data as Organization;
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch team members
  const teamQuery = useQuery({
    queryKey: ['team-members', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, created_at')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }

      return data as TeamMember[];
    },
    enabled: !!profile?.organization_id,
  });

  // Fetch pending invitations
  const invitationsQuery = useQuery({
    queryKey: ['invitations', profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id || !isOrgAdmin) return [];

      const { data, error } = await supabase
        .from('organization_invitations')
        .select('id, email, role, status, expires_at, created_at')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        return [];
      }

      return data as Invitation[];
    },
    enabled: !!profile?.organization_id && isOrgAdmin,
  });

  // Create organization
  const createOrganization = useMutation({
    mutationFn: async ({ name, industry }: { name: string; industry?: string }) => {
      const { data, error } = await supabase.rpc('create_organization_with_admin', {
        org_name: name,
        org_industry: industry || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Organization created',
        description: 'You are now the admin of your organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update organization
  const updateOrganization = useMutation({
    mutationFn: async ({ name, industry }: { name: string; industry?: string }) => {
      if (!profile?.organization_id) throw new Error('No organization');

      const { error } = await supabase
        .from('organizations')
        .update({ name, industry })
        .eq('id', profile.organization_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      toast({
        title: 'Organization updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Send team invitation
  const sendInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: UserRole }) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-team-invite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ email, role }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: 'Invitation sent',
        description: 'The team member will receive an email invitation.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel invitation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
      toast({
        title: 'Invitation canceled',
        description: 'The invitation has been revoked.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error canceling invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update team member role
  const updateMemberRole = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: UserRole }) => {
      if (!isOrgAdmin) throw new Error('Only admins can change roles');
      if (memberId === user?.id) throw new Error('Cannot change your own role');

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', memberId)
        .eq('organization_id', profile?.organization_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Role updated',
        description: 'The team member\'s role has been changed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove team member
  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isOrgAdmin) throw new Error('Only admins can remove members');
      if (memberId === user?.id) throw new Error('Cannot remove yourself');

      const { error } = await supabase
        .from('profiles')
        .update({ organization_id: null, role: 'individual' })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Member removed',
        description: 'The team member has been removed from the organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing member',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Leave organization
  const leaveOrganization = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('leave_organization');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({
        title: 'Left organization',
        description: 'You are no longer part of the organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error leaving organization',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    organization: organizationQuery.data,
    teamMembers: teamQuery.data ?? [],
    invitations: invitationsQuery.data ?? [],
    isOrgAdmin,
    hasOrganization,
    isLoading: organizationQuery.isLoading || teamQuery.isLoading,
    createOrganization,
    updateOrganization,
    sendInvitation,
    cancelInvitation,
    updateMemberRole,
    removeMember,
    leaveOrganization,
  };
}

// Hook for accepting invitations (used on invite acceptance page)
export function useInvitation(token: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const invitationQuery = useQuery({
    queryKey: ['invitation', token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from('organization_invitations')
        .select(`
          *,
          organizations (name)
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        console.error('Error fetching invitation:', error);
        return null;
      }

      return data;
    },
    enabled: !!token,
  });

  const acceptInvitation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('No invitation token');

      const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: 'Invitation accepted',
        description: 'You have joined the organization.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error accepting invitation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    invitation: invitationQuery.data,
    isLoading: invitationQuery.isLoading,
    isValid: !!invitationQuery.data,
    acceptInvitation,
  };
}
