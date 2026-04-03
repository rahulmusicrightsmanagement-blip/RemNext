const TENANT_ID = process.env.MS_TENANT_ID!;
const CLIENT_ID = process.env.MS_CLIENT_ID!;
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET!;
const SENDER_MAILBOX = process.env.MS_SENDER_MAILBOX!;
const SENDER_EMAIL = process.env.MS_SENDER_EMAIL!;

async function getAccessToken(): Promise<string> {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
  });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

async function sendMail(subject: string, to: string, html: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${SENDER_MAILBOX}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          from: { emailAddress: { address: SENDER_EMAIL } },
          body: { contentType: "HTML", content: html },
          toRecipients: [{ emailAddress: { address: to } }],
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to send email: ${err}`);
  }
}

export async function sendVerificationLinks(
  to: string,
  name: string,
  taskName: string,
  urls: string[]
): Promise<void> {
  const linkItems = urls
    .map(
      (url, i) =>
        `<a href="${url}" style="display:block;margin:10px 0;padding:12px 16px;background:#fff;border:1px solid #d8b4fe;border-radius:10px;color:#7c3aed;font-size:13px;text-decoration:none;word-break:break-all;">
          🔗 Link ${i + 1}: ${url}
        </a>`
    )
    .join("");

  const html = `
    <div style="font-family:'Poppins',Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9f6ff;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#c084fc,#a855f7);padding:32px 40px;text-align:center;">
        <h1 style="color:#fff;font-size:24px;margin:0;font-weight:700;">RemNxt</h1>
      </div>
      <div style="padding:36px 40px;">
        <h2 style="color:#1a1a2e;font-size:18px;margin:0 0 8px;">Verification Required</h2>
        <p style="color:#555;font-size:14px;margin:0 0 20px;">Hi ${name}, please complete the verification steps for your application to <strong>${taskName}</strong> by visiting the link(s) below:</p>
        <div style="margin-bottom:24px;">${linkItems}</div>
        <p style="color:#999;font-size:12px;margin:0;">If you have any questions, contact us at remnxthepl@gmail.com</p>
      </div>
      <div style="background:#f0e8ff;padding:16px 40px;text-align:center;">
        <p style="color:#aaa;font-size:11px;margin:0;">&copy; ${new Date().getFullYear()} RemNxt. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendMail(`Action Required: Verification Links for "${taskName}"`, to, html);
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const html = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f6ff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c084fc, #a855f7); padding: 32px 40px; text-align: center;">
        <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">RemNxt</h1>
      </div>
      <div style="padding: 36px 40px;">
        <h2 style="color: #1a1a2e; font-size: 20px; margin: 0 0 12px;">Reset Your Password</h2>
        <p style="color: #555; font-size: 14px; margin: 0 0 28px;">Hi ${name}, click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetUrl}" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#c084fc,#a855f7);color:#fff;border-radius:50px;font-size:15px;font-weight:600;text-decoration:none;margin-bottom:24px;">
          Reset Password
        </a>
        <p style="color: #999; font-size: 12px; margin: 0;">If you didn't request this, you can safely ignore this email. Your password will not change.</p>
      </div>
      <div style="background: #f0e8ff; padding: 16px 40px; text-align: center;">
        <p style="color: #aaa; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} RemNxt. All rights reserved.</p>
      </div>
    </div>
  `;
  await sendMail("Reset your RemNxt password", to, html);
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  const html = `
    <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #f9f6ff; border-radius: 16px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c084fc, #a855f7); padding: 32px 40px; text-align: center;">
        <h1 style="color: #fff; font-size: 24px; margin: 0; font-weight: 700;">RemNxt</h1>
      </div>
      <div style="padding: 36px 40px;">
        <h2 style="color: #1a1a2e; font-size: 20px; margin: 0 0 12px;">Verify your email</h2>
        <p style="color: #555; font-size: 14px; margin: 0 0 28px;">Hi ${name}, use the code below to complete your sign up. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #fff; border: 2px dashed #c084fc; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
          <span style="font-size: 40px; font-weight: 700; letter-spacing: 14px; color: #7c3aed;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 12px; margin: 0;">If you didn't create a RemNxt account, you can safely ignore this email.</p>
      </div>
      <div style="background: #f0e8ff; padding: 16px 40px; text-align: center;">
        <p style="color: #aaa; font-size: 11px; margin: 0;">&copy; ${new Date().getFullYear()} RemNxt. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendMail("Your RemNxt Email Verification Code", to, html);
}
