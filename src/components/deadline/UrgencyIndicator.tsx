import { cn } from '@/lib/utils';
import { DeadlineStatus, getUrgencyMessage } from '@/lib/deadline-utils';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

interface UrgencyIndicatorProps {
  status: DeadlineStatus;
  count: number;
  className?: string;
}

export function UrgencyIndicator({ status, count, className }: UrgencyIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'safe':
        return Shield;
      case 'upcoming':
        return AlertTriangle;
      case 'overdue':
        return AlertCircle;
    }
  };

  const Icon = getIcon();

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl p-8 transition-all duration-500",
        status === 'safe' && "bg-safe/10 border border-safe/20",
        status === 'upcoming' && "bg-upcoming/10 border border-upcoming/20",
        status === 'overdue' && "bg-overdue/10 border border-overdue/20",
        className
      )}
    >
      {/* Animated background glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-20",
          status === 'safe' && "bg-gradient-to-br from-safe/30 to-transparent",
          status === 'upcoming' && "bg-gradient-to-br from-upcoming/30 to-transparent",
          status === 'overdue' && "bg-gradient-to-br from-overdue/30 to-transparent"
        )}
      />

      <div className="relative flex items-center gap-6">
        {/* Pulsing indicator */}
        <div
          className={cn(
            "h-20 w-20 rounded-2xl flex items-center justify-center",
            status === 'safe' && "bg-safe animate-pulse-safe",
            status === 'upcoming' && "bg-upcoming animate-pulse-upcoming",
            status === 'overdue' && "bg-overdue animate-pulse-overdue"
          )}
        >
          <Icon className={cn(
            "h-10 w-10",
            status === 'safe' && "text-safe-foreground",
            status === 'upcoming' && "text-upcoming-foreground",
            status === 'overdue' && "text-overdue-foreground"
          )} />
        </div>

        <div className="flex-1">
          <h2 className={cn(
            "text-2xl font-semibold mb-1",
            status === 'safe' && "text-safe",
            status === 'upcoming' && "text-upcoming",
            status === 'overdue' && "text-overdue"
          )}>
            {status === 'safe' ? 'All Clear' : status === 'upcoming' ? 'Attention Needed' : 'Action Required'}
          </h2>
          <p className="text-muted-foreground">
            {getUrgencyMessage(status, count)}
          </p>
        </div>
      </div>
    </div>
  );
}
