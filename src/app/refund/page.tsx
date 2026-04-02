export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Refund &amp; Cancellation Policy</h1>
      <div className="text-sm text-muted space-y-6 leading-relaxed">
        <p>Last updated: April 2, 2026</p>

        <p>
          Erovel is operated by 17816600 Canada Inc. (Robert Chiarello, 3534 Bank St,
          Gloucester, ON K1T 3W3, Canada). This policy outlines our refund and cancellation
          terms for all purchases made on the platform.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Digital Goods (Non-Refundable)</h2>
          <p>
            Tips and one-time story purchases are non-refundable. These are digital goods that
            are delivered immediately upon purchase. By completing a purchase, you acknowledge
            that the digital content is made available to you instantly and that you waive any
            right of withdrawal or refund for these transactions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Subscriptions</h2>
          <p>
            You may cancel your subscription at any time. Upon cancellation, you will retain
            access to the subscribed content until the end of your current billing period. No
            prorated refunds are issued for the remaining time in a billing cycle.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">How to Cancel</h2>
          <p>You can cancel your subscription in two ways:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Through your account settings under the &quot;Subscriptions&quot; section.</li>
            <li>By contacting our support team at{" "}
              <a href="mailto:contact@growyoursb.com" className="text-foreground underline hover:no-underline">
                contact@growyoursb.com
              </a>.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Billing Errors</h2>
          <p>
            If you believe you have been charged incorrectly, please contact our support team
            within 30 days of the charge at{" "}
            <a href="mailto:contact@growyoursb.com" className="text-foreground underline hover:no-underline">
              contact@growyoursb.com
            </a>.
            We will review the charge and, if a billing error is confirmed, issue a refund
            accordingly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Refund Exceptions</h2>
          <p>Refunds may be issued in the following circumstances:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Confirmed billing errors (e.g., incorrect amount charged).</li>
            <li>Duplicate charges for the same transaction.</li>
            <li>Unauthorized transactions (charges made without your consent).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Processing Time</h2>
          <p>
            Approved refunds are processed within 5&ndash;10 business days. The time it takes for
            the refund to appear on your statement may vary depending on your payment provider.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Chargebacks</h2>
          <p>
            We encourage you to contact our support team before initiating a dispute or
            chargeback with your bank or payment provider. We are committed to resolving billing
            issues promptly and fairly. Filing a fraudulent chargeback (i.e., disputing a
            legitimate charge) may result in the termination of your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Contact for Billing Issues</h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-1 text-foreground">
            <p className="font-medium">17816600 Canada Inc.</p>
            <p>3534 Bank St, Gloucester, ON K1T 3W3, Canada</p>
            <p>
              Email:{" "}
              <a href="mailto:contact@growyoursb.com" className="underline hover:no-underline">
                contact@growyoursb.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
