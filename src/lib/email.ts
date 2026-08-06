import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendInvitationEmail(
  email: string,
  workspaceName: string,
  inviterName: string,
  inviteUrl: string,
  role: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">ToneCraft</h1>
      </div>
      <div style="background: #f9fafb; padding: 40px 20px; border-radius: 0 0 12px 12px;">
        <p style="font-size: 18px; margin-bottom: 24px;">Hi there,</p>
        <p style="margin-bottom: 16px;">
          <strong>${inviterName}</strong> invited you to join the <strong>${workspaceName}</strong> workspace on ToneCraft.
        </p>
        <p style="margin-bottom: 24px;">You'll have <strong>${role}</strong> access to collaborate on projects, chats, and more.</p>
        <a href="${inviteUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
          Accept Invitation
        </a>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
          Or copy this link: <a href="${inviteUrl}" style="color: #6366f1; word-break: break-all;">${inviteUrl}</a>
        </p>
        <p style="font-size: 12px; color: #9ca3af;">
          This invitation expires in 7 days. If you didn't expect this, you can safely ignore this email.
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        &copy; ${new Date().getFullYear()} ToneCraft. All rights reserved.
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || "ToneCraft <noreply@tonecraft.app>",
    to: email,
    subject: `You're invited to ${workspaceName} on ToneCraft`,
    html,
  });
}

export async function sendInvitationAcceptedEmail(
  email: string,
  workspaceName: string
) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || "ToneCraft <noreply@tonecraft.app>",
    to: email,
    subject: `You've joined ${workspaceName} on ToneCraft`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6366f1;">Welcome to ${workspaceName}!</h1>
        <p>You've successfully accepted the invitation to join this workspace.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/p/${workspaceName}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Go to Workspace
        </a>
      </div>
    `,
  });
}