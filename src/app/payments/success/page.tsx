"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <Suspense>
      <PaymentSuccessContent />
    </Suspense>
  );
}

function PaymentSuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("id");
  const [status, setStatus] = useState<string>("checking");

  useEffect(() => {
    if (!orderId) return;
    const supabase = createClient();
    if (!supabase) return;

    async function check() {
      const { data } = await supabase!
        .from("pending_crypto_payments")
        .select("status")
        .eq("order_id", orderId)
        .single();
      if (data) setStatus(data.status as string);
    }

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="text-2xl font-bold">Payment Received</h1>
      <p className="text-muted">
        Thanks for your tip! Your payment is being processed.
      </p>
      <p className="text-sm text-muted">Status: {status}</p>
      <p className="text-xs text-muted">
        Crypto payments can take a few minutes to confirm on the blockchain.
        You can safely close this page — the tip will be credited automatically.
      </p>
      <Link href="/" className="text-accent hover:underline">
        Back to Erovel
      </Link>
    </div>
  );
}
