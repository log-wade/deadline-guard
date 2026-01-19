import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { UrgencyIndicator } from '@/components/deadline/UrgencyIndicator';
import { DeadlineCard } from '@/components/deadline/DeadlineCard';
import { DeadlineForm, DeadlineFormData } from '@/components/deadline/DeadlineForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeadlines } from '@/hooks/useDeadlines';
import {
  Deadline,
  getDeadlineStatus,
  getOverallUrgency,
  sortDeadlinesByUrgency,
} from '@/lib/deadline-utils';
import { Plus, Clock } from 'lucide-react';
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

export default function Dashboard() {
  const { deadlines, isLoading, createDeadline, updateDeadline, deleteDeadline } = useDeadlines();
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<Deadline | null>(null);
  const [deletingDeadline, setDeletingDeadline] = useState<Deadline | null>(null);

  const sortedDeadlines = sortDeadlinesByUrgency(deadlines);
  const urgentDeadlines = sortedDeadlines.slice(0, 5);
  const overallStatus = getOverallUrgency(deadlines);
  
  const overdueCount = deadlines.filter(
    (d) => getDeadlineStatus(d.due_date, d.consequence_level) === 'overdue'
  ).length;
  const upcomingCount = deadlines.filter(
    (d) => getDeadlineStatus(d.due_date, d.consequence_level) === 'upcoming'
  ).length;

  const handleCreateDeadline = (data: DeadlineFormData) => {
    createDeadline.mutate(data, {
      onSuccess: () => {
        setFormOpen(false);
      },
    });
  };

  const handleUpdateDeadline = (data: DeadlineFormData) => {
    if (!editingDeadline) return;
    updateDeadline.mutate(
      { id: editingDeadline.id, ...data },
      {
        onSuccess: () => {
          setEditingDeadline(null);
        },
      }
    );
  };

  const handleDeleteDeadline = () => {
    if (!deletingDeadline) return;
    deleteDeadline.mutate(deletingDeadline.id, {
      onSuccess: () => {
        setDeletingDeadline(null);
      },
    });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Monitor your important deadlines</p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Deadline
          </Button>
        </div>

        {/* Urgency Indicator */}
        {isLoading ? (
          <Skeleton className="h-36 w-full rounded-2xl" />
        ) : (
          <UrgencyIndicator 
            status={overallStatus} 
            count={overallStatus === 'overdue' ? overdueCount : upcomingCount}
          />
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <p className="text-sm text-muted-foreground">Total Deadlines</p>
            <p className="text-2xl font-semibold">{deadlines.length}</p>
          </div>
          <div className="bg-overdue-muted rounded-xl p-4 border border-overdue/20">
            <p className="text-sm text-overdue">Overdue</p>
            <p className="text-2xl font-semibold text-overdue">{overdueCount}</p>
          </div>
          <div className="bg-upcoming-muted rounded-xl p-4 border border-upcoming/20">
            <p className="text-sm text-upcoming">Upcoming</p>
            <p className="text-2xl font-semibold text-upcoming">{upcomingCount}</p>
          </div>
          <div className="bg-safe-muted rounded-xl p-4 border border-safe/20">
            <p className="text-sm text-safe">On Track</p>
            <p className="text-2xl font-semibold text-safe">
              {deadlines.length - overdueCount - upcomingCount}
            </p>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Priority Deadlines</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : urgentDeadlines.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No deadlines yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your important deadlines to stay protected.
              </p>
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Deadline
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentDeadlines.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  deadline={deadline}
                  onEdit={(d) => setEditingDeadline(d)}
                  onDelete={(d) => setDeletingDeadline(d)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Form */}
      <DeadlineForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreateDeadline}
        isLoading={createDeadline.isPending}
      />

      {/* Edit Form */}
      <DeadlineForm
        open={!!editingDeadline}
        onOpenChange={(open) => !open && setEditingDeadline(null)}
        onSubmit={handleUpdateDeadline}
        deadline={editingDeadline}
        isLoading={updateDeadline.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingDeadline} onOpenChange={(open) => !open && setDeletingDeadline(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deadline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDeadline?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeadline} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
