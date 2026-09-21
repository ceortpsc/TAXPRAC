export class MetaGraphError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MetaGraphError';
    this.code = details.code ?? null;
    this.type = details.type ?? null;
    this.subcode = details.subcode ?? null;
    this.httpStatus = details.httpStatus ?? null;
    this.isTransient = Boolean(details.isTransient);
  }
}

function asBool(value) {
  return String(value || '').trim().toLowerCase() === 'true';
}

function requireHttpsUrl(value, fieldName) {
  if (!value) return null;
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }
  if (url.protocol !== 'https:') {
    throw new Error(`${fieldName} must use HTTPS.`);
  }
  return url.toString();
}

export class FacebookOrganicAdapter {
  constructor({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
    if (typeof fetchImpl !== 'function') {
      throw new Error('A fetch implementation is required.');
    }

    this.fetch = fetchImpl;
    this.pageId = String(env.META_PAGE_ID || '').trim();
    this.pageAccessToken = String(env.META_PAGE_ACCESS_TOKEN || '').trim();
    this.graphVersion = String(env.META_GRAPH_VERSION || '').trim();
    this.writeEnabled = asBool(env.FACEBOOK_DIRECT_PUBLISH_ENABLED);
    this.baseUrl = this.graphVersion
      ? `https://graph.facebook.com/${this.graphVersion}`
      : 'https://graph.facebook.com';
  }

  get configured() {
    return Boolean(this.pageId && this.pageAccessToken);
  }

  status() {
    return {
      provider: 'facebook_organic',
      mode: 'FIRST_PARTY_META_GRAPH_API',
      configured: this.configured,
      writeEnabled: this.writeEnabled,
      graphVersion: this.graphVersion || 'APP_DEFAULT',
      pageIdConfigured: Boolean(this.pageId),
      pageAccessTokenConfigured: Boolean(this.pageAccessToken),
      capabilities: [
        'READ_PAGE_PROFILE',
        'PUBLISH_TEXT_POST',
        'PUBLISH_LINK_POST',
        'PUBLISH_PHOTO_POST'
      ],
      secretsExposed: false
    };
  }

  assertConfigured() {
    if (!this.configured) {
      throw new Error(
        'Facebook direct connector is not configured. Set META_PAGE_ID and META_PAGE_ACCESS_TOKEN in the hosting secret store.'
      );
    }
  }

  assertWriteEnabled() {
    this.assertConfigured();
    if (!this.writeEnabled) {
      throw new Error(
        'Facebook direct publishing is disabled. Set FACEBOOK_DIRECT_PUBLISH_ENABLED=true only after approval controls are ready.'
      );
    }
  }

  async #request(path, { method = 'GET', params = {}, body = null } = {}) {
    this.assertConfigured();

    const url = new URL(`${this.baseUrl}/${String(path).replace(/^\/+/, '')}`);
    const requestInit = { method, headers: {} };

    if (method === 'GET') {
      const query = new URLSearchParams({
        ...Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
        ),
        access_token: this.pageAccessToken
      });
      url.search = query.toString();
    } else {
      const form = new URLSearchParams();
      for (const [key, value] of Object.entries(body || {})) {
        if (value !== undefined && value !== null && value !== '') {
          form.set(key, String(value));
        }
      }
      form.set('access_token', this.pageAccessToken);
      requestInit.headers['content-type'] = 'application/x-www-form-urlencoded';
      requestInit.body = form.toString();
    }

    const response = await this.fetch(url, requestInit);
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || payload?.error) {
      const apiError = payload?.error || {};
      throw new MetaGraphError(
        apiError.message || `Meta Graph API request failed with HTTP ${response.status}.`,
        {
          code: apiError.code,
          type: apiError.type,
          subcode: apiError.error_subcode,
          httpStatus: response.status,
          isTransient: apiError.is_transient
        }
      );
    }

    return payload || {};
  }

  async getPage() {
    return this.#request(this.pageId, {
      params: {
        fields: 'id,name,link,category,picture'
      }
    });
  }

  async publishTextPost({ message, link } = {}) {
    this.assertWriteEnabled();

    const normalizedMessage = String(message || '').trim();
    if (!normalizedMessage) throw new Error('message is required.');

    const normalizedLink = link ? requireHttpsUrl(link, 'link') : null;

    return this.#request(`${this.pageId}/feed`, {
      method: 'POST',
      body: {
        message: normalizedMessage,
        link: normalizedLink
      }
    });
  }

  async publishPhotoPost({ imageUrl, caption = '' } = {}) {
    this.assertWriteEnabled();

    const normalizedImageUrl = requireHttpsUrl(imageUrl, 'imageUrl');
    if (!normalizedImageUrl) throw new Error('imageUrl is required.');

    return this.#request(`${this.pageId}/photos`, {
      method: 'POST',
      body: {
        url: normalizedImageUrl,
        caption: String(caption || '').trim(),
        published: 'true'
      }
    });
  }
}
