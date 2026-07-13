import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { generateOtp, saveOtp } from "@/lib/otp-store";

// ── SMS via Fast2SMS (India) ────────────────────────────────────────────────
async function sendSms(mobile: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error("FAST2SMS_API_KEY not configured");

  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "otp",
      variables_values: otp,
      numbers: mobile,
    }),
  });

  const data = await res.json();
  if (!data.return) {
    throw new Error(data.message ?? "Fast2SMS: failed to send");
  }
}

// ── Email via Nodemailer (Gmail App Password) ──────────────────────────────
async function sendEmail(email: string, otp: string): Promise<void> {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) throw new Error("EMAIL_USER / EMAIL_PASS not configured");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Place2Place" <${user}>`,
    to: email,
    subject: "Your Place2Place OTP",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:24px;border:1px solid #ede8df;border-radius:16px">
        <h2 style="color:#1c3a2a;margin-bottom:8px">Your OTP</h2>
        <p style="color:#555;margin-bottom:20px">Use the code below to sign in to Place2Place. It expires in 5 minutes.</p>
        <div style="background:#f8f4ed;border-radius:12px;padding:20px;text-align:center">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1c3a2a">${otp}</span>
        </div>
        <p style="color:#aaa;font-size:12px;margin-top:20px">Do not share this OTP with anyone.</p>
      </div>
    `,
  });
}

// ── Route handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { contact, type } = (await req.json()) as { contact: string; type: "phone" | "email" };

    if (!contact || !type) {
      return NextResponse.json({ error: "contact and type are required" }, { status: 400 });
    }

    const otp = generateOtp();
    saveOtp(contact, otp);

    const isDev = process.env.NODE_ENV === "development";

    if (type === "phone") {
      if (isDev && !process.env.FAST2SMS_API_KEY) {
        // Dev fallback: return OTP in response so you can test without a key
        console.log(`[DEV] OTP for ${contact}: ${otp}`);
        return NextResponse.json({ success: true, devOtp: otp });
      }
      await sendSms(contact, otp);
    } else {
      if (isDev && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
        console.log(`[DEV] OTP for ${contact}: ${otp}`);
        return NextResponse.json({ success: true, devOtp: otp });
      }
      await sendEmail(contact, otp);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send OTP";
    console.error("[send-otp]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
