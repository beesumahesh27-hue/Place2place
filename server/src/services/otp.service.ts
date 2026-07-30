import { prisma } from "../config/database";
import { env } from "../config/env";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createAndSendOtp(
  contact: string,
  type: "phone" | "email"
): Promise<{ devOtp?: string }> {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRES_MINUTES * 60_000);

  // Expire any active OTPs for this contact before creating a new one
  await prisma.otpToken.updateMany({
    where: { contact, used: false },
    data: { used: true },
  });

  await prisma.otpToken.create({ data: { contact, otp, expiresAt } });

  if (type === "phone") {
    if (env.isDev && !env.FAST2SMS_API_KEY) return { devOtp: otp };
    await sendSms(contact, otp);
  } else {
    if (env.isDev && !env.BREVO_API_KEY) return { devOtp: otp };
    await sendEmail(contact, otp);
  }

  return {};
}

export async function verifyOtp(contact: string, otp: string): Promise<boolean> {
  const record = await prisma.otpToken.findFirst({
    where: { contact, otp, used: false, expiresAt: { gt: new Date() } },
  });
  if (!record) return false;
  await prisma.otpToken.update({ where: { id: record.id }, data: { used: true } });
  return true;
}

async function sendSms(mobile: string, otp: string): Promise<void> {
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: { authorization: env.FAST2SMS_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify({ route: "otp", variables_values: otp, numbers: mobile }),
  });
  const data = (await res.json()) as { return: boolean; message?: string };
  if (!data.return) throw new Error(data.message ?? "Fast2SMS: failed to send");
}

async function sendEmail(email: string, otp: string): Promise<void> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": env.BREVO_API_KEY!, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: env.BREVO_SENDER_NAME, email: env.BREVO_SENDER_EMAIL },
      to: [{ email }],
      subject: "Your Place2Place OTP",
      htmlContent: `
        <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #ede8df;border-radius:16px">
          <h2 style="color:#1c3a2a">Your OTP</h2>
          <p style="color:#555">Use the code below to sign in. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>
          <div style="background:#f8f4ed;border-radius:12px;padding:20px;text-align:center">
            <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1c3a2a">${otp}</span>
          </div>
          <p style="color:#aaa;font-size:12px;margin-top:20px">Do not share this OTP with anyone.</p>
        </div>
      `,
    }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Brevo: failed to send email");
  }
}
