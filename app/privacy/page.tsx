'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';

export default function PrivacyPage() {
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
                Privacy Policy
              </h1>
              <p className="mt-4 text-gray-600">
                <strong>Important:</strong> This privacy policy is provided as a
                template for informational purposes only. Please consult with a
                qualified legal professional regarding data protection laws
                applicable to Uganda and the GDPR if you serve EU residents.
                Chazon does not provide legal advice.
              </p>
            </div>

            <div className="prose prose-gray max-w-none">
              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-600 mb-4">
                  Chazon (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is
                  committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your
                  information when you use our website, mobile application, and
                  related services (collectively, the &quot;Platform&quot;).
                </p>
                <p className="text-gray-600">
                  Please read this Privacy Policy carefully. By accessing or
                  using the Platform, you acknowledge that you have read,
                  understood, and agree to be bound by all the terms of this
                  Privacy Policy.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  2. Information We Collect
                </h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  2.1 Information You Provide
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                  <li>
                    <strong>Account Information:</strong> Name, email address,
                    phone number, password, profile picture
                  </li>
                  <li>
                    <strong>Verification Information:</strong> ID documents,
                    phone verification records
                  </li>
                  <li>
                    <strong>Service Information:</strong> Service listings,
                    descriptions, photos, pricing
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Payment method details
                    (processed through third-party payment providers)
                  </li>
                  <li>
                    <strong>Communications:</strong> Messages sent through the
                    Platform, feedback, reviews
                  </li>
                  <li>
                    <strong>Supporting Documents:</strong> Business licenses,
                    insurance certificates (for Stewards)
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  2.2 Information Collected Automatically
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                  <li>
                    <strong>Device Information:</strong> Browser type, operating
                    system, device identifiers
                  </li>
                  <li>
                    <strong>Usage Data:</strong> Pages visited, features used,
                    time spent, click patterns
                  </li>
                  <li>
                    <strong>Location Data:</strong> IP address, general
                    location, GPS data (with consent)
                  </li>
                  <li>
                    <strong>Log Data:</strong> Access times, error logs,
                    referring URLs
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  2.3 Information from Third Parties
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>
                    Social media platforms (if you sign in via social media)
                  </li>
                  <li>Payment processors (transaction history)</li>
                  <li>Background check providers (verification data)</li>
                  <li>Marketing partners (with your consent)</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-gray-600 mb-4">
                  We use the information we collect for the following purposes:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Provide, maintain, and improve the Platform</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, security alerts</li>
                  <li>Respond to your comments, questions, and requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>
                    Detect, investigate, and prevent fraudulent or illegal
                    activities
                  </li>
                  <li>Verify identity and prevent unauthorized access</li>
                  <li>Facilitate communication between Users</li>
                  <li>Personalize and improve your experience</li>
                  <li>Provide customer support</li>
                  <li>Enforce our Terms of Service and policies</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  4. How We Share Your Information
                </h2>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.1 Sharing with Other Users
                </h3>
                <p className="text-gray-600 mb-4">
                  To facilitate bookings and services, we share relevant
                  information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>
                    <strong>With Clients:</strong> Steward profile, contact
                    (after booking), service details
                  </li>
                  <li>
                    <strong>With Stewards:</strong> Client name, booking address
                    (after acceptance), contact
                  </li>
                  <li>
                    <strong>Neither party receives:</strong> Full phone numbers
                    or email addresses directly
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.2 Service Providers
                </h3>
                <p className="text-gray-600 mb-4">
                  We share information with third-party service providers who
                  assist us in:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Payment processing (Flutterwave)</li>
                  <li>SMS/voice services (Africa&apos;s Talking)</li>
                  <li>Cloud hosting and infrastructure</li>
                  <li>Analytics and tracking</li>
                  <li>Customer support</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.3 Legal Requirements
                </h3>
                <p className="text-gray-600 mb-4">
                  We may disclose information if required by law, court order,
                  or government request, including to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Comply with legal obligations</li>
                  <li>Protect our rights, privacy, safety, or property</li>
                  <li>Prevent fraud or illegal activity</li>
                  <li>Respond to emergencies involving danger</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  4.4 Business Transfers
                </h3>
                <p className="text-gray-600">
                  If Chazon is involved in a merger, acquisition, or sale of
                  assets, your information may be transferred as part of that
                  transaction.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  5. Data Security
                </h2>
                <p className="text-gray-600 mb-4">
                  We implement appropriate technical and organizational measures
                  to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Encryption of data in transit (TLS/SSL)</li>
                  <li>Encryption of sensitive data at rest</li>
                  <li>Regular security assessments and audits</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p className="text-gray-600">
                  While we strive to protect your information, no method of
                  transmission over the Internet or electronic storage is 100%
                  secure. We cannot guarantee absolute security.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  6. Data Retention
                </h2>
                <p className="text-gray-600 mb-4">
                  We retain your information for as long as your account is
                  active or as needed to provide services:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Account information: Until account deletion + 30 days</li>
                  <li>Transaction records: 7 years (financial compliance)</li>
                  <li>Communications: 3 years after account closure</li>
                  <li>Verification documents: Duration of account + 1 year</li>
                </ul>
                <p className="text-gray-600">
                  After these periods, data is securely deleted or anonymized.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  7. Your Rights
                </h2>
                <p className="text-gray-600 mb-4">
                  You have the following rights regarding your personal
                  information:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal
                    data
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of
                    inaccurate data
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your data
                    (subject to legal retention)
                  </li>
                  <li>
                    <strong>Portability:</strong> Receive your data in a
                    structured format
                  </li>
                  <li>
                    <strong>Objection:</strong> Object to certain processing
                    activities
                  </li>
                  <li>
                    <strong>Restriction:</strong> Request restriction of
                    processing
                  </li>
                  <li>
                    <strong>Withdraw Consent:</strong> Withdraw consent where
                    processing is based on consent
                  </li>
                </ul>
                <p className="text-gray-600">
                  To exercise these rights, contact us at privacy@chazon.com. We
                  will respond within 30 days.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  8. Cookies and Tracking
                </h2>
                <p className="text-gray-600 mb-4">
                  We use cookies and similar tracking technologies:
                </p>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  8.1 Types of Cookies
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>
                    <strong>Essential:</strong> Required for Platform
                    functionality
                  </li>
                  <li>
                    <strong>Analytics:</strong> Help us understand usage
                    patterns
                  </li>
                  <li>
                    <strong>Marketing:</strong> Used for advertising (with
                    consent)
                  </li>
                  <li>
                    <strong>Preferences:</strong> Remember your settings and
                    choices
                  </li>
                </ul>

                <h3 className="text-xl font-medium text-gray-800 mb-3">
                  8.2 Managing Cookies
                </h3>
                <p className="text-gray-600">
                  You can control cookies through your browser settings.
                  Disabling cookies may affect Platform functionality.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  9. Third-Party Links
                </h2>
                <p className="text-gray-600">
                  The Platform may contain links to third-party websites or
                  services. We are not responsible for the privacy practices of
                  these third parties. We encourage you to review their privacy
                  policies before providing any information.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  10. Children&apos;s Privacy
                </h2>
                <p className="text-gray-600">
                  The Platform is not intended for individuals under the age of
                  18. We do not knowingly collect personal information from
                  children. If we learn that we have collected information from
                  a child under 18, we will take steps to delete that
                  information promptly.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  11. International Data Transfers
                </h2>
                <p className="text-gray-600">
                  Your information may be transferred to and processed in
                  countries other than Uganda. When we transfer data
                  internationally, we ensure appropriate safeguards are in
                  place, such as standard contractual clauses or adequacy
                  decisions.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  12. Changes to This Policy
                </h2>
                <p className="text-gray-600 mb-4">
                  We may update this Privacy Policy from time to time. We will
                  notify you of material changes by:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                  <li>Posting the updated policy on the Platform</li>
                  <li>Sending an email notification</li>
                  <li>Displaying a notice on the Platform</li>
                </ul>
                <p className="text-gray-600">
                  Continued use after changes constitutes acceptance of the
                  updated policy.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  13. Contact Us
                </h2>
                <p className="text-gray-600 mb-4">
                  If you have questions about this Privacy Policy or our data
                  practices, please contact us:
                </p>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Chazon</strong>
                    <br />
                    AAA Complex, Bukoto-Kisaasi
                    <br />
                    Kampala, Uganda
                    <br />
                    <br />
                    <strong>Email:</strong> privacy@chazon.com
                    <br />
                    <strong>Phone:</strong> +256 788 433 163
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  14. Data Protection Officer
                </h2>
                <p className="text-gray-600">
                  For GDPR-related inquiries (if applicable), you may contact
                  our Data Protection Officer at dpo@chazon.com. You also have
                  the right to lodge a complaint with your local data protection
                  authority.
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
