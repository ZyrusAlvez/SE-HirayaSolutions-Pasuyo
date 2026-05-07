import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "465");
const SMTP_USER = Deno.env.get("SMTP_USER") ?? "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") ?? "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") ?? SMTP_USER;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATES: Record<string, string> = {
  "errand-accepted": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Errand Accepted</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .header { padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #F3F4F6; }
    .body { padding: 40px; }
    .body h2 { color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 8px; }
    .body p { color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 24px; }
    .errand-card { background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .errand-card .description { color: #6B7280; font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
    .cta-wrap { text-align: center; margin-bottom: 24px; }
    .cta-button { display: inline-block; background-color: #FEA405; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; }
    .footer { padding: 20px 40px; text-align: center; border-top: 1px solid #F3F4F6; }
    .footer p { color: #9CA3AF; font-size: 11px; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://pasuyo.xyz/assets/assets/logo/Pasuyo_full.fb4e4361aa1f53810293622e25f31490.png" alt="Pasuyo" style="height: 36px;" />
    </div>
    <div class="body">
      <h2>Your Errand Has Been Accepted!</h2>
      <p>Great news! Someone has accepted your errand. You can now coordinate the details through chat.</p>
      <div class="errand-card">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size: 15px; font-weight: 700; color: #111827;">{{errand_title}}</td>
            <td style="font-size: 14px; font-weight: 700; color: #D97706; text-align: right; white-space: nowrap; padding-left: 12px;">{{errand_budget}}</td>
          </tr>
        </table>
        <p class="description">{{errand_description}}</p>
      </div>
      <div class="cta-wrap">
        <a href="{{chat_url}}" class="cta-button">Open Chat</a>
      </div>
      <p>If you have any questions, feel free to reach out through the app.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Pasuyo &middot; Hiraya Solutions<br/>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>`,

  "errand-cancelled": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Errand Cancelled</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .header { padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #F3F4F6; }
    .body { padding: 40px; }
    .body h2 { color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 8px; }
    .body p { color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 24px; }
    .errand-card { background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .errand-card .description { color: #6B7280; font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
    .reason-label { font-size: 12px; font-weight: 600; color: #991B1B; margin: 10px 0 0; }
    .reason-value { font-size: 13px; color: #DC2626; margin: 2px 0 0; }
    .cta-wrap { text-align: center; margin-bottom: 24px; }
    .cta-button { display: inline-block; background-color: #FEA405; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; }
    .footer { padding: 20px 40px; text-align: center; border-top: 1px solid #F3F4F6; }
    .footer p { color: #9CA3AF; font-size: 11px; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://pasuyo.xyz/assets/assets/logo/Pasuyo_full.fb4e4361aa1f53810293622e25f31490.png" alt="Pasuyo" style="height: 36px;" />
    </div>
    <div class="body">
      <h2>Your Errand Has Been Cancelled</h2>
      <p>Unfortunately, <strong>{{canceller_name}}</strong> has cancelled your errand. Your errand is now back to available and can be accepted by others.</p>
      <div class="errand-card">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size: 15px; font-weight: 700; color: #111827;">{{errand_title}}</td>
            <td style="font-size: 14px; font-weight: 700; color: #D97706; text-align: right; white-space: nowrap; padding-left: 12px;">{{errand_budget}}</td>
          </tr>
        </table>
        <p class="description">{{errand_description}}</p>
        <p class="reason-label">Reason</p>
        <p class="reason-value">{{cancel_reason}}</p>
      </div>
      <div class="cta-wrap">
        <a href="{{errand_url}}" class="cta-button">View Errand</a>
      </div>
      <p>Your errand is still live and available for others to accept.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Pasuyo &middot; Hiraya Solutions<br/>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>`,

  "errand-marked-done": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Errand Marked as Done</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .header { padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #F3F4F6; }
    .body { padding: 40px; }
    .body h2 { color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 8px; }
    .body p { color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 24px; }
    .errand-card { background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .errand-card .description { color: #6B7280; font-size: 13px; line-height: 1.5; margin: 6px 0 0; }
    .cta-wrap { text-align: center; margin-bottom: 24px; }
    .cta-button { display: inline-block; background-color: #FEA405; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; }
    .footer { padding: 20px 40px; text-align: center; border-top: 1px solid #F3F4F6; }
    .footer p { color: #9CA3AF; font-size: 11px; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://pasuyo.xyz/assets/assets/logo/Pasuyo_full.fb4e4361aa1f53810293622e25f31490.png" alt="Pasuyo" style="height: 36px;" />
    </div>
    <div class="body">
      <h2>Your Errand Has Been Marked as Done</h2>
      <p><strong>{{runner_name}}</strong> has marked your errand as completed. Please review and confirm the completion through chat.</p>
      <div class="errand-card">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-size: 15px; font-weight: 700; color: #111827;">{{errand_title}}</td>
            <td style="font-size: 14px; font-weight: 700; color: #D97706; text-align: right; white-space: nowrap; padding-left: 12px;">{{errand_budget}}</td>
          </tr>
        </table>
        <p class="description">{{errand_description}}</p>
      </div>
      <div class="cta-wrap">
        <a href="{{chat_url}}" class="cta-button">Open Chat</a>
      </div>
      <p>If something doesn't look right, reach out to the runner through chat.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Pasuyo &middot; Hiraya Solutions<br/>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>`,

  "account-restored": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Account Restored</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F9FAFB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 480px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .header { padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #F3F4F6; }
    .body { padding: 40px; }
    .body h2 { color: #111827; font-size: 20px; font-weight: 700; margin: 0 0 8px; }
    .body p { color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 24px; }
    .status-card { background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; }
    .status-card .icon { font-size: 32px; margin-bottom: 8px; color: #065F46; }
    .status-card .label { font-size: 14px; font-weight: 700; color: #065F46; }
    .cta-wrap { text-align: center; margin-bottom: 24px; }
    .cta-button { display: inline-block; background-color: #FEA405; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 12px; }
    .footer { padding: 20px 40px; text-align: center; border-top: 1px solid #F3F4F6; }
    .footer p { color: #9CA3AF; font-size: 11px; margin: 0; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <img src="https://pasuyo.xyz/assets/assets/logo/Pasuyo_full.fb4e4361aa1f53810293622e25f31490.png" alt="Pasuyo" style="height: 36px;" />
    </div>
    <div class="body">
      <h2>Your Account Has Been Restored</h2>
      <p>Good news! Your Pasuyo account has been restored. You can now access all features of the platform again.</p>
      <div class="status-card">
        <div class="icon">&#10003;</div>
        <div class="label">Account Active</div>
      </div>
      <div class="cta-wrap">
        <a href="https://pasuyo.xyz" class="cta-button">Open Pasuyo</a>
      </div>
      <p>If you have any questions, feel free to reach out through the app.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Pasuyo &middot; Hiraya Solutions<br/>This is an automated message, please do not reply.</p>
    </div>
  </div>
</body>
</html>`,
};

function renderTemplate(template: string, data: Record<string, string>): string {
  let html = template;
  for (const [key, value] of Object.entries(data)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  return html;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { userId, to, subject, template, data } = await req.json();

    let recipientEmail = to;

    if (!recipientEmail && userId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      recipientEmail = userData?.user?.email;
    }

    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "No recipient email" }), { status: 400, headers: corsHeaders });
    }

    const templateHtml = TEMPLATES[template];
    if (!templateHtml) {
      return new Response(JSON.stringify({ error: "Unknown template" }), { status: 400, headers: corsHeaders });
    }

    const html = renderTemplate(templateHtml, data ?? {});

    const client = new SMTPClient({
      connection: {
        hostname: SMTP_HOST,
        port: SMTP_PORT,
        tls: true,
        auth: { username: SMTP_USER, password: SMTP_PASS },
      },
    });

    await client.send({
      from: "Pasuyo <" + SMTP_FROM + ">",
      to: recipientEmail,
      subject: subject ?? "Pasuyo Notification",
      html,
    });

    await client.close();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
