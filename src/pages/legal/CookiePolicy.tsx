
import LegalPageLayout from '../../components/layout/LegalPageLayout';

export default function CookiePolicy() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <section className="space-y-4">
        <p>This Cookie Policy explains how Elects Empire may use cookies and similar technologies across its applications.</p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">How We Use Cookies</h2>
        <p>Cookies are used to keep users logged in, maintain session security, remember preferences, and ensure platform stability.</p>
      </section>
    </LegalPageLayout>
  );
}
