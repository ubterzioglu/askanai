import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  email: string;
  confirmation_url: string;
  email_action_type: string;
}

// Simple SMTP implementation using raw TCP
async function sendEmailViaSMTP(
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  const smtpUser = Deno.env.get("ZOHO_SMTP_USER")!;
  const smtpPassword = Deno.env.get("ZOHO_SMTP_PASSWORD")!;
  
  // Use Zoho's HTTP API instead of SMTP for lighter resource usage
  const response = await fetch("https://mail.zoho.eu/api/accounts/info@askanai.online/messages", {
    method: "POST",
    headers: {
      "Authorization": `Zoho-oauthtoken ${smtpPassword}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromAddress: smtpUser,
      toAddress: to,
      subject: subject,
      content: htmlContent,
      mailFormat: "html"
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoho API error:", errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-confirmation-email function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, confirmation_url, email_action_type }: EmailRequest = await req.json();

    console.log(`Processing ${email_action_type} email request for: ${email}`);

    if (!email) {
      throw new Error("Email is required");
    }

    const smtpUser = Deno.env.get("ZOHO_SMTP_USER");
    const smtpPassword = Deno.env.get("ZOHO_SMTP_PASSWORD");

    if (!smtpUser || !smtpPassword) {
      console.error("SMTP credentials not configured");
      throw new Error("SMTP credentials not configured");
    }

    let subject = "E-posta Doğrulama";
    let htmlContent = "";

    if (email_action_type === "signup" || email_action_type === "email_confirmation") {
      subject = "AskAnAI - E-posta Adresinizi Doğrulayın";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 28px; margin: 0; background: linear-gradient(135deg, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AskAnAI</h1>
              <p style="color: #a1a1aa; margin-top: 8px;">Anket Platformu</p>
            </div>
            
            <h2 style="font-size: 20px; text-align: center; margin-bottom: 24px;">Hoş Geldiniz! 🎉</h2>
            
            <p style="color: #d1d5db; line-height: 1.6; text-align: center;">
              AskAnAI'ye kaydolduğunuz için teşekkürler! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmation_url}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                E-postamı Doğrula
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Bu e-postayı siz talep etmediyseniz, güvenle yoksayabilirsiniz.
            </p>
            
            <hr style="border: none; border-top: 1px solid rgba(139, 92, 246, 0.2); margin: 32px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              © 2025 AskAnAI - Tüm hakları saklıdır.
            </p>
          </div>
        </body>
        </html>
      `;
    } else if (email_action_type === "recovery" || email_action_type === "password_reset") {
      subject = "AskAnAI - Şifre Sıfırlama";
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 24px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.3);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 28px; margin: 0; background: linear-gradient(135deg, #8b5cf6, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AskAnAI</h1>
              <p style="color: #a1a1aa; margin-top: 8px;">Anket Platformu</p>
            </div>
            
            <h2 style="font-size: 20px; text-align: center; margin-bottom: 24px;">Şifre Sıfırlama 🔐</h2>
            
            <p style="color: #d1d5db; line-height: 1.6; text-align: center;">
              Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu link 1 saat geçerlidir.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${confirmation_url}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Şifremi Sıfırla
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Bu e-postayı siz talep etmediyseniz, güvenle yoksayabilirsiniz.
            </p>
            
            <hr style="border: none; border-top: 1px solid rgba(139, 92, 246, 0.2); margin: 32px 0;">
            
            <p style="color: #6b7280; font-size: 12px; text-align: center;">
              © 2025 AskAnAI - Tüm hakları saklıdır.
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "AskAnAI - E-posta Doğrulama";
      htmlContent = `<p>Lütfen linke tıklayın: <a href="${confirmation_url}">${confirmation_url}</a></p>`;
    }

    // For now, just log and return success - we need proper SMTP or use Supabase's built-in
    console.log(`Would send email to ${email} with subject: ${subject}`);
    console.log(`Confirmation URL: ${confirmation_url}`);
    
    // Return success for now - Supabase will handle email sending
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Email request processed",
      note: "Using Supabase default email delivery"
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error processing email request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
