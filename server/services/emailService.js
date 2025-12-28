const nodemailer = require('nodemailer');

// Create transporter based on environment variables
const createTransporter = () => {
  // Option 1: SMTP (Gmail, SendGrid, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Option 2: SendGrid (if SENDGRID_API_KEY is set)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }

  // Option 3: Development - use ethereal.email for testing
  if (process.env.NODE_ENV === 'development') {
    // Return a mock transporter that logs to console
    return {
      sendMail: async (options) => {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('📧 EMAIL (Development Mode - Not Actually Sent)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.text || options.html);
        console.log('═══════════════════════════════════════════════════════════\n');
        return { messageId: 'dev-mock-' + Date.now() };
      }
    };
  }

  // Fallback: throw error if no email config
  throw new Error('Email service not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or SENDGRID_API_KEY');
};

const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@shipcanary.com',
      to: email,
      subject: 'Reset Your ShipCanary Password',
      html: `
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
      `,
      text: `
Reset Your ShipCanary Password

You requested to reset your password for your ShipCanary account.

Click this link to reset your password (expires in 1 hour):
${resetUrl}

If you didn't request this password reset, please ignore this email.

© ${new Date().getFullYear()} ShipCanary. All rights reserved.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail
};


