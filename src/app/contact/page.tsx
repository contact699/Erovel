import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Contact &amp; Support</h1>
      <div className="text-sm text-muted space-y-6 leading-relaxed">
        <p>
          Erovel is operated by 17816600 Canada Inc. If you need assistance, have a question,
          or need to report an issue, we are here to help.
        </p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Business Information</h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-1 text-foreground">
            <p className="font-medium">Robert Chiarello</p>
            <p>17816600 Canada Inc.</p>
            <p>3534 Bank St</p>
            <p>Gloucester, ON K1T 3W3, Canada</p>
            <p>
              Email:{" "}
              <a href="mailto:contact@growyoursb.com" className="underline hover:no-underline">
                contact@growyoursb.com
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Support Email</h2>
          <p>
            For all inquiries, reach us at{" "}
            <a href="mailto:contact@growyoursb.com" className="text-foreground underline hover:no-underline">
              contact@growyoursb.com
            </a>.
            We aim to respond to all messages within 48 hours.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">How Can We Help?</h2>
          <p>We handle the following categories of inquiries:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <span className="font-medium text-foreground">General Inquiries</span> &mdash;
              Questions about Erovel, how the platform works, or general feedback.
            </li>
            <li>
              <span className="font-medium text-foreground">Billing &amp; Payment Issues</span> &mdash;
              Charges, refunds, subscription management, or payment method questions. See
              our{" "}
              <Link href="/refund" className="text-foreground underline hover:no-underline">
                Refund Policy
              </Link>{" "}
              for details.
            </li>
            <li>
              <span className="font-medium text-foreground">Content Reports</span> &mdash;
              Report content that violates our terms of service, community guidelines, or
              applicable law.
            </li>
            <li>
              <span className="font-medium text-foreground">DMCA Notices</span> &mdash;
              Copyright infringement claims and counter-notifications. See our{" "}
              <Link href="/dmca" className="text-foreground underline hover:no-underline">
                DMCA Policy
              </Link>{" "}
              for filing instructions.
            </li>
            <li>
              <span className="font-medium text-foreground">Creator Support</span> &mdash;
              Help with creator accounts, verification, payouts, or content management.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Response Time</h2>
          <p>
            We strive to respond to all inquiries within 48 hours. During periods of high
            volume, response times may be slightly longer. For urgent matters such as
            unauthorized account access, please indicate the urgency in your subject line.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Related Policies</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <Link href="/dmca" className="text-foreground underline hover:no-underline">
                DMCA Policy
              </Link>{" "}
              &mdash; Copyright infringement and takedown procedures.
            </li>
            <li>
              <Link href="/refund" className="text-foreground underline hover:no-underline">
                Refund &amp; Cancellation Policy
              </Link>{" "}
              &mdash; Refunds, cancellations, and billing disputes.
            </li>
            <li>
              <Link href="/terms" className="text-foreground underline hover:no-underline">
                Terms of Service
              </Link>{" "}
              &mdash; Platform usage terms and conditions.
            </li>
            <li>
              <Link href="/privacy" className="text-foreground underline hover:no-underline">
                Privacy Policy
              </Link>{" "}
              &mdash; How we handle your data.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
