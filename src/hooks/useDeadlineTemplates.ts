import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeadlineTemplate {
  id: string;
  name: string;
  description: string | null;
  category: 'license' | 'insurance' | 'contract' | 'personal' | 'other';
  subcategory: string | null;
  default_consequence_level: 'low' | 'medium' | 'high' | 'critical';
  typical_recurrence: 'none' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'biennial' | 'custom';
  typical_lead_time_days: number;
  industry: string[];
  issuing_authority_template: string | null;
  renewal_instructions_template: string | null;
}

export function useDeadlineTemplates(industry?: string) {
  const templatesQuery = useQuery({
    queryKey: ['deadline-templates', industry],
    queryFn: async () => {
      let query = supabase
        .from('deadline_templates')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name');

      // If industry is specified, filter by it
      // Note: Using contains for array column
      if (industry) {
        query = query.contains('industry', [industry]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data as DeadlineTemplate[];
    },
  });

  // Group templates by category
  const templatesByCategory = (templatesQuery.data ?? []).reduce((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, DeadlineTemplate[]>);

  // Get unique industries from all templates
  const industries = [...new Set(
    (templatesQuery.data ?? []).flatMap(t => t.industry)
  )].sort();

  return {
    templates: templatesQuery.data ?? [],
    templatesByCategory,
    industries,
    isLoading: templatesQuery.isLoading,
    error: templatesQuery.error,
  };
}

// Category labels for display
export const CATEGORY_LABELS: Record<string, string> = {
  license: 'Licenses & Permits',
  insurance: 'Insurance',
  contract: 'Contracts & Bonds',
  personal: 'Certifications & Training',
  other: 'Compliance & Reporting',
};

// Subcategory labels
export const SUBCATEGORY_LABELS: Record<string, string> = {
  // Licenses
  contractor_license: 'Contractor License',
  specialty_license: 'Specialty License',
  pe_license: 'PE License',
  architect_license: 'Architect License',
  business_license: 'Business License',
  
  // Insurance
  general_liability: 'General Liability',
  professional_liability: 'Professional Liability (E&O)',
  workers_comp: 'Workers Compensation',
  commercial_auto: 'Commercial Auto',
  builders_risk: 'Builders Risk',
  umbrella: 'Umbrella/Excess',
  
  // Bonds
  license_bond: 'License Bond',
  bid_bond: 'Bid Bond',
  performance_bond: 'Performance Bond',
  payment_bond: 'Payment Bond',
  
  // Certifications
  safety_cert: 'Safety Certification',
  professional_cert: 'Professional Certification',
  equipment_cert: 'Equipment Certification',
  
  // Permits
  building_permit: 'Building Permit',
  environmental_permit: 'Environmental Permit',
  encroachment_permit: 'Encroachment Permit',
  
  // Tax & Reporting
  tax_deadline: 'Tax Filing',
  compliance_report: 'Compliance Report',
};

// Recurrence labels
export const RECURRENCE_LABELS: Record<string, string> = {
  none: 'One-time',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
  biennial: 'Every 2 Years',
  custom: 'Custom',
};

// Industry labels
export const INDUSTRY_LABELS: Record<string, string> = {
  construction: 'Construction',
  engineering: 'Engineering',
  architecture: 'Architecture',
};
