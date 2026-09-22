# TAXPRAC

RTPSC / Ross Tax Pro Software Co. enterprise tax-operations platform.

## Production architecture

- FastAPI background/API service
- Celery workers and Redis
- Supabase operational persistence
- AWS infrastructure-as-code and security CI
- Next.js marketing/auth-gate frontend in `frontend/`
- ProAvalon evidence-aware operations assistant
- Avalon deterministic calculation engine

## ProAvalon

ProAvalon is the explanation and routing layer. It may:

- explain controls,
- identify evidence gaps,
- summarize calculation traces,
- route workflows,
- draft internal review notes,
- surface rule-pack status.

It does **not** independently verify an external IRS, processor, bank, filing,
signature, transcript, or authorization event.

## Avalon Calculation Engine

Avalon is deterministic and traceable. Supported operational calculations:

- workpaper sum,
- reconciliation delta,
- percentage,
- variance,
- evidence-completeness score.

Execution policy:

- no arbitrary code execution,
- no `eval`,
- AI cannot override deterministic math,
- 2025 core rule-pack status is active,
- 2020–2024 tax-sensitive execution is archived-source gated,
- 2026 tax-sensitive execution is final-source-package gated,
- canonical XML is not represented as IRS-valid MeF XML,
- consequential release remains evidence- and approval-gated.

## Marketing assets

The Next.js frontend is wired to these approved asset slots:

```
frontend/public/marketing/ross-tax-pro-brighter-tomorrows.webp
frontend/public/marketing/ross-tax-pro-secure-workspace.webp
frontend/public/marketing/2026-tax-season-starts-here.webp
frontend/public/marketing/ross-tax-pro-brand-blueprint.webp
```

The current ChatGPT/AppDeploy session contains the approved generated creatives for
those slots. The AppDeploy redeployment is currently quota-gated; the asset files
should be injected into the paths above during the next deployment window.

## Local development

Backend:

```bash
python -m pip install -r requirements.txt
uvicorn api_server:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Required runtime configuration is supplied through environment variables. Secrets
must not be committed to the repository.
