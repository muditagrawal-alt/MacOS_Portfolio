/* ==========================================================================
   CI Quality Gate 3: Behavioural Component Suite (jsdom)
   --------------------------------------------------------------------------
   Fast, browserless checks of behaviour — not just "function exists".
   Section 0 is static wiring integrity: every inline handler and every menu
   command must call a function that actually exists, and every pane/folder a
   link points at must exist. That class of bug (a menu item calling a pane id
   that isn't there) is otherwise invisible until someone clicks it.

   Real-browser coverage (layout, media, camera, keyboard) lives in
   scripts/test-e2e.js.
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT_DIR = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

console.log('🧪 [CI Gate 3] Behavioural component suite…\n');

const dom = new JSDOM(html, { url: 'http://localhost:8899/', runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;
const { document } = window;

/* ── Browser API fakes ─────────────────────────────────────────────────── */
// No network in CI: every live lookup fails fast and the UI must cope.
window.fetch = () => Promise.reject(new Error('offline (test)'));

const audioParam = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {}, cancelScheduledValues() {} });
const audioNode = () => ({ connect() {}, disconnect() {}, start() {}, stop() {}, type: '', frequency: audioParam(), gain: audioParam(), Q: audioParam(), delayTime: audioParam() });
window.AudioContext = window.webkitAudioContext = function () {
    return {
        currentTime: 0, sampleRate: 44100, state: 'running', destination: {},
        resume: async () => {},
        createOscillator: audioNode, createGain: audioNode, createBiquadFilter: audioNode, createDelay: audioNode,
        createBuffer: () => ({ getChannelData: () => new Float32Array(1024) }),
        createBufferSource: () => ({ ...audioNode(), buffer: null })
    };
};

