export const sendEmailNotification = async (emailData: {
  email: string;
  recipient_name: string;
  subject: string;
  message: string;
}) => {
  // For static hosting, you'll need to call Mailjet API directly
  // or use a serverless function service like Vercel Functions, Netlify Functions, etc.

  try {
    const response = await fetch("https://api.mailjet.com/v3.1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(
          `${process.env.NEXT_PUBLIC_MJ_APIKEY_PUBLIC}:${process.env.NEXT_PUBLIC_MJ_APIKEY_PRIVATE}`
        )}`,
      },
      body: JSON.stringify({
        Messages: [
          {
            From: {
              Email: process.env.NEXT_PUBLIC_MJ_EMAIL_REGISTERED,
              Name: "Job Placement Tracking System",
            },
            To: [
              {
                Email: emailData.email,
                Name: emailData.recipient_name,
              },
            ],
            Subject: emailData.subject,
            TextPart: emailData.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
