import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Kings Advice <onboarding@resend.dev>';
const SITE_URL = process.env.SITE_URL || 'https://kingsadvice.onrender.com';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #0f172a; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px; background: #f8fafc; }
        .content p { margin: 0 0 15px; }
        .badge { display: inline-block; background: #e2e8f0; color: #475569; padding: 6px 12px; border-radius: 4px; font-size: 14px; font-weight: bold; }
        .badge-expert { background: #fef3c7; color: #92400e; }
        .badge-ai { background: #dbeafe; color: #1e40af; }
        .badge-basic { background: #e2e8f0; color: #475569; }
        .response-box { background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .response-box p { margin: 0; white-space: pre-wrap; }
        .cta-button { display: inline-block; background: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        .info-box { background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .upsell-box { background: #fef3c7; border: 1px solid #fcd34d; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background: #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Kings Advice</h1>
          <p>Expert Consulting On Demand</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>Copyright 2026 Kings Advice. All rights reserved.</p>
          <p style="margin-top: 10px; font-size: 11px;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  console.log('=== EMAIL SEND ATTEMPT ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('API Key exists:', !!process.env.RESEND_API_KEY);
  console.log('API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 10) + '...');
  
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', JSON.stringify(error, null, 2));
      return false;
    }

    console.log('Email sent successfully! ID:', data?.id);
    return true;
  } catch (err) {
    console.error('Email service error:', err);
    return false;
  }
}

export async function sendBasicThankYou(customerEmail: string, customerName: string, topic: string, response: string): Promise<boolean> {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Thank you for choosing <span class="badge badge-basic">Basic Consult - $29</span>!</p>
    <p>Here is your expert guidance on <strong>"${topic}"</strong>:</p>
    <div class="response-box">
      <p>${response}</p>
    </div>
    <div class="upsell-box">
      <p><strong>Need more personalized advice?</strong></p>
      <p>Our Expert Review service ($499) provides a custom, in-depth analysis from a senior consultant tailored specifically to your situation.</p>
      <a href="${SITE_URL}" class="cta-button">Get Expert Review</a>
    </div>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your Basic Consult Response - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendAIAnalystThankYou(customerEmail: string, customerName: string, response: string): Promise<boolean> {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Thank you for choosing <span class="badge badge-ai">AI Analyst - $99</span>!</p>
    <p>Here is your AI-powered analysis:</p>
    <div class="response-box">
      <p>${response}</p>
    </div>
    <div class="upsell-box">
      <p><strong>Want even deeper insights?</strong></p>
      <p>Our Expert Review service ($499) connects you with a senior consultant who will conduct a thorough, personalized analysis of your specific situation.</p>
      <a href="${SITE_URL}" class="cta-button">Get Expert Review</a>
    </div>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your AI Analyst Response - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendExpertRequestConfirmation(customerEmail: string, customerName: string, requestId: string): Promise<boolean> {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Thank you for choosing our <span class="badge badge-expert">Expert Review - $499</span> service!</p>
    <p>We have received your consulting request and our senior team is now reviewing it. You can expect a detailed, personalized response from one of our expert consultants within <strong>2-3 business days</strong>.</p>
    <div class="info-box">
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p style="margin-top: 10px; margin-bottom: 0;"><strong>What happens next:</strong></p>
      <ul style="margin: 10px 0 0; padding-left: 20px;">
        <li>A senior consultant will be assigned to your case</li>
        <li>They will conduct a thorough analysis of your situation</li>
        <li>You'll receive your response via email</li>
      </ul>
    </div>
    <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your Expert Review Request Has Been Received - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendExpertResponseReady(customerEmail: string, customerName: string, response: string): Promise<boolean> {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Great news! Your <span class="badge badge-expert">Expert Review</span> response is ready.</p>
    <p>Our senior consultant has completed their in-depth analysis of your situation. Here are your personalized insights and recommendations:</p>
    <div class="response-box">
      <p>${response}</p>
    </div>
    <p>We hope this guidance helps you achieve your business goals. If you have any follow-up questions or need additional consulting, we're always here to help.</p>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your Expert Review Response is Ready - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendAdminNotification(requestId: string, customerName: string, tier: string, description: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('No ADMIN_EMAIL configured, skipping admin notification');
    return false;
  }

  const tierDisplay = tier === 'custom' ? 'Expert Review ($499)' : tier === 'middle' ? 'AI Analyst ($99)' : 'Basic Consult ($29)';
  
  const content = `
    <p><strong>New Consulting Request Received</strong></p>
    <div class="info-box">
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Customer:</strong> ${customerName}</p>
      <p><strong>Service Tier:</strong> <span class="badge">${tierDisplay}</span></p>
    </div>
    <p><strong>Request Details:</strong></p>
    <div class="response-box">
      <p>${description}</p>
    </div>
    <p>Log in to the admin dashboard to review and respond to this request.</p>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `New ${tierDisplay} Request from ${customerName} - Kings Advice`,
    html: getEmailTemplate(content),
  });
}
