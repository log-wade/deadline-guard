import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Deadline {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  category: string;
  consequence_level: string;
  user_id: string;
  last_reminder_sent: string | null;
}

interface Profile {
  id: string;
  email: string;
  name: string;
}

// Reminder windows in days
const REMINDER_WINDOWS = [30, 14, 7, 3, 1];

function getDaysUntilDeadline(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function shouldSendReminder(daysUntil: number, lastReminderSent: string | null): boolean {
  // Check if we're at a reminder window
  const isAtWindow = REMINDER_WINDOWS.some(window => daysUntil <= window && daysUntil > window - 1);
  
  if (!isAtWindow) return false;
  
  // If no reminder sent yet, send one
  if (!lastReminderSent) return true;
  
  // Don't send more than one reminder per day
  const lastSent = new Date(lastReminderSent);
  const now = new Date();
  const hoursSinceLastReminder = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
  
  return hoursSinceLastReminder >= 24;
}

function getConsequenceLevelEmoji(level: string): string {
  switch (level) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '📌';
    case 'low': return '📝';
    default: return '📋';
  }
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    license: 'License',
    insurance: 'Insurance',
    contract: 'Contract',
    personal: 'Personal',
    other: 'Other'
  };
  return labels[category] || category;
}

async function sendReminderEmail(
  userEmail: string,
  userName: string,
  deadline: Deadline,
  daysUntil: number
): Promise<boolean> {
  const emoji = getConsequenceLevelEmoji(deadline.consequence_level);
  const urgencyText = daysUntil <= 1 ? 'TODAY' : daysUntil <= 3 ? 'URGENT' : 'Upcoming';
  
  try {
    const { error } = await resend.emails.send({
      from: "Deadline Reminders <onboarding@resend.dev>",
      to: [userEmail],
      subject: `${emoji} ${urgencyText}: ${deadline.title} due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .deadline-card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
            .badge-critical { background: #fee2e2; color: #dc2626; }
            .badge-high { background: #fef3c7; color: #d97706; }
            .badge-medium { background: #dbeafe; color: #2563eb; }
            .badge-low { background: #d1fae5; color: #059669; }
            .days-left { font-size: 48px; font-weight: bold; color: ${daysUntil <= 3 ? '#dc2626' : '#667eea'}; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">⏰ Deadline Reminder</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Hi ${userName}, don't miss this important deadline!</p>
            </div>
            <div class="content">
              <div style="text-align: center;">
                <div class="days-left">${daysUntil}</div>
                <div style="color: #6b7280; margin-bottom: 20px;">day${daysUntil === 1 ? '' : 's'} remaining</div>
              </div>
              
              <div class="deadline-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                  <h2 style="margin: 0; color: #1f2937;">${deadline.title}</h2>
                  <span class="badge badge-${deadline.consequence_level}">${deadline.consequence_level.toUpperCase()}</span>
                </div>
                
                ${deadline.description ? `<p style="color: #6b7280; margin: 0 0 15px 0;">${deadline.description}</p>` : ''}
                
                <div style="display: flex; gap: 20px; color: #6b7280; font-size: 14px;">
                  <div>📅 <strong>Due:</strong> ${new Date(deadline.due_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  <div>📁 <strong>Category:</strong> ${getCategoryLabel(deadline.category)}</div>
                </div>
              </div>
              
              <div class="footer">
                <p>This is an automated reminder from your Deadline Tracker.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error(`Failed to send email to ${userEmail}:`, error);
      return false;
    }
    
    console.log(`Successfully sent reminder to ${userEmail} for deadline: ${deadline.title}`);
    return true;
  } catch (err) {
    console.error(`Error sending email to ${userEmail}:`, err);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting deadline reminder check...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all deadlines with their user profiles
    const { data: deadlines, error: deadlinesError } = await supabase
      .from("deadlines")
      .select("*")
      .gte("due_date", new Date().toISOString().split("T")[0]);

    if (deadlinesError) {
      console.error("Error fetching deadlines:", deadlinesError);
      throw deadlinesError;
    }

    console.log(`Found ${deadlines?.length || 0} upcoming deadlines`);

    let remindersSent = 0;
    let remindersSkipped = 0;

    for (const deadline of deadlines || []) {
      const daysUntil = getDaysUntilDeadline(deadline.due_date);
      
      console.log(`Checking deadline "${deadline.title}": ${daysUntil} days until due`);
      
      if (!shouldSendReminder(daysUntil, deadline.last_reminder_sent)) {
        console.log(`Skipping reminder for "${deadline.title}" - not in reminder window or already sent`);
        remindersSkipped++;
        continue;
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, name")
        .eq("id", deadline.user_id)
        .single();

      if (profileError || !profile) {
        console.error(`Could not find profile for user ${deadline.user_id}:`, profileError);
        continue;
      }

      const sent = await sendReminderEmail(
        profile.email,
        profile.name,
        deadline,
        daysUntil
      );

      if (sent) {
        // Update last_reminder_sent
        const { error: updateError } = await supabase
          .from("deadlines")
          .update({ last_reminder_sent: new Date().toISOString() })
          .eq("id", deadline.id);

        if (updateError) {
          console.error(`Failed to update last_reminder_sent for ${deadline.id}:`, updateError);
        }
        
        remindersSent++;
      }
    }

    const result = {
      success: true,
      message: `Processed ${deadlines?.length || 0} deadlines. Sent ${remindersSent} reminders, skipped ${remindersSkipped}.`,
      remindersSent,
      remindersSkipped,
      totalDeadlines: deadlines?.length || 0,
    };

    console.log("Reminder check complete:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-deadline-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
