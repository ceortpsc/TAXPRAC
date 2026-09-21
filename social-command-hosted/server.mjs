import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { FacebookOrganicAdapter } from './facebook-organic-adapter.mjs';
import { buildFacebookConnector, FACEBOOK_BRAND_DEFAULTS, normalizeFacebookDraft } from './facebook-connector.mjs';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 10000);
const MCP_TOKEN = process.env.MCP_BEARER_TOKEN || '';
const facebookAdapter = new FacebookOrganicAdapter();

const BRAND = {
  company: 'Ross Tax Pro Software Co.',
  metricoolBrandId: '6883133',
  metricoolLabel: 'rosstaxprosoftwareco',
  timezone: 'America/Chicago',
  observedConnectedNetworks: ['TikTok', 'Facebook'],
  observedAt: '2026-09-21',
  phone: FACEBOOK_BRAND_DEFAULTS.phone,
  email: FACEBOOK_BRAND_DEFAULTS.email,
  websites: FACEBOOK_BRAND_DEFAULTS.websites
};

const providerDefinitions = [
  { id:'tiktok', label:'TikTok', state:'CONNECTED_VIA_METRICOOL', mode:'Aggregator bridge', oauthEnv:null },
  buildFacebookConnector(facebookAdapter),
  { id:'instagram', label:'Instagram', state:'BRIDGE_READY_NOT_VERIFIED', mode:'Metricool bridge', oauthEnv:null },
  { id:'x', label:'X', state:'AUTHORIZATION_REQUIRED', mode:'Direct OAuth', oauthEnv:'X_OAUTH_URL' },
  { id:'linkedin', label:'LinkedIn', state:'AUTHORIZATION_REQUIRED', mode:'Direct OAuth or supported aggregator', oauthEnv:'LINKEDIN_OAUTH_URL' },
  { id:'youtube', label:'YouTube', state:'AUTHORIZATION_REQUIRED', mode:'Google OAuth', oauthEnv:'YOUTUBE_OAUTH_URL' },
  { id:'pinterest', label:'Pinterest', state:'AUTHORIZATION_REQUIRED', mode:'Direct OAuth', oauthEnv:'PINTEREST_OAUTH_URL' },
  { id:'threads', label:'Threads', state:'AUTHORIZATION_REQUIRED', mode:'Meta OAuth or supported aggregator', oauthEnv:'THREADS_OAUTH_URL' },
  { id:'bluesky', label:'Bluesky', state:'AUTHORIZATION_REQUIRED', mode:'App password / provider auth', oauthEnv:'BLUESKY_OAUTH_URL' },
  { id:'gmb', label:'Google Business Profile', state:'AUTHORIZATION_REQUIRED', mode:'Google OAuth or supported aggregator', oauthEnv:'GMB_OAUTH_URL' }
];

const isConnectedState = (state) => String(state || '').startsWith('CONNECTED') || String(state || '').startsWith('DIRECT_ADAPTER');

const connectionRegistry = () => providerDefinitions.map(p => ({
  ...p,
  connectUrlConfigured: p.oauthEnv ? Boolean(process.env[p.oauthEnv]) : false,
  connectUrl: p.oauthEnv && process.env[p.oauthEnv] ? process.env[p.oauthEnv] : null
}));

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

app.get('/health', (_req, res) => res.json({ ok: true, service: 'rtpsc-social-command', version: '1.2.0' }));
app.get('/api/status', (_req, res) => res.json({
  product: 'RTPSC Social Intelligence & Engagement Center',
  brand: BRAND,
  campaignCount: campaigns.length,
  externalPublishingMode: facebookAdapter.status().configured ? 'HYBRID_DIRECT_AND_AGGREGATOR' : 'METRICOOL_SCHEDULED',
  directProviderPublishing: facebookAdapter.status().configured && facebookAdapter.status().writeEnabled,
  facebook: facebookAdapter.status(),
  note: 'This hosted control plane does not fabricate provider analytics or delivery state.'
}));
app.get('/api/campaigns', (_req, res) => res.json({ items: campaigns }));
app.get('/api/connections', (_req, res) => res.json({ items: connectionRegistry() }));
app.get('/api/facebook/status', (_req, res) => res.json(facebookAdapter.status()));
app.get('/api/seo', (_req, res) => res.json(seo));
app.get('/api/analytics', (_req, res) => res.json({
  dataMode: 'PROVIDER_DATA_NOT_BOUND_TO_THIS_HOST',
  metrics: {},
  note: 'Connect a provider analytics adapter before displaying reach, clicks, engagement or conversion metrics.'
}));

