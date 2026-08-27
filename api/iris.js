/* ==========================================================================
   Iris — serverless model proxy  (Vercel / Netlify Functions compatible)
   --------------------------------------------------------------------------
   Deploy this, then set APP_CONFIG.IRIS_ENDPOINT in js/config/config.js to
   its URL (e.g. '/api/iris').

   The API key lives ONLY in the platform's environment variables. It is never
   sent to the browser. Set it with:
       vercel env add GROQ_API_KEY
   or in the Netlify dashboard under Site settings → Environment variables.
   ========================================================================== */

const ALLOWED_ORIGINS = [
    'https://muditagrawal-alt.github.io',
    'http://localhost:8899'
];

export default async function handler(req, res) {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const key = process.env.GROQ_API_KEY;
    if (!key) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    const { system, messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'messages[] required' });
    }

    // Clamp what a visitor can spend on your account.
    const trimmed = messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 2000)
    }));

    try {
        const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'system', content: String(system || '').slice(0, 8000) }, ...trimmed],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!upstream.ok) {
            return res.status(502).json({ error: 'Upstream model error', status: upstream.status });
        }

        const data = await upstream.json();
        const reply = data.choices?.[0]?.message?.content || null;
        return res.status(200).json({ reply });
    } catch (e) {
        return res.status(502).json({ error: 'Upstream unreachable' });
    }
}
