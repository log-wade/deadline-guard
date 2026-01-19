import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Clock,
  FileText,
  Shield,
  Car,
  Briefcase,
  User,
  HelpCircle
} from 'lucide-react';
import {
  Deadline,
  getDeadlineStatus,
  getDaysUntilDue,
  getStatusColor,
  getConsequenceColor,
  getCategoryLabel,
  getConsequenceLabel,
  DeadlineCategory,
} from '@/lib/deadline-utils';

interface DeadlineCardProps {
  deadline: Deadline;
  onEdit: (deadline: Deadline) => void;
  onDelete: (deadline: Deadline) => void;
}

const categoryIcons: Record<DeadlineCategory, typeof FileText> = {
  license: Shield,
  insurance: Car,
  contract: Briefcase,
  personal: User,
  other: HelpCircle,
};

export function DeadlineCard({ deadline, onEdit, onDelete }: DeadlineCardProps) {
  const status = getDeadlineStatus(deadline.due_date, deadline.consequence_level);
  const daysUntil = getDaysUntilDue(deadline.due_date);
  const statusColor = getStatusColor(status);
  const consequenceColor = getConsequenceColor(deadline.consequence_level);
  const CategoryIcon = categoryIcons[deadline.category];

  const getDaysText = () => {
    if (daysUntil < 0) {
      return `${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? 's' : ''} overdue`;
    } else if (daysUntil === 0) {
      return 'Due today';
    } else if (daysUntil === 1) {
      return 'Due tomorrow';
    } else {
      return `${daysUntil} days left`;
    }
  };

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-200 hover:shadow-md",
      status === 'overdue' && "border-overdue/30 bg-overdue-muted/30",
      status === 'upcoming' && "border-upcoming/30 bg-upcoming-muted/30",
      status === 'safe' && "border-border"
    )}>
      {/* Status indicator bar */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1",
        status === 'safe' && "bg-safe",
        status === 'upcoming' && "bg-upcoming",
        status === 'overdue' && "bg-overdue"
      )} />

      <CardContent className="p-4 pl-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title and category */}
            <div className="flex items-center gap-2 mb-2">
              <CategoryIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-medium text-foreground truncate">{deadline.title}</h3>
            </div>

            {/* Description */}
            {deadline.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {deadline.description}
              </p>
            )}

            {/* Badges and date */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant="secondary" 
                className="text-xs"
              >
                {getCategoryLabel(deadline.category)}
              </Badge>
              
              <Badge 
                className={cn(
                  "text-xs",
                  consequenceColor === 'safe' && "bg-safe/10 text-safe hover:bg-safe/20",
                  consequenceColor === 'upcoming' && "bg-upcoming/10 text-upcoming hover:bg-upcoming/20",
                  consequenceColor === 'overdue' && "bg-overdue/10 text-overdue hover:bg-overdue/20",
                  consequenceColor === 'critical' && "bg-critical/10 text-critical hover:bg-critical/20"
                )}
              >
                {getConsequenceLabel(deadline.consequence_level)}
              </Badge>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground ml-auto">
                <Calendar className="h-3.5 w-3.5" />
                <span>{format(new Date(deadline.due_date), 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>

          {/* Days indicator and actions */}
          <div className="flex flex-col items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(deadline)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(deadline)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              status === 'safe' && "bg-safe/10 text-safe",
              status === 'upcoming' && "bg-upcoming/10 text-upcoming",
              status === 'overdue' && "bg-overdue/10 text-overdue"
            )}>
              <Clock className="h-3 w-3" />
              {getDaysText()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
