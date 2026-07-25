import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || 'sonukumarray1009@gmail.com';
    const pass = process.env.SMTP_PASS || 'ggslehoqigimiils';

    // Configure Nodemailer for SMTP delivery
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for port 465, false for port 587
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false, // Prevents local SSL/proxy cert errors
        },
      });
      logger.info(`📧 Mail Service: SMTP Transporter configured for ${user}.`);
    } else {
      logger.info('📧 Mail Service: SMTP credentials not found. Falling back to console logging.');
    }
  }

  async sendTestEmail(toEmail: string) {
    const subject = `📧 Portl System: SMTP Real Test Email`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 550px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <h2 style="color: #4f46e5; margin-top: 0;">Portl Mail System Active! 🚀</h2>
        <p>This is a real test email dispatched from your Portl Society Management System backend.</p>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>📧 Recipient:</strong> ${toEmail}</p>
          <p style="margin: 4px 0;"><strong>🌐 SMTP Server:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
          <p style="margin: 4px 0;"><strong>STATUS:</strong> ✅ Connected & Verified</p>
        </div>
        <p style="color: #64748b; font-size: 13px;">Sent at: ${new Date().toLocaleString()}</p>
      </div>
    `;

    if (!this.transporter) {
      throw new Error('SMTP Transporter is not configured. Please set SMTP_USER and SMTP_PASS in backend/.env');
    }

    const fromEmail = process.env.SMTP_FROM || `"Portl Admin" <${process.env.SMTP_USER || 'sonukumarray1009@gmail.com'}>`;

    try {
      const info = await this.transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        html,
      });
      logger.info(`📧 Real test email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId, recipient: toEmail };
    } catch (error: any) {
      const isAuthError = error.code === 'EAUTH' || error.responseCode === 535;
      const errorDetail = isAuthError
        ? 'Gmail SMTP Authentication Failed (535 Bad Credentials). Google requires a 16-character App Password. To fix: Go to Google Account > Security > 2-Step Verification > App passwords > Generate App Password, then paste it into backend/.env as SMTP_PASS.'
        : (error.message || String(error));
      
      logger.error(`❌ SMTP Delivery Failed for ${toEmail}: ${errorDetail}`);

      // Fallback console log output
      console.log(`
========================================================================
📧 [MAIL SYSTEM FALLBACK LOG]
------------------------------------------------------------------------
To:      ${toEmail}
Subject: ${subject}
Error:   ${errorDetail}
========================================================================`);

      return {
        success: false,
        error: errorDetail,
        isAuthError,
      };
    }
  }

  async sendPasswordResetEmail(toEmail: string, resetCode: string) {
    const subject = `🔑 Portl Verification Code: ${resetCode}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #4f46e5; margin-top: 0;">Password Reset Verification</h2>
        <p>You requested a password reset for your Portl account. Use the code below to complete the verification:</p>
        <div style="background-color: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f172a; margin: 20px 0;">
          ${resetCode}
        </div>
        <p style="color: #64748b; font-size: 13px;">This verification code will expire in 10 minutes.</p>
      </div>
    `;

    if (this.transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM || `"Portl Support" <${process.env.SMTP_USER || 'sonukumarray1009@gmail.com'}>`;
        await this.transporter.sendMail({
          from: fromEmail,
          to: toEmail,
          subject,
          html,
        });
        logger.info(`📧 Password reset email sent via SMTP to: ${toEmail}`);
        return;
      } catch (err: any) {
        logger.error(`❌ Failed to send password reset email via SMTP to ${toEmail}: ${err.message || err}`);
      }
    }

    // Mock Console Output fallback
    console.log(`
========================================================================
📧 [PASSWORD RESET CODE SENT TO CONSOLE]
------------------------------------------------------------------------
To:          ${toEmail}
Reset Code:  ${resetCode}
========================================================================`);
  }

  async sendOnboardingApprovalEmail(toEmail: string, adminName: string, societyName: string) {
    const subject = `🏠 Portl: Your Society ${societyName} is Verified!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px;">
          <h1 style="color: #4f46e5; margin-top: 0;">Welcome to Portl</h1>
          <h2>Hello ${adminName},</h2>
          <p>Your society onboarding request for <strong>${societyName}</strong> has been successfully verified by the developer team!</p>
          <div style="background: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0;">
            <p><strong>🏘️ Society:</strong> ${societyName}</p>
            <p><strong>👤 Admin Email:</strong> ${toEmail}</p>
            <p><strong>🔒 Account Status:</strong> Active & Verified</p>
          </div>
          <p>Please open the Portl app and sign in to manage your society.</p>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM || `"Portl Admin" <${process.env.SMTP_USER || 'sonukumarray1009@gmail.com'}>`;
        await this.transporter.sendMail({
          from: fromEmail,
          to: toEmail,
          subject,
          html,
        });
        logger.info(`📧 Real verification email successfully sent to: ${toEmail}`);
        return;
      } catch (error: any) {
        logger.error(`❌ Failed to send real email to ${toEmail}: ${error.message || error}`);
      }
    }

    // Mock Console Output for local development
    console.log(`
========================================================================
📧 [ONBOARDING APPROVAL EMAIL SENT TO CONSOLE]
------------------------------------------------------------------------
To:          ${toEmail}
Admin Name:  ${adminName}
Society:     ${societyName}
Status:      Verified & Active
========================================================================`);
  }
}

export const emailService = new EmailService();
