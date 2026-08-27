# Iris model proxy

`iris.js` keeps the model API key **server-side**. The browser never sees it.

## Deploy (Vercel)

```
vercel                       # first deploy, links the project
vercel env add GROQ_API_KEY  # paste a FRESH key — see rotation note below
vercel --prod
```

Then set the endpoint in `js/config/config.js`:

```js
IRIS_ENDPOINT: '/api/iris'
```

## Deploy (Netlify)

Move this file to `netlify/functions/iris.js`, set `GROQ_API_KEY` under
Site settings → Environment variables, and use `IRIS_ENDPOINT: '/.netlify/functions/iris'`.

## No proxy?

Leave `IRIS_ENDPOINT: null`. Iris still answers — it falls back to the local
`window.PORTFOLIO_CORPUS` index (see `js/data/corpus.js`). Nothing breaks.

## ⚠️ Key rotation

The key that previously lived in `js/config/api-keys.js` was readable by
anyone who loaded the site. **Revoke it at https://console.groq.com/keys and
issue a new one** before configuring this proxy.
