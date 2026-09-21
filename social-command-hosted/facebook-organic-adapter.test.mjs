import test from 'node:test';
import assert from 'node:assert/strict';
import { FacebookOrganicAdapter } from './facebook-organic-adapter.mjs';

test('status never exposes secrets', () => {
  const adapter = new FacebookOrganicAdapter({
    env: {
      META_PAGE_ID: '123',
      META_PAGE_ACCESS_TOKEN: 'secret',
      FACEBOOK_DIRECT_PUBLISH_ENABLED: 'true'
    },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) })
  });

  const status = adapter.status();
  assert.equal(status.configured, true);
  assert.equal(status.writeEnabled, true);
  assert.equal(Object.values(status).includes('secret'), false);
});

test('publishes a text post with the page token only in the outbound request', async () => {
  let request;
  const adapter = new FacebookOrganicAdapter({
    env: {
      META_PAGE_ID: '123',
      META_PAGE_ACCESS_TOKEN: 'secret',
      FACEBOOK_DIRECT_PUBLISH_ENABLED: 'true'
    },
    fetchImpl: async (url, init) => {
      request = { url: String(url), init };
      return { ok: true, status: 200, json: async () => ({ id: '123_456' }) };
    }
  });

  const result = await adapter.publishTextPost({
    message: '2026 Tax Season readiness is live.',
    link: 'https://www.rosstaxsoftware.com'
  });

  assert.equal(result.id, '123_456');
  assert.match(request.url, /123\/feed$/);
  assert.match(request.init.body, /message=2026\+Tax\+Season/);
  assert.match(request.init.body, /access_token=secret/);
});

test('blocks writes until explicitly enabled', async () => {
  const adapter = new FacebookOrganicAdapter({
    env: {
      META_PAGE_ID: '123',
      META_PAGE_ACCESS_TOKEN: 'secret',
      FACEBOOK_DIRECT_PUBLISH_ENABLED: 'false'
    },
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) })
  });

  await assert.rejects(
    adapter.publishTextPost({ message: 'blocked' }),
    /direct publishing is disabled/i
  );
});
