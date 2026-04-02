export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="text-sm text-muted space-y-6 leading-relaxed">
        <p>Last updated: April 2, 2026</p>

        <section className="space-y-3">
          <p>
            This Privacy Policy describes how 17816600 Canada Inc., operating as Erovel (&quot;Erovel,&quot;
            &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), collects, uses, discloses, and protects your personal information
            when you access or use the Erovel website, mobile applications, or any related services
            (collectively, the &quot;Platform&quot;). By using the Platform, you consent to the practices
            described in this Privacy Policy.
          </p>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>

          <h3 className="text-base font-medium text-foreground">1.1 Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Email address</li>
            <li>Username and display name</li>
            <li>Password (stored in hashed form only)</li>
            <li>Date of birth (to verify age eligibility)</li>
            <li>Profile information you choose to provide (biography, avatar, links)</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">1.2 Creator Verification Information</h3>
          <p>If you register as a Creator, we additionally collect:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Legal name</li>
            <li>Government-issued photo identification (processed through our verification provider)</li>
            <li>Biometric data for identity verification (facial recognition, processed by Veriff)</li>
            <li>Address and country of residence</li>
            <li>Tax identification information (e.g., Social Insurance Number, SSN, or equivalent)</li>
            <li>Payout method details (Paxum account or cryptocurrency wallet address)</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">1.3 Payment Information</h3>
          <p>When you make purchases on the Platform, we collect:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Billing name and address</li>
            <li>Transaction history and purchase records</li>
            <li>Subscription details</li>
          </ul>
          <p>
            Full payment card numbers, CVVs, and bank account details are processed and stored
            exclusively by our third-party payment processors (CCBill and Segpay). Erovel does not
            have access to or store your full payment card information.
          </p>

          <h3 className="text-base font-medium text-foreground">1.4 Usage Information</h3>
          <p>We automatically collect information about your use of the Platform, including:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>IP address and approximate geolocation (country/region level)</li>
            <li>Browser type, version, and operating system</li>
            <li>Device type and screen resolution</li>
            <li>Pages visited, features used, and actions taken on the Platform</li>
            <li>Reading history and content interaction data (bookmarks, likes, comments)</li>
            <li>Referring URLs and exit pages</li>
            <li>Timestamps and session duration</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">1.5 Cookies and Similar Technologies</h3>
          <p>
            We use cookies and similar technologies to collect information. See Section 6 for
            details about our use of cookies.
          </p>
        </section>

        {/* 2. How We Use Your Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>

          <h3 className="text-base font-medium text-foreground">2.1 Service Operation</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>To create, maintain, and secure your account</li>
            <li>To process transactions, subscriptions, and payouts</li>
            <li>To deliver content and personalize your experience</li>
            <li>To provide customer support and respond to inquiries</li>
            <li>To verify Creator identities and age eligibility</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">2.2 Communication</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>To send transactional notifications (purchase confirmations, payout notices)</li>
            <li>To notify you of changes to our Terms of Service, Privacy Policy, or other policies</li>
            <li>To send service-related announcements and updates</li>
            <li>To send promotional communications (with your consent, and with opt-out available)</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">2.3 Analytics and Improvement</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>To analyze usage patterns and improve the Platform&apos;s features and performance</li>
            <li>To generate aggregated, anonymized statistics about Platform usage</li>
            <li>To conduct research and development for new features</li>
            <li>To provide Creators with anonymized analytics about their content performance</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">2.4 Safety and Moderation</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>To detect, investigate, and prevent fraud, abuse, and violations of our Terms</li>
            <li>To moderate content and enforce our content standards</li>
            <li>To protect the safety and security of our users and the Platform</li>
            <li>To comply with legal obligations, including law enforcement requests</li>
          </ul>
        </section>

        {/* 3. How We Share Your Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">3. How We Share Your Information</h2>
          <p>
            We do not sell your personal information to third parties. We share your information
            only in the following circumstances:
          </p>

          <h3 className="text-base font-medium text-foreground">3.1 Service Providers</h3>
          <p>We share information with the following categories of service providers who assist us in operating the Platform:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Payment Processors (CCBill, Segpay):</strong> To process subscriptions,
              purchases, and tips. They receive billing information necessary to complete transactions.
            </li>
            <li>
              <strong>Identity Verification (Veriff):</strong> To verify Creator identities and age.
              They receive government ID documents and biometric data for verification purposes only.
            </li>
            <li>
              <strong>Content Moderation (AWS Rekognition):</strong> To assist with automated
              detection of prohibited visual content. Visual content may be processed through
              Amazon Web Services for moderation purposes.
            </li>
            <li>
              <strong>Content Delivery Network (BunnyCDN):</strong> To deliver content efficiently
              to users worldwide. BunnyCDN processes requests that include IP addresses and device
              information for content delivery optimization.
            </li>
            <li>
              <strong>Payout Providers (Paxum):</strong> To process Creator earnings payouts. They
              receive payout method details and transaction amounts.
            </li>
          </ul>

          <h3 className="text-base font-medium text-foreground">3.2 Legal Requirements</h3>
          <p>We may disclose your information when required to do so by law, including:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>In response to a court order, subpoena, or other legal process</li>
            <li>To comply with applicable laws and regulations</li>
            <li>To cooperate with law enforcement investigations</li>
            <li>To protect the rights, property, or safety of Erovel, its users, or the public</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">3.3 Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, reorganization, or sale of all or a portion of
            our assets, your personal information may be transferred to the successor entity. We
            will notify you of any such transfer and any choices you may have regarding your
            information.
          </p>

          <h3 className="text-base font-medium text-foreground">3.4 With Your Consent</h3>
          <p>
            We may share your information with third parties when you have given us explicit consent
            to do so.
          </p>
        </section>

        {/* 4. Data Retention */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">4. Data Retention</h2>
          <p>We retain your personal information according to the following principles:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Active Accounts:</strong> Account data is retained for as long as your account
              remains active and for a reasonable period thereafter to allow for reactivation.
            </li>
            <li>
              <strong>Deleted Accounts:</strong> Upon account deletion request, we will delete or
              anonymize your personal information within thirty (30) days, except as noted below.
            </li>
            <li>
              <strong>Transaction Records:</strong> Financial transaction records are retained for a
              minimum of seven (7) years to comply with tax and accounting obligations.
            </li>
            <li>
              <strong>Legal Requirements:</strong> We may retain certain information as required by
              law, including records necessary for compliance with 18 U.S.C. 2257, tax regulations,
              and other legal obligations, even after account deletion.
            </li>
            <li>
              <strong>Content Moderation Records:</strong> Records of content removals and account
              actions taken for violations are retained indefinitely to enforce our repeat infringer
              policy and prevent circumvention of bans.
            </li>
            <li>
              <strong>Anonymized Data:</strong> Aggregated, anonymized data that cannot be used to
              identify you may be retained indefinitely for analytics and research purposes.
            </li>
          </ul>
        </section>

        {/* 5. Data Security */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction. These
            measures include:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Encryption of data in transit using TLS/SSL protocols</li>
            <li>Encryption of sensitive data at rest</li>
            <li>Hashing of passwords using industry-standard algorithms (bcrypt)</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls limiting employee access to personal information on a need-to-know basis</li>
            <li>Secure infrastructure hosted on reputable cloud providers with SOC 2 compliance</li>
            <li>Two-factor authentication available for all user accounts</li>
          </ul>
          <p>
            While we strive to protect your personal information, no method of transmission over
            the Internet or method of electronic storage is completely secure. We cannot guarantee
            absolute security of your data, and you use the Platform at your own risk.
          </p>
        </section>

        {/* 6. Cookies and Tracking */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">6. Cookies and Tracking Technologies</h2>
          <p>We use the following types of cookies and similar technologies:</p>

          <h3 className="text-base font-medium text-foreground">6.1 Essential Cookies</h3>
          <p>
            These cookies are strictly necessary for the operation of the Platform. They include
            session cookies for authentication, CSRF protection tokens, and cookies required to
            process transactions. These cookies cannot be disabled without impairing core Platform
            functionality.
          </p>

          <h3 className="text-base font-medium text-foreground">6.2 Analytics Cookies</h3>
          <p>
            We use analytics tools to understand how users interact with the Platform. These cookies
            collect information about page views, navigation patterns, and feature usage. Analytics
            data is aggregated and does not identify individual users. You may opt out of analytics
            cookies through your browser settings or our cookie preferences panel.
          </p>

          <h3 className="text-base font-medium text-foreground">6.3 Local Storage</h3>
          <p>
            We use browser local storage (localStorage) to store your reading preferences, theme
            settings, content display preferences, and reading progress. This data is stored locally
            on your device and is not transmitted to our servers unless you choose to sync your
            preferences across devices.
          </p>

          <h3 className="text-base font-medium text-foreground">6.4 Managing Cookies</h3>
          <p>
            Most web browsers allow you to manage cookies through browser settings. You can typically
            set your browser to refuse all cookies, accept only first-party cookies, or delete
            cookies when you close your browser. Note that disabling essential cookies may prevent
            you from using certain features of the Platform.
          </p>
        </section>

        {/* 7. Your Rights */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your personal
            information:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Right of Access:</strong> You may request a copy of the personal information
              we hold about you.
            </li>
            <li>
              <strong>Right of Correction:</strong> You may request that we correct any inaccurate
              or incomplete personal information.
            </li>
            <li>
              <strong>Right of Deletion:</strong> You may request that we delete your personal
              information, subject to legal retention requirements described in Section 4.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> You may request a copy of your personal
              information in a structured, commonly used, machine-readable format (e.g., JSON or CSV).
            </li>
            <li>
              <strong>Right to Withdraw Consent:</strong> Where processing is based on your consent,
              you may withdraw consent at any time without affecting the lawfulness of processing
              carried out prior to withdrawal.
            </li>
            <li>
              <strong>Right to Object:</strong> You may object to certain types of processing,
              including processing for direct marketing purposes.
            </li>
            <li>
              <strong>Right to Restrict Processing:</strong> You may request that we restrict the
              processing of your personal information in certain circumstances.
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at contact@growyoursb.com. We will
            respond to your request within thirty (30) days. We may request additional information
            to verify your identity before processing your request.
          </p>
        </section>

        {/* 8. PIPEDA Compliance (Canada) */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">8. PIPEDA Compliance (Canada)</h2>
          <p>
            As a Canadian company, Erovel complies with the Personal Information Protection and
            Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation. Under
            PIPEDA, we adhere to the following principles:
          </p>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Accountability:</strong> 17816600 Canada Inc. is responsible for personal
              information under its control. Our Privacy Officer is responsible for compliance with
              this policy.
            </li>
            <li>
              <strong>Identifying Purposes:</strong> We identify the purposes for which personal
              information is collected at or before the time of collection.
            </li>
            <li>
              <strong>Consent:</strong> We obtain meaningful consent for the collection, use, and
              disclosure of personal information, except where permitted by law.
            </li>
            <li>
              <strong>Limiting Collection:</strong> We limit the collection of personal information
              to what is necessary for the identified purposes.
            </li>
            <li>
              <strong>Limiting Use, Disclosure, and Retention:</strong> Personal information is used
              only for the purposes for which it was collected and is retained only as long as
              necessary to fulfill those purposes.
            </li>
            <li>
              <strong>Accuracy:</strong> We take reasonable steps to ensure that personal information
              is accurate, complete, and up to date.
            </li>
            <li>
              <strong>Safeguards:</strong> We protect personal information with security safeguards
              appropriate to the sensitivity of the information.
            </li>
            <li>
              <strong>Openness:</strong> This Privacy Policy makes our policies and practices
              regarding personal information publicly available.
            </li>
            <li>
              <strong>Individual Access:</strong> Upon request, we will inform you of the existence,
              use, and disclosure of your personal information and provide you with access to that
              information.
            </li>
            <li>
              <strong>Challenging Compliance:</strong> You may challenge our compliance with PIPEDA
              by contacting our Privacy Officer. If you are not satisfied with our response, you may
              file a complaint with the Office of the Privacy Commissioner of Canada.
            </li>
          </ul>
        </section>

        {/* 9. GDPR Considerations (EU Users) */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">9. GDPR Considerations (European Union Users)</h2>
          <p>
            If you are located in the European Economic Area (EEA), the United Kingdom, or
            Switzerland, the following additional provisions apply to you under the General Data
            Protection Regulation (GDPR) and equivalent legislation:
          </p>

          <h3 className="text-base font-medium text-foreground">9.1 Legal Bases for Processing</h3>
          <p>We process your personal data under the following legal bases:</p>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Contract Performance:</strong> Processing necessary to provide you with the services you have requested (account management, content delivery, payment processing).</li>
            <li><strong>Legitimate Interests:</strong> Processing necessary for our legitimate interests, such as fraud prevention, platform security, and service improvement, where these interests are not overridden by your rights.</li>
            <li><strong>Legal Obligation:</strong> Processing necessary to comply with applicable laws and regulations (tax compliance, record-keeping requirements).</li>
            <li><strong>Consent:</strong> Processing based on your freely given consent (marketing communications, analytics cookies).</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">9.2 Additional EU Rights</h3>
          <p>In addition to the rights listed in Section 7, EU users have the right to:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Lodge a complaint with a supervisory authority in the EU member state of your habitual residence or place of work.</li>
            <li>Object to automated decision-making, including profiling, that produces legal effects or similarly significant effects.</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">9.3 Data Protection Officer</h3>
          <p>
            For GDPR-related inquiries, you may contact us at contact@growyoursb.com with the
            subject line &quot;GDPR Request.&quot;
          </p>
        </section>

        {/* 10. CCPA Considerations (California Users) */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">10. CCPA Considerations (California Users)</h2>
          <p>
            If you are a California resident, the following additional provisions apply to you under
            the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):
          </p>

          <h3 className="text-base font-medium text-foreground">10.1 Categories of Information Collected</h3>
          <p>
            In the preceding twelve (12) months, we have collected the following categories of
            personal information as defined by the CCPA: identifiers (name, email, IP address);
            personal information categories listed in Cal. Civ. Code 1798.80(e) (name, address);
            internet or other electronic network activity information (browsing history, interactions
            with the Platform); geolocation data (approximate location from IP address); and
            biometric information (for Creator identity verification only).
          </p>

          <h3 className="text-base font-medium text-foreground">10.2 Your CCPA Rights</h3>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Right to Know:</strong> You may request that we disclose the categories and specific pieces of personal information we have collected about you.</li>
            <li><strong>Right to Delete:</strong> You may request deletion of your personal information, subject to legal exceptions.</li>
            <li><strong>Right to Opt-Out of Sale:</strong> We do not sell personal information. If this practice changes, we will provide a &quot;Do Not Sell My Personal Information&quot; link.</li>
            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.</li>
            <li><strong>Right to Correct:</strong> You may request correction of inaccurate personal information.</li>
          </ul>

          <h3 className="text-base font-medium text-foreground">10.3 Exercising CCPA Rights</h3>
          <p>
            To exercise your CCPA rights, contact us at contact@growyoursb.com or write to us at
            the address listed in Section 15. We will verify your identity before processing your
            request. You may also designate an authorized agent to make a request on your behalf.
          </p>
        </section>

        {/* 11. Children's Privacy */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">11. Children&apos;s Privacy</h2>
          <p>
            The Platform is not intended for use by individuals under the age of eighteen (18).
            We do not knowingly collect personal information from children under 18. In accordance
            with the Children&apos;s Online Privacy Protection Act (COPPA), the Platform does not target
            or knowingly collect information from children under the age of thirteen (13).
          </p>
          <p>
            If we become aware that we have collected personal information from a child under 18,
            we will take immediate steps to delete that information and terminate the associated
            account. If you believe that we have inadvertently collected personal information from
            a minor, please contact us immediately at contact@growyoursb.com.
          </p>
          <p>
            We implement age verification measures at registration to prevent underage access to the
            Platform. These measures include date of birth verification and, for Creators, government
            ID verification through our third-party verification provider.
          </p>
        </section>

        {/* 12. International Data Transfers */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">12. International Data Transfers</h2>
          <p>
            Erovel is operated from Canada. Your personal information may be transferred to, stored
            in, and processed in countries other than your country of residence, including Canada
            and the United States, where our servers and service providers are located.
          </p>
          <p>
            When transferring personal data from the EEA, UK, or Switzerland to countries that have
            not been deemed to provide an adequate level of data protection, we rely on the following
            transfer mechanisms:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Adequacy Decisions:</strong> Canada has been recognized by the European
              Commission as providing adequate data protection for commercial organizations subject
              to PIPEDA.
            </li>
            <li>
              <strong>Standard Contractual Clauses:</strong> For transfers to service providers in
              countries without adequacy decisions, we use EU Standard Contractual Clauses approved
              by the European Commission.
            </li>
            <li>
              <strong>Contractual Protections:</strong> All service providers are bound by data
              processing agreements that require them to protect personal information in accordance
              with applicable law.
            </li>
          </ul>
          <p>
            By using the Platform, you acknowledge that your personal information may be processed
            in jurisdictions where data protection laws may differ from those in your country of
            residence.
          </p>
        </section>

        {/* 13. Third-Party Links and Services */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">13. Third-Party Links and Services</h2>
          <p>
            The Platform may contain links to third-party websites or services that are not operated
            by Erovel. We are not responsible for the privacy practices of these third parties. We
            encourage you to review the privacy policies of any third-party websites or services
            that you visit. This Privacy Policy applies only to information collected through our
            Platform.
          </p>
        </section>

        {/* 14. Changes to This Privacy Policy */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">14. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices,
            technologies, legal requirements, or other factors. When we make material changes, we
            will:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Update the &quot;Last updated&quot; date at the top of this page.</li>
            <li>Post the revised Privacy Policy on the Platform.</li>
            <li>Notify registered users via email or a prominent notice on the Platform at least thirty (30) days before material changes take effect.</li>
          </ul>
          <p>
            Your continued use of the Platform after the effective date of any changes constitutes
            your acceptance of the updated Privacy Policy. If you do not agree with the changes,
            you must stop using the Platform and request deletion of your account.
          </p>
        </section>

        {/* 15. Contact Information */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">15. Contact Information</h2>
          <p>
            If you have any questions, concerns, or requests regarding this Privacy Policy or our
            data practices, please contact us at:
          </p>
          <div className="bg-surface border border-border rounded-xl p-5 space-y-1 text-foreground">
            <p className="font-medium">17816600 Canada Inc. — Privacy Office</p>
            <p>Attn: Robert Chiarello</p>
            <p>3534 Bank St</p>
            <p>Gloucester, ON K1T 3W3, Canada</p>
            <p>Email: contact@growyoursb.com</p>
          </div>
          <p>
            For PIPEDA complaints that are not resolved to your satisfaction, you may contact the
            Office of the Privacy Commissioner of Canada at{" "}
            <a href="https://www.priv.gc.ca" className="text-accent underline" target="_blank" rel="noopener noreferrer">
              www.priv.gc.ca
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
