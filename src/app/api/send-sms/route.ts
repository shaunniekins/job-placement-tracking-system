import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  const { phone, message } = await req.json();

  if (!phone || !message) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = twilio(accountSid, authToken);

  try {
    const result = await client.messages.create({
      body: message,
      from: "JPTS",
      to: phone,
    });

    return NextResponse.json({
      message: "Message sent successfully!",
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to send message",
        error: message,
      },
      { status: 500 }
    );
  }
}
