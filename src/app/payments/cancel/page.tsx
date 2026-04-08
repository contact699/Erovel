import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
      <h1 className="text-2xl font-bold">Payment Canceled</h1>
      <p className="text-muted">
        Your payment was canceled. No charges were made.
      </p>
      <Link href="/" className="text-accent hover:underline">
        Back to Erovel
      </Link>
    </div>
  );
}
