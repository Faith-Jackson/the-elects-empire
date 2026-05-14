export default function Credits() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-6">
      <h1 className="text-4xl font-serif font-bold text-[var(--color-text)]">Credits & Acknowledgements</h1>
      <p className="text-[var(--color-text-muted)]">
        The Elects Empire is entirely designed, developed, and fueled by the relentless vision and dedication of <strong>Faith Jackson</strong>, known to many as <strong>The 13th Disciple</strong>. From the initial conceptualization of the architecture to the daily maintenance of its features, he acts as both the visionary architect and the lead developer. His commitment to this project stems from a profound desire to build tools that genuinely serve the Body of Christ, ensuring that the work is not only technically sound but spiritually foundational.
      </p>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Technology Stack</h2>
        <ul className="list-disc pl-5 text-[var(--color-text-muted)]">
          <li>React with Vite</li>
          <li>Firebase (Firestore, Authentication)</li>
          <li>Tailwind CSS</li>
          <li>Lucide React (Icons)</li>
          <li>Motion (Animations)</li>
          <li>Gemini AI (Spiritual Counsel)</li>
        </ul>
      </div>
      <p className="text-sm text-[var(--color-text-muted)]/50 pt-10">© 2026 The Elects Empire. All rights reserved.</p>
    </div>
  );
}
