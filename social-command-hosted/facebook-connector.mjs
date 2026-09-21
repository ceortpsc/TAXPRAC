export const FACEBOOK_BRAND_DEFAULTS = Object.freeze({
  company: 'Ross Tax Pro Software Co.',
  phone: '512-489-6749',
  email: 'help@rosstaxsoftware.com',
  websites: [
    'https://www.rosstaxsoftware.com',
    'https://www.rosstaxprosoftwareco.com'
  ]
});

export function buildFacebookConnector(adapter) {
  const status = adapter.status();

  return {
    id: 'facebook',
    label: 'Facebook',
    state: status.configured
      ? (status.writeEnabled ? 'DIRECT_ADAPTER_ACTIVE' : 'DIRECT_ADAPTER_READY')
      : 'AUTHORIZATION_REQUIRED',
    mode: 'First-party Meta Graph API',
    oauthEnv: 'FACEBOOK_OAUTH_URL',
    capabilities: status.capabilities,
    directPublishing: status.configured && status.writeEnabled,
    configured: status.configured
  };
}

export function normalizeFacebookDraft({ message, link = null, imageUrl = null, approvalReference = '' }) {
  const normalized = {
    message: String(message || '').trim(),
    link: link || null,
    imageUrl: imageUrl || null,
    approvalReference: String(approvalReference || '').trim()
  };

  if (!normalized.message) throw new Error('message is required.');
  if (!normalized.approvalReference) {
    throw new Error('approvalReference is required for an auditable external publication.');
  }

  return normalized;
}
