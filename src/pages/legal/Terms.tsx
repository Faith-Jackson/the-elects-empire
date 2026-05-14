
import LegalPageLayout from '../../components/layout/LegalPageLayout';

export default function Terms() {
  return (
    <LegalPageLayout title="Terms of Service">
      <section className="space-y-4">
        <p>By accessing or using Elects Empire, users agree to comply with these Terms of Service. If users do not agree, they should discontinue use of the platform.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Purpose</h2>
        <p>Elects Empire provides Christian-centered educational, spiritual, and community resources.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">User Responsibilities</h2>
        <p>Users agree to respect others, avoid harassment, maintain accurate account information, and use the platform responsibly in alignment with community standards.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">AI-Generated Content</h2>
        <p>Users remain responsible for how they interpret, apply, share, or distribute AI-generated materials.</p>
      </section>
    </LegalPageLayout>
  );
}
