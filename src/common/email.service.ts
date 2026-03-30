import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true, // true for port 465
            auth: {
                user: process.env.SMTP_USER || 'noreply@teachmedrive.co.uk',
                pass: process.env.SMTP_PASS || '',
            },
        });
    }

    async sendPasswordReset(to: string, resetLink: string): Promise<void> {
        const from = process.env.SMTP_FROM || 'TeachMeDrive <noreply@teachmedrive.co.uk>';

        try {
            await this.transporter.sendMail({
                from,
                to,
                subject: 'Reset Your TeachMeDrive Password',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #6366f1;">Reset Your Password</h2>
                        <p>You requested a password reset for your TeachMeDrive account.</p>
                        <p>Click the button below to choose a new password:</p>
                        <a href="${resetLink}" 
                           style="display: inline-block; padding: 12px 32px; 
                                  background: #6366f1; color: white; text-decoration: none;
                                  border-radius: 8px; font-weight: bold; margin: 16px 0;">
                            Reset Password
                        </a>
                        <p style="color: #666; font-size: 14px;">
                            This link expires in 1 hour. If you didn't request this, ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                        <p style="color: #999; font-size: 12px;">
                            TeachMeDrive — UK Driving Instructor Marketplace
                        </p>
                    </div>
                `,
            });
            this.logger.log(`Password reset email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error}`);
            // Don't throw — we don't want to reveal whether the email exists
        }
    }
}
