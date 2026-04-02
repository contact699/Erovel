export default function DMCAPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">DMCA Policy</h1>
      <div className="text-sm text-muted space-y-6 leading-relaxed">
        <p>Last updated: April 2, 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Copyright Infringement Notice</h2>
          <p>
            Erovel (&quot;17816600 Canada Inc.&quot;) respects intellectual property rights and complies with
            the Digital Millennium Copyright Act (DMCA). If you believe that content hosted on our
            platform infringes your copyright, you may submit a takedown notice to our designated agent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Designated DMCA Agent</h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-1 text-foreground">
            <p className="font-medium">Robert Chiarello</p>
            <p>17816600 Canada Inc.</p>
            <p>3534 Bank St</p>
            <p>Gloucester, ON K1T 3W3, Canada</p>
            <p>Email: contact@growyoursb.com</p>
            <p className="text-xs text-muted mt-2">DMCA Registration No. DMCA-1071086</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Filing a DMCA Notice</h2>
          <p>To file a valid DMCA takedown notice, please provide the following information in writing:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>A physical or electronic signature of the copyright owner or authorized agent.</li>
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Identification of the material that is claimed to be infringing, with enough detail
              to allow us to locate the material (e.g., the URL of the page).</li>
            <li>Your contact information, including name, address, telephone number, and email.</li>
            <li>A statement that you have a good faith belief that the use of the material is not
              authorized by the copyright owner, its agent, or the law.</li>
            <li>A statement, made under penalty of perjury, that the information in your notice is
              accurate and that you are the copyright owner or authorized to act on behalf of the owner.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Counter-Notification</h2>
          <p>
            If you believe your content was removed in error, you may file a counter-notification
            with the same designated agent. The counter-notification must include:
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Your physical or electronic signature.</li>
            <li>Identification of the material that was removed and where it appeared.</li>
            <li>A statement under penalty of perjury that you have a good faith belief the material
              was removed by mistake or misidentification.</li>
            <li>Your name, address, telephone number, and a statement consenting to jurisdiction of
              the federal court in your district.</li>
          </ol>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Repeat Infringers</h2>
          <p>
            In accordance with the DMCA, Erovel will terminate the accounts of users who are
            determined to be repeat infringers. We reserve the right to remove any content and
            terminate any account at our discretion.
          </p>
        </section>
      </div>
    </div>
  );
}
