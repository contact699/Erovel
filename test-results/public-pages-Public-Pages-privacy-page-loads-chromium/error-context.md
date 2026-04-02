# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> privacy page loads
- Location: e2e\public-pages.spec.ts:51:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Privacy Policy')
Expected: visible
Error: strict mode violation: getByText('Privacy Policy') resolved to 11 elements:
    1) <h1 class="text-3xl font-bold mb-6">Privacy Policy</h1> aka getByRole('heading', { name: 'Privacy Policy', exact: true })
    2) <p>This Privacy Policy describes how 17816600 Canada…</p> aka getByText('This Privacy Policy describes')
    3) <li>To notify you of changes to our Terms of Service,…</li> aka getByText('To notify you of changes to')
    4) <li>…</li> aka getByText('Openness: This Privacy Policy')
    5) <p>The Platform may contain links to third-party web…</p> aka getByText('The Platform may contain')
    6) <h2 class="text-lg font-semibold text-foreground">14. Changes to This Privacy Policy</h2> aka getByRole('heading', { name: 'Changes to This Privacy Policy' })
    7) <p>We may update this Privacy Policy from time to ti…</p> aka getByText('We may update this Privacy')
    8) <li>Post the revised Privacy Policy on the Platform.</li> aka getByText('Post the revised Privacy')
    9) <p>Your continued use of the Platform after the effe…</p> aka getByText('Your continued use of the')
    10) <p>If you have any questions, concerns, or requests …</p> aka getByText('If you have any questions,')
    ...

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Privacy Policy')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img [ref=e6]
        - generic [ref=e8]: Erovel
      - generic [ref=e9]:
        - heading "Age Verification Required" [level=1] [ref=e10]
        - paragraph [ref=e11]: This website contains adult content. You must be 18 years or older to enter.
      - generic [ref=e12]:
        - paragraph [ref=e13]: Enter your date of birth
        - generic [ref=e14]:
          - textbox "MM" [ref=e15]
          - textbox "DD" [ref=e16]
          - textbox "YYYY" [ref=e17]
        - button "Enter" [ref=e18] [cursor=pointer]
      - paragraph [ref=e19]:
        - text: By entering, you confirm you are 18+ and agree to our
        - link "Terms of Service" [ref=e20] [cursor=pointer]:
          - /url: /terms
        - text: .
    - banner [ref=e21]:
      - generic [ref=e22]:
        - link "Erovel" [ref=e23] [cursor=pointer]:
          - /url: /
          - img [ref=e24]
          - generic [ref=e26]: Erovel
        - navigation [ref=e27]:
          - link "Browse" [ref=e28] [cursor=pointer]:
            - /url: /browse
          - link "Romance" [ref=e29] [cursor=pointer]:
            - /url: /browse/romance
          - link "Fantasy" [ref=e30] [cursor=pointer]:
            - /url: /browse/fantasy
          - link "Chat Stories" [ref=e31] [cursor=pointer]:
            - /url: /browse?format=chat
        - generic [ref=e32]:
          - button [ref=e33] [cursor=pointer]:
            - img [ref=e34]
          - button [ref=e37] [cursor=pointer]:
            - img [ref=e38]
          - generic [ref=e44]:
            - link "Log in" [ref=e45] [cursor=pointer]:
              - /url: /login
              - button "Log in" [ref=e46]
            - link "Sign up" [ref=e47] [cursor=pointer]:
              - /url: /signup
              - button "Sign up" [ref=e48]
    - main [ref=e49]:
      - generic [ref=e50]:
        - heading "Privacy Policy" [level=1] [ref=e51]
        - generic [ref=e52]:
          - paragraph [ref=e53]: "Last updated: April 2, 2026"
          - paragraph [ref=e55]: This Privacy Policy describes how 17816600 Canada Inc., operating as Erovel ("Erovel," "we," "us," or "our"), collects, uses, discloses, and protects your personal information when you access or use the Erovel website, mobile applications, or any related services (collectively, the "Platform"). By using the Platform, you consent to the practices described in this Privacy Policy.
          - generic [ref=e56]:
            - heading "1. Information We Collect" [level=2] [ref=e57]
            - heading "1.1 Account Information" [level=3] [ref=e58]
            - paragraph [ref=e59]: "When you create an account, we collect:"
            - list [ref=e60]:
              - listitem [ref=e61]: Email address
              - listitem [ref=e62]: Username and display name
              - listitem [ref=e63]: Password (stored in hashed form only)
              - listitem [ref=e64]: Date of birth (to verify age eligibility)
              - listitem [ref=e65]: Profile information you choose to provide (biography, avatar, links)
            - heading "1.2 Creator Verification Information" [level=3] [ref=e66]
            - paragraph [ref=e67]: "If you register as a Creator, we additionally collect:"
            - list [ref=e68]:
              - listitem [ref=e69]: Legal name
              - listitem [ref=e70]: Government-issued photo identification (processed through our verification provider)
              - listitem [ref=e71]: Biometric data for identity verification (facial recognition, processed by Veriff)
              - listitem [ref=e72]: Address and country of residence
              - listitem [ref=e73]: Tax identification information (e.g., Social Insurance Number, SSN, or equivalent)
              - listitem [ref=e74]: Payout method details (Paxum account or cryptocurrency wallet address)
            - heading "1.3 Payment Information" [level=3] [ref=e75]
            - paragraph [ref=e76]: "When you make purchases on the Platform, we collect:"
            - list [ref=e77]:
              - listitem [ref=e78]: Billing name and address
              - listitem [ref=e79]: Transaction history and purchase records
              - listitem [ref=e80]: Subscription details
            - paragraph [ref=e81]: Full payment card numbers, CVVs, and bank account details are processed and stored exclusively by our third-party payment processors (CCBill and Segpay). Erovel does not have access to or store your full payment card information.
            - heading "1.4 Usage Information" [level=3] [ref=e82]
            - paragraph [ref=e83]: "We automatically collect information about your use of the Platform, including:"
            - list [ref=e84]:
              - listitem [ref=e85]: IP address and approximate geolocation (country/region level)
              - listitem [ref=e86]: Browser type, version, and operating system
              - listitem [ref=e87]: Device type and screen resolution
              - listitem [ref=e88]: Pages visited, features used, and actions taken on the Platform
              - listitem [ref=e89]: Reading history and content interaction data (bookmarks, likes, comments)
              - listitem [ref=e90]: Referring URLs and exit pages
              - listitem [ref=e91]: Timestamps and session duration
            - heading "1.5 Cookies and Similar Technologies" [level=3] [ref=e92]
            - paragraph [ref=e93]: We use cookies and similar technologies to collect information. See Section 6 for details about our use of cookies.
          - generic [ref=e94]:
            - heading "2. How We Use Your Information" [level=2] [ref=e95]
            - paragraph [ref=e96]: "We use the information we collect for the following purposes:"
            - heading "2.1 Service Operation" [level=3] [ref=e97]
            - list [ref=e98]:
              - listitem [ref=e99]: To create, maintain, and secure your account
              - listitem [ref=e100]: To process transactions, subscriptions, and payouts
              - listitem [ref=e101]: To deliver content and personalize your experience
              - listitem [ref=e102]: To provide customer support and respond to inquiries
              - listitem [ref=e103]: To verify Creator identities and age eligibility
            - heading "2.2 Communication" [level=3] [ref=e104]
            - list [ref=e105]:
              - listitem [ref=e106]: To send transactional notifications (purchase confirmations, payout notices)
              - listitem [ref=e107]: To notify you of changes to our Terms of Service, Privacy Policy, or other policies
              - listitem [ref=e108]: To send service-related announcements and updates
              - listitem [ref=e109]: To send promotional communications (with your consent, and with opt-out available)
            - heading "2.3 Analytics and Improvement" [level=3] [ref=e110]
            - list [ref=e111]:
              - listitem [ref=e112]: To analyze usage patterns and improve the Platform's features and performance
              - listitem [ref=e113]: To generate aggregated, anonymized statistics about Platform usage
              - listitem [ref=e114]: To conduct research and development for new features
              - listitem [ref=e115]: To provide Creators with anonymized analytics about their content performance
            - heading "2.4 Safety and Moderation" [level=3] [ref=e116]
            - list [ref=e117]:
              - listitem [ref=e118]: To detect, investigate, and prevent fraud, abuse, and violations of our Terms
              - listitem [ref=e119]: To moderate content and enforce our content standards
              - listitem [ref=e120]: To protect the safety and security of our users and the Platform
              - listitem [ref=e121]: To comply with legal obligations, including law enforcement requests
          - generic [ref=e122]:
            - heading "3. How We Share Your Information" [level=2] [ref=e123]
            - paragraph [ref=e124]: "We do not sell your personal information to third parties. We share your information only in the following circumstances:"
            - heading "3.1 Service Providers" [level=3] [ref=e125]
            - paragraph [ref=e126]: "We share information with the following categories of service providers who assist us in operating the Platform:"
            - list [ref=e127]:
              - listitem [ref=e128]:
                - strong [ref=e129]: "Payment Processors (CCBill, Segpay):"
                - text: To process subscriptions, purchases, and tips. They receive billing information necessary to complete transactions.
              - listitem [ref=e130]:
                - strong [ref=e131]: "Identity Verification (Veriff):"
                - text: To verify Creator identities and age. They receive government ID documents and biometric data for verification purposes only.
              - listitem [ref=e132]:
                - strong [ref=e133]: "Content Moderation (AWS Rekognition):"
                - text: To assist with automated detection of prohibited visual content. Visual content may be processed through Amazon Web Services for moderation purposes.
              - listitem [ref=e134]:
                - strong [ref=e135]: "Content Delivery Network (BunnyCDN):"
                - text: To deliver content efficiently to users worldwide. BunnyCDN processes requests that include IP addresses and device information for content delivery optimization.
              - listitem [ref=e136]:
                - strong [ref=e137]: "Payout Providers (Paxum):"
                - text: To process Creator earnings payouts. They receive payout method details and transaction amounts.
            - heading "3.2 Legal Requirements" [level=3] [ref=e138]
            - paragraph [ref=e139]: "We may disclose your information when required to do so by law, including:"
            - list [ref=e140]:
              - listitem [ref=e141]: In response to a court order, subpoena, or other legal process
              - listitem [ref=e142]: To comply with applicable laws and regulations
              - listitem [ref=e143]: To cooperate with law enforcement investigations
              - listitem [ref=e144]: To protect the rights, property, or safety of Erovel, its users, or the public
            - heading "3.3 Business Transfers" [level=3] [ref=e145]
            - paragraph [ref=e146]: In the event of a merger, acquisition, reorganization, or sale of all or a portion of our assets, your personal information may be transferred to the successor entity. We will notify you of any such transfer and any choices you may have regarding your information.
            - heading "3.4 With Your Consent" [level=3] [ref=e147]
            - paragraph [ref=e148]: We may share your information with third parties when you have given us explicit consent to do so.
          - generic [ref=e149]:
            - heading "4. Data Retention" [level=2] [ref=e150]
            - paragraph [ref=e151]: "We retain your personal information according to the following principles:"
            - list [ref=e152]:
              - listitem [ref=e153]:
                - strong [ref=e154]: "Active Accounts:"
                - text: Account data is retained for as long as your account remains active and for a reasonable period thereafter to allow for reactivation.
              - listitem [ref=e155]:
                - strong [ref=e156]: "Deleted Accounts:"
                - text: Upon account deletion request, we will delete or anonymize your personal information within thirty (30) days, except as noted below.
              - listitem [ref=e157]:
                - strong [ref=e158]: "Transaction Records:"
                - text: Financial transaction records are retained for a minimum of seven (7) years to comply with tax and accounting obligations.
              - listitem [ref=e159]:
                - strong [ref=e160]: "Legal Requirements:"
                - text: We may retain certain information as required by law, including records necessary for compliance with 18 U.S.C. 2257, tax regulations, and other legal obligations, even after account deletion.
              - listitem [ref=e161]:
                - strong [ref=e162]: "Content Moderation Records:"
                - text: Records of content removals and account actions taken for violations are retained indefinitely to enforce our repeat infringer policy and prevent circumvention of bans.
              - listitem [ref=e163]:
                - strong [ref=e164]: "Anonymized Data:"
                - text: Aggregated, anonymized data that cannot be used to identify you may be retained indefinitely for analytics and research purposes.
          - generic [ref=e165]:
            - heading "5. Data Security" [level=2] [ref=e166]
            - paragraph [ref=e167]: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:"
            - list [ref=e168]:
              - listitem [ref=e169]: Encryption of data in transit using TLS/SSL protocols
              - listitem [ref=e170]: Encryption of sensitive data at rest
              - listitem [ref=e171]: Hashing of passwords using industry-standard algorithms (bcrypt)
              - listitem [ref=e172]: Regular security audits and vulnerability assessments
              - listitem [ref=e173]: Access controls limiting employee access to personal information on a need-to-know basis
              - listitem [ref=e174]: Secure infrastructure hosted on reputable cloud providers with SOC 2 compliance
              - listitem [ref=e175]: Two-factor authentication available for all user accounts
            - paragraph [ref=e176]: While we strive to protect your personal information, no method of transmission over the Internet or method of electronic storage is completely secure. We cannot guarantee absolute security of your data, and you use the Platform at your own risk.
          - generic [ref=e177]:
            - heading "6. Cookies and Tracking Technologies" [level=2] [ref=e178]
            - paragraph [ref=e179]: "We use the following types of cookies and similar technologies:"
            - heading "6.1 Essential Cookies" [level=3] [ref=e180]
            - paragraph [ref=e181]: These cookies are strictly necessary for the operation of the Platform. They include session cookies for authentication, CSRF protection tokens, and cookies required to process transactions. These cookies cannot be disabled without impairing core Platform functionality.
            - heading "6.2 Analytics Cookies" [level=3] [ref=e182]
            - paragraph [ref=e183]: We use analytics tools to understand how users interact with the Platform. These cookies collect information about page views, navigation patterns, and feature usage. Analytics data is aggregated and does not identify individual users. You may opt out of analytics cookies through your browser settings or our cookie preferences panel.
            - heading "6.3 Local Storage" [level=3] [ref=e184]
            - paragraph [ref=e185]: We use browser local storage (localStorage) to store your reading preferences, theme settings, content display preferences, and reading progress. This data is stored locally on your device and is not transmitted to our servers unless you choose to sync your preferences across devices.
            - heading "6.4 Managing Cookies" [level=3] [ref=e186]
            - paragraph [ref=e187]: Most web browsers allow you to manage cookies through browser settings. You can typically set your browser to refuse all cookies, accept only first-party cookies, or delete cookies when you close your browser. Note that disabling essential cookies may prevent you from using certain features of the Platform.
          - generic [ref=e188]:
            - heading "7. Your Rights" [level=2] [ref=e189]
            - paragraph [ref=e190]: "Depending on your jurisdiction, you may have the following rights regarding your personal information:"
            - list [ref=e191]:
              - listitem [ref=e192]:
                - strong [ref=e193]: "Right of Access:"
                - text: You may request a copy of the personal information we hold about you.
              - listitem [ref=e194]:
                - strong [ref=e195]: "Right of Correction:"
                - text: You may request that we correct any inaccurate or incomplete personal information.
              - listitem [ref=e196]:
                - strong [ref=e197]: "Right of Deletion:"
                - text: You may request that we delete your personal information, subject to legal retention requirements described in Section 4.
              - listitem [ref=e198]:
                - strong [ref=e199]: "Right to Data Portability:"
                - text: You may request a copy of your personal information in a structured, commonly used, machine-readable format (e.g., JSON or CSV).
              - listitem [ref=e200]:
                - strong [ref=e201]: "Right to Withdraw Consent:"
                - text: Where processing is based on your consent, you may withdraw consent at any time without affecting the lawfulness of processing carried out prior to withdrawal.
              - listitem [ref=e202]:
                - strong [ref=e203]: "Right to Object:"
                - text: You may object to certain types of processing, including processing for direct marketing purposes.
              - listitem [ref=e204]:
                - strong [ref=e205]: "Right to Restrict Processing:"
                - text: You may request that we restrict the processing of your personal information in certain circumstances.
            - paragraph [ref=e206]: To exercise any of these rights, please contact us at contact@growyoursb.com. We will respond to your request within thirty (30) days. We may request additional information to verify your identity before processing your request.
          - generic [ref=e207]:
            - heading "8. PIPEDA Compliance (Canada)" [level=2] [ref=e208]
            - paragraph [ref=e209]: "As a Canadian company, Erovel complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable provincial privacy legislation. Under PIPEDA, we adhere to the following principles:"
            - list [ref=e210]:
              - listitem [ref=e211]:
                - strong [ref=e212]: "Accountability:"
                - text: 17816600 Canada Inc. is responsible for personal information under its control. Our Privacy Officer is responsible for compliance with this policy.
              - listitem [ref=e213]:
                - strong [ref=e214]: "Identifying Purposes:"
                - text: We identify the purposes for which personal information is collected at or before the time of collection.
              - listitem [ref=e215]:
                - strong [ref=e216]: "Consent:"
                - text: We obtain meaningful consent for the collection, use, and disclosure of personal information, except where permitted by law.
              - listitem [ref=e217]:
                - strong [ref=e218]: "Limiting Collection:"
                - text: We limit the collection of personal information to what is necessary for the identified purposes.
              - listitem [ref=e219]:
                - strong [ref=e220]: "Limiting Use, Disclosure, and Retention:"
                - text: Personal information is used only for the purposes for which it was collected and is retained only as long as necessary to fulfill those purposes.
              - listitem [ref=e221]:
                - strong [ref=e222]: "Accuracy:"
                - text: We take reasonable steps to ensure that personal information is accurate, complete, and up to date.
              - listitem [ref=e223]:
                - strong [ref=e224]: "Safeguards:"
                - text: We protect personal information with security safeguards appropriate to the sensitivity of the information.
              - listitem [ref=e225]:
                - strong [ref=e226]: "Openness:"
                - text: This Privacy Policy makes our policies and practices regarding personal information publicly available.
              - listitem [ref=e227]:
                - strong [ref=e228]: "Individual Access:"
                - text: Upon request, we will inform you of the existence, use, and disclosure of your personal information and provide you with access to that information.
              - listitem [ref=e229]:
                - strong [ref=e230]: "Challenging Compliance:"
                - text: You may challenge our compliance with PIPEDA by contacting our Privacy Officer. If you are not satisfied with our response, you may file a complaint with the Office of the Privacy Commissioner of Canada.
          - generic [ref=e231]:
            - heading "9. GDPR Considerations (European Union Users)" [level=2] [ref=e232]
            - paragraph [ref=e233]: "If you are located in the European Economic Area (EEA), the United Kingdom, or Switzerland, the following additional provisions apply to you under the General Data Protection Regulation (GDPR) and equivalent legislation:"
            - heading "9.1 Legal Bases for Processing" [level=3] [ref=e234]
            - paragraph [ref=e235]: "We process your personal data under the following legal bases:"
            - list [ref=e236]:
              - listitem [ref=e237]:
                - strong [ref=e238]: "Contract Performance:"
                - text: Processing necessary to provide you with the services you have requested (account management, content delivery, payment processing).
              - listitem [ref=e239]:
                - strong [ref=e240]: "Legitimate Interests:"
                - text: Processing necessary for our legitimate interests, such as fraud prevention, platform security, and service improvement, where these interests are not overridden by your rights.
              - listitem [ref=e241]:
                - strong [ref=e242]: "Legal Obligation:"
                - text: Processing necessary to comply with applicable laws and regulations (tax compliance, record-keeping requirements).
              - listitem [ref=e243]:
                - strong [ref=e244]: "Consent:"
                - text: Processing based on your freely given consent (marketing communications, analytics cookies).
            - heading "9.2 Additional EU Rights" [level=3] [ref=e245]
            - paragraph [ref=e246]: "In addition to the rights listed in Section 7, EU users have the right to:"
            - list [ref=e247]:
              - listitem [ref=e248]: Lodge a complaint with a supervisory authority in the EU member state of your habitual residence or place of work.
              - listitem [ref=e249]: Object to automated decision-making, including profiling, that produces legal effects or similarly significant effects.
            - heading "9.3 Data Protection Officer" [level=3] [ref=e250]
            - paragraph [ref=e251]: For GDPR-related inquiries, you may contact us at contact@growyoursb.com with the subject line "GDPR Request."
          - generic [ref=e252]:
            - heading "10. CCPA Considerations (California Users)" [level=2] [ref=e253]
            - paragraph [ref=e254]: "If you are a California resident, the following additional provisions apply to you under the California Consumer Privacy Act (CCPA) and the California Privacy Rights Act (CPRA):"
            - heading "10.1 Categories of Information Collected" [level=3] [ref=e255]
            - paragraph [ref=e256]: "In the preceding twelve (12) months, we have collected the following categories of personal information as defined by the CCPA: identifiers (name, email, IP address); personal information categories listed in Cal. Civ. Code 1798.80(e) (name, address); internet or other electronic network activity information (browsing history, interactions with the Platform); geolocation data (approximate location from IP address); and biometric information (for Creator identity verification only)."
            - heading "10.2 Your CCPA Rights" [level=3] [ref=e257]
            - list [ref=e258]:
              - listitem [ref=e259]:
                - strong [ref=e260]: "Right to Know:"
                - text: You may request that we disclose the categories and specific pieces of personal information we have collected about you.
              - listitem [ref=e261]:
                - strong [ref=e262]: "Right to Delete:"
                - text: You may request deletion of your personal information, subject to legal exceptions.
              - listitem [ref=e263]:
                - strong [ref=e264]: "Right to Opt-Out of Sale:"
                - text: We do not sell personal information. If this practice changes, we will provide a "Do Not Sell My Personal Information" link.
              - listitem [ref=e265]:
                - strong [ref=e266]: "Right to Non-Discrimination:"
                - text: We will not discriminate against you for exercising your CCPA rights.
              - listitem [ref=e267]:
                - strong [ref=e268]: "Right to Correct:"
                - text: You may request correction of inaccurate personal information.
            - heading "10.3 Exercising CCPA Rights" [level=3] [ref=e269]
            - paragraph [ref=e270]: To exercise your CCPA rights, contact us at contact@growyoursb.com or write to us at the address listed in Section 15. We will verify your identity before processing your request. You may also designate an authorized agent to make a request on your behalf.
          - generic [ref=e271]:
            - heading "11. Children's Privacy" [level=2] [ref=e272]
            - paragraph [ref=e273]: The Platform is not intended for use by individuals under the age of eighteen (18). We do not knowingly collect personal information from children under 18. In accordance with the Children's Online Privacy Protection Act (COPPA), the Platform does not target or knowingly collect information from children under the age of thirteen (13).
            - paragraph [ref=e274]: If we become aware that we have collected personal information from a child under 18, we will take immediate steps to delete that information and terminate the associated account. If you believe that we have inadvertently collected personal information from a minor, please contact us immediately at contact@growyoursb.com.
            - paragraph [ref=e275]: We implement age verification measures at registration to prevent underage access to the Platform. These measures include date of birth verification and, for Creators, government ID verification through our third-party verification provider.
          - generic [ref=e276]:
            - heading "12. International Data Transfers" [level=2] [ref=e277]
            - paragraph [ref=e278]: Erovel is operated from Canada. Your personal information may be transferred to, stored in, and processed in countries other than your country of residence, including Canada and the United States, where our servers and service providers are located.
            - paragraph [ref=e279]: "When transferring personal data from the EEA, UK, or Switzerland to countries that have not been deemed to provide an adequate level of data protection, we rely on the following transfer mechanisms:"
            - list [ref=e280]:
              - listitem [ref=e281]:
                - strong [ref=e282]: "Adequacy Decisions:"
                - text: Canada has been recognized by the European Commission as providing adequate data protection for commercial organizations subject to PIPEDA.
              - listitem [ref=e283]:
                - strong [ref=e284]: "Standard Contractual Clauses:"
                - text: For transfers to service providers in countries without adequacy decisions, we use EU Standard Contractual Clauses approved by the European Commission.
              - listitem [ref=e285]:
                - strong [ref=e286]: "Contractual Protections:"
                - text: All service providers are bound by data processing agreements that require them to protect personal information in accordance with applicable law.
            - paragraph [ref=e287]: By using the Platform, you acknowledge that your personal information may be processed in jurisdictions where data protection laws may differ from those in your country of residence.
          - generic [ref=e288]:
            - heading "13. Third-Party Links and Services" [level=2] [ref=e289]
            - paragraph [ref=e290]: The Platform may contain links to third-party websites or services that are not operated by Erovel. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party websites or services that you visit. This Privacy Policy applies only to information collected through our Platform.
          - generic [ref=e291]:
            - heading "14. Changes to This Privacy Policy" [level=2] [ref=e292]
            - paragraph [ref=e293]: "We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, legal requirements, or other factors. When we make material changes, we will:"
            - list [ref=e294]:
              - listitem [ref=e295]: Update the "Last updated" date at the top of this page.
              - listitem [ref=e296]: Post the revised Privacy Policy on the Platform.
              - listitem [ref=e297]: Notify registered users via email or a prominent notice on the Platform at least thirty (30) days before material changes take effect.
            - paragraph [ref=e298]: Your continued use of the Platform after the effective date of any changes constitutes your acceptance of the updated Privacy Policy. If you do not agree with the changes, you must stop using the Platform and request deletion of your account.
          - generic [ref=e299]:
            - heading "15. Contact Information" [level=2] [ref=e300]
            - paragraph [ref=e301]: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:"
            - generic [ref=e302]:
              - paragraph [ref=e303]: 17816600 Canada Inc. — Privacy Office
              - paragraph [ref=e304]: "Attn: Robert Chiarello"
              - paragraph [ref=e305]: 3534 Bank St
              - paragraph [ref=e306]: Gloucester, ON K1T 3W3, Canada
              - paragraph [ref=e307]: "Email: contact@growyoursb.com"
            - paragraph [ref=e308]:
              - text: For PIPEDA complaints that are not resolved to your satisfaction, you may contact the Office of the Privacy Commissioner of Canada at
              - link "www.priv.gc.ca" [ref=e309] [cursor=pointer]:
                - /url: https://www.priv.gc.ca
              - text: .
    - contentinfo [ref=e310]:
      - generic [ref=e311]:
        - generic [ref=e312]:
          - generic [ref=e313]:
            - heading "Erovel" [level=3] [ref=e314]
            - paragraph [ref=e315]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e316]:
            - heading "Browse" [level=3] [ref=e317]
            - list [ref=e318]:
              - listitem [ref=e319]:
                - link "All Stories" [ref=e320] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e321]:
                - link "Romance" [ref=e322] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e323]:
                - link "Fantasy" [ref=e324] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e325]:
                - link "Chat Stories" [ref=e326] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e327]:
            - heading "Creators" [level=3] [ref=e328]
            - list [ref=e329]:
              - listitem [ref=e330]:
                - link "Why Erovel?" [ref=e331] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e332]:
                - link "Become a Creator" [ref=e333] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e334]:
                - link "Creator Dashboard" [ref=e335] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e336]:
                - link "Import from imgchest" [ref=e337] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e338]:
            - heading "Legal" [level=3] [ref=e339]
            - list [ref=e340]:
              - listitem [ref=e341]:
                - link "Terms of Service" [ref=e342] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e343]:
                - link "Privacy Policy" [ref=e344] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e345]:
                - link "DMCA Policy" [ref=e346] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e347]:
                - link "2257 Compliance" [ref=e348] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e349]:
                - link "Refund Policy" [ref=e350] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e351]:
                - link "Contact" [ref=e352] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e353]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e354]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { bypassAgeGate } from "./helpers";
  3   | 
  4   | test.describe("Public Pages", () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await bypassAgeGate(page);
  7   |   });
  8   | 
  9   |   test("homepage loads with hero section", async ({ page }) => {
  10  |     await page.goto("/");
  11  |     await expect(page.getByText("Stories that ignite")).toBeVisible();
  12  |     await expect(page.getByText("Browse Stories")).toBeVisible();
  13  |   });
  14  | 
  15  |   test("browse page loads", async ({ page }) => {
  16  |     await page.goto("/browse");
  17  |     await expect(page.getByText("Browse Stories")).toBeVisible();
  18  |     await expect(page.getByText("Categories")).toBeVisible();
  19  |   });
  20  | 
  21  |   test("browse has format filter", async ({ page }) => {
  22  |     await page.goto("/browse");
  23  |     await expect(page.getByText("All Formats")).toBeVisible();
  24  |   });
  25  | 
  26  |   test("browse has sort options", async ({ page }) => {
  27  |     await page.goto("/browse");
  28  |     await expect(page.getByText("Trending")).toBeVisible();
  29  |   });
  30  | 
  31  |   test("search page loads", async ({ page }) => {
  32  |     await page.goto("/search");
  33  |     await expect(page.getByText("Search Stories")).toBeVisible();
  34  |   });
  35  | 
  36  |   test("category browse page loads", async ({ page }) => {
  37  |     await page.goto("/browse/romance");
  38  |     await expect(page).toHaveURL(/browse\/romance/);
  39  |   });
  40  | 
  41  |   test("404 page for invalid route", async ({ page }) => {
  42  |     await page.goto("/nonexistent-page-xyz");
  43  |     await expect(page.getByText("404")).toBeVisible();
  44  |   });
  45  | 
  46  |   test("terms page loads", async ({ page }) => {
  47  |     await page.goto("/terms");
  48  |     await expect(page.getByText("Terms of Service")).toBeVisible();
  49  |   });
  50  | 
  51  |   test("privacy page loads", async ({ page }) => {
  52  |     await page.goto("/privacy");
> 53  |     await expect(page.getByText("Privacy Policy")).toBeVisible();
      |                                                    ^ Error: expect(locator).toBeVisible() failed
  54  |   });
  55  | 
  56  |   test("dmca page loads with agent info", async ({ page }) => {
  57  |     await page.goto("/dmca");
  58  |     await expect(page.getByText("DMCA Policy")).toBeVisible();
  59  |     await expect(page.getByText("Robert Chiarello")).toBeVisible();
  60  |     await expect(page.getByText("DMCA-1071086")).toBeVisible();
  61  |   });
  62  | 
  63  |   test("2257 compliance page loads", async ({ page }) => {
  64  |     await page.goto("/2257");
  65  |     await expect(page.getByText("2257")).toBeVisible();
  66  |   });
  67  | 
  68  |   test("refund policy page loads", async ({ page }) => {
  69  |     await page.goto("/refund");
  70  |     await expect(page.getByText("Refund")).toBeVisible();
  71  |   });
  72  | 
  73  |   test("contact page loads", async ({ page }) => {
  74  |     await page.goto("/contact");
  75  |     await expect(page.getByText("Contact")).toBeVisible();
  76  |     await expect(page.getByText("contact@growyoursb.com")).toBeVisible();
  77  |   });
  78  | 
  79  |   test("creators landing page loads", async ({ page }) => {
  80  |     await page.goto("/creators");
  81  |     await expect(page.getByText("Your stories deserve")).toBeVisible();
  82  |     await expect(page.getByText("85%")).toBeVisible();
  83  |   });
  84  | 
  85  |   test("header navigation links work", async ({ page }) => {
  86  |     await page.goto("/");
  87  |     await page.click("text=Browse");
  88  |     await expect(page).toHaveURL(/browse/);
  89  |   });
  90  | 
  91  |   test("theme toggle works", async ({ page }) => {
  92  |     await page.goto("/");
  93  |     const html = page.locator("html");
  94  |     await page.click('[class*="cursor-pointer"]:has(svg)');
  95  |     // Should toggle dark class
  96  |     const hasDark = await html.evaluate((el) => el.classList.contains("dark"));
  97  |     expect(typeof hasDark).toBe("boolean");
  98  |   });
  99  | 
  100 |   test("footer has all legal links", async ({ page }) => {
  101 |     await page.goto("/");
  102 |     const footer = page.locator("footer");
  103 |     await expect(footer.getByText("Terms of Service")).toBeVisible();
  104 |     await expect(footer.getByText("Privacy Policy")).toBeVisible();
  105 |     await expect(footer.getByText("DMCA Policy")).toBeVisible();
  106 |     await expect(footer.getByText("Refund Policy")).toBeVisible();
  107 |     await expect(footer.getByText("Contact")).toBeVisible();
  108 |   });
  109 | });
  110 | 
```