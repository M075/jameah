import { BrevoClient } from "@getbrevo/brevo";

const apiKey = process.env.BREVO_API_KEY;
const sender = parseSender(
  process.env.EMAIL_FROM ?? "Jameah Mahmoodiyah <noreply@jameah.edu>",
);

/**
 * Parse a sender string that may be either a bare email
 * (`noreply@jameah.edu`) or the "Name <email>" form. Brevo's API wants the
 * sender split into `{ name, email }`.
 */
function parseSender(from: string): { name: string; email: string } {
  const match = from.match(/^(.*?)\s*<(.+?)>$/);
  if (match && match[2]) {
    return { name: match[1].trim() || "Jameah Mahmoodiyah", email: match[2].trim() };
  }
  return { name: "Jameah Mahmoodiyah", email: from.trim() };
}

export interface LoginEmailInput {
  to: string;
  name: string;
  url: string;
}

function loginEmailHtml(name: string, url: string): string {
  const who = name ? name : "there";
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
      <h2 style="color:#064e3b;margin:0 0 8px;">Jameah Mahmoodiyah</h2>
      <p style="color:#374151;font-size:15px;">Assalamu alaikum ${who},</p>
      <p style="color:#374151;font-size:15px;line-height:1.5;">
        Click the button below to sign in to your report account. This link is
        private and will expire in 15 minutes.
      </p>
      <p style="margin:24px 0;">
        <a href="${url}"
           style="background:#047857;color:#ffffff;text-decoration:none;
                  padding:12px 24px;border-radius:8px;font-size:15px;font-weight:600;
                  display:inline-block;">
          Sign in to my account
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;line-height:1.5;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <span style="color:#047857;word-break:break-all;">${url}</span>
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px;">
        If you didn't request this email you can safely ignore it.
      </p>
    </div>
  </body>
</html>`;
}

function loginEmailText(name: string, url: string): string {
  const who = name ? name : "there";
  return `Assalamu alaikum ${who},\n\nSign in to your Jameah Mahmoodiyah account using this link (expires in 15 minutes):\n${url}\n\nIf you didn't request this, you can ignore the email.`;
}

/**
 * Send the passwordless sign-in email via Brevo's transactional API.
 * When BREVO_API_KEY is not configured (local dev), the link is logged to the
 * server console instead so the flow can still be tested.
 */
export async function sendLoginEmail({ to, name, url }: LoginEmailInput): Promise<void> {
  if (!apiKey) {
    console.log(`[magic-link] (dev) sign-in link for ${to}: ${url}`);
    return;
  }

  const client = new BrevoClient({ apiKey });

  await client.transactionalEmails.sendTransacEmail({
    sender,
    to: [{ email: to, name: name || undefined }],
    subject: "Your Jameah Mahmoodiyah sign-in link",
    htmlContent: loginEmailHtml(name, url),
    textContent: loginEmailText(name, url),
  });
}
