import Link from "next/link";
import { campaignAssets, secureAppUrl } from "../../lib/marketing";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section
        className="auth-brand-panel"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(3,24,47,.92), rgba(3,24,47,.34)), url(" +
            campaignAssets.auth +
            ")",
        }}
      >
        <img src="/rtpsc-logo.svg" alt="Ross Tax Pro Software Co." />
        <div>
          <p className="eyebrow">SECURE • TRUSTED • CONTROLLED</p>
          <h1>Powering tax professionals without limits.</h1>
          <p>
            Smart tools. Stronger businesses. Brighter futures.
          </p>
        </div>
      </section>

      <section className="auth-gate">
        <div className="auth-card">
          <p className="eyebrow">RTPSC AUTH GATE</p>
          <h2>Secure RTPSC Workspace</h2>
          <p>
            Continue to the protected OAuth workspace for tax operations,
            client services, training, compliance, and enterprise tools.
          </p>
          <a className="button button-gold button-block" href={secureAppUrl}>
            Continue to Secure Sign In
          </a>
          <p className="fine-print">
            General acceptance of website terms is not taxpayer consent for
            disclosure or use of tax return information. Required taxpayer
            authorizations and consents remain separate, scoped controls.
          </p>
          <div className="legal-links">
            <Link href="/">Home</Link>
            <a href={secureAppUrl}>Privacy Notice</a>
            <a href={secureAppUrl}>Terms of Service</a>
            <a href={secureAppUrl}>Security Disclosure</a>
          </div>
        </div>
      </section>
    </main>
  );
}
