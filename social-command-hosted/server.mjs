import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 10000);
const MCP_TOKEN = process.env.MCP_BEARER_TOKEN || '';
const BRAND = {
  company: 'Ross Tax Pro Software Co.',
  metricoolBrandId: '6883133',
  metricoolLabel: 'rosstaxprosoftwareco',
  timezone: 'America/Chicago',
  observedConnectedNetworks: ['TikTok'],
  observedAt: '2026-09-19'
};

const campaigns = [
  { title: '2026 Filing Season Readiness', network: 'TikTok', when: '2026-09-19 17:00 CDT', status: 'SCHEDULED' },
  { title: '2% Preparation-Fee Promotion + Consultation', network: 'TikTok', when: '2026-09-19 18:00 CDT', status: 'SCHEDULED' },
  { title: 'Now Hiring | Ross Tax Pro Software Co.', network: 'TikTok', when: '2026-09-19 19:30 CDT', status: 'SCHEDULED' },
  { title: 'Ross Tax Pro University + TAXPRAC', network: 'TikTok', when: '2026-09-19 21:00 CDT', status: 'SCHEDULED' },
  { title: 'Dependent Proof File | 2026 Filing Season', network: 'TikTok', when: '2026-09-20 10:00 CDT', status: 'SCHEDULED' },
  { title: 'Now Hiring | Ross Tax Pro Software Co.', network: 'TikTok', when: '2026-09-20 12:00 CDT', status: 'SCHEDULED' },
  { title: 'Verify Direct Deposit Details | 2026 Filing Season', network: 'TikTok', when: '2026-09-21 18:00 CDT', status: 'SCHEDULED' },
  { title: 'Build Your Tax File | 2026 Filing Season', network: 'TikTok', when: '2026-09-22 18:00 CDT', status: 'SCHEDULED' },
  { title: 'TAXPRAC Enterprise Suite', network: 'TikTok', when: '2026-09-23 10:00 CDT', status: 'SCHEDULED' },
  { title: 'Become a Tax Professional | RTPU', network: 'TikTok', when: '2026-09-24 10:00 CDT', status: 'SCHEDULED' },
  { title: '2026 Filing Season Client Promotion', network: 'TikTok', when: '2026-09-25 10:00 CDT', status: 'SCHEDULED' },
  { title: 'Protect Your Tax Information', network: 'TikTok', when: '2026-09-26 10:00 CDT', status: 'SCHEDULED' }
];

const seo = {
  property: 'rosstaxsoftware.com',
  technical: {
    robots: 'REGISTERED',
    sitemap: 'REGISTERED',
    structuredData: 'REVIEW_PER_ROUTE',
    canonicalPolicy: 'REVIEW_PER_ROUTE',
    searchConsole: 'NOT_CONNECTED_TO_THIS_HOST'
  },
  contentPillars: [
    'Tax preparation and bookkeeping',
    'Taxpayer education',
    'Ross Tax Pro University',
    'Tax professional hiring',
    'TAXPRAC software and ERO operations'
  ]
};

