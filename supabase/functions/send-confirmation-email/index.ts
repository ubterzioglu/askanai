import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Email format validation
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

// Validate confirmation URL is from trusted domain
const isValidConfirmationUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    const trustedDomains = [
      'askanai.lovable.app',
      'localhost',
      'lovable.app',
      'supabase.co'
    ];
    return trustedDomains.some(domain => 
      parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-confirmation-email function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized - missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate JWT using Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("JWT validation failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated request from user: ${userId}`);

    const { email, confirmation_url, email_action_type }: EmailRequest = await req.json();

    console.log(`Processing ${email_action_type} email request for: ${email}`);

    // Validate email format
    if (!email || !isValidEmail(email)) {
      console.error("Invalid email format:", email);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate confirmation URL is from trusted domain
    if (confirmation_url && !isValidConfirmationUrl(confirmation_url)) {
      console.error("Untrusted confirmation URL:", confirmation_url);
      return new Response(
        JSON.stringify({ error: "Invalid confirmation URL" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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

    // Log the email attempt for monitoring
    console.log(`Email request validated for ${email} with action: ${email_action_type}`);
    console.log(`Confirmation URL domain validated: ${confirmation_url}`);
    
    // Return success - Supabase will handle email sending
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
      JSON.stringify({ error: "Failed to process email request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
