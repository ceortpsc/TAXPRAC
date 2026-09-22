"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type CalcResult = {
  status: string;
  tax_year_status: string;
  calculation: {
    operation: string;
    result: string;
    trace: string[];
    disclaimer: string;
  };
};

export default function AvalonPage() {
  const [operation, setOperation] = useState("reconciliation_delta");
  const [taxYear, setTaxYear] = useState(2025);
  const [values, setValues] = useState("1000, 975");
  const [prompt, setPrompt] = useState(
    "Explain what evidence should be reviewed before this reconciliation is approved."
  );
  const [calc, setCalc] = useState<CalcResult | null>(null);
  const [assistant, setAssistant] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function runCalculation(event: FormEvent) {
    event.preventDefault();
    setError("");
    const parsed = values
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value));

    const response = await fetch(
      (process.env.NEXT_PUBLIC_TAXPRAC_API_URL || "") +
        "/api/v1/avalon/calculate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, values: parsed, tax_year: taxYear }),
      }
    );

    if (!response.ok) {
      setError("Avalon calculation could not be completed.");
      return;
    }
    setCalc(await response.json());
  }

  async function runProAvalon() {
    setError("");
    const response = await fetch(
      (process.env.NEXT_PUBLIC_TAXPRAC_API_URL || "") +
        "/api/v1/proavalon/assist",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tax_year: taxYear }),
      }
    );
    if (!response.ok) {
      setError("ProAvalon assistance could not be completed.");
      return;
    }
    setAssistant(await response.json());
  }

  return (
    <main className="avalon-page">
      <header className="avalon-header">
        <Link href="/" className="brand">
          <img src="/rtpsc-logo.svg" alt="RTPSC" />
        </Link>
        <Link href="/sign-in" className="button button-outline">
          Secure Workspace
        </Link>
      </header>

      <section className="avalon-hero">
        <p className="eyebrow">NEW AGE • NEW VISION • NEW TECHNOLOGY</p>
        <h1>Avalon Intelligence</h1>
        <p>
          ProAvalon provides evidence-aware operational guidance. Avalon
          Calculation Engine performs deterministic, traceable calculations.
          AI may explain the result; it cannot override the math or fabricate
          external verification.
        </p>
      </section>

      <section className="avalon-grid">
        <article className="avalon-card">
          <h2>Avalon Calculation Engine</h2>
          <form onSubmit={runCalculation}>
            <label>
              Tax year
              <select value={taxYear} onChange={(e) => setTaxYear(Number(e.target.value))}>
                {[2020, 2021, 2022, 2023, 2024, 2025, 2026].map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label>
              Operation
              <select value={operation} onChange={(e) => setOperation(e.target.value)}>
                <option value="sum">Workpaper Sum</option>
                <option value="reconciliation_delta">Reconciliation Delta</option>
                <option value="percentage">Percentage</option>
                <option value="variance">Variance</option>
                <option value="evidence_score">Evidence Score</option>
              </select>
            </label>
            <label>
              Values
              <input value={values} onChange={(e) => setValues(e.target.value)} />
            </label>
            <button className="button button-gold" type="submit">
              Execute Calculation
            </button>
          </form>
          {calc && (
            <div className="execution-output">
              <strong>{calc.calculation.result}</strong>
              <span>{calc.tax_year_status}</span>
              <ol>
                {calc.calculation.trace.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p>{calc.calculation.disclaimer}</p>
            </div>
          )}
        </article>

        <article className="avalon-card">
          <h2>ProAvalon AI-Assisted Operations</h2>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={7} />
          <button className="button button-outline" onClick={runProAvalon}>
            Run ProAvalon
          </button>
          {assistant && (
            <pre className="execution-output">
              {JSON.stringify(assistant, null, 2)}
            </pre>
          )}
        </article>
      </section>

      <section className="policy-grid">
        <article>
          <h3>Purpose</h3>
          <p>Explain controls, reconcile operational values, identify evidence gaps, and support reviewer decisions.</p>
        </article>
        <article>
          <h3>Execution policy</h3>
          <p>No arbitrary code execution. No eval. No AI override of deterministic math. No external status is auto-verified.</p>
        </article>
        <article>
          <h3>Tax-year gate</h3>
          <p>2025 core rule pack active. 2020–2024 archive-source gated. 2026 tax-sensitive execution blocked pending final approved source packages.</p>
        </article>
        <article>
          <h3>Release control</h3>
          <p>Tax-sensitive or externally consequential actions require approved evidence, valid credentials, applicable signatures, and human release.</p>
        </article>
      </section>

      {error && <p className="error-banner">{error}</p>}
    </main>
  );
}
