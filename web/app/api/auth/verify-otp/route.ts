import { NextRequest, NextResponse } from "next/server";
import { verifyAndConsumeOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  try {
    const { contact, otp } = (await req.json()) as { contact: string; otp: string };

    if (!contact || !otp) {
      return NextResponse.json({ error: "contact and otp are required" }, { status: 400 });
    }

    const result = verifyAndConsumeOtp(contact, otp);

    if (result === "ok") {
      return NextResponse.json({ success: true });
    }
    if (result === "expired") {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }
    return NextResponse.json({ error: "Incorrect OTP. Please try again." }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Verification failed";
    console.error("[verify-otp]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
