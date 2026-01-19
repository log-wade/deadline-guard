import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useDeadlines, CreateDeadlineInput } from '@/hooks/useDeadlines';
import { useDeadlineTemplates, DeadlineTemplate, CATEGORY_LABELS, RECURRENCE_LABELS } from '@/hooks/useDeadlineTemplates';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarIcon, 
  ChevronDown, 
  ChevronUp,
  Check,
  Loader2,
  Sparkles,
  Search,
  FileText,
  Shield,
  ScrollText,
  Award,
  X,
  ArrowLeft,
  Zap,
  Clock,
  DollarSign,
  Building2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConsequenceLevel, DeadlineCategory, RecurrencePattern } from '@/lib/deadline-utils';

// Form schema
const quickAddSchema = z.object({
  title: z.string().min(1, 'What do you need to remember?').max(200),
  due_date: z.date({ required_error: 'When is it due?' }),
  consequence_level: z.enum(['low', 'medium', 'high', 'critical']),
});

const detailedSchema = quickAddSchema.extend({
  description: z.string().max(2000).optional(),
  category: z.enum(['license', 'insurance', 'contract', 'personal', 'other']),
  subcategory: z.string().optional(),
  recurrence: z.enum(['none', 'monthly', 'quarterly', 'semi_annual', 'annual', 'biennial', 'custom']),
  recurrence_interval_days: z.number().optional(),
  auto_renew: z.boolean(),
  reference_number: z.string().optional(),
  issuing_authority: z.string().optional(),
  estimated_cost: z.number().optional(),
  renewal_instructions: z.string().optional(),
});

type QuickAddForm = z.infer<typeof quickAddSchema>;
type DetailedForm = z.infer<typeof detailedSchema>;

interface DeadlineFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingDeadline?: any; // For edit mode
}

const CONSEQUENCE_OPTIONS: { value: ConsequenceLevel; label: string; emoji: string; description: string }[] = [
  { value: 'low', label: 'Low', emoji: '😌', description: 'Minor inconvenience' },
  { value: 'medium', label: 'Medium', emoji: '😐', description: 'Some hassle to fix' },
  { value: 'high', label: 'High', emoji: '😰', description: 'Serious problems' },
  { value: 'critical', label: 'Critical', emoji: '🚨', description: "Can't work without it" },
];

const CATEGORY_OPTIONS: { value: DeadlineCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'license', label: 'License', icon: <ScrollText className="h-4 w-4" /> },
  { value: 'insurance', label: 'Insurance', icon: <Shield className="h-4 w-4" /> },
  { value: 'contract', label: 'Contract/Bond', icon: <FileText className="h-4 w-4" /> },
  { value: 'personal', label: 'Certification', icon: <Award className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Clock className="h-4 w-4" /> },
];

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
  { value: 'none', label: "Doesn't repeat" },
  { value: 'monthly', label: 'Every month' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'semi_annual', label: 'Every 6 months' },
  { value: 'annual', label: 'Every year' },
  { value: 'biennial', label: 'Every 2 years' },
];

