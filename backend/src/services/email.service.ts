import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Only configure Nodemailer if SMTP details are provided in environment variables
    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for port 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      logger.info('📧 Mail Service: SMTP Transporter configured successfully.');
    } else {
      logger.info('📧 Mail Service: SMTP credentials not found. Falling back to console logging.');
    }
  }

  async sendOnboardingApprovalEmail(toEmail: string, adminName: string, societyName: string) {
    const subject = `🏠 Portl: Your Society ${societyName} is Verified!`;
    
    // HTML Email Template
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
            border: 1px solid #e2e8f0;
          }
          .header {
            background-color: #4f46e5;
            padding: 32px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 32px;
            line-height: 1.6;
          }
          .content h2 {
            font-size: 20px;
            color: #0f172a;
            margin-top: 0;
          }
          .highlight-box {
            background-color: #f1f5f9;
            border-left: 4px solid #4f46e5;
            padding: 16px;
            border-radius: 0 8px 8px 0;
            margin: 24px 0;
          }
          .highlight-box p {
            margin: 4px 0;
            font-size: 15px;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .btn {
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 16px;
            display: inline-block;
            box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
          }
          .footer {
            background-color: #f8fafc;
            padding: 24px;
            text-align: center;
            font-size: 13px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Portl</h1>
          </div>
          <div class="content">
            <h2>Hello ${adminName},</h2>
            <p>We are excited to inform you that your society onboarding request has been **successfully verified** by the developer team!</p>
            
            <div class="highlight-box">
              <p><strong>🏘️ Society Registered:</strong> ${societyName}</p>
              <p><strong>👤 Admin Username:</strong> ${toEmail}</p>
              <p><strong>🔒 Account Status:</strong> Active & Verified</p>
            </div>
            
            <p>Your Admin account is now active. You can log in using the mobile app and start managing your society (linking towers, registering flats, adding guards, and approving residents).</p>
            
            <div class="button-container">
              <span class="btn">Open App & Log In</span>
            </div>
            
            <p>If you have any questions or require setup assistance, please reply directly to this email.</p>
          </div>
          <div class="footer">
            <p>Portl Residency Management Solutions &copy; 2026. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    if (this.transporter) {
      try {
        const fromEmail = process.env.SMTP_FROM || '"Portl Admin" <noreply@portl.app>';
        await this.transporter.sendMail({
          from: fromEmail,
          to: toEmail,
          subject,
          html,
        });
        logger.info(`📧 Real verification email successfully sent to: ${toEmail}`);
      } catch (error: any) {
        logger.error(`❌ Failed to send real email to ${toEmail}: ${error.message || error}`);
      }
    } else {
      // Mock Console Output for local development
      console.log(`
========================================================================
📧 [MOCK EMAIL SENT]
------------------------------------------------------------------------
To:      ${toEmail}
Subject: ${subject}
------------------------------------------------------------------------
Hello ${adminName},

Congratulations! Your society onboarding request has been successfully
verified by the developer team!

🏘️ Society Registered: ${societyName}
👤 Admin Username:      ${toEmail}
🔒 Account Status:     Active & Verified

Please open the Portl mobile app, log in using your Admin email and password,
and start managing your society.

Cheers,
The Portl Team
========================================================================`);
    }
  }
}

export const emailService = new EmailService();