app.get('/connect/:provider', (req, res) => {
  const provider = connectionRegistry().find(p => p.id === req.params.provider);
  if (!provider) return res.status(404).send('Unknown provider.');
  if (isConnectedState(provider.state)) return res.redirect('/');
  if (!provider.connectUrlConfigured || !provider.connectUrl) {
    return res.status(503).type('html').send(`<!doctype html><html><body style="font-family:system-ui;background:#071827;color:#fff;padding:40px"><h1>${provider.label} authorization is not configured yet</h1><p>This service will not invent an OAuth client or credential. Configure the provider application credentials and authorization URL first, then this button will open the provider's consent flow.</p><p><a href="/" style="color:#d4af37">Return to Social Command Center</a></p></body></html>`);
  }
  return res.redirect(provider.connectUrl);
});

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RTPSC Social Command Center</title>
<style>
:root{--navy:#071827;--panel:#0d2237;--panel2:#102b45;--gold:#d4af37;--text:#edf5fb;--muted:#9fb2c3;--green:#22c55e;--line:#24415b;--amber:#f2c94c}*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:#06111d;color:var(--text)}header{padding:24px 28px;background:linear-gradient(120deg,#06111d,#0a2741);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:20px;align-items:center}h1{margin:4px 0 6px;font-size:28px}.eyebrow{font-size:11px;letter-spacing:.16em;color:var(--gold);font-weight:800}.sub{color:var(--muted);font-size:13px}.badge{border:1px solid #245c42;background:#0b3322;color:#7ff0a9;padding:9px 12px;border-radius:999px;font-weight:800;font-size:12px}main{max-width:1500px;margin:auto;padding:22px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.card{background:linear-gradient(180deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.18)}.card span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.08em}.card b{font-size:24px;display:block;margin-top:6px}.wide{grid-column:1/-1}.split{display:grid;grid-template-columns:1.3fr .7fr;gap:12px;margin-top:12px}.connections{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:12px}.connection{border:1px solid var(--line);background:#0a1d30;border-radius:12px;padding:12px}.connection h3{margin:0 0 4px;font-size:14px}.connection .mode{font-size:10px;color:var(--muted);min-height:30px}.state{font-size:9px;font-weight:900;letter-spacing:.05em;margin:8px 0}.connected{color:#7ff0a9}.required{color:var(--amber)}.connectBtn{display:inline-block;margin-top:7px;padding:7px 9px;border-radius:7px;text-decoration:none;background:#163957;color:#d7ecff;font-size:10px;font-weight:800}.connectBtn.disabled{background:#182531;color:#6f8597;pointer-events:none}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:10px 8px;border-top:1px solid var(--line);text-align:left}th{color:#b8c6d4}.status{color:#7ff0a9;font-weight:800}.pill{display:inline-block;padding:4px 7px;border-radius:999px;background:#163957;color:#cbe8ff;font-size:10px;margin:3px 4px 0 0}.notice{background:#0c2a1c;border:1px solid #1e6844;color:#bffbd5;border-radius:12px;padding:13px;margin-bottom:12px}.warn{background:#30290d;border-color:#6c5a1c;color:#ffe68f}.sectionTitle{display:flex;justify-content:space-between;gap:10px;align-items:center}.sectionTitle h2{font-size:17px;margin:0}.sectionTitle small{color:var(--muted)}footer{max-width:1500px;margin:auto;padding:0 22px 24px;color:#7890a4;font-size:11px}@media(max-width:1100px){.connections{grid-template-columns:repeat(3,1fr)}}@media(max-width:950px){.grid{grid-template-columns:repeat(2,1fr)}.split{grid-template-columns:1fr}}@media(max-width:620px){header{display:block}.badge{display:inline-block;margin-top:12px}.grid,.connections{grid-template-columns:1fr}main{padding:13px}.tableWrap{overflow:auto}}
</style></head><body>
<header><div><div class="eyebrow">ROSS TAX PRO SOFTWARE CO.</div><h1>Social Intelligence & Engagement Center</h1><div class="sub">Hosted control plane · ChatGPT/MCP adapter · campaign execution visibility · SEO governance</div></div><div class="badge">HOSTED SERVICE ONLINE</div></header>
<main>
<div class="notice">Campaign scheduling remains available through the connected aggregator bridge. Facebook now also has a first-party Meta Graph adapter and MCP connector; it becomes active only when the Page ID and Page access token are configured in the secret store, and direct publishing remains independently gated. Other networks still require account-owner authorization.</div>
<div class="grid">
<div class="card"><span>Scheduled campaigns</span><b>${campaigns.length}</b></div>
<div class="card"><span>Observed networks</span><b>${BRAND.observedConnectedNetworks.length}</b></div>
<div class="card"><span>Metricool brand</span><b style="font-size:16px">${BRAND.metricoolLabel}</b></div>
<div class="card"><span>Timezone</span><b style="font-size:16px">${BRAND.timezone}</b></div>
</div>
<section class="card wide" style="margin-top:12px">
  <div class="sectionTitle"><h2>Social Connections</h2><small>Owner authorization required for third-party accounts</small></div>
  <div class="connections">
    ${connectionRegistry().map(p=>`<div class="connection"><h3>${p.label}</h3><div class="mode">${p.mode}</div><div class="state ${isConnectedState(p.state)?'connected':'required'}">${p.state}</div>${isConnectedState(p.state)?'<span class="connectBtn disabled">Connected</span>':p.connectUrlConfigured?`<a class="connectBtn" href="/connect/${p.id}">Authorize</a>`:'<span class="connectBtn disabled">OAuth setup required</span>'}</div>`).join('')}
  </div>
</section>
<div class="notice warn" style="margin-top:12px">For security, this service does not accept social-media passwords. Each network must be authorized through its official OAuth/consent flow, and client secrets must stay in the hosting secret store.</div>
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
<div class="card wide" style="margin-top:12px"><div class="sectionTitle"><h2>Connector posture</h2><small>/mcp</small></div><p class="sub">Bearer-protected MCP endpoint for ChatGPT-native status, campaign, SEO, connection-state and analytics-readiness tools. The Facebook direct lane uses the first-party Meta Graph adapter and requires an auditable approval reference plus the FACEBOOK_DIRECT_PUBLISH_ENABLED feature gate.</p></div>
</main><footer>Ross Tax Pro Software Co. · Social Command Center · No taxpayer-return data is exposed by this service.</footer>
</body></html>`;

app.get('/', (_req, res) => res.type('html').send(html));

const sessions = new Map();

function authorized(req) {
  if (!MCP_TOKEN) return false;
  return (req.headers.authorization || '') === `Bearer ${MCP_TOKEN}`;
}

function makeServer() {
  const server = new McpServer({ name: 'rtpsc-social-command', version: '1.2.0' });

  server.registerTool('get_social_status', {
    title: 'Get social command status',
    description: 'Read current Ross Tax Pro Software Co. social command status and observed connection metadata.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify({ brand: BRAND, campaignCount: campaigns.length, directProviderPublishing: facebookAdapter.status().configured && facebookAdapter.status().writeEnabled, facebook: facebookAdapter.status() }, null, 2) }]
  }));

  server.registerTool('list_social_connections', {
    title: 'List social connections',
    description: 'List observed and authorization-required social account connection states. Never returns secrets.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify(connectionRegistry().map(({connectUrl,...rest})=>rest), null, 2) }]
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


  server.registerTool('get_facebook_connection_status', {
    title: 'Get Facebook connection status',
    description: 'Read the sanitized first-party Facebook Page connector state without exposing access tokens or secrets.',
    inputSchema: {}
  }, async () => ({
    content: [{ type: 'text', text: JSON.stringify({ ...facebookAdapter.status(), brand: FACEBOOK_BRAND_DEFAULTS }, null, 2) }]
  }));

  server.registerTool('get_facebook_page', {
    title: 'Get Facebook Page',
    description: 'Read the configured Facebook Page profile through the first-party Meta Graph adapter.',
    inputSchema: {}
  }, async () => {
    try {
      const page = await facebookAdapter.getPage();
      return { content: [{ type: 'text', text: JSON.stringify(page, null, 2) }] };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({
          error: error?.name || 'FacebookConnectorError',
          message: error?.message || 'Facebook Page lookup failed.',
          code: error?.code ?? null,
          httpStatus: error?.httpStatus ?? null
        }, null, 2) }]
      };
    }
  });

  server.registerTool('publish_facebook_post', {
    title: 'Publish Facebook post',
    description: 'Publish an approved text or link post to the configured Facebook Page. Requires an approval reference and enabled direct publishing gate.',
    inputSchema: {
      message: z.string().min(1).max(10000),
      link: z.string().url().optional(),
      approvalReference: z.string().min(1).max(180)
    }
  }, async ({ message, link, approvalReference }) => {
    try {
      const draft = normalizeFacebookDraft({ message, link, approvalReference });
      const result = await facebookAdapter.publishTextPost({ message: draft.message, link: draft.link });
      return {
        content: [{ type: 'text', text: JSON.stringify({
          status: 'PUBLISHED',
          provider: 'facebook_organic',
          approvalReference: draft.approvalReference,
          result
        }, null, 2) }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({
          status: 'NOT_PUBLISHED',
          error: error?.name || 'FacebookConnectorError',
          message: error?.message || 'Facebook publication failed.',
          code: error?.code ?? null,
          httpStatus: error?.httpStatus ?? null
        }, null, 2) }]
      };
    }
  });

  server.registerTool('publish_facebook_photo_post', {
    title: 'Publish Facebook photo post',
    description: 'Publish an approved public HTTPS image with caption to the configured Facebook Page. Requires an approval reference and enabled direct publishing gate.',
    inputSchema: {
      imageUrl: z.string().url(),
      caption: z.string().max(10000).default(''),
      approvalReference: z.string().min(1).max(180)
    }
  }, async ({ imageUrl, caption, approvalReference }) => {
    try {
      const draft = normalizeFacebookDraft({
        message: caption || 'Approved Facebook photo publication',
        imageUrl,
        approvalReference
      });
      const result = await facebookAdapter.publishPhotoPost({
        imageUrl: draft.imageUrl,
        caption: caption || ''
      });
      return {
        content: [{ type: 'text', text: JSON.stringify({
          status: 'PUBLISHED',
          provider: 'facebook_organic',
          approvalReference: draft.approvalReference,
          result
        }, null, 2) }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify({
          status: 'NOT_PUBLISHED',
          error: error?.name || 'FacebookConnectorError',
          message: error?.message || 'Facebook photo publication failed.',
          code: error?.code ?? null,
          httpStatus: error?.httpStatus ?? null
        }, null, 2) }]
      };
    }
  });

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
