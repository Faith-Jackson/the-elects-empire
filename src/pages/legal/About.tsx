
import LegalPageLayout from '../../components/layout/LegalPageLayout';

export default function About() {
  return (
    <LegalPageLayout title="About Us">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Who We Are</h2>
        <p>
          Elects Empire is a Christ-centered digital ecosystem created to give believers around the world a complete, accessible, and spiritually enriching experience in one place. The vision behind Elects Empire is simple yet powerful: every believer should have access to deep spiritual growth, biblical understanding, Christian fellowship, and life-transforming resources without financial limitations or unnecessary barriers.
        </p>
        <p>
          Elects Empire was built from the understanding that many believers genuinely desire to know God more deeply but often lack access to the right materials, communities, guidance, or platforms. Many people cannot afford books, courses, devotionals, theological resources, or mentorship opportunities. Others simply do not know where to begin. Elects Empire exists to bridge that gap.
        </p>
        <p>
          The platform is designed to become an all-in-one Christian environment where believers can learn, grow, fellowship, pray, engage, and develop spiritually through technology.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Our Mission</h2>
        <p>
          Our mission is to help believers gain a clearer understanding of Christ by providing free, accessible, spiritually sound, and community-driven resources that strengthen faith, deepen biblical understanding, and encourage spiritual growth.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Our Vision</h2>
        <p>
          Our vision is to build a global Christian ecosystem where believers can find everything they need for spiritual development in one place. We aim to create a unified, Christ-centered environment that encourages growth, love, community, discipleship, and practical support among believers worldwide.
        </p>
        <p>
          We envision a future where technology becomes a tool for spreading truth, strengthening believers, and building communities centered entirely around Christ.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-[var(--color-text)]">Core Values</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Christ-Centered Living:</strong> Everything within Elects Empire is built around Christ, biblical truth, spiritual growth, and the advancement of God’s kingdom.</li>
          <li><strong>Integrity:</strong> We are committed to honesty, transparency, fairness, and accountability.</li>
          <li><strong>Love:</strong> We believe love is central to Christian living.</li>
          <li><strong>Community:</strong> We believe believers grow stronger together.</li>
          <li><strong>Growth:</strong> We are committed to helping believers grow spiritually, intellectually, emotionally, and practically.</li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
