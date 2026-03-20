'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg p-8 md:p-12">
            <div className="mb-8 pb-8 border-b">
              <p className="text-sm text-gray-500 mb-2">
                Last updated: March 20, 2026
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                Terms of Service
              </h1>
              <p className="mt-4 text-gray-600">
                <strong>Important:</strong> These terms are provided as a
                template for informational purposes only. Please consult with a
                qualified legal professional before using these terms in a
                production environment. Chazon does not provide legal advice.
              </p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-gray-600 mb-4">
                  By accessing and using Chazon (&quot;the Platform&quot;), you
                  agree to be bound by these Terms of Service
                  (&quot;Terms&quot;). If you do not agree to these Terms, you
                  may not access or use the Platform.
                </p>
                <p className="text-gray-600">
                  These Terms constitute a legally binding agreement between you
                  and Chazon regarding your use of the Platform. By registering
                  an account, creating a service listing, or booking a service,
                  you acknowledge that you have read, understood, and agree to
                  be bound by these Terms.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Platform Description
                </h2>
                <p className="text-gray-600 mb-4">
                  Chazon is an online marketplace that connects clients seeking
                  services (&quot;Clients&quot;) with individuals or businesses
                  providing services (&quot;Stewards&quot;). We facilitate
                  transactions but are not a party to any agreement between
                  Clients and Stewards.
                </p>
                <p className="text-gray-600">
                  The Platform enables: service discovery, booking management,
                  secure payment processing through escrow, and communication
                  between Clients and Stewards.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. User Accounts
                </h2>
                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  3.1 Account Registration
                </h3>
                <p className="text-gray-600 mb-4">
                  To use certain features, you must create an account. You agree
                  to provide accurate, current, and complete information and to
                  update such information to keep it accurate, current, and
                  complete.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  3.2 Account Security
                </h3>
                <p className="text-gray-600 mb-4">
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activities that occur
                  under your account. You agree to notify us immediately of any
                  unauthorized use of your account.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  3.3 Account Types
                </h3>
                <p className="text-gray-600">
                  <strong>Clients:</strong> Users seeking services from
                  Stewards.
                  <br />
                  <strong>Stewards:</strong> Users providing services to
                  Clients.
                  <br />
                  <strong>Admins:</strong> Chazon staff with platform management
                  capabilities.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. Off-Platform Communication Prohibition
                </h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ⚠️ Critical Restriction
                  </h3>
                  <p className="text-red-700 font-medium mb-4">
                    All communication between Clients and Stewards must occur
                    exclusively through the Chazon Platform.
                  </p>
                </div>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.1 Prohibited Actions
                </h3>
                <p className="text-gray-600 mb-4">You agree NOT to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>
                    Share personal phone numbers, email addresses, or other
                    contact information
                  </li>
                  <li>
                    Use the Platform to arrange transactions outside of Chazon
                  </li>
                  <li>
                    Share links to external websites, social media profiles, or
                    messaging apps
                  </li>
                  <li>
                    Request or provide services to be performed outside the
                    Platform
                  </li>
                  <li>
                    Attempt to circumvent the payment system or fee structure
                  </li>
                  <li>
                    Use coded language, spellings, or symbols to evade detection
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.2 Purpose of Restriction
                </h3>
                <p className="text-gray-600 mb-4">
                  This restriction protects both Clients and Stewards by
                  ensuring:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Payment protection through our escrow system</li>
                  <li>Dispute resolution support</li>
                  <li>Verified communication records</li>
                  <li>Platform sustainability through fair fees</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.3 Consequences of Violation
                </h3>
                <p className="text-gray-600">
                  Violation of this section may result in: warning, temporary
                  suspension, permanent account termination, and/or legal
                  action. Reported violations will be investigated, and Chazon
                  reserves the right to take appropriate action.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Service Listings and Bookings
                </h2>
                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  5.1 Service Listings
                </h3>
                <p className="text-gray-600 mb-4">
                  Stewards represent and warrant that all information provided
                  in service listings is accurate, complete, and not misleading.
                  Listings must comply with all applicable laws and regulations.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  5.2 Booking Process
                </h3>
                <p className="text-gray-600 mb-4">
                  When a Client books a service, a binding agreement is formed
                  between the Client and Steward. The Client agrees to pay the
                  listed price plus any applicable fees.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  5.3 Cancellation Policy
                </h3>
                <p className="text-gray-600">
                  Bookings may be cancelled according to the following:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mt-2">
                  <li>More than 24 hours before: Full refund</li>
                  <li>
                    Less than 24 hours before: Partial refund at Chazon's
                    discretion
                  </li>
                  <li>After service has started: No refund</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Payment Protection and Escrow
                </h2>
                <p className="text-gray-600 mb-4">
                  All payments are processed through Chazon&apos;s secure
                  payment system. Funds are held in escrow until the service is
                  completed and confirmed by the Client.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  6.1 Payment Release
                </h3>
                <p className="text-gray-600 mb-4">
                  Payment to the Steward is released only after the Client
                  confirms completion of the service through the Platform. If no
                  confirmation is provided within 72 hours of the scheduled
                  completion time, payment may be automatically released.
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  6.2 Platform Fees
                </h3>
                <p className="text-gray-600">
                  Chazon charges a service fee (typically 15-20% of the
                  transaction value) from Stewards. This fee supports platform
                  maintenance, payment processing, and customer support.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Dispute Resolution
                </h2>
                <p className="text-gray-600 mb-4">
                  If a dispute arises between a Client and Steward:
                </p>
                <ol className="list-decimal list-inside text-gray-600 space-y-2 mb-4">
                  <li>
                    Attempt to resolve the matter directly through the
                    Platform&apos;s messaging
                  </li>
                  <li>If unresolved, file a dispute through the Platform</li>
                  <li>Chazon will review evidence and make a determination</li>
                  <li>
                    Chazon&apos;s decision is final, subject to these Terms
                  </li>
                </ol>
                <p className="text-gray-600">
                  Disputes may result in: full or partial refund, payment
                  release, account suspension, or permanent removal from the
                  Platform.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. User Conduct
                </h2>
                <p className="text-gray-600 mb-4">You agree not to:</p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Submit false, misleading, or fraudulent information</li>
                  <li>Interfere with the proper functioning of the Platform</li>
                  <li>
                    Attempt to gain unauthorized access to accounts or systems
                  </li>
                  <li>Use automated systems or bots without authorization</li>
                  <li>Collect user information without consent</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Intellectual Property
                </h2>
                <p className="text-gray-600 mb-4">
                  Chazon retains all rights to the Platform, including but not
                  limited to: software, design, trademarks, logos, and content.
                  Users retain rights to content they submit but grant Chazon a
                  license to use such content for Platform purposes.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Privacy and Data Handling
                </h2>
                <p className="text-gray-600 mb-4">
                  Your use of the Platform is also governed by our Privacy
                  Policy. Please review it at{' '}
                  <Link
                    href="/privacy"
                    className="text-chazon-primary hover:underline"
                  >
                    /privacy
                  </Link>
                  .
                </p>
                <p className="text-gray-600">
                  We collect, use, and protect your personal information as
                  described in the Privacy Policy. By using the Platform, you
                  consent to such data practices.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. Limitation of Liability
                </h2>
                <p className="text-gray-600 mb-4">
                  To the maximum extent permitted by law, Chazon is not liable
                  for:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>
                    Indirect, incidental, special, or consequential damages
                  </li>
                  <li>
                    Loss of profits, revenue, data, or business opportunities
                  </li>
                  <li>Actions or omissions of Users or third parties</li>
                  <li>Service quality or outcomes</li>
                </ul>
                <p className="text-gray-600">
                  Our total liability shall not exceed the amount of fees paid
                  by you in the twelve (12) months preceding the claim.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Indemnification
                </h2>
                <p className="text-gray-600">
                  You agree to indemnify, defend, and hold harmless Chazon and
                  its officers, directors, employees, and agents from any
                  claims, damages, losses, or expenses arising from your use of
                  the Platform, your violation of these Terms, or your violation
                  of any rights of a third party.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  13. Modification of Terms
                </h2>
                <p className="text-gray-600">
                  Chazon reserves the right to modify these Terms at any time.
                  We will provide notice of material changes via email or
                  prominent notice on the Platform. Continued use after changes
                  constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  14. Termination
                </h2>
                <p className="text-gray-600 mb-4">
                  You may terminate your account at any time by contacting
                  support or using the account deletion feature. Chazon may
                  terminate or suspend your account for:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Violation of these Terms</li>
                  <li>Fraudulent or illegal activity</li>
                  <li>Non-payment or chargebacks</li>
                  <li>Harassment or harmful behavior</li>
                  <li>At Chazon&apos;s discretion</li>
                </ul>
                <p className="text-gray-600">
                  Termination does not affect obligations incurred prior to
                  termination.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  15. Governing Law
                </h2>
                <p className="text-gray-600">
                  These Terms shall be governed by and construed in accordance
                  with the laws of Uganda, without regard to its conflict of law
                  provisions. Any disputes shall be resolved in the courts of
                  Uganda.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  16. Contact Information
                </h2>
                <p className="text-gray-600">
                  For questions regarding these Terms, please contact us at:
                  <br />
                  <strong>Email:</strong> legal@chazon.com
                  <br />
                  <strong>Address:</strong> AAA Complex, Bukoto-Kisaasi,
                  Kampala, Uganda
                  <br />
                  <strong>Phone:</strong> +256 788 433 163
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  17. Entire Agreement
                </h2>
                <p className="text-gray-600">
                  These Terms, together with the Privacy Policy and any other
                  policies referenced herein, constitute the entire agreement
                  between you and Chazon regarding your use of the Platform and
                  supersede all prior agreements and understandings.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
