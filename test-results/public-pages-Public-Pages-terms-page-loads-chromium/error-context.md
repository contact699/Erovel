# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: public-pages.spec.ts >> Public Pages >> terms page loads
- Location: e2e\public-pages.spec.ts:46:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Terms of Service')
Expected: visible
Error: strict mode violation: getByText('Terms of Service') resolved to 5 elements:
    1) <h1 class="text-3xl font-bold mb-6">Terms of Service</h1> aka getByRole('heading', { name: 'Terms of Service' })
    2) <p>Welcome to Erovel, operated by 17816600 Canada In…</p> aka getByText('Welcome to Erovel, operated')
    3) <li>Violation of these Terms of Service or any applic…</li> aka getByText('Violation of these Terms of')
    4) <p>If you have any questions about these Terms of Se…</p> aka getByText('If you have any questions')
    5) <a href="/terms" class="hover:text-foreground transition-colors">Terms of Service</a> aka getByRole('link', { name: 'Terms of Service' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText('Terms of Service')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - link "Erovel" [ref=e5] [cursor=pointer]:
          - /url: /
          - img [ref=e6]
          - generic [ref=e8]: Erovel
        - navigation [ref=e9]:
          - link "Browse" [ref=e10] [cursor=pointer]:
            - /url: /browse
          - link "Romance" [ref=e11] [cursor=pointer]:
            - /url: /browse/romance
          - link "Fantasy" [ref=e12] [cursor=pointer]:
            - /url: /browse/fantasy
          - link "Chat Stories" [ref=e13] [cursor=pointer]:
            - /url: /browse?format=chat
        - generic [ref=e14]:
          - button [ref=e15] [cursor=pointer]:
            - img [ref=e16]
          - button [ref=e19] [cursor=pointer]:
            - img [ref=e20]
          - generic [ref=e26]:
            - link "Log in" [ref=e27] [cursor=pointer]:
              - /url: /login
              - button "Log in" [ref=e28]
            - link "Sign up" [ref=e29] [cursor=pointer]:
              - /url: /signup
              - button "Sign up" [ref=e30]
    - main [ref=e31]:
      - generic [ref=e32]:
        - heading "Terms of Service" [level=1] [ref=e33]
        - generic [ref=e34]:
          - paragraph [ref=e35]: "Last updated: April 2, 2026"
          - generic [ref=e36]:
            - heading "1. Acceptance of Terms" [level=2] [ref=e37]
            - paragraph [ref=e38]: Welcome to Erovel, operated by 17816600 Canada Inc. ("Erovel," "we," "us," or "our"). By accessing or using the Erovel website, mobile applications, or any related services (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you must not access or use the Platform.
            - paragraph [ref=e39]: These Terms constitute a legally binding agreement between you and 17816600 Canada Inc. Your continued use of the Platform following any modifications to these Terms constitutes acceptance of those modifications.
          - generic [ref=e40]:
            - heading "2. Eligibility" [level=2] [ref=e41]
            - paragraph [ref=e42]: "The Platform contains adult fiction content and is strictly restricted to individuals who are at least eighteen (18) years of age, or the age of majority in their jurisdiction, whichever is greater. By accessing or using the Platform, you represent and warrant that:"
            - list [ref=e43]:
              - listitem [ref=e44]: You are at least 18 years old or have reached the age of majority in your jurisdiction.
              - listitem [ref=e45]: You have the legal capacity to enter into a binding agreement.
              - listitem [ref=e46]: You are not prohibited from using the Platform under the laws of your jurisdiction.
              - listitem [ref=e47]: It is lawful for you to access adult content in the jurisdiction from which you are accessing the Platform.
            - paragraph [ref=e48]: We reserve the right to request proof of age at any time and to terminate accounts where we have reasonable grounds to believe the user is under 18 years of age.
          - generic [ref=e49]:
            - heading "3. Account Registration and Responsibilities" [level=2] [ref=e50]
            - paragraph [ref=e51]: "To access certain features of the Platform, you must create an account. When registering, you agree to:"
            - list [ref=e52]:
              - listitem [ref=e53]: Provide accurate, current, and complete information during registration.
              - listitem [ref=e54]: Maintain and promptly update your account information to keep it accurate and complete.
              - listitem [ref=e55]: Maintain the confidentiality of your account credentials, including your password.
              - listitem [ref=e56]: Accept responsibility for all activities that occur under your account.
              - listitem [ref=e57]: Notify us immediately of any unauthorized use of your account or any other breach of security.
            - paragraph [ref=e58]: You may not transfer, sell, or assign your account to any third party. You may not create more than one account per individual. We reserve the right to suspend or terminate accounts that we reasonably believe violate these Terms or are being used fraudulently.
          - generic [ref=e59]:
            - heading "4. User-Generated Content and Ownership" [level=2] [ref=e60]
            - paragraph [ref=e61]: "The Platform allows users (\"Creators\") to publish original fiction and related content (\"User Content\"). Creators retain full ownership of all intellectual property rights in their User Content. By uploading, publishing, or otherwise making User Content available on the Platform, you grant Erovel a non-exclusive, worldwide, royalty-free, sublicensable license to:"
            - list [ref=e62]:
              - listitem [ref=e63]: Host, store, reproduce, and display your User Content on the Platform.
              - listitem [ref=e64]: Format, adapt, and technically process your User Content as necessary for the operation of the Platform (e.g., formatting for different devices, generating previews and excerpts).
              - listitem [ref=e65]: Use excerpts of your User Content for promotional purposes, including search results and recommendation features.
            - paragraph [ref=e66]: This license terminates when you remove your User Content from the Platform or when your account is deleted, except for copies that have been made by other users in accordance with these Terms (e.g., purchased content) and reasonable backup copies retained for legal compliance purposes.
            - paragraph [ref=e67]: You represent and warrant that you own or have all necessary rights, licenses, and permissions to publish your User Content and to grant the above license, and that your User Content does not infringe or violate the rights of any third party.
          - generic [ref=e68]:
            - heading "5. Content Standards" [level=2] [ref=e69]
            - paragraph [ref=e70]: "All User Content must comply with the following standards. The following content is strictly prohibited and will result in immediate removal and account termination:"
            - list [ref=e71]:
              - listitem [ref=e72]:
                - strong [ref=e73]: "Child Sexual Abuse Material (CSAM):"
                - text: Any content that depicts, describes, or promotes the sexual exploitation or abuse of minors is absolutely prohibited. This includes fictional, drawn, computer-generated, or AI-generated depictions of minors in sexual situations.
              - listitem [ref=e74]:
                - strong [ref=e75]: "Minors in Any Context:"
                - text: No character depicted in a sexual or romantic context may be described as, or reasonably appear to be, under the age of eighteen (18). All characters in sexual content must be explicitly established as adults.
              - listitem [ref=e76]:
                - strong [ref=e77]: "Non-Consensual Real-Person Content:"
                - text: Content depicting real, identifiable persons in sexual scenarios without their verified, written consent is prohibited. This includes fan fiction involving real public figures in explicit sexual situations.
              - listitem [ref=e78]:
                - strong [ref=e79]: "Content Promoting Illegal Activity:"
                - text: Content that provides instructions for or actively promotes real-world violence, terrorism, human trafficking, or other serious criminal activity.
              - listitem [ref=e80]:
                - strong [ref=e81]: "Malware and Harmful Links:"
                - text: Content containing viruses, malware, phishing links, or any material designed to damage or gain unauthorized access to systems.
            - paragraph [ref=e82]: Creators must accurately tag and categorize their content using the Platform's content tagging system. Failure to properly tag content, including the omission of required content warnings, may result in content removal or account suspension.
            - paragraph [ref=e83]: Erovel reserves the right to review, moderate, and remove any content at its sole discretion, even if such content does not explicitly violate the above prohibitions.
          - generic [ref=e84]:
            - heading "6. Creator Obligations" [level=2] [ref=e85]
            - paragraph [ref=e86]: "Creators who publish content on the Platform agree to the following additional obligations:"
            - list [ref=e87]:
              - listitem [ref=e88]:
                - strong [ref=e89]: "Identity Verification:"
                - text: All Creators must complete identity verification through our third-party verification provider before publishing content or receiving payouts. This verification confirms your identity and age. You must provide a valid government-issued photo identification document and complete a biometric verification process.
              - listitem [ref=e90]:
                - strong [ref=e91]: "18 U.S.C. 2257 Compliance:"
                - text: To the extent applicable, Creators are responsible for maintaining records in compliance with 18 U.S.C. 2257 and 28 C.F.R. 75 for any visual depictions of actual sexually explicit conduct. Creators must certify that all individuals depicted in visual content are over 18 years of age and that appropriate records are maintained.
              - listitem [ref=e92]:
                - strong [ref=e93]: "Tax Compliance:"
                - text: Creators are solely responsible for reporting and paying all taxes applicable to income earned through the Platform. Erovel may be required to collect tax information (such as W-9 or W-8BEN forms) and to report earnings to relevant tax authorities.
              - listitem [ref=e94]:
                - strong [ref=e95]: "Accurate Representation:"
                - text: Creators must not misrepresent the nature of their content, their identity, or their qualifications.
              - listitem [ref=e96]:
                - strong [ref=e97]: "Exclusive Availability:"
                - text: Content posted as exclusive to paying subscribers must not be made freely available on other platforms during the exclusivity period.
          - generic [ref=e98]:
            - heading "7. Reader Obligations" [level=2] [ref=e99]
            - paragraph [ref=e100]: "Users who access and read content on the Platform (\"Readers\") agree to:"
            - list [ref=e101]:
              - listitem [ref=e102]: Not reproduce, redistribute, or republish any content from the Platform without the express written permission of the Creator.
              - listitem [ref=e103]: Not circumvent or attempt to circumvent any access restrictions, paywalls, or digital rights management measures.
              - listitem [ref=e104]: Not use automated tools, bots, scrapers, or similar technology to access or download content from the Platform.
              - listitem [ref=e105]: Respect the intellectual property rights of Creators and report any suspected infringement.
              - listitem [ref=e106]: Use content ratings and tags to make informed decisions about the content they access.
              - listitem [ref=e107]: Not engage in harassment, abuse, or intimidation of Creators or other users through comments, messages, or any other communication feature.
          - generic [ref=e108]:
            - heading "8. Subscriptions and Billing" [level=2] [ref=e109]
            - paragraph [ref=e110]: "The Platform offers subscription-based access to Creator content. By purchasing a subscription, you agree to the following:"
            - list [ref=e111]:
              - listitem [ref=e112]:
                - strong [ref=e113]: "Recurring Billing:"
                - text: Subscriptions are billed on a recurring monthly basis. By subscribing, you authorize Erovel and its payment processors to charge your selected payment method on a recurring basis at the then-current subscription price.
              - listitem [ref=e114]:
                - strong [ref=e115]: "Auto-Renewal:"
                - text: All subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date. You will be charged for the next billing cycle unless cancellation is completed before the renewal date. No partial refunds are provided for unused portions of a billing period.
              - listitem [ref=e116]:
                - strong [ref=e117]: "Cancellation:"
                - text: You may cancel your subscription at any time through your account settings. Upon cancellation, you will retain access to the subscribed content until the end of your current billing period. After the billing period ends, your access to paid content will be revoked.
              - listitem [ref=e118]:
                - strong [ref=e119]: "Price Changes:"
                - text: Creators may change their subscription prices. You will be notified of any price changes at least thirty (30) days in advance. If you do not cancel before the new price takes effect, you will be charged the updated price.
              - listitem [ref=e120]:
                - strong [ref=e121]: "Payment Processing:"
                - text: Payments are processed through third-party payment processors. By making a purchase, you agree to the terms and conditions of the applicable payment processor. Erovel does not store your full payment card information.
          - generic [ref=e122]:
            - heading "9. Tips and One-Time Purchases" [level=2] [ref=e123]
            - paragraph [ref=e124]: The Platform allows Readers to send tips to Creators and make one-time purchases of individual stories or content bundles.
            - list [ref=e125]:
              - listitem [ref=e126]:
                - strong [ref=e127]: "Voluntary Tips:"
                - text: Tips are voluntary, non-refundable payments made directly to Creators as a show of appreciation. Tips do not entitle the tipper to any additional content, services, or special treatment beyond what the Creator may choose to offer at their sole discretion.
              - listitem [ref=e128]:
                - strong [ref=e129]: "One-Time Purchases:"
                - text: Individual stories or content bundles may be purchased for a one-time fee. Once purchased, the buyer receives a non-transferable, non-exclusive license to access that content through the Platform.
              - listitem [ref=e130]:
                - strong [ref=e131]: "Non-Refundable Digital Goods:"
                - text: All tips and one-time purchases are for digital goods and services that are delivered immediately upon payment. Due to the nature of digital goods, all such transactions are final and non-refundable, except as described in Section 10 (Refund Policy).
          - generic [ref=e132]:
            - heading "10. Refund Policy" [level=2] [ref=e133]
            - paragraph [ref=e134]: "Due to the digital nature of the content and services provided on the Platform, our refund policy is as follows:"
            - list [ref=e135]:
              - listitem [ref=e136]:
                - strong [ref=e137]: "General Rule:"
                - text: All purchases, including subscriptions, tips, and one-time content purchases, are non-refundable. By completing a transaction, you acknowledge that digital content is delivered immediately and that you waive any right of withdrawal that may otherwise apply.
              - listitem [ref=e138]:
                - strong [ref=e139]: "Billing Errors:"
                - text: If you believe you have been charged in error (e.g., duplicate charges, charges after cancellation, incorrect amounts), you may request a refund by contacting us at contact@growyoursb.com within thirty (30) days of the erroneous charge. We will investigate and, if a billing error is confirmed, issue a refund to your original payment method.
              - listitem [ref=e140]:
                - strong [ref=e141]: "Technical Issues:"
                - text: If you are unable to access content you have paid for due to a confirmed technical issue on our end, we may, at our discretion, issue a refund or provide an alternative remedy such as extending your access period.
              - listitem [ref=e142]:
                - strong [ref=e143]: "Chargeback Policy:"
                - text: Filing a chargeback or payment dispute with your bank or credit card company without first attempting to resolve the issue with Erovel may result in immediate suspension of your account. We reserve the right to contest any chargeback and to provide transaction records to your financial institution. Accounts associated with fraudulent chargebacks will be permanently terminated, and any outstanding balances may be referred to a collections agency. If a chargeback is filed and subsequently reversed in our favor, your account may be reinstated at our discretion, and you may be charged a chargeback processing fee of up to $25.00 CAD.
          - generic [ref=e144]:
            - heading "11. Platform Fee" [level=2] [ref=e145]
            - paragraph [ref=e146]: Erovel charges a platform fee of fifteen percent (15%) on all transactions processed through the Platform, including subscriptions, tips, and one-time purchases. This fee covers the cost of hosting, content delivery, payment processing, platform maintenance, moderation, and customer support.
            - paragraph [ref=e147]: Creators receive eighty-five percent (85%) of all gross revenue from their content sales, subscriptions, and tips, after deduction of the platform fee. Payment processing fees charged by third-party payment processors are included in the 15% platform fee and are not charged separately to Creators.
            - paragraph [ref=e148]: Erovel reserves the right to modify the platform fee with at least sixty (60) days' written notice to Creators. Any fee changes will apply only to transactions occurring after the effective date of the change.
          - generic [ref=e149]:
            - heading "12. Creator Payouts" [level=2] [ref=e150]
            - paragraph [ref=e151]: "Creator earnings are paid out according to the following terms:"
            - list [ref=e152]:
              - listitem [ref=e153]:
                - strong [ref=e154]: "Payout Schedule:"
                - text: Payouts are processed on a weekly basis, typically on Fridays, for earnings that have cleared the applicable holding period.
              - listitem [ref=e155]:
                - strong [ref=e156]: "Minimum Payout Threshold:"
                - text: A minimum balance of fifty dollars ($50.00 USD) is required to initiate a payout. If your balance is below the minimum threshold, it will carry over to the next payout period.
              - listitem [ref=e157]:
                - strong [ref=e158]: "Payout Methods:"
                - text: Payouts are available via Paxum and cryptocurrency. Creators must configure a valid payout method in their account settings to receive earnings. Erovel is not responsible for delays or failures caused by incorrect payout information provided by the Creator.
              - listitem [ref=e159]:
                - strong [ref=e160]: "Holding Period:"
                - text: Earnings are subject to a holding period of seven (7) days from the date of the transaction before they become eligible for payout. This holding period allows for the resolution of any disputes, chargebacks, or fraudulent transactions.
              - listitem [ref=e161]:
                - strong [ref=e162]: "Deductions:"
                - text: Erovel may deduct from Creator earnings any amounts owed due to chargebacks, refunds, adjustments, or outstanding fees.
          - generic [ref=e163]:
            - heading "13. Intellectual Property and DMCA" [level=2] [ref=e164]
            - paragraph [ref=e165]: The Platform, including its design, code, logos, trademarks, and all non-user-generated content, is the exclusive property of 17816600 Canada Inc. and is protected by copyright, trademark, and other intellectual property laws.
            - paragraph [ref=e166]:
              - text: Erovel complies with the Digital Millennium Copyright Act (DMCA) and responds to valid takedown notices. If you believe that content on the Platform infringes your copyright, please refer to our
              - link "DMCA Policy" [ref=e167] [cursor=pointer]:
                - /url: /dmca
              - text: for instructions on submitting a takedown notice.
            - paragraph [ref=e168]: Repeat infringers will have their accounts terminated in accordance with our DMCA Policy. We maintain a designated DMCA agent as required by law.
          - generic [ref=e169]:
            - heading "14. Account Termination" [level=2] [ref=e170]
            - paragraph [ref=e171]: You may terminate your account at any time by contacting us or through your account settings. Upon termination, your access to the Platform will be revoked and your account data will be handled in accordance with our Privacy Policy.
            - paragraph [ref=e172]: "Erovel reserves the right to suspend or terminate any account, at any time and without prior notice, for any of the following reasons:"
            - list [ref=e173]:
              - listitem [ref=e174]: Violation of these Terms of Service or any applicable law or regulation.
              - listitem [ref=e175]: Publishing or distributing prohibited content as described in Section 5.
              - listitem [ref=e176]: Repeated copyright infringement (repeat infringer policy).
              - listitem [ref=e177]: Fraudulent activity, including fraudulent chargebacks or payment manipulation.
              - listitem [ref=e178]: Harassment, abuse, or threatening behavior toward other users or Erovel staff.
              - listitem [ref=e179]: Creating multiple accounts to circumvent bans or restrictions.
              - listitem [ref=e180]: Any conduct that Erovel reasonably determines to be harmful to the Platform, its users, or its reputation.
            - paragraph [ref=e181]: Upon termination for cause, any pending Creator earnings may be withheld for up to ninety (90) days to account for potential chargebacks and refunds. Funds remaining after the holding period will be paid out in accordance with Section 12, provided the Creator has a valid payout method on file and no outstanding disputes.
          - generic [ref=e182]:
            - heading "15. Limitation of Liability" [level=2] [ref=e183]
            - paragraph [ref=e184]: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EROVEL, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE PLATFORM, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STATUTE, OR ANY OTHER LEGAL THEORY, EVEN IF EROVEL HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            - paragraph [ref=e185]: TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, EROVEL'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO EROVEL IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM, OR (B) ONE HUNDRED CANADIAN DOLLARS ($100.00 CAD).
            - paragraph [ref=e186]: THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. EROVEL DOES NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            - paragraph [ref=e187]: Erovel is not responsible for User Content published by Creators. Erovel does not endorse, guarantee, or assume liability for any User Content. You access User Content at your own risk.
          - generic [ref=e188]:
            - heading "16. Indemnification" [level=2] [ref=e189]
            - paragraph [ref=e190]: "You agree to indemnify, defend, and hold harmless 17816600 Canada Inc., its officers, directors, employees, agents, and affiliates from and against any and all claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any rights of any third party; or (d) any User Content you publish on the Platform."
          - generic [ref=e191]:
            - heading "17. Governing Law" [level=2] [ref=e192]
            - paragraph [ref=e193]: These Terms and any dispute arising out of or relating to these Terms or your use of the Platform shall be governed by and construed in accordance with the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles. You irrevocably submit to the exclusive jurisdiction of the courts of the Province of Ontario, located in Ottawa, Ontario, Canada, for the resolution of any disputes arising out of or relating to these Terms.
          - generic [ref=e194]:
            - heading "18. Dispute Resolution" [level=2] [ref=e195]
            - paragraph [ref=e196]: Before initiating any formal legal proceedings, you agree to first attempt to resolve any dispute informally by contacting us at contact@growyoursb.com. We will attempt to resolve the dispute through good-faith negotiation within thirty (30) days of receiving your written notice.
            - paragraph [ref=e197]: If the dispute cannot be resolved informally, either party may initiate binding arbitration administered by the ADR Institute of Canada in accordance with its arbitration rules. The arbitration shall take place in Ottawa, Ontario, Canada, and shall be conducted in English. The decision of the arbitrator shall be final and binding and may be entered as a judgment in any court of competent jurisdiction.
            - paragraph [ref=e198]: Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property rights or to prevent irreparable harm.
            - paragraph [ref=e199]: YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
          - generic [ref=e200]:
            - heading "19. Modifications to Terms" [level=2] [ref=e201]
            - paragraph [ref=e202]: Erovel reserves the right to modify these Terms at any time. When we make material changes, we will notify you by posting the updated Terms on the Platform and updating the "Last updated" date at the top of this page. For material changes that affect your rights or obligations, we will provide at least thirty (30) days' advance notice via email or a prominent notice on the Platform.
            - paragraph [ref=e203]: Your continued use of the Platform after the effective date of any modifications constitutes your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using the Platform and terminate your account.
          - generic [ref=e204]:
            - heading "20. Severability" [level=2] [ref=e205]
            - paragraph [ref=e206]: If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving the original intent of the parties.
          - generic [ref=e207]:
            - heading "21. Entire Agreement" [level=2] [ref=e208]
            - paragraph [ref=e209]: These Terms, together with the Privacy Policy, DMCA Policy, and any other policies referenced herein, constitute the entire agreement between you and 17816600 Canada Inc. regarding your use of the Platform and supersede all prior agreements, understandings, and communications, whether written or oral, relating to the subject matter hereof.
          - generic [ref=e210]:
            - heading "22. Contact Information" [level=2] [ref=e211]
            - paragraph [ref=e212]: "If you have any questions about these Terms of Service, please contact us at:"
            - generic [ref=e213]:
              - paragraph [ref=e214]: 17816600 Canada Inc.
              - paragraph [ref=e215]: "Attn: Robert Chiarello"
              - paragraph [ref=e216]: 3534 Bank St
              - paragraph [ref=e217]: Gloucester, ON K1T 3W3, Canada
              - paragraph [ref=e218]: "Email: contact@growyoursb.com"
    - contentinfo [ref=e219]:
      - generic [ref=e220]:
        - generic [ref=e221]:
          - generic [ref=e222]:
            - heading "Erovel" [level=3] [ref=e223]
            - paragraph [ref=e224]: A platform for adult fiction creators and readers. Stories that ignite.
          - generic [ref=e225]:
            - heading "Browse" [level=3] [ref=e226]
            - list [ref=e227]:
              - listitem [ref=e228]:
                - link "All Stories" [ref=e229] [cursor=pointer]:
                  - /url: /browse
              - listitem [ref=e230]:
                - link "Romance" [ref=e231] [cursor=pointer]:
                  - /url: /browse/romance
              - listitem [ref=e232]:
                - link "Fantasy" [ref=e233] [cursor=pointer]:
                  - /url: /browse/fantasy
              - listitem [ref=e234]:
                - link "Chat Stories" [ref=e235] [cursor=pointer]:
                  - /url: /browse?format=chat
          - generic [ref=e236]:
            - heading "Creators" [level=3] [ref=e237]
            - list [ref=e238]:
              - listitem [ref=e239]:
                - link "Why Erovel?" [ref=e240] [cursor=pointer]:
                  - /url: /creators
              - listitem [ref=e241]:
                - link "Become a Creator" [ref=e242] [cursor=pointer]:
                  - /url: /signup
              - listitem [ref=e243]:
                - link "Creator Dashboard" [ref=e244] [cursor=pointer]:
                  - /url: /dashboard
              - listitem [ref=e245]:
                - link "Import from imgchest" [ref=e246] [cursor=pointer]:
                  - /url: /dashboard/import
          - generic [ref=e247]:
            - heading "Legal" [level=3] [ref=e248]
            - list [ref=e249]:
              - listitem [ref=e250]:
                - link "Terms of Service" [ref=e251] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e252]:
                - link "Privacy Policy" [ref=e253] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e254]:
                - link "DMCA Policy" [ref=e255] [cursor=pointer]:
                  - /url: /dmca
              - listitem [ref=e256]:
                - link "2257 Compliance" [ref=e257] [cursor=pointer]:
                  - /url: /2257
              - listitem [ref=e258]:
                - link "Refund Policy" [ref=e259] [cursor=pointer]:
                  - /url: /refund
              - listitem [ref=e260]:
                - link "Contact" [ref=e261] [cursor=pointer]:
                  - /url: /contact
        - generic [ref=e262]: © 2026 Erovel. All rights reserved. You must be 18+ to use this platform.
  - alert [ref=e263]
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
> 48  |     await expect(page.getByText("Terms of Service")).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  49  |   });
  50  | 
  51  |   test("privacy page loads", async ({ page }) => {
  52  |     await page.goto("/privacy");
  53  |     await expect(page.getByText("Privacy Policy")).toBeVisible();
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