app.get('/health', (_req, res) => res.json({ ok: true, service: 'rtpsc-social-command', version: '1.0.0' }));
app.get('/api/status', (_req, res) => res.json({
  product: 'RTPSC Social Intelligence & Engagement Center',
  brand: BRAND,
  campaignCount: campaigns.length,
  externalPublishingMode: 'METRICOOL_SCHEDULED',
  directProviderPublishing: false,
  note: 'This hosted control plane does not fabricate provider analytics or delivery state.'
}));
app.get('/api/campaigns', (_req, res) => res.json({ items: campaigns }));
app.get('/api/seo', (_req, res) => res.json(seo));
app.get('/api/analytics', (_req, res) => res.json({
  dataMode: 'PROVIDER_DATA_NOT_BOUND_TO_THIS_HOST',
  metrics: {},
  note: 'Connect a provider analytics adapter before displaying reach, clicks, engagement or conversion metrics.'
}));

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RTPSC Social Command Center</title>
<style>
:root{--navy:#071827;--panel:#0d2237;--panel2:#102b45;--gold:#d4af37;--text:#edf5fb;--muted:#9fb2c3;--green:#22c55e;--line:#24415b}*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:#06111d;color:var(--text)}header{padding:24px 28px;background:linear-gradient(120deg,#06111d,#0a2741);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;align-items:center}h1{margin:4px 0 6px;font-size:28px}.eyebrow{font-size:11px;letter-spacing:.16em;color:var(--gold);font-weight:800}.sub{color:var(--muted);font-size:13px}.badge{border:1px solid #245c42;background:#0b3322;color:#7ff0a9;padding:9px 12px;border-radius:999px;font-weight:800;font-size:12px}main{max-width:1500px;margin:auto;padding:22px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.18)}.card span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.card b{font-size:24px;display:block;margin-top:6px}.wide{grid-column:1/-1}.split{display:grid;grid-template-columns:1.3fr .7fr;gap:12px;margin-top:12px}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:10px 8px;border-top:1px solid var(--line);text-align:left}th{color:#b8c6d4}.status{color:#7ff0a9;font-weight:800}.pill{display:inline-block;padding:4px 7px;border-radius:999px;background:#163957;color:#cbe8ff;font-size:10px;margin:3px 4px 0 0}.notice{background:#0c2a1c;border:1px solid #1e6844;color:#bffbd5;border-radius:12px;padding:13px;margin-bottom:12px}.sectionTitle{display:flex;justify-content:space-between;gap:10px;align-items:center}.sectionTitle h2{font-size:17px;margin:0}.sectionTitle small{color:var(--muted)}footer{max-width:1500px;margin:auto;padding:0 22px 24px;color:#7890a4;font-size:11px}@media(max-width:950px){.grid{grid-template-columns:repeat(2,1fr)}.split{grid-template-columns:1fr}}@media(max-width:620px){header{display:block}.badge{display:inline-block;margin-top:12px}.grid{grid-template-columns:1fr}main{padding:13px}.tableWrap{overflow:auto}}
</style></head><body>
<header><div><div class="eyebrow">ROSS TAX PRO SOFTWARE CO.</div><h1>Social Intelligence & Engagement Center</h1><div class="sub">Hosted control plane · ChatGPT/MCP adapter · campaign execution visibility · SEO governance</div></div><div class="badge">HOSTED SERVICE ONLINE</div></header>
<main><div class="notice">Campaign scheduling is active through the connected Metricool brand. This dashboard intentionally does not display invented analytics.</div>
<div class="grid">
<div class="card"><span>Scheduled campaigns</span><b>${campaigns.length}</b></div>
<div class="card"><span>Observed networks</span><b>${BRAND.observedConnectedNetworks.length}</b></div>
<div class="card"><span>Metricool brand</span><b style="font-size:16px">${BRAND.metricoolLabel}</b></div>
<div class="card"><span>Timezone</span><b style="font-size:16px">${BRAND.timezone}</b></div>
</div>
<div class="split">
<section class="card"><div class="sectionTitle"><h2>Campaign execution queue</h2><small>Current launch schedule</small></div><div class="tableWrap"><table><thead><tr><th>Campaign</th><th>Network</th><th>Scheduled</th><th>Status</th></tr></thead><tbody>
${campaigns.map(c=>`<tr><td>${c.title}</td><td>${c.network}</td><td>${c.when}</td><td class="status">${c.status}</td></tr>`).join('')}
</tbody></table></div></section>
<section class="card"><div class="sectionTitle"><h2>SEO center</h2><small>${seo.property}</small></div>
<p class="sub">Technical posture</p>
${Object.entries(seo.technical).map(([k,v])=>`<div style="padding:8px 0;border-top:1px solid var(--line)"><strong>${k}</strong><div class="sub">${v}</div></div>`).join('')}
<p class="sub" style="margin-top:14px">Content pillars</p>
${seo.contentPillars.map(x=>`<span class="pill">${x}</span>`).join('')}
</section></div>
<div class="card wide" style="margin-top:12px"><div class="sectionTitle"><h2>Connector posture</h2><small>/mcp</small></div><p class="sub">Bearer-protected MCP endpoint for ChatGPT-native status, campaign, SEO and analytics-readiness tools. Direct provider write actions remain disabled until first-party provider credentials and explicit dispatch logic are bound.</p></div>
</main><footer>Ross Tax Pro Software Co. · Social Command Center · No taxpayer-return data is exposed by this service.</footer>
</body></html>`;

app.get('/', (_req, res) => res.type('html').send(html));

const sessions = new Map();

function authorized(req) {
  if (!MCP_TOKEN) return false;
  return (req.headers.authorization || '') === `Bearer ${MCP_TOKEN}`;
}

function makeServer() {
  const server = new McpServer({ name: 'rtpsc-social-command', version: '1.0.0' });

  server.registerTool('get_social_status', {
    title: 'Get social command status',
    description: 'Read current Ross Tax Pro Software Co. social command status and observed connection metadata.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify({ brand: BRAND, campaignCount: campaigns.length, directProviderPublishing: false }, null, 2) }]
  }));

  server.registerTool('list_campaigns', {
    title: 'List campaigns',
    description: 'List currently registered scheduled social campaigns.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify(campaigns, null, 2) }]
  }));

  server.registerTool('get_seo_overview', {
    title: 'Get SEO overview',
    description: 'Read the hosted SEO control-center posture.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify(seo, null, 2) }]
  }));

  server.registerTool('get_analytics_readiness', {
    title: 'Get analytics readiness',
    description: 'Check whether real provider analytics are bound to this hosted service.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify({ dataMode: 'PROVIDER_DATA_NOT_BOUND_TO_THIS_HOST', fabricatedMetricsAllowed: false }, null, 2) }]
  }));

  server.registerTool('prepare_campaign_draft', {
    title: 'Prepare campaign draft',
    description: 'Prepare campaign copy for review without publishing externally.',
    inputSchema: {
      title: z.string().min(1).max(180),
      caption: z.string().min(1).max(12000),
      networks: z.array(z.string()).max(12)
    }
  }, async ({ title, caption, networks }) => ({
    content: [{ type: 'text', text: JSON.stringify({ status: 'DRAFT_PREPARED', title, caption, networks, externallyPublished: false }, null, 2) }]
  }));

  return server;
}

app.all('/mcp', async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: 'UNAUTHORIZED' });

  const sessionId = req.headers['mcp-session-id'];
  let transport = sessionId ? sessions.get(sessionId) : undefined;

  if (!transport && req.method === 'POST' && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => sessions.set(id, transport),
      onsessionclosed: (id) => sessions.delete(id)
    });
    const server = makeServer();
    await server.connect(transport);
  }

  if (!transport) return res.status(400).json({ error: 'INVALID_OR_MISSING_MCP_SESSION' });
  await transport.handleRequest(req, res, req.body);
});

app.listen(PORT, '0.0.0.0', () => console.log(`RTPSC Social Command Center listening on ${PORT}`));
