import { createClient } from '@supabase/supabase-js'

// Supabase client untuk email service
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface InvitationEmailData {
  email: string
  token: string
  role: string
  inviterName: string
  inviterEmail: string
  expiresAt: string
}

/**
 * Service untuk mengirim email undangan
 */
export class EmailService {
  private static instance: EmailService
  private baseUrl: string

  private constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Kirim email undangan ke user baru
   */
  async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    try {
      const invitationUrl = `${this.baseUrl}/auth/accept-invitation?token=${data.token}`
      
      const emailTemplate = this.generateInvitationEmailTemplate({
        ...data,
        invitationUrl
      })

      // Gunakan Supabase Edge Functions untuk mengirim email
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.email,
          subject: `You're invited to join ${process.env.NEXT_PUBLIC_APP_NAME || 'AI CMS'}`,
          html: emailTemplate.html,
          text: emailTemplate.text
        }
      })

      if (error) {
        console.error('Error sending invitation email:', error)
        return false
      }

      console.log('Invitation email sent successfully:', result)
      return true

    } catch (error) {
      console.error('Unexpected error sending invitation email:', error)
      return false
    }
  }

  /**
   * Generate HTML template untuk email undangan
   */
  private generateInvitationEmailTemplate(data: InvitationEmailData & { invitationUrl: string }) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation to Join AI CMS</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .invitation-details {
            background-color: #f8fafc;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .detail-label {
            font-weight: 600;
            color: #4b5563;
          }
          .detail-value {
            color: #1f2937;
          }
          .cta-button {
            display: inline-block;
            background-color: #6366f1;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #4f46e5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AI CMS</div>
            <h1 class="title">You're Invited!</h1>
          </div>
          
          <div class="content">
            <p>Hello!</p>
            <p><strong>${data.inviterName}</strong> (${data.inviterEmail}) has invited you to join our AI CMS platform.</p>
            
            <div class="invitation-details">
              <div class="detail-row">
                <span class="detail-label">Your Role:</span>
                <span class="detail-value">${this.getRoleDisplayName(data.role)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Invited By:</span>
                <span class="detail-value">${data.inviterName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Expires:</span>
                <span class="detail-value">${new Date(data.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="${data.invitationUrl}" class="cta-button">Accept Invitation</a>
            </div>
            
            <div class="warning">
              <strong>Important:</strong> This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}. 
              Please accept it before then to join the team.
            </div>
            
            <p>If you have any questions, please contact ${data.inviterName} at ${data.inviterEmail}.</p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${data.inviterName} from AI CMS.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
You're Invited to Join AI CMS!

Hello!

${data.inviterName} (${data.inviterEmail}) has invited you to join our AI CMS platform.

Invitation Details:
- Your Role: ${this.getRoleDisplayName(data.role)}
- Invited By: ${data.inviterName}
- Expires: ${new Date(data.expiresAt).toLocaleDateString()}

To accept this invitation, click the link below:
${data.invitationUrl}

Important: This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}. 
Please accept it before then to join the team.

If you have any questions, please contact ${data.inviterName} at ${data.inviterEmail}.

This invitation was sent by ${data.inviterName} from AI CMS.
If you didn't expect this invitation, you can safely ignore this email.
    `

    return { html, text }
  }

  /**
   * Get display name untuk role
   */
  private getRoleDisplayName(role: string): string {
    switch (role) {
      case 'super_admin': return 'Super Admin'
      case 'admin': return 'Admin'
      case 'editor': return 'Editor'
      case 'author': return 'Author'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }

  /**
   * Kirim email welcome setelah user accept invitation
   */
  async sendWelcomeEmail(email: string, displayName: string, role: string): Promise<boolean> {
    try {
      const welcomeUrl = `${this.baseUrl}/dashboard`
      
      const emailTemplate = this.generateWelcomeEmailTemplate({
        email,
        displayName,
        role,
        welcomeUrl
      })

      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: `Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || 'AI CMS'}!`,
          html: emailTemplate.html,
          text: emailTemplate.text
        }
      })

      if (error) {
        console.error('Error sending welcome email:', error)
        return false
      }

      console.log('Welcome email sent successfully:', result)
      return true

    } catch (error) {
      console.error('Unexpected error sending welcome email:', error)
      return false
    }
  }

  /**
   * Generate HTML template untuk welcome email
   */
  private generateWelcomeEmailTemplate(data: {
    email: string
    displayName: string
    role: string
    welcomeUrl: string
  }) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI CMS</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .cta-button {
            display: inline-block;
            background-color: #6366f1;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #4f46e5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">AI CMS</div>
            <h1 class="title">Welcome to AI CMS!</h1>
          </div>
          
          <div class="content">
            <p>Hello ${data.displayName}!</p>
            <p>Welcome to AI CMS! Your account has been successfully created and you're ready to start managing content.</p>
            
            <p><strong>Your Role:</strong> ${this.getRoleDisplayName(data.role)}</p>
            
            <div style="text-align: center;">
              <a href="${data.welcomeUrl}" class="cta-button">Go to Dashboard</a>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>Create and manage content</li>
              <li>Upload media files</li>
              <li>Generate API keys for external access</li>
              <li>And much more!</li>
            </ul>
            
            <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
          </div>
          
          <div class="footer">
            <p>Welcome to AI CMS!</p>
            <p>This email was sent to ${data.email}</p>
          </div>
        </div>
      </body>
      </html>
    `

    const text = `
Welcome to AI CMS!

Hello ${data.displayName}!

Welcome to AI CMS! Your account has been successfully created and you're ready to start managing content.

Your Role: ${this.getRoleDisplayName(data.role)}

To get started, visit your dashboard:
${data.welcomeUrl}

You can now:
- Create and manage content
- Upload media files
- Generate API keys for external access
- And much more!

If you have any questions or need help getting started, don't hesitate to reach out to our support team.

Welcome to AI CMS!
This email was sent to ${data.email}
    `

    return { html, text }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()
