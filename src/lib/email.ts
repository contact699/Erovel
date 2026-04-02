const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Erovel <noreply@erovel.com>";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[Email] Would send to ${to}: ${subject} (RESEND_API_KEY not configured)`);
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!response.ok) {
      console.error("[Email] Send failed:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("[Email] Send error:", error);
    return false;
  }
}
