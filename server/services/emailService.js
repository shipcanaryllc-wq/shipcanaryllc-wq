const { Resend } = require('resend');

// Validate email configuration on module load
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

if (!RESEND_API_KEY || !EMAIL_FROM) {
  console.error('\n═══════════════════════════════════════════════════════════');
  console.error('❌ EMAIL NOT CONFIGURED: missing RESEND_API_KEY or EMAIL_FROM');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('   Set RESEND_API_KEY in server/.env file');
  console.error('   Set EMAIL_FROM in server/.env file (e.g., onboarding@resend.dev)');
  console.error('═══════════════════════════════════════════════════════════\n');
}

// Initialize Resend client only if API key is present
let resend = null;
if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
}

/**
 * Generic email sending function using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} [options.text] - Plain text email body (optional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
const sendEmail = async ({ to, subject, html, text }) => {
  // Check if email is configured
  if (!RESEND_API_KEY || !EMAIL_FROM) {
    const errorMsg = 'Email service not configured: missing RESEND_API_KEY or EMAIL_FROM';
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    console.log('[EMAIL] sending via Resend', { to, from: EMAIL_FROM, subject });
    
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
    });

    if (error) {
      console.error('[EMAIL] Resend API error', { 
        error: error.message, 
        statusCode: error.statusCode,
        to,
        from: EMAIL_FROM
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('[EMAIL] sent successfully via Resend', { 
      id: data?.id, 
      to,
      from: EMAIL_FROM 
    });
    // Return Resend response ID as 'id' to match Resend API response
    return { success: true, id: data?.id, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Password reset token
 * @returns {Promise<{success: boolean, id?: string, messageId?: string}>}
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">ShipCanary</h1>
      </div>
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0;">
        <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
        <p>You requested to reset your password for your ShipCanary account.</p>
        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666;">Or copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #999; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 14px; color: #666; margin-top: 30px;">If you didn't request this password reset, please ignore this email.</p>
      </div>
      <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>© ${new Date().getFullYear()} ShipCanary. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
Reset Your ShipCanary Password

You requested to reset your password for your ShipCanary account.

Click this link to reset your password (expires in 1 hour):
${resetUrl}

If you didn't request this password reset, please ignore this email.

© ${new Date().getFullYear()} ShipCanary. All rights reserved.
  `;

  return await sendEmail({
    to: email,
    subject: 'Reset Your ShipCanary Password',
    html,
    text,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  isEmailConfigured: () => !!(RESEND_API_KEY && EMAIL_FROM),
};



