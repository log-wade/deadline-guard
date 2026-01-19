import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: "org_member" | "org_admin";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get user's profile and org
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role, name")
      .eq("id", user.id)
      .single();

    if (!profile?.organization_id) {
      throw new Error("You must be part of an organization to invite members");
    }

    if (profile.role !== "org_admin") {
      throw new Error("Only organization admins can invite members");
    }

    // Get organization name
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    const { email, role }: InviteRequest = await req.json();

    // Check if user is already in the org
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("organization_id", profile.organization_id)
      .single();

    if (existingProfile) {
      throw new Error("This user is already a member of your organization");
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from("organization_invitations")
      .select("id")
      .eq("email", email)
      .eq("organization_id", profile.organization_id)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      throw new Error("An invitation has already been sent to this email");
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("organization_invitations")
      .insert({
        organization_id: profile.organization_id,
        email,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) {
      throw inviteError;
    }

    // Build invitation URL
    const baseUrl = Deno.env.get("APP_URL") || "https://app.deadlineguard.com";
    const inviteUrl = `${baseUrl}/invite/${invitation.token}`;

    // Send invitation email
    const { error: emailError } = await resend.emails.send({
      from: "DeadlineGuard <invites@deadlineguard.com>",
      to: [email],
      subject: `${profile.name} invited you to join ${org?.name} on DeadlineGuard`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">🛡️ DeadlineGuard</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to join a team</p>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p><strong>${profile.name}</strong> has invited you to join <strong>${org?.name}</strong> on DeadlineGuard as a ${role === "org_admin" ? "team admin" : "team member"}.</p>
              <p>DeadlineGuard helps teams track critical business deadlines — licenses, insurance renewals, certifications, and more.</p>
              <div style="text-align: center;">
                <a href="${inviteUrl}" class="button">Accept Invitation</a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
              <p style="color: #6b7280; font-size: 14px;">If you don't recognize the sender or didn't expect this invitation, you can safely ignore this email.</p>
              <div class="footer">
                <p>DeadlineGuard — Never miss a critical deadline again</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);
      // Don't throw - invitation was created, just email failed
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expires_at: invitation.expires_at,
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Invite error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
