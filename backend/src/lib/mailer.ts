import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

  await transporter.sendMail({
    from: `"RemNxt" <${process.env.SMTP_USER}>`,
    to,
    subject: `Action Required: Verification Links for "${taskName}"`,
    html: `
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
    `,
  });
}

export async function sendOtpEmail(to: string, name: string, otp: string): Promise<void> {
  await transporter.sendMail({
    from: `"RemNxt" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your RemNxt Email Verification Code",
    html: `
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
    `,
  });
}
