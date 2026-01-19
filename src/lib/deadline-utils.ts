import { differenceInDays, parseISO, startOfDay, addDays, addMonths, addYears } from 'date-fns';

export type ConsequenceLevel = 'low' | 'medium' | 'high' | 'critical';
export type DeadlineStatus = 'safe' | 'upcoming' | 'warning' | 'urgent' | 'critical' | 'overdue';
export type DeadlineCategory = 'license' | 'insurance' | 'contract' | 'personal' | 'other';
export type RecurrencePattern = 'none' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'biennial' | 'custom';

// Reminder windows based on consequence level (in days)
export const REMINDER_WINDOWS: Record<ConsequenceLevel, number> = {
  low: 14,
  medium: 30,
  high: 60,
  critical: 90,
};

// More granular urgency thresholds (in days)
export const URGENCY_THRESHOLDS = {
  overdue: 0,
  critical: 3,
  urgent: 7,
  warning: 14,
  upcoming: 30,
};

export interface Deadline {
  id: string;
  title: string;
  description?: string | null;
  category: DeadlineCategory;
  subcategory?: string | null;
  due_date: string;
  consequence_level: ConsequenceLevel;
  user_id: string;
  organization_id?: string | null;
  last_reminder_sent?: string | null;
  
  // Recurrence fields
  recurrence?: RecurrencePattern;
  recurrence_interval_days?: number | null;
  parent_deadline_id?: string | null;
  auto_renew?: boolean;
  
  // A/E/C specific fields
  renewal_instructions?: string | null;
  estimated_cost?: number | null;
  reference_number?: string | null;
  issuing_authority?: string | null;
  
  created_at: string;
  updated_at: string;
}

export function getDaysUntilDue(dueDate: string): number {
  const today = startOfDay(new Date());
  const due = startOfDay(parseISO(dueDate));
  return differenceInDays(due, today);
}

export function getDeadlineStatus(dueDate: string, consequenceLevel?: ConsequenceLevel): DeadlineStatus {
  const daysUntilDue = getDaysUntilDue(dueDate);
  
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= URGENCY_THRESHOLDS.critical) return 'critical';
  if (daysUntilDue <= URGENCY_THRESHOLDS.urgent) return 'urgent';
  if (daysUntilDue <= URGENCY_THRESHOLDS.warning) return 'warning';
  if (daysUntilDue <= URGENCY_THRESHOLDS.upcoming) return 'upcoming';
  return 'safe';
}

export function getStatusColor(status: DeadlineStatus): string {
  switch (status) {
    case 'safe': return 'green';
    case 'upcoming': return 'blue';
    case 'warning': return 'yellow';
    case 'urgent': return 'orange';
    case 'critical': return 'red';
    case 'overdue': return 'red';
  }
}

export function getStatusBadgeClasses(status: DeadlineStatus): string {
  switch (status) {
    case 'safe':
      return 'bg-green-500/20 text-green-500 border-green-500/30';
    case 'upcoming':
      return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
    case 'warning':
      return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'urgent':
      return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    case 'critical':
    case 'overdue':
      return 'bg-red-500/20 text-red-500 border-red-500/30';
  }
}

export function getConsequenceColor(level: ConsequenceLevel): string {
  switch (level) {
    case 'low': return 'green';
    case 'medium': return 'yellow';
    case 'high': return 'orange';
    case 'critical': return 'red';
  }
}

export function getConsequenceBadgeClasses(level: ConsequenceLevel): string {
  switch (level) {
    case 'low':
      return 'bg-green-500/20 text-green-500 border-green-500/30';
    case 'medium':
      return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'high':
      return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    case 'critical':
      return 'bg-red-500/20 text-red-500 border-red-500/30';
  }
}

export function getCategoryLabel(category: DeadlineCategory): string {
  const labels: Record<DeadlineCategory, string> = {
    license: 'License',
    insurance: 'Insurance',
    contract: 'Contract',
    personal: 'Personal',
    other: 'Other',
  };
  return labels[category];
}

export function getCategoryIcon(category: DeadlineCategory): string {
  const icons: Record<DeadlineCategory, string> = {
    license: '📜',
    insurance: '🛡️',
    contract: '📋',
    personal: '👤',
    other: '📁',
  };
  return icons[category];
}

export function getConsequenceLabel(level: ConsequenceLevel): string {
  const labels: Record<ConsequenceLevel, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[level];
}

export function getStatusLabel(status: DeadlineStatus): string {
  const labels: Record<DeadlineStatus, string> = {
    safe: 'On Track',
    upcoming: 'Upcoming',
    warning: 'Due Soon',
    urgent: 'Urgent',
    critical: 'Critical',
    overdue: 'Overdue',
  };
  return labels[status];
}

