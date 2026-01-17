import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Kings Advice <onboarding@resend.dev>';

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
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return false;
    }

    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (err) {
    console.error('Email service error:', err);
    return false;
  }
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
        <li>You'll receive a comprehensive, actionable response</li>
      </ul>
    </div>
    <p>You can track the status of your request anytime by visiting your customer dashboard.</p>
    <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your Expert Review Request Has Been Received - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendAIAnalystConfirmation(customerEmail: string, customerName: string, requestId: string): Promise<boolean> {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Thank you for choosing our <span class="badge badge-ai">AI Analyst - $99</span> service!</p>
    <p>Your request has been submitted and our AI-powered analysis system is processing it now. You should receive your personalized insights within <strong>just a few moments</strong>.</p>
    <div class="info-box">
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p style="margin-top: 10px; margin-bottom: 0;"><strong>What our AI Analyst does:</strong></p>
      <ul style="margin: 10px 0 0; padding-left: 20px;">
        <li>Analyzes your specific business challenge</li>
        <li>Draws from industry best practices</li>
        <li>Provides actionable recommendations</li>
      </ul>
    </div>
    <p>Check your dashboard shortly - your analysis will be ready soon!</p>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your AI Analysis is Being Processed - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendBasicConsultConfirmation(customerEmail: string, customerName: string, requestId: string, topic: string): Promise<boolean> {
  const content = `
    <p>Dear ${customerName},</p>
    <p>Thank you for using our <span class="badge badge-basic">Basic Consult - $29</span> service!</p>
    <p>Your request regarding <strong>"${topic}"</strong> has been completed. Our expert knowledge base has provided you with guidance based on industry best practices.</p>
    <div class="info-box">
      <p><strong>Request ID:</strong> ${requestId}</p>
    </div>
    <p>Your response is ready! Visit your customer dashboard to view the full details.</p>
    <p>Need more personalized advice? Consider upgrading to our AI Analyst or Expert Review services for deeper insights tailored to your specific situation.</p>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: 'Your Basic Consult Response is Ready - Kings Advice',
    html: getEmailTemplate(content),
  });
}

export async function sendResponseReadyNotification(customerEmail: string, customerName: string, requestId: string, tier: string): Promise<boolean> {
  const tierDisplay = tier === 'expert' ? 'Expert Review' : tier === 'middle' ? 'AI Analyst' : 'Basic Consult';
  
  const content = `
    <p>Dear ${customerName},</p>
    <p>Great news! Your <strong>${tierDisplay}</strong> consulting response is now ready.</p>
    <div class="info-box">
      <p><strong>Request ID:</strong> ${requestId}</p>
    </div>
    <p>Our team has completed the analysis of your request and prepared a detailed response for you.</p>
    <p>Visit your customer dashboard now to view your personalized consulting insights and recommendations.</p>
    <p>We hope this guidance helps you achieve your business goals. If you have any follow-up questions or need additional consulting, we're always here to help.</p>
    <p>Best regards,<br><strong>The Kings Advice Team</strong></p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Your ${tierDisplay} Response is Ready - Kings Advice`,
    html: getEmailTemplate(content),
  });
}

export async function sendAdminNotification(requestId: string, customerName: string, tier: string, description: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('No ADMIN_EMAIL configured, skipping admin notification');
    return false;
  }

  const tierDisplay = tier === 'expert' ? 'Expert Review ($499)' : tier === 'middle' ? 'AI Analyst ($99)' : 'Basic Consult ($29)';
  
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
