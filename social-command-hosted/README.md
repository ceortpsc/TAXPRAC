# RTPSC Social Command Center — Hosted Branch

This branch hosts a standalone Render web service for Ross Tax Pro Software Co.'s Social Intelligence & Engagement Center.

Endpoints:
- `/` — hosted dashboard
- `/health` — service health
- `/api/status` — brand/control posture
- `/api/campaigns` — scheduled campaign registry
- `/api/connections` — normalized provider registry
- `/api/facebook/status` — sanitized first-party Facebook adapter state
- `/api/seo` — SEO control overview
- `/api/analytics` — analytics binding state
- `/mcp` — bearer-protected MCP endpoint

## Facebook direct adapter

The first-party Facebook Organic lane is implemented with the Meta Graph API and remains fail-closed until secrets are configured.

Required secret-store values:
- `META_PAGE_ID`
- `META_PAGE_ACCESS_TOKEN`

Optional:
- `META_GRAPH_VERSION` — omit to use the Meta app's configured default Graph API version.
- `FACEBOOK_OAUTH_URL` — authorization URL surfaced by the connection registry when a separate OAuth broker is used.
- `FACEBOOK_DIRECT_PUBLISH_ENABLED=true` — independently enables direct write actions after approval controls are ready.

MCP tools:
- `get_facebook_connection_status`
- `get_facebook_page`
- `publish_facebook_post`
- `publish_facebook_photo_post`

Every direct publish tool requires an `approvalReference`. The service never returns the Page access token, never accepts Facebook passwords, and keeps provider secrets in the hosting secret store.

Approved Ross Tax Pro Software Co. publication contact block:
- 512-489-6749
- help@rosstaxsoftware.com
- https://www.rosstaxsoftware.com
- https://www.rosstaxprosoftwareco.com

Run `npm test` to execute the adapter unit tests.

The service intentionally does not fabricate social metrics or claim provider publication unless the provider returns a successful publication result.
