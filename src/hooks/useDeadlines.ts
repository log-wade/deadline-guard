import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { 
  Deadline, 
  DeadlineCategory, 
  ConsequenceLevel, 
  RecurrencePattern 
} from '@/lib/deadline-utils';

export interface CreateDeadlineInput {
  title: string;
  description?: string;
  category: DeadlineCategory;
  subcategory?: string;
  due_date: string;
  consequence_level: ConsequenceLevel;
  organization_id?: string | null;
  
  // Recurrence
  recurrence?: RecurrencePattern;
  recurrence_interval_days?: number;
  auto_renew?: boolean;
  
  // A/E/C fields
  renewal_instructions?: string;
  estimated_cost?: number;
  reference_number?: string;
  issuing_authority?: string;
}

export interface UpdateDeadlineInput extends Partial<CreateDeadlineInput> {
  id: string;
}

export function useDeadlines() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deadlinesQuery = useQuery({
    queryKey: ['deadlines', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) {
        throw error;
      }

      return data as Deadline[];
    },
    enabled: !!user,
  });

  const createDeadline = useMutation({
    mutationFn: async (input: CreateDeadlineInput) => {
      if (!user) throw new Error('Not authenticated');

      // Check plan limits (basic check - full check in database)
      const { count } = await supabase
        .from('deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // This will be enforced by database function, but give early feedback
      // The actual limit check happens server-side

      const { data, error } = await supabase
        .from('deadlines')
        .insert({
          ...input,
          user_id: user.id,
          recurrence: input.recurrence || 'none',
          auto_renew: input.auto_renew || false,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes('Rate limit')) {
          throw new Error('You have reached the maximum number of deadlines you can create today. Please try again tomorrow.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Deadline created',
        description: 'Your deadline has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating deadline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateDeadline = useMutation({
    mutationFn: async ({ id, ...input }: UpdateDeadlineInput) => {
      const { data, error } = await supabase
        .from('deadlines')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Deadline updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating deadline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteDeadline = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Deadline deleted',
        description: 'The deadline has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting deadline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Create deadline from template
  const createFromTemplate = useMutation({
    mutationFn: async (template: {
      name: string;
      description?: string;
      category: DeadlineCategory;
      subcategory?: string;
      default_consequence_level: ConsequenceLevel;
      typical_recurrence: RecurrencePattern;
      issuing_authority_template?: string;
      renewal_instructions_template?: string;
      due_date: string; // User must provide this
      reference_number?: string;
      estimated_cost?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('deadlines')
        .insert({
          title: template.name,
          description: template.description,
          category: template.category,
          subcategory: template.subcategory,
          due_date: template.due_date,
          consequence_level: template.default_consequence_level,
          user_id: user.id,
          recurrence: template.typical_recurrence,
          auto_renew: template.typical_recurrence !== 'none',
          issuing_authority: template.issuing_authority_template,
          renewal_instructions: template.renewal_instructions_template,
          reference_number: template.reference_number,
          estimated_cost: template.estimated_cost,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast({
        title: 'Deadline created',
        description: 'Your deadline has been added from the template.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating deadline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    deadlines: deadlinesQuery.data ?? [],
    isLoading: deadlinesQuery.isLoading,
    error: deadlinesQuery.error,
    createDeadline,
    updateDeadline,
    deleteDeadline,
    createFromTemplate,
    refetch: deadlinesQuery.refetch,
  };
}