export function getRecurrenceLabel(recurrence: RecurrencePattern): string {
  const labels: Record<RecurrencePattern, string> = {
    none: 'One-time',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
    biennial: 'Every 2 Years',
    custom: 'Custom',
  };
  return labels[recurrence];
}

export function getNextDueDate(currentDueDate: string, recurrence: RecurrencePattern, customDays?: number): Date {
  const current = parseISO(currentDueDate);
  
  switch (recurrence) {
    case 'monthly':
      return addMonths(current, 1);
    case 'quarterly':
      return addMonths(current, 3);
    case 'semi_annual':
      return addMonths(current, 6);
    case 'annual':
      return addYears(current, 1);
    case 'biennial':
      return addYears(current, 2);
    case 'custom':
      return addDays(current, customDays || 365);
    default:
      return current;
  }
}

export function sortDeadlinesByUrgency(deadlines: Deadline[]): Deadline[] {
  return [...deadlines].sort((a, b) => {
    const statusOrder: Record<DeadlineStatus, number> = { 
      overdue: 0, 
      critical: 1, 
      urgent: 2, 
      warning: 3, 
      upcoming: 4, 
      safe: 5 
    };
    
    const aStatus = getDeadlineStatus(a.due_date, a.consequence_level);
    const bStatus = getDeadlineStatus(b.due_date, b.consequence_level);
    
    if (statusOrder[aStatus] !== statusOrder[bStatus]) {
      return statusOrder[aStatus] - statusOrder[bStatus];
    }
    
    // If same status, sort by due date
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });
}

export function groupDeadlinesByStatus(deadlines: Deadline[]): Record<DeadlineStatus, Deadline[]> {
  const groups: Record<DeadlineStatus, Deadline[]> = {
    overdue: [],
    critical: [],
    urgent: [],
    warning: [],
    upcoming: [],
    safe: [],
  };
  
  for (const deadline of deadlines) {
    const status = getDeadlineStatus(deadline.due_date, deadline.consequence_level);
    groups[status].push(deadline);
  }
  
  return groups;
}

export function groupDeadlinesByCategory(deadlines: Deadline[]): Record<DeadlineCategory, Deadline[]> {
  const groups: Record<DeadlineCategory, Deadline[]> = {
    license: [],
    insurance: [],
    contract: [],
    personal: [],
    other: [],
  };
  
  for (const deadline of deadlines) {
    groups[deadline.category].push(deadline);
  }
  
  return groups;
}

export function getDeadlineCounts(deadlines: Deadline[]): {
  total: number;
  overdue: number;
  critical: number;
  urgent: number;
  warning: number;
  upcoming: number;
  safe: number;
} {
  const counts = {
    total: deadlines.length,
    overdue: 0,
    critical: 0,
    urgent: 0,
    warning: 0,
    upcoming: 0,
    safe: 0,
  };
  
  for (const deadline of deadlines) {
    const status = getDeadlineStatus(deadline.due_date, deadline.consequence_level);
    counts[status]++;
  }
  
  return counts;
}

export function getOverallUrgency(deadlines: Deadline[]): DeadlineStatus {
  if (deadlines.length === 0) return 'safe';
  
  const statusPriority: DeadlineStatus[] = ['overdue', 'critical', 'urgent', 'warning', 'upcoming', 'safe'];
  
  for (const status of statusPriority) {
    for (const deadline of deadlines) {
      if (getDeadlineStatus(deadline.due_date, deadline.consequence_level) === status) {
        return status;
      }
    }
  }
  
  return 'safe';
}

export function getUrgencyMessage(status: DeadlineStatus, count: number): string {
  const plural = count !== 1 ? 's' : '';
  
  switch (status) {
    case 'overdue':
      return `${count} overdue deadline${plural} need immediate attention`;
    case 'critical':
      return `${count} critical deadline${plural} due within 3 days`;
    case 'urgent':
      return `${count} urgent deadline${plural} due within 7 days`;
    case 'warning':
      return `${count} deadline${plural} due within 2 weeks`;
    case 'upcoming':
      return `${count} deadline${plural} approaching`;
    case 'safe':
      return 'All deadlines are on track';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDaysUntilDue(dueDate: string): string {
  const days = getDaysUntilDue(dueDate);
  
  if (days < 0) {
    const absDays = Math.abs(days);
    return `${absDays} day${absDays !== 1 ? 's' : ''} overdue`;
  } else if (days === 0) {
    return 'Due today';
  } else if (days === 1) {
    return 'Due tomorrow';
  } else {
    return `${days} days`;
  }
}
