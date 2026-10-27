#!/usr/bin/env node
/* ==========================================================================
   Local server + setup questionnaire — `npm start` / `npm run setup`
   --------------------------------------------------------------------------
     npm start          serves the portfolio at http://localhost:8000. On the
                        first run in a fresh clone it opens the questionnaire
                        instead, so the site can be made yours before anything
                        else (skip it and it won't ask again).
     npm run setup      opens the questionnaire any time.
     npm run admin      the owner's admin: the same questionnaire, starting from
                        the current info bank, with a Publish button that
                        commits and pushes the content (setup/publish.js).

   Options: --port 8000  --no-open  --setup  --admin

   None of this is ever public: it runs on this machine only, and setup/ is
   excluded from the deployed site (_config.yml, .vercelignore).

   The questionnaire saves through POST /__setup/save, which writes the info
   bank and uploaded files (setup/apply.js); POST /__setup/tidy removes the
   files the previous info bank used. Only this machine can reach them:
   the server listens on 127.0.0.1 and refuses other Host headers (DNS
   rebinding) and cross-origin posts. No dependencies.
   ========================================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const setup = require('../setup/apply.js');
const publisher = require('../setup/publish.js');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const PORT = Number((args[args.indexOf('--port') + 1] || '').match(/^\d+$/) ? args[args.indexOf('--port') + 1] : process.env.PORT || 8000);
const MAX_BODY = 120 * 1024 * 1024;   // a demo video, base64-encoded

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
    '.ico': 'image/x-icon', '.pdf': 'application/pdf', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8'
};

const LOCAL_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]);

function send(res, status, body, type = 'application/json') {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let size = 0;
        const chunks = [];
        req.on('data', c => {
            size += c.length;
            if (size > MAX_BODY) { reject(new Error('Upload too large')); req.destroy(); return; }
            chunks.push(c);
        });
        req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        req.on('error', reject);
    });
}

async function handleSetupApi(req, res, route) {
    // Setup endpoints change files on disk: same-origin only.
    if (req.method === 'POST') {
        const origin = req.headers.origin || '';
        if (origin && !LOCAL_HOSTS.has(origin.replace(/^https?:\/\//, ''))) return send(res, 403, { error: 'Cross-origin request refused' });
    }
    if (route === 'status' && req.method === 'GET') {
        return send(res, 200, { pending: !setup.isSetupDone(ROOT), owner: setup.readProfile(ROOT).name || null });
    }
    if (route === 'config' && req.method === 'GET') {
        return send(res, 200, setup.readConfig(ROOT));
    }
    if (route === 'skip' && req.method === 'POST') {
        setup.markDone(setup.readProfile(ROOT).name, ROOT);
        return send(res, 200, { ok: true });
    }
    if (route === 'save' && req.method === 'POST') {
        try {
            const body = JSON.parse(await readBody(req));
            const { written, leftovers } = setup.saveSubmission(body.profile, { files: body.files || [], config: body.config }, ROOT);
            console.log(`  ✔ Saved your portfolio (${written.length} files): ${written.join(', ')}`);
            return send(res, 200, { ok: true, written, leftovers });
        } catch (e) {
            return send(res, 400, { error: e.message });
        }
    }
    if (route === 'publishing' && req.method === 'GET') {
        return send(res, 200, publisher.status(ROOT));
    }
    if (route === 'publish' && req.method === 'POST') {
        try {
            const result = publisher.publish(ROOT);
            console.log(result.published ? `  ✔ Published ${result.files.length} files to ${result.branch} (${result.commit})` : `  ${result.message}`);
            return send(res, 200, { ok: true, ...result });
        } catch (e) {
            return send(res, 400, { error: e.message });
        }
    }
    if (route === 'tidy' && req.method === 'POST') {
        const removed = setup.removeLeftovers(ROOT);
        console.log(`  ✔ Removed ${removed.length} unused files`);
        return send(res, 200, { ok: true, removed });
    }
    return send(res, 404, { error: 'Unknown setup endpoint' });
}

function serveStatic(req, res, urlPath) {
    let rel = decodeURIComponent(urlPath);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT + path.sep)) return send(res, 403, 'Forbidden', 'text/plain');
    // Never serve local secrets or tooling internals.
    if (/(^|[\\/])(\.env|\.git|\.portfolio|node_modules)([\\/]|$)/.test(path.relative(ROOT, file))) return send(res, 404, 'Not found', 'text/plain');
    fs.stat(file, (err, st) => {
        if (err || !st.isFile()) return send(res, 404, 'Not found', 'text/plain');
        const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
        const range = req.headers.range;
        if (range) {
            const [s, e] = range.replace('bytes=', '').split('-');
            const start = Number(s) || 0;
            const end = e ? Number(e) : st.size - 1;
            res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': type });
            return fs.createReadStream(file, { start, end }).pipe(res);
        }
        res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' });
        fs.createReadStream(file).pipe(res);
    });
}

const server = http.createServer((req, res) => {
    if (!LOCAL_HOSTS.has(req.headers.host || '')) return send(res, 421, 'This server only answers on localhost.', 'text/plain');
    const urlPath = (req.url || '/').split('?')[0];
    const api = urlPath.match(/^\/__setup\/([a-z]+)$/);
    if (api) return handleSetupApi(req, res, api[1]).catch(e => send(res, 500, { error: e.message }));
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain');
    serveStatic(req, res, urlPath);
});

function openBrowser(url) {
    if (flag('no-open') || process.env.CI) return;
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
    const cmdArgs = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    try { spawn(cmd, cmdArgs, { stdio: 'ignore', detached: true }).unref(); } catch (e) { /* no browser — the URL is printed */ }
}

server.listen(PORT, '127.0.0.1', () => {
    const base = `http://localhost:${PORT}/`;
    const firstRun = !setup.isSetupDone(ROOT);
    const openSetup = flag('setup') || firstRun;
    console.log(`\n  Portfolio running at ${base}`);
    console.log(`  iPhone version:     ${base}ios.html?view=ios`);
    console.log(`  Setup questionnaire: ${base}setup/`);
    console.log(`  Admin:              ${base}setup/?admin=1  (this machine only)\n`);
    if (firstRun && !flag('setup') && !flag('admin')) console.log('  First run here — opening the questionnaire so you can make it yours.\n');
    openBrowser(flag('admin') ? `${base}setup/?admin=1` : openSetup ? `${base}setup/` : base);
});

server.on('error', (e) => {
    console.error(e.code === 'EADDRINUSE' ? `  Port ${PORT} is busy — try: npm start -- --port 8001` : e.message);
    process.exit(1);
});
