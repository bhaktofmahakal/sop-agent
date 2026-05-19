const ALLOWED_HOSTS = new Set([
  'api.groq.com',
  'api.openai.com',
  'api.anthropic.com'
]);

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key, anthropic-version'
  );
}

module.exports = async function handler(req, res) {
  setCors(res);

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
      headers: request.options.headers || {}
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
