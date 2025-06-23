
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Contact email function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, message, userId }: ContactEmailRequest = await req.json();
    
    console.log('Processing contact form submission:', { firstName, lastName, email, hasUserId: !!userId });

    // Create Supabase client with SERVICE ROLE KEY to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store in customer_messages table - using service role bypasses RLS
    const messageData = {
      user_id: userId || null, // Allow null for anonymous users
      subject: `Contact Form Inquiry from ${firstName} ${lastName}`,
      message: `Name: ${firstName} ${lastName}\nEmail: ${email}\n\nMessage:\n${message}`,
      status: 'open'
    };

    console.log('Inserting message with data:', messageData);

    const { data: insertData, error: dbError } = await supabaseClient
      .from('customer_messages')
      .insert(messageData)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to store message in database: ${dbError.message}`);
    }

    console.log('Message stored in database successfully:', insertData);

    // Send email to admin
    const adminEmailResponse = await resend.emails.send({
      from: "MecCrypto Contact <onboarding@resend.dev>",
      to: ["smdktk@gmail.com"],
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Contact Details:</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${userId ? `<p><strong>User ID:</strong> ${userId}</p>` : '<p><em>Submitted by anonymous user</em></p>'}
          </div>
          
          <div style="background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message:</h3>
            <p style="line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p>This email was sent automatically from the MecCrypto contact form.</p>
            <p>Message ID: ${insertData.id}</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Admin email sent successfully:", adminEmailResponse);

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: "MecCrypto Support <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for contacting MecCrypto",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #dc2626;">
            <h1 style="color: #dc2626; margin: 0;">MecCrypto</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Professional Cryptocurrency Trading Platform</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333;">Thank you for contacting us, ${firstName}!</h2>
            
            <p style="color: #4b5563; line-height: 1.6;">
              We have received your message and our team will review it carefully. 
              We typically respond to all inquiries within 24 hours during business days.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3 style="color: #dc2626; margin-top: 0;">Your message:</h3>
              <p style="color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6;">
              If you have any urgent trading questions or need immediate assistance, 
              you can also use our MecBot chat assistant available on our platform.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://your-domain.com" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Visit MecCrypto Platform
              </a>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 12px; color: #6b7280; margin-top: 20px;">
              <p>Reference ID: ${insertData.id}</p>
              <p>Please keep this reference ID for your records.</p>
            </div>
          </div>
          
          <div style="background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px;">
            <p>© 2024 MecCrypto. All rights reserved.</p>
            <p>Professional cryptocurrency trading platform with advanced security features.</p>
          </div>
        </div>
      `,
    });

    console.log("User confirmation email sent successfully:", userEmailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully and message stored",
        messageId: insertData.id,
        adminEmailId: adminEmailResponse.data?.id,
        userEmailId: userEmailResponse.data?.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send email",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
