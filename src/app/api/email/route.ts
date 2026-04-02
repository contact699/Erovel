import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

/**
 * Internal API for sending notification emails.
 * Called by other API routes/webhooks, not directly by clients.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is an internal call (check for a secret or auth)
    const authHeader = request.headers.get("authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
      // Also allow authenticated users to trigger their own emails
      const supabase = await createServerSupabaseClient();
      if (!supabase) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const success = await sendEmail({ to, subject, html });

    return NextResponse.json({ sent: success });
  } catch (err) {
    console.error("Email API error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
