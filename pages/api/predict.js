// API route to call Python backend
const API_URL = process.env.API_URL || 'https://fakenews-oz9j.onrender.com';
const DEFAULT_TIMEOUT_MS = 60000; // 60s to allow cold-starts

function timeoutFetch(resource, options = {}, timeout = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

async function pingHealth(baseUrl) {
  try {
    const healthUrl = `${baseUrl}/health`;
    await timeoutFetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // avoid cached responses
      cache: 'no-store',
    }, DEFAULT_TIMEOUT_MS);
  } catch (_) {
    // ignore
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    // Call Python backend using native fetch with timeout/retries (Node 18+)
    const backendUrl = `${API_URL}/predict`;

    const attempt = async () => {
      const response = await timeoutFetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const textBody = await response.text();
      let json;
      try { json = JSON.parse(textBody); } catch (_) { /* non-JSON (e.g., HTML 502 page) */ }

      if (!response.ok) {
        return { ok: false, status: response.status, body: json || textBody };
      }
      return { ok: true, body: json };
    };

    const maxRetries = 3;
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const r = await attempt();
        if (r.ok) {
          return res.status(200).json(r.body);
        }
        const retriable = r.status === 502 || r.status === 504 || r.status === 500 || r.status === 503;
        if (retriable && i < maxRetries) {
          // Try to wake backend (Render cold start) before retrying
          await pingHealth(API_URL);
          await new Promise((s) => setTimeout(s, 5000));
          continue;
        }
        return res.status(r.status || 500).json({
          error: 'Backend request failed',
          status: r.status || 500,
          message: typeof r.body === 'string' ? r.body.slice(0, 500) : r.body,
          apiUrl: API_URL,
        });
      } catch (innerErr) {
        // Network/timeout error
        if (i < maxRetries) {
          await pingHealth(API_URL);
          await new Promise((s) => setTimeout(s, 5000));
          continue;
        }
        console.error('Prediction attempt failed:', innerErr);
        return res.status(504).json({
          error: 'Backend request timed out',
          message: innerErr.message || 'Timeout',
          apiUrl: API_URL,
        });
      }
    }
  } catch (error) {
    console.error('Prediction error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Prediction failed',
      message: error.message || 'Unknown error',
      apiUrl: API_URL
    });
  }
}