export function DeadlineForm({ open, onOpenChange, editingDeadline }: DeadlineFormProps) {
  const [mode, setMode] = useState<'quick' | 'detailed' | 'templates' | 'success'>('quick');
  const [selectedTemplate, setSelectedTemplate] = useState<DeadlineTemplate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedDeadline, setSavedDeadline] = useState<any>(null);

  const { createDeadline, updateDeadline } = useDeadlines();
  const { templates, templatesByCategory } = useDeadlineTemplates();
  const { limits, canUseFeature } = useSubscription();

  const isEditing = !!editingDeadline;

  // Quick add form
  const quickForm = useForm<QuickAddForm>({
    resolver: zodResolver(quickAddSchema),
    defaultValues: {
      title: '',
      consequence_level: 'medium',
    },
  });

  // Detailed form
  const detailedForm = useForm<DetailedForm>({
    resolver: zodResolver(detailedSchema),
    defaultValues: {
      title: '',
      consequence_level: 'medium',
      category: 'other',
      recurrence: 'none',
      auto_renew: false,
    },
  });

  // Reset form when opening/closing
  useEffect(() => {
    if (open) {
      setMode('quick');
      setSelectedTemplate(null);
      setSavedDeadline(null);
      quickForm.reset();
      detailedForm.reset();

      if (editingDeadline) {
        setMode('detailed');
        detailedForm.reset({
          title: editingDeadline.title,
          due_date: new Date(editingDeadline.due_date),
          consequence_level: editingDeadline.consequence_level,
          description: editingDeadline.description || '',
          category: editingDeadline.category,
          subcategory: editingDeadline.subcategory || '',
          recurrence: editingDeadline.recurrence || 'none',
          auto_renew: editingDeadline.auto_renew || false,
          reference_number: editingDeadline.reference_number || '',
          issuing_authority: editingDeadline.issuing_authority || '',
          estimated_cost: editingDeadline.estimated_cost || undefined,
          renewal_instructions: editingDeadline.renewal_instructions || '',
        });
      }
    }
  }, [open, editingDeadline]);

  // Apply template to detailed form
  const applyTemplate = (template: DeadlineTemplate) => {
    setSelectedTemplate(template);
    detailedForm.reset({
      title: template.name,
      consequence_level: template.default_consequence_level,
      category: template.category,
      subcategory: template.subcategory || '',
      recurrence: template.typical_recurrence,
      auto_renew: template.typical_recurrence !== 'none',
      issuing_authority: template.issuing_authority_template || '',
      renewal_instructions: template.renewal_instructions_template || '',
    });
    setMode('detailed');
  };

  // Handle quick add submission
  const onQuickSubmit = async (data: QuickAddForm) => {
    try {
      const result = await createDeadline.mutateAsync({
        title: data.title,
        due_date: format(data.due_date, 'yyyy-MM-dd'),
        consequence_level: data.consequence_level,
        category: 'other',
        recurrence: 'none',
      });
      
      setSavedDeadline({
        ...data,
        consequence_level: data.consequence_level,
      });
      setMode('success');
    } catch (error) {
      // Error handled by hook
    }
  };

  // Handle detailed submission
  const onDetailedSubmit = async (data: DetailedForm) => {
    try {
      const payload: CreateDeadlineInput = {
        title: data.title,
        due_date: format(data.due_date, 'yyyy-MM-dd'),
        consequence_level: data.consequence_level,
        category: data.category,
        subcategory: data.subcategory,
        description: data.description,
        recurrence: data.recurrence,
        recurrence_interval_days: data.recurrence_interval_days,
        auto_renew: data.auto_renew,
        reference_number: data.reference_number,
        issuing_authority: data.issuing_authority,
        estimated_cost: data.estimated_cost,
        renewal_instructions: data.renewal_instructions,
      };

      if (isEditing) {
        await updateDeadline.mutateAsync({ id: editingDeadline.id, ...payload });
      } else {
        await createDeadline.mutateAsync(payload);
      }
      
      setSavedDeadline(data);
      setMode('success');
    } catch (error) {
      // Error handled by hook
    }
  };

  // Filter templates by search
  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get reminder dates for success screen
  const getReminderDates = (dueDate: Date, level: ConsequenceLevel) => {
    const reminders: string[] = [];
    const reminderDays = level === 'critical' ? [30, 14, 7, 3, 1] :
                         level === 'high' ? [14, 7, 3, 1] :
                         level === 'medium' ? [7, 3, 1] : [3, 1];
    
    reminderDays.forEach(days => {
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - days);
      if (reminderDate > new Date()) {
        reminders.push(`${days} day${days > 1 ? 's' : ''} before (${format(reminderDate, 'MMM d')})`);
      }
    });
    
    return reminders;
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAddAnother = () => {
    setMode('quick');
    setSavedDeadline(null);
    quickForm.reset();
    detailedForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "sm:max-w-lg",
        mode === 'templates' && "sm:max-w-2xl"
      )}>
        {/* Quick Add Mode */}
        {mode === 'quick' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                What do you need to remember?
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={quickForm.handleSubmit(onQuickSubmit)} className="space-y-6 pt-4">
              {/* Title */}
              <div className="space-y-2">
                <Input
                  placeholder="e.g., Contractor license renewal"
                  className="text-lg h-12"
                  {...quickForm.register('title')}
                />
                {quickForm.formState.errors.title && (
                  <p className="text-sm text-destructive">{quickForm.formState.errors.title.message}</p>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="text-base">When is it due?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-12",
                        !quickForm.watch('due_date') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {quickForm.watch('due_date') ? (
                        format(quickForm.watch('due_date'), "MMMM d, yyyy")
                      ) : (
                        "Pick a date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={quickForm.watch('due_date')}
                      onSelect={(date) => quickForm.setValue('due_date', date as Date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {quickForm.formState.errors.due_date && (
                  <p className="text-sm text-destructive">{quickForm.formState.errors.due_date.message}</p>
                )}
              </div>

              {/* Consequence Level */}
              <div className="space-y-3">
                <Label className="text-base">How bad if you miss it?</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CONSEQUENCE_OPTIONS.map((option) => {
                    const isSelected = quickForm.watch('consequence_level') === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => quickForm.setValue('consequence_level', option.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className={cn(
                          "text-xs font-medium",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )}>
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 text-base"
                disabled={createDeadline.isPending}
              >
                {createDeadline.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Save — I'll remind you
                  </>
                )}
              </Button>

              {/* Expand Options */}
              <div className="pt-2 border-t flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    // Copy quick form values to detailed form
                    detailedForm.setValue('title', quickForm.getValues('title'));
                    detailedForm.setValue('due_date', quickForm.getValues('due_date'));
                    detailedForm.setValue('consequence_level', quickForm.getValues('consequence_level'));
                    setMode('detailed');
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <ChevronDown className="h-4 w-4" />
                  Add more details
                </button>
                <button
                  type="button"
                  onClick={() => setMode('templates')}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  <Sparkles className="h-4 w-4" />
                  Use a template
                </button>
              </div>
            </form>
          </>
        )}

        {/* Template Selection Mode */}
        {mode === 'templates' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setMode('quick')}
                  className="p-1 hover:bg-muted rounded"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <DialogTitle>What do you need to track?</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Template Categories */}
              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {searchQuery ? (
                  // Search results
                  <div className="space-y-2">
                    {filteredTemplates.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No templates found. Try a different search or create a custom deadline.
                      </p>
                    ) : (
                      filteredTemplates.map((template) => (
                        <TemplateCard 
                          key={template.id} 
                          template={template} 
                          onClick={() => applyTemplate(template)} 
                        />
                      ))
                    )}
                  </div>
                ) : (
                  // Category view
                  Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
                    categoryTemplates.length > 0 && (
                      <div key={category}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                          {CATEGORY_OPTIONS.find(c => c.value === category)?.icon}
                          {CATEGORY_LABELS[category] || category}
                        </h3>
                        <div className="grid gap-2">
                          {categoryTemplates.slice(0, 4).map((template) => (
                            <TemplateCard 
                              key={template.id} 
                              template={template} 
                              onClick={() => applyTemplate(template)} 
                            />
                          ))}
                          {categoryTemplates.length > 4 && (
                            <button 
                              className="text-sm text-primary hover:underline text-left pl-2"
                              onClick={() => setSearchQuery(category)}
                            >
                              + {categoryTemplates.length - 4} more...
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  ))
                )}
              </div>

              {/* Custom option */}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Don't see what you need?
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setMode('quick')}
                >
                  Create a custom deadline
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Detailed Mode */}
        {mode === 'detailed' && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button 
                    onClick={() => setMode('quick')}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                )}
                <DialogTitle>
                  {isEditing ? 'Edit Deadline' : selectedTemplate ? selectedTemplate.name : 'Add Details'}
                </DialogTitle>
              </div>
            </DialogHeader>

            <form onSubmit={detailedForm.handleSubmit(onDetailedSubmit)} className="space-y-5 pt-2 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div className="space-y-2">
                <Label>What?</Label>
                <Input
                  placeholder="Deadline name"
                  {...detailedForm.register('title')}
                />
              </div>

              {/* Category (auto-detected badge) */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select 
                  value={detailedForm.watch('category')} 
                  onValueChange={(v) => detailedForm.setValue('category', v as DeadlineCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date & Recurrence */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>When?</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !detailedForm.watch('due_date') && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {detailedForm.watch('due_date') ? (
                          format(detailedForm.watch('due_date'), "MMM d, yyyy")
                        ) : (
                          "Pick date"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={detailedForm.watch('due_date')}
                        onSelect={(date) => detailedForm.setValue('due_date', date as Date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Repeats?</Label>
                  <Select 
                    value={detailedForm.watch('recurrence')} 
                    onValueChange={(v) => {
                      detailedForm.setValue('recurrence', v as RecurrencePattern);
                      detailedForm.setValue('auto_renew', v !== 'none');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Consequence Level */}
              <div className="space-y-2">
                <Label>How bad if you miss it?</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CONSEQUENCE_OPTIONS.map((option) => {
                    const isSelected = detailedForm.watch('consequence_level') === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => detailedForm.setValue('consequence_level', option.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <span className="text-xl">{option.emoji}</span>
                        <span className="text-xs">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Details Section */}
              <div className="space-y-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Optional Details</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">License/Policy #</Label>
                    <Input
                      placeholder="e.g., CBC-123456"
                      {...detailedForm.register('reference_number')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Who do you renew with?</Label>
                    <Input
                      placeholder="e.g., State Board"
                      {...detailedForm.register('issuing_authority')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Estimated Cost</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0"
                        className="pl-9"
                        {...detailedForm.register('estimated_cost', { valueAsNumber: true })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Auto-create next?</Label>
                    <div className="flex items-center gap-2 h-10">
                      <Switch
                        checked={detailedForm.watch('auto_renew')}
                        onCheckedChange={(v) => detailedForm.setValue('auto_renew', v)}
                        disabled={detailedForm.watch('recurrence') === 'none'}
                      />
                      <span className="text-sm text-muted-foreground">
                        {detailedForm.watch('auto_renew') ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Notes or renewal instructions</Label>
                  <Textarea
                    placeholder="Any notes to remember when renewing..."
                    rows={3}
                    {...detailedForm.register('renewal_instructions')}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full"
                disabled={createDeadline.isPending || updateDeadline.isPending}
              >
                {(createDeadline.isPending || updateDeadline.isPending) ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    {isEditing ? 'Save Changes' : 'Save Deadline'}
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {/* Success Mode */}
        {mode === 'success' && savedDeadline && (
          <div className="text-center py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Got it! You're covered.</h2>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-muted-foreground mb-2">I'll remind you:</p>
              <ul className="space-y-1">
                {getReminderDates(savedDeadline.due_date, savedDeadline.consequence_level).map((reminder, idx) => (
                  <li key={idx} className="text-sm flex items-center gap-2">
                    <Clock className="h-3 w-3 text-primary" />
                    {reminder}
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-muted-foreground mb-6">
              You can forget about this now.
            </p>
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleAddAnother}>
                Add Another
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Template Card Component
function TemplateCard({ template, onClick }: { template: DeadlineTemplate; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium group-hover:text-primary transition-colors">
            {template.name}
          </p>
          {template.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {template.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {template.typical_recurrence !== 'none' && (
            <Badge variant="secondary" className="text-xs">
              <RefreshCw className="h-3 w-3 mr-1" />
              {RECURRENCE_LABELS[template.typical_recurrence]}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export default DeadlineForm;
