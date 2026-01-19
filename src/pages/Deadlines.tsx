import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { DeadlineForm } from '@/components/deadline/DeadlineFormNew';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeadlines } from '@/hooks/useDeadlines';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Deadline,
  DeadlineCategory,
  DeadlineStatus,
  getDeadlineStatus,
  getStatusLabel,
  getStatusBadgeClasses,
  getConsequenceBadgeClasses,
  getConsequenceLabel,
  getCategoryLabel,
  getCategoryIcon,
  getRecurrenceLabel,
  sortDeadlinesByUrgency,
  formatDaysUntilDue,
  formatCurrency,
  getDaysUntilDue,
} from '@/lib/deadline-utils';
import { 
  Plus, 
  Search, 
  Clock, 
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
  RefreshCw,
  DollarSign,
  Building2,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function Deadlines() {
  const { deadlines, isLoading, deleteDeadline } = useDeadlines();
  const { planTier, limits } = useSubscription();
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deletingDeadline, setDeletingDeadline] = useState<Deadline | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DeadlineCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DeadlineStatus | 'all'>('all');

  const filteredDeadlines = sortDeadlinesByUrgency(deadlines).filter((deadline) => {
    const matchesSearch = deadline.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deadline.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || deadline.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      getDeadlineStatus(deadline.due_date, deadline.consequence_level) === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleEdit = (deadline: Deadline) => {
    setEditingDeadline(deadline);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingDeadline) {
      await deleteDeadline.mutateAsync(deletingDeadline.id);
      setDeletingDeadline(null);
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingDeadline(null);
  };

  // Count by status for quick filters
  const statusCounts = {
    overdue: deadlines.filter(d => getDeadlineStatus(d.due_date) === 'overdue').length,
    critical: deadlines.filter(d => getDeadlineStatus(d.due_date) === 'critical').length,
    urgent: deadlines.filter(d => getDeadlineStatus(d.due_date) === 'urgent').length,
    upcoming: deadlines.filter(d => ['warning', 'upcoming'].includes(getDeadlineStatus(d.due_date))).length,
  };

  const atLimit = limits.deadlines !== -1 && deadlines.length >= limits.deadlines;

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Deadlines</h1>
            <p className="text-muted-foreground">
              {deadlines.length === 0 
                ? "You haven't added any deadlines yet"
                : `${deadlines.length} deadline${deadlines.length !== 1 ? 's' : ''} tracked`
              }
              {limits.deadlines !== -1 && (
                <span className="text-muted-foreground/70"> · {limits.deadlines - deadlines.length} remaining</span>
              )}
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} disabled={atLimit}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deadline
          </Button>
        </div>

        {/* At Limit Warning */}
        {atLimit && (
          <Card className="mb-6 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium">You've reached your limit</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to Pro for unlimited deadlines
                  </p>
                </div>
              </div>
              <Button size="sm" asChild>
                <a href="/pricing">Upgrade</a>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Status Filters */}
        {deadlines.length > 0 && (statusCounts.overdue > 0 || statusCounts.critical > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {statusCounts.overdue > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue')}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  statusFilter === 'overdue'
                    ? "bg-red-500 text-white"
                    : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {statusCounts.overdue} Overdue
              </button>
            )}
            {statusCounts.critical > 0 && (
              <button
                onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  statusFilter === 'critical'
                    ? "bg-orange-500 text-white"
                    : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                {statusCounts.critical} Due in 3 days
              </button>
            )}
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Search and Filters */}
        {deadlines.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deadlines..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="license">Licenses</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="contract">Contracts/Bonds</SelectItem>
                <SelectItem value="personal">Certifications</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && deadlines.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Track your first deadline</h2>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Never miss a license renewal, insurance deadline, or certification expiration again.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Deadline
                </Button>
                <Button variant="outline" onClick={() => setFormOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Browse Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results */}
        {!isLoading && deadlines.length > 0 && filteredDeadlines.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-semibold mb-1">No matching deadlines</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        )}

        {/* Deadline List */}
        {!isLoading && filteredDeadlines.length > 0 && (
          <div className="space-y-3">
            {filteredDeadlines.map((deadline) => (
              <DeadlineRow 
                key={deadline.id} 
                deadline={deadline}
                onEdit={() => handleEdit(deadline)}
                onDelete={() => setDeletingDeadline(deadline)}
              />
            ))}
          </div>
        )}

        {/* Form Modal */}
        <DeadlineForm 
          open={formOpen} 
          onOpenChange={handleFormClose}
          editingDeadline={editingDeadline}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingDeadline} onOpenChange={() => setDeletingDeadline(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this deadline?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{deletingDeadline?.title}" and stop all reminders.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

// Deadline Row Component
interface DeadlineRowProps {
  deadline: Deadline;
  onEdit: () => void;
  onDelete: () => void;
}

function DeadlineRow({ deadline, onEdit, onDelete }: DeadlineRowProps) {
  const status = getDeadlineStatus(deadline.due_date, deadline.consequence_level);
  const daysUntil = getDaysUntilDue(deadline.due_date);
  const isOverdue = daysUntil < 0;
  const isCritical = status === 'critical' || status === 'overdue';

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isOverdue && "border-red-500/50 bg-red-50/50 dark:bg-red-950/10",
      status === 'critical' && !isOverdue && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-950/10"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Category Icon */}
          <div className={cn(
            "hidden sm:flex items-center justify-center w-10 h-10 rounded-lg text-lg flex-shrink-0",
            isOverdue ? "bg-red-500/10" : 
            status === 'critical' ? "bg-orange-500/10" : "bg-muted"
          )}>
            {getCategoryIcon(deadline.category)}
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium truncate">{deadline.title}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Due Date */}
                  <span className={cn(
                    "text-sm flex items-center gap-1",
                    isOverdue ? "text-red-600 font-medium" :
                    status === 'critical' ? "text-orange-600 font-medium" :
                    "text-muted-foreground"
                  )}>
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(deadline.due_date), 'MMM d, yyyy')}
                    <span className="text-muted-foreground">·</span>
                    {formatDaysUntilDue(deadline.due_date)}
                  </span>
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={cn("hidden sm:inline-flex", getStatusBadgeClasses(status))}>
                  {getStatusLabel(status)}
                </Badge>
                <Badge variant="outline" className={getConsequenceBadgeClasses(deadline.consequence_level)}>
                  {getConsequenceLabel(deadline.consequence_level)}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={onEdit}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Additional Info Row */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                {getCategoryIcon(deadline.category)} {getCategoryLabel(deadline.category)}
              </span>
              
              {deadline.recurrence && deadline.recurrence !== 'none' && (
                <span className="inline-flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" />
                  {getRecurrenceLabel(deadline.recurrence)}
                </span>
              )}
              
              {deadline.reference_number && (
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {deadline.reference_number}
                </span>
              )}
              
              {deadline.estimated_cost && (
                <span className="inline-flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {formatCurrency(deadline.estimated_cost)}
                </span>
              )}
              
              {deadline.issuing_authority && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {deadline.issuing_authority}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
