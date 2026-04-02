export default function CompliancePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">18 U.S.C. 2257 Compliance Statement</h1>
      <div className="text-sm text-muted space-y-6 leading-relaxed">
        <p>Last updated: April 2, 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Custodian of Records</h2>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-1 text-foreground">
            <p className="font-medium">Robert Chiarello</p>
            <p>17816600 Canada Inc.</p>
            <p>3534 Bank St</p>
            <p>Gloucester, ON K1T 3W3, Canada</p>
            <p>Email: contact@growyoursb.com</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">User-Generated Content</h2>
          <p>
            All visual content appearing on Erovel is user-generated. Erovel, operated by
            17816600 Canada Inc., does not produce any of the visual content hosted on the
            platform. Creators are the primary producers of all content they upload and are
            solely responsible for maintaining their own records as required by 18 U.S.C. 2257
            and 28 C.F.R. 75.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Identity Verification</h2>
          <p>
            All creators are required to verify their identity through Veriff, a third-party
            identity verification service, before they are permitted to publish any content on
            the platform. As part of this verification process, creators certify that all
            individuals depicted in their content are over 18 years of age.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Record-Keeping</h2>
          <p>
            Records required pursuant to 18 U.S.C. 2257 and 28 C.F.R. 75 are maintained by the
            custodian of records identified above. The platform maintains verification records
            for all creators who publish content on Erovel, including proof of identity
            verification and age certification.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Primary Producer Responsibility</h2>
          <p>
            Erovel is not the primary producer of any visual content hosted on the platform.
            Creators who upload content are the primary producers and bear full responsibility
            for compliance with 18 U.S.C. 2257, including the obligation to maintain their own
            records verifying the age and identity of all individuals depicted in their content.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Exemption Statement</h2>
          <p>
            Erovel qualifies for the exemption under 28 C.F.R. 75.1(c)(4) as it does not
            produce the content hosted on the platform. The platform operates solely as a
            hosting service for user-generated content and does not direct, create, or otherwise
            participate in the production of any visual depictions hosted on the service.
          </p>
        </section>
      </div>
    </div>
  );
}
