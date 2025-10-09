import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get projects with deadlines in the next 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(`
        *,
        project_assignments(employee_id)
      `)
      .eq("status", "ongoing")
      .lte("end_date", threeDaysFromNow.toISOString())
      .gte("end_date", new Date().toISOString());

    if (projectsError) throw projectsError;

    console.log(`Found ${projects?.length || 0} projects with upcoming deadlines`);

    // Get tasks with upcoming deadlines
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("*, assigned_to")
      .in("status", ["pending", "in_progress"])
      .lte("deadline", threeDaysFromNow.toISOString())
      .gte("deadline", new Date().toISOString());

    if (tasksError) throw tasksError;

    console.log(`Found ${tasks?.length || 0} tasks with upcoming deadlines`);

    const emailsSent: string[] = [];

    // Helper function to send email via Resend API
    const sendEmail = async (to: string, subject: string, html: string) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'EFFI-TRACK <onboarding@resend.dev>',
          to: [to],
          subject,
          html
        })
      });
      return res;
    };

    // Send emails for projects
    if (projects && projects.length > 0) {
      for (const project of projects) {
        const employeeIds = project.project_assignments?.map((pa: any) => pa.employee_id) || [];
        
        if (employeeIds.length > 0) {
          const { data: employees } = await supabase
            .from("employees")
            .select("email, name")
            .in("id", employeeIds);

          if (employees) {
            for (const employee of employees) {
              const daysLeft = Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              
              try {
                await sendEmail(
                  employee.email,
                  `⚠️ Project Deadline Alert: ${project.title}`,
                  `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                      <div style="background: white; padding: 30px; border-radius: 8px;">
                        <h1 style="color: #667eea; margin-bottom: 20px;">🚨 Project Deadline Approaching</h1>
                        <p style="font-size: 16px; color: #333; margin-bottom: 15px;">Hi <strong>${employee.name}</strong>,</p>
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                          This is a reminder that the project <strong>"${project.title}"</strong> deadline is approaching soon.
                        </p>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                          <p style="margin: 0; font-size: 14px; color: #666;"><strong>Project:</strong> ${project.title}</p>
                          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Deadline:</strong> ${new Date(project.end_date).toLocaleDateString()}</p>
                          <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Days Remaining:</strong> ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Please ensure all tasks are completed on time.</p>
                        <p style="font-size: 14px; color: #999;">Best regards,<br>EFFI-TRACK Team</p>
                      </div>
                    </div>
                  `
                );
                emailsSent.push(employee.email);
                console.log(`Email sent to ${employee.email} for project ${project.title}`);
              } catch (emailError) {
                console.error(`Failed to send email to ${employee.email}:`, emailError);
              }
            }
          }
        }
      }
    }

    // Send emails for tasks
    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        if (task.assigned_to) {
          const { data: employee } = await supabase
            .from("employees")
            .select("email, name")
            .eq("id", task.assigned_to)
            .single();

          if (employee) {
            const daysLeft = Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            try {
              await sendEmail(
                employee.email,
                `⏰ Task Deadline Alert: ${task.title}`,
                `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 8px;">
                      <h1 style="color: #667eea; margin-bottom: 20px;">⏰ Task Deadline Approaching</h1>
                      <p style="font-size: 16px; color: #333; margin-bottom: 15px;">Hi <strong>${employee.name}</strong>,</p>
                      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                        Your assigned task <strong>"${task.title}"</strong> deadline is coming up soon.
                      </p>
                      <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #764ba2;">
                        <p style="margin: 0; font-size: 14px; color: #666;"><strong>Task:</strong> ${task.title}</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Status:</strong> ${task.status.replace('_', ' ').toUpperCase()}</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Deadline:</strong> ${new Date(task.deadline).toLocaleDateString()}</p>
                        <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;"><strong>Days Remaining:</strong> ${daysLeft} day${daysLeft !== 1 ? 's' : ''}</p>
                      </div>
                      <p style="font-size: 14px; color: #666; margin-bottom: 20px;">Please complete this task before the deadline.</p>
                      <p style="font-size: 14px; color: #999;">Best regards,<br>EFFI-TRACK Team</p>
                    </div>
                  </div>
                `
              );
              emailsSent.push(employee.email);
              console.log(`Email sent to ${employee.email} for task ${task.title}`);
            } catch (emailError) {
              console.error(`Failed to send email to ${employee.email}:`, emailError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${emailsSent.length} deadline alert emails`,
        emailsSent,
        projectsChecked: projects?.length || 0,
        tasksChecked: tasks?.length || 0
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-deadline-alerts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);