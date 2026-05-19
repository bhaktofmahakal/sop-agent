const ALLOWED_HOSTS = new Set([
  'api.groq.com',
  'api.openai.com',
  'api.anthropic.com'
]);

const ALLOWED_FORWARD_HEADERS = new Set([
  'authorization',
  'content-type',
  'x-api-key',
  'anthropic-version'
]);

function getAllowedOrigin(req) {
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin || !host) return '';
  try {
    const originHost = new URL(origin).host;
    return originHost === host ? origin : '';
  } catch {
    return '';
  }
}

function setCors(res, origin) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key, anthropic-version'
  );
}

function filterForwardHeaders(headers = {}) {
  const filtered = {};
  for (const [key, value] of Object.entries(headers)) {
    if (ALLOWED_FORWARD_HEADERS.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

module.exports = async function handler(req, res) {
  const allowedOrigin = getAllowedOrigin(req);
  if (req.headers.origin && !allowedOrigin) {
    res.status(403).json({ error: 'Origin not allowed.' });
    return;
  }
  setCors(res, allowedOrigin);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      res.status(400).json({ error: 'Invalid JSON payload.' });
      return;
    }
  }

  const request = payload?.request;
  if (!request?.url || !request?.options) {
    res.status(400).json({ error: 'Missing request payload.' });
    return;
  }

  let target;
  try {
    target = new URL(request.url);
  } catch {
    res.status(400).json({ error: 'Invalid target URL.' });
    return;
  }

  if (!ALLOWED_HOSTS.has(target.hostname)) {
    res.status(400).json({ error: 'Target host not allowed.' });
    return;
  }

  const method = (request.options.method || 'GET').toUpperCase();
  if (method !== 'POST') {
    res.status(400).json({ error: 'Only POST requests are supported.' });
    return;
  }

  try {
    const upstreamRes = await fetch(request.url, {
      ...request.options,
      headers: filterForwardHeaders(request.options.headers)
    });
    const text = await upstreamRes.text();
    const contentType = upstreamRes.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'application/json');
    }
    res.status(upstreamRes.status).send(text);
  } catch (error) {
    res.status(502).json({ error: 'Upstream request failed.' });
  }
};
