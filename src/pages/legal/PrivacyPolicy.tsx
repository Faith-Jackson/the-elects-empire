
import LegalPageLayout from '../../components/layout/LegalPageLayout';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <section className="space-y-4">
        <p>This Privacy Policy explains how Elects Empire collects, stores, uses, and protects user information across its applications, services, and community systems. By using Elects Empire, users agree to the practices outlined in this Privacy Policy.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Information We Collect</h2>
        <p>Elects Empire aims to collect only the minimum information necessary for account functionality and platform operations, including name/username, email address, authentication information, basic settings, and user-generated content.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">AI and Interaction Data</h2>
        <p>Some AI-powered features may temporarily process prompts or interactions to provide responses and improve experience. We do not actively use this data for advanced analytics, advertising, or commercial profiling.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Security & Retention</h2>
        <p>We do not intentionally sell user data. User-related information is stored while accounts are active. Users can request deletion. We take reasonable measures to protect data; however, no platform can guarantee absolute security.</p>
      </section>
    </LegalPageLayout>
  );
}