class FakeAudio {
    constructor() { this.attrs = {}; this.volume = 1; this.currentTime = 0; this.duration = NaN; this.paused = true; this.listeners = {}; }
    set src(v) { this.attrs.src = v; }
    get src() { return this.attrs.src || ''; }
    getAttribute(k) { return this.attrs[k] || null; }
    setAttribute(k, v) { this.attrs[k] = v; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    load() {}
}
window.Audio = FakeAudio;
window.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () {};

window.HTMLCanvasElement.prototype.getContext = function () {
    return new Proxy({}, { get: (t, k) => (k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
};
window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,iVBORw0KGgo=';

// The microphone must never be touched without consent — count every start.
window.__srStarts = 0;
window.SpeechRecognition = window.webkitSpeechRecognition = class { start() { window.__srStarts++; } stop() {} abort() {} };

// Camera: count getUserMedia calls and live tracks.
window.__gum = 0;
Object.defineProperty(window.navigator, 'mediaDevices', {
    value: {
        getUserMedia: async () => {
            window.__gum++;
            const track = { readyState: 'live', stop() { this.readyState = 'ended'; } };
            (window.__tracks = window.__tracks || []).push(track);
            return { getTracks: () => [track] };
        }
    }
});
window.HTMLMediaElement.prototype.__defineSetter__('srcObject', function (v) { this._srcObject = v; });
window.HTMLMediaElement.prototype.__defineGetter__('srcObject', function () { return this._srcObject || null; });

/* ── Load the app in index.html order ──────────────────────────────────────
   As real <script> elements, not eval(): classic scripts share one global
   lexical scope (a top-level const in one file is visible to the next),
   which eval() does not reproduce. */
const scriptOrder = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map(m => m[1].split('?')[0]).filter(s => !/^https?:/.test(s));
const scriptErrors = [];
window.addEventListener('error', e => scriptErrors.push(`${e.message} (${e.filename || 'inline'})`));
document.querySelectorAll('script[src]').forEach(el => el.remove());
for (const scriptPath of scriptOrder) {
    const el = document.createElement('script');
    el.textContent = fs.readFileSync(path.join(ROOT_DIR, scriptPath), 'utf8') + `\n//# sourceURL=${scriptPath}`;
    document.body.appendChild(el);
}
const ev = document.createEvent('Event');
ev.initEvent('DOMContentLoaded', true, true);
document.dispatchEvent(ev);

let testCount = 0, passCount = 0, failCount = 0;
function assert(condition, name, details = '') {
    testCount++;
    if (condition) { passCount++; console.log(`  ✅ ${name}`); }
    else { failCount++; console.error(`  ❌ ${name}${details ? '  — ' + details : ''}`); }
}
const run = (fn) => { try { return fn(); } catch (e) { return e; } };

function finishAfter(ms) {
    return new Promise(r => setTimeout(r, ms));
}

(async () => {
    await finishAfter(250);   // let DOMContentLoaded timers settle

    /* ── 0. Wiring integrity ───────────────────────────────────────────── */
    console.log('--- 0. Wiring integrity ---');
    assert(scriptErrors.length === 0, `all ${scriptOrder.length} scripts load without errors`, scriptErrors.join(' | '));
    const NOT_FUNCS = new Set(['if', 'for', 'while', 'switch', 'return', 'typeof', 'function', 'setTimeout', 'Number', 'String', 'Boolean', 'parseInt', 'parseFloat', 'encodeURIComponent']);
    const stripStrings = (code) => String(code).replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, "''");
    const calledGlobals = (code) => [...stripStrings(code).matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)].map(m => m[2]).filter(n => !NOT_FUNCS.has(n));

    const handlerAttrs = [...document.querySelectorAll('*')].flatMap(el =>
        [...el.attributes].filter(a => /^on[a-z]+$/.test(a.name)).map(a => ({ el, code: a.value })));
    const missingHandlers = new Set();
    handlerAttrs.forEach(({ code }) => calledGlobals(code).forEach(n => { if (typeof window[n] !== 'function') missingHandlers.add(n); }));
    assert(missingHandlers.size === 0, `every inline handler in index.html calls a defined function (${handlerAttrs.length} handlers)`, [...missingHandlers].join(', '));

    const menuItems = [...Object.values(window.eval('APP_MENUS')), window.eval('DEFAULT_APP'), { menus: window.eval('SHARED_MENUS') }]
        .flatMap(a => Object.values(a.menus).flat()).filter(i => i.run);
    const missingMenu = new Set();
    menuItems.forEach(i => calledGlobals(i.run).forEach(n => { if (typeof window[n] !== 'function') missingMenu.add(n); }));
    assert(missingMenu.size === 0, `every menu-bar command calls a defined function (${menuItems.length} items)`, [...missingMenu].join(', '));

    const reserved = menuItems.filter(i => /^⌘[WQNTM]$/.test(i.shortcut || ''));
    assert(reserved.length === 0, 'no menu advertises a browser/OS-reserved shortcut (⌘W ⌘Q ⌘N ⌘T ⌘M)', reserved.map(i => i.label).join(', '));

    const jsSource = scriptOrder.map(s => fs.readFileSync(path.join(ROOT_DIR, s), 'utf8')).join('\n') + html;
    const panes = [...new Set([...jsSource.matchAll(/(?:openSettingsPane|switchSettingsTab)\(\s*'([\w-]+)'/g)].map(m => m[1]))];
    const missingPanes = panes.filter(p => !document.getElementById(`settings-pane-${p}`));
    assert(panes.length > 3 && missingPanes.length === 0, `every Settings pane that something links to exists (${panes.join(', ')})`, missingPanes.join(', '));

    const folders = [...new Set([...jsSource.matchAll(/(?:openFinderPane|finderSidebarNav)\(\s*'([\w-]+)'/g)].map(m => m[1]))];
    const alias = { experience: 'experience-folder', education: 'education-folder', projects: 'projects-folder', skills: 'skills-folder', shared: 'home', 'macintosh-hd': 'home', 'icloud-drive': 'documents', about: 'home' };
    const fsRoots = window.eval('AAKASH_STYLE_FS');
    const missingFolders = folders.filter(f => !fsRoots[alias[f] || f]);
    assert(missingFolders.length === 0, `every Finder location that something links to exists (${folders.length})`, missingFolders.join(', '));

    /* ── 1. Window manager ─────────────────────────────────────────────── */
    console.log('\n--- 1. Window manager ---');
    const wins = [...document.querySelectorAll('.window')].map(w => w.id);
    let wmOk = true, wmWhy = '';
    for (const id of wins) {
        const el = document.getElementById(id);
        window.openWindow(id);
        if (el.classList.contains('hidden') || window.getActiveWindow().id !== id) { wmOk = false; wmWhy = `${id} open/focus`; break; }
        window.minimizeWindow(id);
        if (!el.classList.contains('minimized')) { wmOk = false; wmWhy = `${id} minimise`; break; }
        window.openWindow(id);
        window.maximizeWindow(id);
        if (!el.classList.contains('is-maximized')) { wmOk = false; wmWhy = `${id} zoom`; break; }
        window.maximizeWindow(id);
        window.closeWindow(id);
        if (!el.classList.contains('hidden')) { wmOk = false; wmWhy = `${id} close`; break; }
    }
    assert(wmOk, `open / minimise / zoom / close work on all ${wins.length} windows`, wmWhy);

    const names = { 'welcome-window': `About ${window.PROFILE_DATA.first}`, 'finder-window': 'Finder', 'music-window': 'Music', 'photobooth-window': 'Photo Booth', 'breakout-window': 'Breakout', 'snake-window': 'Snake', 'terminal-window': 'Terminal', 'safari-window': 'Safari' };
    const wrongNames = Object.entries(names).filter(([id, n]) => { window.openWindow(id); const shown = document.querySelector('.app-name-item').textContent; window.closeWindow(id); return shown !== n; }).map(([id]) => id);
    assert(wrongNames.length === 0, 'the menu bar names the frontmost app', wrongNames.join(', '));

    window.openBreakout(); window.startBreakoutGame(); window.toggleBreakoutPause();
    window.minimizeWindow('breakout-window');
    assert(window.breakoutState().paused === true, 'minimising a paused game keeps it paused');
    window.breakoutOverlayAction();
    assert(window.breakoutState().paused === false && window.breakoutState().running === true, 'the overlay "Resume" resumes rather than restarting');
    window.closeBreakout();

    /* ── 2. Desktop, Quick Look, Finder ────────────────────────────────── */
    console.log('\n--- 2. Desktop, Quick Look & Finder ---');
    const noPreview = window.DESKTOP_FILES.filter(f => typeof f.preview !== 'function').map(f => f.id);
    assert(noPreview.length === 0, 'every desktop file can be Quick Looked', noPreview.join(', '));
    window.openQuickLook('readme');
    assert(document.getElementById('quicklook-overlay').classList.contains('active') && document.getElementById('ql-title').textContent === 'README.txt' && /GETTING AROUND/.test(document.getElementById('ql-content').textContent), 'Quick Look renders README.txt as text');
    window.closeQuickLook();

    const deskFolder = fsRoots.desktop.items.map(id => window.eval('FS_ITEMS')[id].name);
    assert(window.DESKTOP_FILES.every(f => deskFolder.includes(f.name)), 'Finder’s Desktop folder mirrors the real desktop');
    assert(fsRoots.trash.items.length === window.TRASH_ITEMS.length, 'Finder’s Trash and Trash.app share one dataset');
    const fsItems = window.eval('FS_ITEMS');
    assert(Boolean(fsItems['profile-pic'].src) && Boolean(fsItems['wallpaper-tahoe'].src), 'image files carry a real image to preview');

    /* ── 3. Notes & Mail ───────────────────────────────────────────────── */
    console.log('\n--- 3. Notes & Mail ---');
    // One sidebar row per folder in the info bank's notes, and none of them empty.
    const folderIds = [...document.querySelectorAll('.notes-sidebar .sidebar-item[data-category]')].map(r => r.dataset.category).filter(c => c !== 'all');
    assert(folderIds.length === window.eval('notesFolders()').length && folderIds.length > 0, 'the Notes sidebar lists the info bank’s folders', folderIds.join(', '));
    const emptyFolders = folderIds.filter(c => { window.switchNotesCategory(c); return document.querySelectorAll('#notes-list .note-item').length === 0; });
    window.switchNotesCategory('all');
    assert(emptyFolders.length === 0, 'every Notes folder shows its notes', emptyFolders.join(', '));
    window.addNewNotePrompt();
    document.getElementById('note-title-display').textContent = 'CI note';
    window.commitNoteEdit(window.eval('activeNoteId'));
    const stored = JSON.parse(window.localStorage.getItem('notes-user-v1') || '[]');
    assert(stored.some(n => n.title === 'CI note'), 'a new note is saved to localStorage');

    const store = window.eval('emailStore');
    store.unshift({ id: 999, mailbox: 'sent', senderName: '<img src=x onerror=1>', subject: '<b>x</b>', snippet: 's', from: 'f', to: 't', date: 'now', body: '', actions: [] });
    window.switchMailbox('sent', null);
    assert(!document.querySelector('#mail-list-items img') && !document.querySelector('#mail-list-items b'), 'Mail never renders visitor-typed text as HTML');
    window.switchMailbox('drafts', null);
    window.switchMailbox('inbox', null);
    assert(document.getElementById('mail-reader-actions').style.display !== 'none', 'reader actions return after visiting an empty mailbox');

    /* ── 4. Safari & utilities ─────────────────────────────────────────── */
    console.log('\n--- 4. Safari & utilities ---');
    const evil = '<img src=x onerror=alert(1)>';
    const out = window.buildSearchResultsHtml(evil, [{ title: 'T', snippet: '<span class="searchmatch">m</span><script>x</script>' }], { title: 'T', extract: '<b>e</b>' }, []);
    assert(!out.includes('<img src=x') && !out.includes('<script>'), 'Safari escapes the query and every Wikipedia field');
    assert(!/1,840,000/.test(window.searchStatsText(3, 1)), 'search stats are real numbers');
    assert(window.normaliseTypedUrl('github.com/octocat') === 'https://github.com/octocat' &&window.normaliseTypedUrl('what is rag') === null && window.normaliseTypedUrl('javascript:alert(1)') === null, 'typed addresses navigate; phrases search; unsafe schemes refused');
    const m = window.evaluateMathExpression;
    assert(m('12*8') === 96 && m('2^8') === 256 && m('(1+2)*3') === 9 && m('2^3^2') === 512, 'calculator: arithmetic, precedence and powers');
    assert(m('1/0') === null && m('alert(1)') === null && m('42') === null, 'calculator rejects division by zero, code and bare numbers');

    /* ── 5. Iris ───────────────────────────────────────────────────────── */
    console.log('\n--- 5. Iris ---');
    assert(window.__srStarts === 0, 'the microphone is not started without consent');
    const brain = window.IrisBrain;
    // Asked about whoever the info bank describes, so this holds after `npm run setup`.
    const P = window.PROFILE_DATA;
    const who = brain.respond(`who is ${P.first}?`);
    assert(who.text.includes(P.name) && who.sources.length > 0, 'answers "who is …" from the profile, with sources');
    const knows = (skill) => brain.respond(`${P.pron.subject === 'they' ? 'do they' : `does ${P.pron.subject}`} know ${skill}?`).text.trim();
    const listed = P.skills.flatMap(g => g.items);
    const unlisted = ['Haskell', 'COBOL', 'Fortran'].find(s => !listed.some(i => i.toLowerCase() === s.toLowerCase()));
    assert(!listed.length || /^Yes/.test(knows(listed[0])), 'confirms a skill that is listed');
    assert(/don.t see/i.test(knows(unlisted)), 'says so when a skill is not listed');
    assert(brain.respond('what is the capital of Peru?').outOfScope === true, 'declines out-of-scope questions');
    const org = P.experience.length ? (P.experience[0].org.split(/[^A-Za-z0-9]+/).find(w => w.length >= 4 && !/^(the|and|for)$/i.test(w)) || '') : '';
    const work = org ? brain.respond(`tell me about ${P.pron.possessive} work at ${org}`) : null;
    assert(!work || (work.text.includes(org) && work.sources.some(s => s.label.includes(org))), 'employer questions cite that employer');
    assert(window.evaluateUserPromptSemantics('what is RAG?') === null, 'questions never trigger side effects');
    assert(window.evaluateUserPromptSemantics('open terminal') !== null, 'imperatives still run commands');
    window.closeWindow('terminal-window');

    /* ── 6. Settings, Control Centre, sound ───────────────────────────── */
    console.log('\n--- 6. Settings & Control Centre ---');
    assert(document.querySelectorAll('.theme-option.active').length === 1, 'exactly one Appearance option is selected on first load');
    window.setPreference('widgets', false);
    assert(document.body.classList.contains('hide-widgets'), 'Desktop & Dock ▸ widgets switch hides the widgets');
    window.setPreference('widgets', true);
    window.openControlCenter();
    window.setCcBrightness(50);
    assert(Math.abs(parseFloat(document.getElementById('display-dimmer').style.opacity) - 0.5) < 0.01, 'brightness dims the whole screen via the veil');
    window.setCcBrightness(100);
    window.setCcVolume(20);
    assert(Math.abs(window.getMusicVolume() - 0.16) < 0.02, 'system volume scales Music volume');
    window.setCcVolume(80);
    window.closeControlCenter();

    /* ── 7. Music, Photo Booth, Terminal ──────────────────────────────── */
    console.log('\n--- 7. Music, Photo Booth & Terminal ---');
    window.playMusicTrackIndex(2);
    assert(/Nocturne/.test(window.getMusicState().title) && window.getMusicState().playing, 'Music plays the chosen track');
    window.toggleMusicPlay();
    assert(window.getMusicState().playing === false, 'Music pauses');
    window.playAppleRadio('radio-paradise');
    assert(/Radio Paradise/.test(document.getElementById('music-lcd-track-title').textContent), 'a radio station plays');
    window.closeMusic();

    // Earlier sections opened/closed Photo Booth; let any in-flight camera
    // request settle (it must be released, since the window was closed).
    window.closePhotoBooth();
    await finishAfter(50);
    window.__gum = 0;
    window.openPhotoBooth();
    await finishAfter(50);
    assert(window.__gum === 1, 'opening Photo Booth requests the camera once', `${window.__gum} requests`);
    window.closePhotoBooth();
    assert((window.__tracks || []).every(t => t.readyState === 'ended'), 'closing Photo Booth releases the camera');

    const notFound = ['help', 'neofetch', 'whoami', 'ls projects/', 'cat resume.txt', 'curl me', 'sudo hire-me'].filter(cmd => {
        window.runTerminalCommand(cmd);
        const last = document.getElementById('terminal-output').lastElementChild;
        return !last || /command not found/.test(last.textContent);
    });
    assert(notFound.length === 0, 'Terminal understands its documented commands', notFound.join(', '));
    window.closeWindow('terminal-window');

    /* ── 8. Iris's model proxy (api/iris.js), with Groq and Gemini stubbed ── */
    console.log('\n--- 8. Iris model proxy ---');
    {
        const { OWNER } = await import(path.join(ROOT_DIR, 'api/_owner.js'));
        const origin = OWNER.origins[0];
        const realFetch = global.fetch;
        const calls = [];
        let replies = {};   // provider host → { status, body }
        global.fetch = async (url, init) => {
            calls.push({ host: new URL(url).host, body: JSON.parse(init.body) });
            const r = replies[new URL(url).host] || { status: 500, body: {} };
            return { ok: r.status === 200, status: r.status, json: async () => r.body };
        };
        process.env.GROQ_API_KEY = 'test-groq';
        process.env.GEMINI_API_KEY = 'test-gemini';
        const handler = (await import(path.join(ROOT_DIR, 'api/iris.js'))).default;
        const call = (body, headers = { origin }) => new Promise((resolve) => {
            const res = { code: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.code = c; return this; }, json(b) { resolve({ code: this.code, body: b }); }, end() { resolve({ code: this.code }); } };
            handler({ method: 'POST', headers: { ...headers, 'x-forwarded-for': `10.0.0.${Math.floor(Math.random() * 250)}` }, body, socket: {} }, res);
        });
        const answer = { status: 200, body: { choices: [{ message: { content: `Here it is. [[open:maps:${(P.hackathons[0] || { name: 'campus' }).name}]]` } }] } };
        const busyReply = { status: 429, body: {} };

        replies = { 'api.groq.com': answer, 'generativelanguage.googleapis.com': answer };
        const ok = await call({ messages: [{ role: 'user', content: 'show me where he competed' }], context: ['(passage)'], screen: 'Projects app, viewing Veritas Check' });
        const system = calls[0] ? calls[0].body.messages[0].content : '';
        assert(ok.code === 200 && ok.body.via === 'groq' && ok.body.reply === 'Here it is.' && ok.body.action && ok.body.action.app === 'maps' && ok.body.action.target,
            'Groq answers first; the reply and its [[open:…]] action come back separately', JSON.stringify(ok.body));
        assert(system.includes(OWNER.digest.slice(0, 60)) && /Veritas Check/.test(system) && /Never invent/.test(system) && /advocate/.test(system),
            'the model always gets the whole info bank, the screen, and the stay-positive-but-factual rules');
        assert(calls[0].body.model === (process.env.GROQ_MODEL || 'openai/gpt-oss-120b'), 'a free-tier Groq model by default', calls[0].body.model);

        calls.length = 0;
        replies = { 'api.groq.com': busyReply, 'generativelanguage.googleapis.com': answer };
        const backup = await call({ messages: [{ role: 'user', content: 'hi' }] });
        const gem = calls.find(c => c.host === 'generativelanguage.googleapis.com');
        assert(backup.code === 200 && backup.body.via === 'gemini' && gem && gem.body.model === (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite') && gem.body.messages[0].content === calls[0].body.messages[0].content,
            'Groq out of free-tier tokens: Gemini answers instead, with the same instructions', JSON.stringify({ code: backup.code, via: backup.body.via }));

        replies = { 'api.groq.com': busyReply, 'generativelanguage.googleapis.com': busyReply };
        const busy = await call({ messages: [{ role: 'user', content: 'hi' }] });
        assert(busy.code === 429, 'both out of tokens: the proxy says busy (the site then answers locally)', String(busy.code));
        const foreign = await call({ messages: [{ role: 'user', content: 'hi' }] }, { origin: 'https://evil.example' });
        assert(foreign.code === 403, 'other websites can’t use the proxy', String(foreign.code));
        const lookalike = await call({ messages: [{ role: 'user', content: 'hi' }] }, { referer: `${origin}.evil.example/` });
        assert(lookalike.code === 403, 'nor can one whose address only starts like the site’s', String(lookalike.code));

        replies = { 'api.groq.com': answer };
        const custom = await call({ messages: [{ role: 'user', content: 'hi' }] }, { origin: 'https://portfolio.example', host: 'portfolio.example' });
        assert(custom.code === 200, 'the site on any domain added to the deployment can use it', String(custom.code));
        global.fetch = realFetch;
    }

    /* ── 9. One address: a copy on GitHub Pages sends visitors to the site ── */
    console.log('\n--- 9. Site address ---');
    {
        const vm = require('vm');
        const SiteMeta = require(path.join(ROOT_DIR, 'setup/site-meta.js'));
        const visit = (siteUrl, page, href) => {
            const block = SiteMeta.renderMetaBlock({ ...P, site: { ...P.site, url: siteUrl } }, page);
            const script = (block.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
            const u = new URL(href);
            let went = null;
            if (script) vm.runInNewContext(script, { location: { hostname: u.hostname, search: u.search, hash: u.hash, replace: (to) => { went = to; } } });
            return { went, canonical: (block.match(/rel="canonical" href="([^"]+)"/) || [])[1] };
        };
        const site = 'https://portfolio.example/';
        const mirror = visit(site, 'ios', 'https://owner.github.io/repo/ios.html?view=ios#/maps');
        assert(mirror.went === 'https://portfolio.example/ios.html?view=ios#/maps' && mirror.canonical === 'https://portfolio.example/ios.html',
            'the GitHub Pages copy goes to the same page at the site’s address, deep link kept', JSON.stringify(mirror));
        assert(visit(site, 'mac', 'https://portfolio.example/#/x').went === null, 'the site itself never redirects');
        assert(visit('https://owner.github.io/repo/', 'mac', 'https://owner.github.io/repo/').went === null, 'nor does a site that lives on GitHub Pages');
        const none = visit('', 'mac', 'https://owner.github.io/repo/');
        assert(none.went === null && !none.canonical, 'with no address in the info bank, nothing is added');
    }

    console.log(`\n==================================================`);
    console.log(`Component Suite Summary: ${passCount} Passed, ${failCount} Failed out of ${testCount} tests`);
    console.log(`==================================================\n`);
    process.exit(failCount > 0 ? 1 : 0);
})();
