
import LegalPageLayout from '../../components/layout/LegalPageLayout';

export default function AcceptableUse() {
  return (
    <LegalPageLayout title="Acceptable Use Policy">
      <section className="space-y-4">
        <p>This Acceptable Use Policy defines expected behavior within Elects Empire and its related tools and communities.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Expected Conduct</h2>
        <p>Users are expected to engage respectfully, encourage healthy discussions, promote unity, and treat others with love.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Prohibited Conduct</h2>
        <p>Harassment, hate speech, threats, spamming, malicious attacks, fraudulent behavior, and commercial resale of free resources are strictly prohibited.</p>
      </section>
    </LegalPageLayout>
  );
}
