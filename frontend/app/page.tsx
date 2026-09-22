import Link from "next/link";
import { campaignAssets, routes } from "../lib/marketing";

const productCards = [
  {
    id: "tax-software",
    title: "TAXPRAC Tax Software",
    copy: "Structured return operations, evidence-aware workflows, diagnostics, review gates, and source-of-truth controls.",
  },
  {
    id: "client-services",
    title: "Client Lifecycle",
    copy: "Intake, document collection, preparation, review, e-file readiness, funding, follow-up, and closure.",
  },
  {
    id: "ero-resources",
    title: "ERO Resources",
    copy: "Readiness tools, compliance resources, processor operations, templates, checklists, and support.",
  },
  {
    id: "training",
    title: "Training & Academy",
    copy: "Professional development, software walkthroughs, compliance education, and career-development resources.",
  },
];

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RTPSC TAXPRAC",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    provider: {
      "@type": "Organization",
      name: "Ross Tax Pro Software Co.",
      url: "https://www.rosstaxprosoftwareco.com",
    },
    description:
      "Enterprise tax operations, client workflow, ERO resources, training, compliance, and AI-assisted operational tooling.",
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="site-header">
        <Link href="/" className="brand">
          <img src="/rtpsc-logo.svg" alt="Ross Tax Pro Software Co." />
        </Link>
        <nav>
          <a href="#tax-software">Products</a>
          <a href="#client-services">Client Services</a>
          <a href="#ero-resources">ERO Resources</a>
          <a href="#training">Training</a>
          <Link href={routes.avalon}>Avalon</Link>
        </nav>
        <Link href={routes.secureSignIn} className="button button-outline">
          Secure Sign In
        </Link>
      </header>

      <section
        className="marketing-hero"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(3,24,47,.98), rgba(3,24,47,.80), rgba(3,24,47,.18)), url(" +
            campaignAssets.hero +
            ")",
        }}
      >
        <div className="hero-content">
          <p className="eyebrow">TAX PROFESSIONALS • POWER • PROGRESS</p>
          <h1>
            Smarter Software.
            <span> Stronger Results.</span>
          </h1>
          <p>
            A new-age tax operations platform combining TAXPRAC workflow,
            client lifecycle, compliance controls, training, ERO resources,
            and governed AI-assisted operations.
          </p>
          <div className="hero-actions">
            <Link href={routes.secureSignIn} className="button button-gold">
              Get Started
            </Link>
            <Link href={routes.avalon} className="button button-outline">
              Explore Avalon Intelligence
            </Link>
          </div>
        </div>
      </section>

      <section className="product-grid">
        {productCards.map((card) => (
          <article id={card.id} key={card.id} className="product-card">
            <span>RTPSC</span>
            <h2>{card.title}</h2>
            <p>{card.copy}</p>
            <Link href={routes.secureSignIn}>Open secure workspace →</Link>
          </article>
        ))}
      </section>

      <section
        id="readiness"
        className="campaign-split"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(3,24,47,.97), rgba(3,24,47,.55)), url(" +
            campaignAssets.season +
            ")",
        }}
      >
        <div>
          <p className="eyebrow">2026 SEASON READINESS</p>
          <h2>Prepare. Launch. Grow.</h2>
          <p>
            Secure software, real support, training, ERO tools, and controlled
            automation built for the 2026 operating environment.
          </p>
        </div>
      </section>

      <section className="brand-system">
        <div>
          <p className="eyebrow">BRAND AMBASSADOR • IDENTITY • GROWTH</p>
          <h2>More than software. A stronger tomorrow.</h2>
          <p>
            Campaign assets, product advertising, SEO-ready messaging, CTA
            routing, and brand identity are organized around one consistent
            RTPSC navy, gold, silver, and white visual system.
          </p>
        </div>
        <div
          className="brand-preview"
          style={{ backgroundImage: "url(" + campaignAssets.blueprint + ")" }}
          aria-label="RTPSC brand blueprint preview"
        />
      </section>

      <footer>
        <img src="/rtpsc-logo.svg" alt="RTPSC" />
        <div>
          <Link href="/sign-in">Secure Sign In</Link>
          <Link href="/products/avalon">Avalon Intelligence</Link>
          <a href="https://www.rosstaxsoftware.com">rosstaxsoftware.com</a>
          <a href="https://www.rosstaxprosoftwareco.com">Corporate site</a>
        </div>
        <p>© 2026 Ross Tax Pro Software Co. • Smarter Software. Stronger Results.</p>
      </footer>
    </main>
  );
}
