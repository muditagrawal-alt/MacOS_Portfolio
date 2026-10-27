/* ==========================================================================
   CI Quality Gate 4: Real-Browser End-to-End Suite (Playwright + Chromium)
   --------------------------------------------------------------------------
   Drives the actual site in Chromium and checks behaviour a visitor would
   notice: every Dock app opens, traffic lights work, the lock screen
   unlocks on click, the camera is released, no XSS from typed input, the
   phone layout fits, Iris cites sources and never touches the mic unasked…

   Deterministic by design: live APIs (GitHub, weather, Wikipedia, radio
   directory) are answered from fixtures, and the contact form is
   intercepted so a test can never send real email.

   Run:  npm run test:e2e            (all sections)
         npm run test:e2e -- safari  (sections matching a regex)
   Needs: npx playwright install chromium
   ========================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { chromium, devices } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const SHOTS = path.join(ROOT, 'test-results') + path.sep;
const setup = require('../setup/apply.js');
const { personalTokens, findTokens } = require('./personal-tokens.js');
// Expectations come from the info bank, so the suite still passes after `npm run setup`.
const P = setup.normalize(setup.readProfile(ROOT), ROOT);
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const firstWord = (org) => (org.split(/[^A-Za-z0-9]+/).find(w => w.length >= 4 && !/^(the|and|for)$/i.test(w)) || '');
fs.mkdirSync(SHOTS, { recursive: true });
let BASE = '';

/* ── Static server ─────────────────────────────────────────────────────── */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf', '.json': 'application/json' };
function startServer() {
    return new Promise(resolve => {
        const server = http.createServer((req, res) => {
            let p = decodeURIComponent(req.url.split('?')[0]);
            if (p.endsWith('/')) p += 'index.html';
            const file = path.join(ROOT, p);
            if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
            fs.createReadStream(file).pipe(res);
        });
        server.listen(0, '127.0.0.1', () => { BASE = `http://127.0.0.1:${server.address().port}/`; resolve(server); });
    });
}

/* ── Fixtures for live APIs ────────────────────────────────────────────── */
const GITHUB_FIXTURE = JSON.stringify([
    { name: 'Lighthouse', description: 'Sample repository', language: 'Python', stargazers_count: 3, pushed_at: new Date(Date.now() - 864e5).toISOString(), html_url: 'https://github.com/octocat/Lighthouse', fork: false, archived: false },
    { name: 'Sextant-Command-Line-Tool', description: 'Sample repository', language: 'Python', stargazers_count: 1, pushed_at: new Date(Date.now() - 3 * 864e5).toISOString(), html_url: 'https://github.com/octocat/Sextant-Command-Line-Tool', fork: false, archived: false }
]);
// Current conditions plus 24 hourly and 7 daily entries, timed from now (local time, as Open-Meteo's timezone=auto returns).
function WEATHER_FIXTURE() {
    const p = n => String(n).padStart(2, '0');
    const iso = d => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    const hours = [...Array(24)].map((_, i) => { const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + i); return `${iso(d)}T${p(d.getHours())}:00`; });
    const days = [...Array(7)].map((_, i) => iso(new Date(Date.now() + i * 864e5)));
    return JSON.stringify({
        current: { temperature_2m: 23.4, weather_code: 0, is_day: 0 },
        hourly: { time: hours, temperature_2m: hours.map((_, i) => 20 + (i % 6)), weather_code: hours.map((_, i) => [0, 1, 2, 3, 61, 2][i % 6]), is_day: hours.map((_, i) => (i > 8 && i < 20 ? 1 : 0)) },
        daily: { time: days, temperature_2m_max: [29, 30, 31, 28, 27, 30, 32], temperature_2m_min: [18, 19, 20, 17, 16, 19, 21], weather_code: [0, 1, 2, 61, 63, 3, 0] }
    });
}

async function routeLiveApis(ctx, page) {
    await ctx.route('https://api.github.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: GITHUB_FIXTURE }));
    await ctx.route('https://ipwho.is/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true,"latitude":28.61,"longitude":77.21,"city":"New Delhi","country_code":"IN"}' }));
    await ctx.route('https://api.open-meteo.com/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: WEATHER_FIXTURE() }));
    await ctx.route(/radio-browser\.info/, r => r.abort());
    await ctx.route(/i\.ytimg\.com|google\.com\/s2\/favicons/, r => r.fulfill({ status: 204 }));
    // Map tiles: a blank tile, so Maps never loads OpenStreetMap's servers from a test.
    await ctx.route(/tile\.openstreetmap\.org/, r => r.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64') }));
    // Never let a test send a real email.
    await ctx.route('https://api.web3forms.com/**', r => { page.__web3++; r.fulfill({ status: 200, contentType: 'application/json', body: '{"success":true}' }); });
}

/* ── Harness ───────────────────────────────────────────────────────────── */
const results = [];
async function launch() {
    return chromium.launch({
        executablePath: process.env.PW_CHROMIUM_PATH || undefined,
        args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required']
    });
}

async function freshPage(browser, { unlocked = true, viewport = { width: 1440, height: 900 }, reducedMotion = 'reduce', init, welcome = false } = {}) {
    const ctx = await browser.newContext({ viewport, reducedMotion, permissions: ['camera'], acceptDownloads: true });
    const page = await ctx.newPage();
    page.__web3 = 0;
    page.__errors = [];
    await routeLiveApis(ctx, page);
    page.on('pageerror', e => page.__errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) page.__errors.push('console: ' + m.text()); });
    if (unlocked) await page.addInitScript(() => { try { sessionStorage.setItem('mac-unlocked', 'true'); } catch (e) {} });
    if (!welcome) await page.addInitScript(() => { try { sessionStorage.setItem('mac-welcome-shown', '1'); } catch (e) {} });
    if (init) await page.addInitScript(init);
    await page.goto(BASE);
    await page.waitForTimeout(unlocked ? 900 : 300);
    return page;
}

const IPHONE = devices['iPhone 15 Pro'];
const IPAD = devices['iPad Pro 11'];
// iPadOS asks for desktop sites: a Mac user agent, but with multi-touch.
const IPADOS = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15', viewport: { width: 820, height: 1180 }, hasTouch: true, isMobile: false };
const IOS_APPS = ['about', 'projects', 'resume', 'photos', 'notes', 'weather', 'calculator', 'settings', 'messages', 'mail', 'safari', 'music'];

/** A page on the iPhone/iPad version. `device` is a Playwright descriptor. */
async function iosPage(browser, { device = IPHONE, unlocked = true, path = 'ios.html', init } = {}) {
    const ctx = await browser.newContext({ ...device, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await ctx.newPage();
    page.__web3 = 0;
    page.__errors = [];
    await routeLiveApis(ctx, page);
    page.on('pageerror', e => page.__errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_|net::/.test(m.text())) page.__errors.push('console: ' + m.text()); });
    if (unlocked) await page.addInitScript(() => { try { sessionStorage.setItem('ios-unlocked', '1'); } catch (e) {} });
    if (init) await page.addInitScript(init);
    await page.goto(BASE + path);
    await page.waitForTimeout(700);
    return page;
}

const iosGo = (page, app, path = []) => page.evaluate(([a, p]) => IOS.go(a, p), [app, path]).then(() => page.waitForTimeout(250));
const topPage = '.ios-app-window .ios-page:last-child';

async function test(name, fn) {
    try {
        await fn();
        results.push({ name, ok: true });
        console.log(`  ✅ ${name}`);
    } catch (e) {
        results.push({ name, ok: false, err: e.message });
        console.log(`  ❌ ${name}\n      ${String(e.message).split('\n')[0]}`);
    }
}

function expect(cond, msg) { if (!cond) throw new Error(msg || 'expectation failed'); }

function summary() {
    const pass = results.filter(r => r.ok).length;
    console.log(`\n==================================================`);
    console.log(`E2E Suite Summary: ${pass} Passed, ${results.length - pass} Failed out of ${results.length} tests`);
    console.log(`==================================================\n`);
    return results.length - pass;
}


const only = process.argv[2] ? new RegExp(process.argv[2], 'i') : null;
const section = (name) => !only || only.test(name);

(async () => {
  const server = await startServer();
  const browser = await launch();

  /* ───────────── Boot & lock ───────────── */
  if (section('boot')) {
    console.log('\nBoot & Lock');
    const page = await freshPage(browser, { unlocked: false, reducedMotion: 'no-preference' });
    await test('power gate is shown on first load', async () => {
      expect(await page.isVisible('#boot-power-gate.visible'), 'gate not visible');
    });
    await test('clicking the gate boots into the lock screen', async () => {
      await page.mouse.click(720, 450);
      await page.waitForSelector('#lock-screen-overlay.active', { timeout: 9000 });
    });
    await test('clicking "Swipe up to unlock" unlocks', async () => {
      await page.waitForTimeout(400);
      await page.click('#lock-swipe-hint');
      await page.waitForTimeout(900);
      const shown = await page.evaluate(() => getComputedStyle(document.getElementById('lock-screen-overlay')).display !== 'none');
      expect(!shown, 'lock screen still visible after clicking the unlock button');
    });
    await test('boot + unlock produced no runtime errors', async () => {
      expect(page.__errors.length === 0, page.__errors.join(' | '));
    });
    await page.context().close();

    const p2 = await freshPage(browser, { unlocked: false });
    await test('pressing Enter (no focus) unlocks the lock screen', async () => {
      await p2.waitForSelector('#lock-screen-overlay.active');
      await p2.keyboard.press('Enter');
      await p2.waitForTimeout(900);
      const shown = await p2.evaluate(() => getComputedStyle(document.getElementById('lock-screen-overlay')).display !== 'none');
      expect(!shown, 'still locked');
    });
    await test('a plain click on the lock screen unlocks (like waking a Mac)', async () => {
      await p2.evaluate(() => lockScreenNow());
      await p2.waitForTimeout(500);
      await p2.mouse.click(720, 300);
      await p2.waitForTimeout(900);
      const shown = await p2.evaluate(() => getComputedStyle(document.getElementById('lock-screen-overlay')).display !== 'none');
      expect(!shown, 'still locked after click');
    });
    await p2.context().close();
  }

  /* ───────────── Desktop ───────────── */
  if (section('desktop')) {
    console.log('\nDesktop');
    const page = await freshPage(browser);
    await page.screenshot({ path: SHOTS + 'desktop.png' });
    await test('desktop widgets never cover desktop icons', async () => {
      const overlaps = await page.evaluate(() => {
        const icons = [...document.querySelectorAll('.desktop-icon')].map(e => [e.querySelector('.desktop-icon-label').textContent, e.getBoundingClientRect()]);
        const widgets = [...document.querySelectorAll('.mac-widget-card')].map(e => e.getBoundingClientRect());
        const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return icons.filter(([, r]) => widgets.some(w => hit(r, w))).map(([n]) => n);
      });
      expect(overlaps.length === 0, 'covered: ' + overlaps.join(', '));
    });
    await test('every desktop icon is fully on screen above the dock', async () => {
      const off = await page.evaluate(() => {
        const dock = document.querySelector('.dock').getBoundingClientRect();
        return [...document.querySelectorAll('.desktop-icon')].filter(e => {
          const r = e.getBoundingClientRect();
          return r.bottom > dock.top && r.right > dock.left && r.left < dock.right || r.bottom > innerHeight || r.right > innerWidth;
        }).map(e => e.textContent.trim());
      });
      expect(off.length === 0, 'off-screen/under dock: ' + off.join(', '));
    });
    await test('weather widget is not hardcoded "Sunny" at night / matches live data source', async () => {
      const txt = await page.evaluate(() => document.querySelector('.desktop-widgets-column')?.textContent || '');
      expect(!/H: 29° L: 19°/.test(txt), 'weather widget shows hardcoded H/L values');
    });
    const ids = await page.evaluate(() => DESKTOP_FILES.map(f => f.id));
    for (const id of ids) {
      await test(`Space Quick Looks desktop file "${id}"`, async () => {
        await page.click(`.desktop-icon[data-file-id="${id}"]`);
        await page.keyboard.press('Space');
        await page.waitForTimeout(250);
        const ok = await page.isVisible('#quicklook-overlay.active');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(150);
        expect(ok, 'no Quick Look preview');
      });
    }
    await test('double-click README.txt opens TextEdit with content', async () => {
      await page.dblclick('.desktop-icon[data-file-id="readme"]');
      await page.waitForTimeout(300);
      const len = await page.evaluate(() => document.getElementById('textedit-body').textContent.length);
      expect(len > 200, 'empty text');
      await page.evaluate(() => closeWindow('textedit-window'));
    });
    await test('README does not advertise OS-reserved shortcuts (⌘Space / ⌘Tab)', async () => {
      const body = await page.evaluate(() => TEXT_FILES.readme.body);
      expect(!/Cmd \+ Space|Cmd \+ Tab/.test(body), 'README tells visitors to press keys the OS intercepts');
    });
    await test('desktop page had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  if (section('welcome')) {
    console.log(`\nAbout ${P.first} (first run)`);
    const page = await freshPage(browser, { welcome: true });
    await page.waitForTimeout(900);
    await page.screenshot({ path: SHOTS + 'welcome.png' });
    await test('the About window greets a first-time visitor', async () => {
      expect(await page.evaluate(() => !document.getElementById('welcome-window').classList.contains('hidden')), 'not shown');
    });
    await test('its stats are computed from real data', async () => {
      const t = await page.textContent('.welcome-stats');
      expect(new RegExp(`${P.experience.length}\\s*(internships?|roles?)`).test(t) && new RegExp(`${P.projects.length}\\s*projects`).test(t), t);
    });
    await test('Résumé / Projects / Contact buttons work', async () => {
      await page.click('.welcome-btn:has-text("Projects")');
      const finder = await page.evaluate(() => !document.getElementById('finder-window').classList.contains('hidden') && document.getElementById('finder-title-text').textContent);
      await page.evaluate(() => openWelcome());
      await page.click('.welcome-btn:has-text("Contact")');
      const compose = await page.isVisible('#mail-compose-modal:not(.hidden)');
      expect(finder === 'Projects' && compose, `finder=${finder} compose=${compose}`);
    });
    await test('it shows once per session, not on every reload', async () => {
      await page.reload(); await page.waitForTimeout(1200);
      expect(await page.evaluate(() => document.getElementById('welcome-window').classList.contains('hidden')), 'shown again');
    });
    await test('welcome had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Dock ───────────── */
  if (section('dock')) {
    console.log('\nDock');
    const page = await freshPage(browser);
    const map = {
      'dock-finder': () => !document.getElementById('finder-window').classList.contains('hidden'),
      'dock-launchpad': () => document.getElementById('launchpad-overlay').classList.contains('active'),
      'dock-missioncontrol': () => document.body.classList.contains('mission-control-active'),
      'dock-safari': () => !document.getElementById('safari-window').classList.contains('hidden'),
      'dock-mail': () => !document.getElementById('mail-window').classList.contains('hidden'),
      'dock-notes': () => !document.getElementById('notes-window').classList.contains('hidden'),
      'dock-photos': () => !document.getElementById('photos-window').classList.contains('hidden'),
      'dock-photobooth': () => !document.getElementById('photobooth-window').classList.contains('hidden'),
      'dock-music': () => !document.getElementById('music-window').classList.contains('hidden'),
      'dock-breakout': () => !document.getElementById('breakout-window').classList.contains('hidden'),
      'dock-snake': () => !document.getElementById('snake-window').classList.contains('hidden'),
      'dock-appstore': () => !document.getElementById('appstore-window').classList.contains('hidden'),
      'dock-terminal': () => !document.getElementById('terminal-window').classList.contains('hidden'),
      'dock-settings': () => !document.getElementById('settings-window').classList.contains('hidden'),
      'dock-iris': () => document.getElementById('iris-overlay').classList.contains('active'),
      'dock-trash': () => !document.getElementById('trash-window').classList.contains('hidden'),
    };
    for (const [id, check] of Object.entries(map)) {
      await test(`dock: ${id} opens its app`, async () => {
        await page.click('#' + id);
        await page.waitForTimeout(450);
        const ok = await page.evaluate(check);
        // Reset for the next one
        await page.keyboard.press('Escape');
        await page.evaluate(() => {
          if (typeof exitMissionControl === 'function') exitMissionControl();
          if (typeof closeLaunchpad === 'function') closeLaunchpad();
          if (typeof closeIris === 'function') closeIris();
          document.querySelectorAll('.window:not(.hidden)').forEach(w => closeWindow(w.id));
        });
        await page.waitForTimeout(150);
        expect(ok, 'did not open');
      });
    }
    await test('Mission Control has its own dock icon (not a recoloured Launchpad)', async () => {
      const [a, b] = await page.evaluate(() => [document.querySelector('#dock-launchpad img').getAttribute('src'), document.querySelector('#dock-missioncontrol img').getAttribute('src')]);
      expect(a !== b, 'same artwork: ' + a);
    });
    await test('dock had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Windows & menu bar ───────────── */
  if (section('windows')) {
    console.log('\nWindows & Menu Bar');
    const page = await freshPage(browser);
    page.on('dialog', d => { page.__dialogs = (page.__dialogs || 0) + 1; d.dismiss().catch(() => {}); });
    const wins = await page.evaluate(() => [...document.querySelectorAll('.window')].map(w => w.id));
    for (const id of wins) {
      await test(`traffic lights work on #${id}`, async () => {
        await page.evaluate(i => openWindow(i), id);
        await page.waitForTimeout(150);
        await page.click(`#${id} .control.maximize`);
        expect(await page.evaluate(i => document.getElementById(i).classList.contains('is-maximized'), id), 'did not zoom');
        await page.click(`#${id} .control.maximize`);
        expect(await page.evaluate(i => !document.getElementById(i).classList.contains('is-maximized'), id), 'did not restore');
        await page.click(`#${id} .control.minimize`);
        expect(await page.evaluate(i => document.getElementById(i).classList.contains('minimized'), id), 'did not minimize');
        await page.evaluate(i => openWindow(i), id);
        await page.waitForTimeout(500);
        await page.click(`#${id} .control.close`);
        expect(await page.evaluate(i => document.getElementById(i).classList.contains('hidden'), id), 'did not close');
      });
    }
    const appNames = {
      'welcome-window': `About ${P.first}`,
      'finder-window': 'Finder', 'safari-window': 'Safari', 'mail-window': 'Mail', 'notes-window': 'Notes',
      'terminal-window': 'Terminal', 'music-window': 'Music', 'photobooth-window': 'Photo Booth',
      'breakout-window': 'Breakout', 'snake-window': 'Snake', 'photos-window': 'Photos',
      'appstore-window': 'App Store', 'settings-window': 'System Settings', 'resume-window': 'Preview', 'textedit-window': 'TextEdit'
    };
    for (const [id, name] of Object.entries(appNames)) {
      await test(`menu bar shows "${name}" when #${id} is frontmost`, async () => {
        await page.evaluate(i => openWindow(i), id);
        const shown = await page.textContent('.app-name-item');
        await page.evaluate(i => closeWindow(i), id);
        expect(shown === name, `shows "${shown}"`);
      });
    }
    await test('every menu-bar item runs without throwing and without native alert()s', async () => {
      const before = page.__errors.length;
      for (const id of Object.keys(appNames)) {
        await page.evaluate(i => openWindow(i), id);
        const count = await page.evaluate(() => document.querySelectorAll('#menubar-app-menus .menu-dropdown').length);
        for (let m = 0; m < count; m++) {
          const items = await page.evaluate(m => { const dd = document.querySelectorAll('#menubar-app-menus .menu-dropdown')[m]; return dd ? dd.querySelectorAll('.dropdown-item:not(.disabled)').length : 0; }, m);
          for (let k = 0; k < items; k++) {
            await page.evaluate(i => { if (document.getElementById(i).classList.contains('hidden')) openWindow(i); else bringToFront(i); }, id);
            await page.evaluate(([m, k]) => {
              const dd = document.querySelectorAll('#menubar-app-menus .menu-dropdown')[m];
              if (!dd) return;
              const it = dd.querySelectorAll('.dropdown-item:not(.disabled)')[k];
              if (it && !/Lock|Download|Export|Save Contact|Restart|Shut Down|Force Quit/.test(it.textContent)) it.click();
            }, [m, k]);
            await page.evaluate(() => { closeSpotlight?.(); closeLaunchpad?.(); closeIris?.(); closeQuickLook?.(); exitMissionControl?.(); });
          }
        }
        await page.evaluate(() => document.querySelectorAll('.window:not(.hidden)').forEach(w => closeWindow(w.id)));
      }
      expect(page.__errors.length === before, page.__errors.slice(before).join(' | '));
      expect(!page.__dialogs, `${page.__dialogs} native alert/prompt dialogs popped`);
    });
    await test('Settings ▸ View ▸ About opens the About pane', async () => {
      await page.evaluate(() => openWindow('settings-window'));
      await page.evaluate(() => { const dd = [...document.querySelectorAll('#menubar-app-menus .dropdown-item')].find(e => e.textContent.trim().startsWith('About')); dd && dd.click(); });
      const visible = await page.evaluate(() => !document.getElementById('settings-pane-about-mac').classList.contains('hidden'));
      expect(visible, 'About pane not shown');
    });
    await test('menu items never advertise browser-reserved shortcuts (⌘W ⌘Q ⌘N ⌘T)', async () => {
      const bad = await page.evaluate(() => {
        const all = Object.values(APP_MENUS).concat([DEFAULT_APP]).flatMap(a => Object.values(a.menus).flat());
        return all.filter(i => /^⌘[WQNT]$/.test(i.shortcut || '')).map(i => i.label + ' ' + i.shortcut);
      });
      expect(bad.length === 0, bad.join(', '));
    });
    await test('minimizing a paused game keeps it paused', async () => {
      await page.evaluate(() => openBreakout());
      await page.waitForTimeout(200);
      await page.evaluate(() => { if (!document.getElementById('breakout-overlay').classList.contains('open')) toggleBreakoutPause(); });
      await page.evaluate(() => minimizeWindow('breakout-window'));
      const stillPaused = await page.evaluate(() => document.getElementById('breakout-overlay').classList.contains('open'));
      await page.evaluate(() => closeBreakout());
      expect(stillPaused, 'game unpaused itself while minimized');
    });
    await test('window resize grip does not hijack clicks on a scrollbar edge', async () => {
      await page.evaluate(() => { openWindow('finder-window'); finderSidebarNav('projects'); setFinderViewMode('list'); });
      const box = await page.locator('#finder-window').boundingBox();
      const w0 = box.width;
      await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2);
      await page.mouse.down(); await page.mouse.move(box.x + box.width - 5, box.y + box.height / 2 + 40); await page.mouse.up();
      const w1 = (await page.locator('#finder-window').boundingBox()).width;
      expect(Math.abs(w1 - w0) < 1, 'dragging inside the content edge resized the window');
    });
    await test('windows/menus had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Spotlight & Launchpad & context menus ───────────── */
  if (section('spotlight')) {
    console.log('\nSpotlight / Launchpad / Context menus');
    const page = await freshPage(browser);
    await test('⌘K opens Spotlight', async () => {
      // ⌘ on a Mac, Ctrl on Windows and Linux (keyboard.js's isCmd), like a real visitor's keyboard.
      await page.keyboard.press('ControlOrMeta+k');
      await page.waitForTimeout(200);
      expect(await page.isVisible('#spotlight-overlay.active'));
    });
    await test('Spotlight finds a project and every result has a visible icon', async () => {
      await page.fill('#spotlight-input', P.projects.length ? P.projects[0].name : 'notes');
      await page.waitForTimeout(150);
      const rows = await page.$$eval('.spotlight-row', r => r.length);
      expect(rows > 0, 'no rows');
      const blank = await page.evaluate(() => [...document.querySelectorAll('.spotlight-row-art i')].filter(i => { const c = getComputedStyle(i, '::before').content; return !c || c === 'none' || c === '""' || c === 'normal'; }).length);
      expect(blank === 0, `${blank} result icon(s) render blank`);
    });
    await test('Spotlight inline calculator', async () => {
      await page.fill('#spotlight-input', '12*8');
      await page.waitForTimeout(150);
      expect((await page.textContent('.spotlight-row .spotlight-row-title')).trim() === '96');
    });
    await test('Spotlight Enter launches Terminal', async () => {
      await page.fill('#spotlight-input', 'terminal');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(250);
      expect(await page.evaluate(() => !document.getElementById('terminal-window').classList.contains('hidden')));
      await page.evaluate(() => closeWindow('terminal-window'));
    });
    await test('Spotlight shows correct app icons (Music is not the App Store icon)', async () => {
      const src = await page.evaluate(() => SPOTLIGHT_APPS.find(a => /Music/.test(a.name)).icon);
      expect(/music/.test(src), src);
    });
    const lp = await page.evaluate(() => LAUNCHPAD_APPS.map(a => a.id));
    for (const id of lp) {
      await test(`Launchpad launches "${id}" into a non-empty view`, async () => {
        await page.evaluate(() => openLaunchpad());
        await page.waitForTimeout(150);
        const pagesBefore = page.context().pages().length;
        await page.click(`.launchpad-app-item[data-app-id="${id}"]`);
        await page.waitForTimeout(450);
        const state = await page.evaluate(() => {
          const open = [...document.querySelectorAll('.window:not(.hidden):not(.minimized)')];
          const top = typeof getActiveWindow === 'function' ? getActiveWindow() : null;
          const content = top ? top.querySelector('.window-content, .pb-stage, .breakout-container, .snake-container, .music-app-container, .dmg-content') : null;
          return { open: open.length, iris: document.getElementById('iris-overlay').classList.contains('active'), text: content ? content.textContent.trim().length : 0, imgs: content ? content.querySelectorAll('img,canvas,video,iframe').length : 0 };
        });
        const popup = page.context().pages().length > pagesBefore;
        for (const p of page.context().pages().slice(1)) await p.close();
        await page.evaluate(() => { closeIris(); document.querySelectorAll('.window:not(.hidden)').forEach(w => closeWindow(w.id)); });
        const mc = await page.evaluate(() => document.body.classList.contains('mission-control-active'));
        await page.evaluate(() => exitMissionControl());
        expect(popup || state.iris || mc || (state.open > 0 && (state.text > 20 || state.imgs > 0)), JSON.stringify(state));
      });
    }
    await test('right-click desktop ▸ Change Wallpaper opens the wallpaper pane', async () => {
      await page.mouse.click(300, 600, { button: 'right' });
      await page.click('.context-menu-item:has-text("Change Wallpaper")');
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => !document.getElementById('settings-pane-wallpaper').classList.contains('hidden')));
      await page.evaluate(() => closeWindow('settings-window'));
    });
    await test('right-click a desktop icon ▸ Quick Look previews it', async () => {
      await page.click('.desktop-icon[data-file-id="readme"]', { button: 'right' });
      await page.click('.context-menu-item:has-text("Quick Look")');
      await page.waitForTimeout(200);
      const ok = await page.isVisible('#quicklook-overlay.active');
      await page.keyboard.press('Escape');
      expect(ok, 'no preview');
    });
    await test('spotlight/launchpad/context had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Control Centre / Mission Control ───────────── */
  if (section('control')) {
    console.log('\nControl Centre & Mission Control');
    const page = await freshPage(browser);
    await test('Control Centre opens from the menu bar', async () => {
      await page.click('#control-center-trigger');
      await page.waitForTimeout(250);
      expect(await page.isVisible('#control-center-panel.open'));
    });
    await test('Appearance toggle visibly changes the UI', async () => {
      await page.evaluate(() => openWindow('finder-window'));
      const before = await page.evaluate(() => getComputedStyle(document.querySelector('#finder-window')).backgroundColor);
      await page.evaluate(() => openControlCenter());
      await page.waitForTimeout(150);
      await page.click('#cc-btn-theme');
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => getComputedStyle(document.querySelector('#finder-window')).backgroundColor);
      await page.click('#cc-btn-theme');
      expect(before !== after, 'window background unchanged: ' + before);
    });
    await test('Control Centre battery matches the real battery reading', async () => {
      const [txt, lvl] = await page.evaluate(() => [document.getElementById('cc-battery-text').textContent, window.SYSTEM_BATTERY_LEVEL]);
      expect(txt.includes(lvl + '%'), `panel says "${txt}", system says ${lvl}%`);
    });
    await test('Display brightness dims the whole screen (menu bar + dock too)', async () => {
      await page.evaluate(() => setCcBrightness(50));
      const dimmed = await page.evaluate(() => {
        const el = document.elementFromPoint(innerWidth - 40, 12);
        // Either a dimming veil sits on top, or the menu bar itself is filtered.
        return el && (el.id === 'display-dimmer' || /brightness/.test(getComputedStyle(document.querySelector('.menu-bar')).filter) || !!document.getElementById('display-dimmer'));
      });
      await page.evaluate(() => setCcBrightness(100));
      expect(dimmed, 'menu bar not dimmed');
    });
    await test('Mission Control enter/exit restores window positions', async () => {
      await page.keyboard.press('Escape');
      await page.evaluate(() => { openWindow('finder-window'); openWindow('safari-window'); });
      const before = await page.evaluate(() => ['finder-window', 'safari-window'].map(i => document.getElementById(i).getBoundingClientRect().toJSON()));
      await page.evaluate(() => enterMissionControl());
      await page.waitForTimeout(500);
      await page.evaluate(() => exitMissionControl());
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => ['finder-window', 'safari-window'].map(i => document.getElementById(i).getBoundingClientRect().toJSON()));
      expect(before.every((r, i) => Math.abs(r.x - after[i].x) < 2 && Math.abs(r.y - after[i].y) < 2), JSON.stringify({ before, after }));
    });
    await test('Mission Control windows sit above the dimmer and clicking one focuses it', async () => {
      await page.evaluate(() => { openWindow('finder-window'); openWindow('notes-window'); enterMissionControl(); });
      await page.waitForTimeout(450);
      const box = await page.locator('#finder-window').boundingBox();
      const top = await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); return el && el.closest('.window') ? el.closest('.window').id : (el && el.id); }, [box.x + box.width / 2, box.y + box.height / 2]);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(400);
      const front = await page.evaluate(() => ({ active: document.body.classList.contains('mission-control-active'), id: getActiveWindow().id }));
      expect(top === 'finder-window' && !front.active && front.id === 'finder-window', JSON.stringify({ top, front }));
    });
    await test('control/mission had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Finder ───────────── */
  if (section('finder')) {
    console.log('\nFinder');
    const page = await freshPage(browser);
    await page.evaluate(() => openWindow('finder-window'));
    const targets = await page.$$eval('.sidebar-v2-item[data-target]', els => els.map(e => e.dataset.target));
    await test('every Finder sidebar location renders without error', async () => {
      for (const t of targets) {
        await page.click(`.sidebar-v2-item[data-target="${t}"]`);
        await page.waitForTimeout(40);
      }
      expect(page.__errors.length === 0, page.__errors.join(' | '));
    });
    for (const v of ['icons', 'list', 'columns']) {
      await test(`Finder ${v} view renders Projects`, async () => {
        await page.click('.sidebar-v2-item[data-target="projects"]');
        await page.click(`.finder-view-btn[data-view="${v}"]`);
        const n = await page.evaluate(() => document.querySelectorAll('#finder-content-viewport [data-item-id], #finder-content-viewport .finder-column-row').length);
        expect(n >= 10, 'items: ' + n);
      });
    }
    await test('Finder search filters and clearing restores', async () => {
      await page.click('.finder-view-btn[data-view="icons"]');
      await page.fill('.finder-search-box input', 'omni');
      await page.waitForTimeout(100);
      const n = await page.$$eval('#finder-content-viewport [data-item-id]', e => e.length);
      await page.fill('.finder-search-box input', '');
      await page.waitForTimeout(100);
      const m = await page.$$eval('#finder-content-viewport [data-item-id]', e => e.length);
      expect(n >= 1 && m >= 10, `search ${n}, restored ${m}`);
    });
    await test('opening an image in Finder previews the actual image', async () => {
      await page.click('.sidebar-v2-item[data-target="pictures"]');
      await page.dblclick('#finder-content-viewport [data-item-id="profile-pic"]');
      await page.waitForTimeout(250);
      const img = await page.evaluate(() => !!document.querySelector('#ql-content img'));
      await page.keyboard.press('Escape');
      expect(img, 'preview has no <img>');
    });
    await test('Finder "Desktop" folder mirrors the real desktop', async () => {
      await page.click('.sidebar-v2-item[data-target="desktop"]');
      const names = await page.$$eval('#finder-content-viewport [data-item-id] .finder-grid-name', e => e.map(x => x.textContent.trim()));
      const desk = await page.evaluate(() => DESKTOP_FILES.map(f => f.name));
      expect(desk.every(n => names.includes(n)), `finder: ${names.join(', ')} | desktop: ${desk.join(', ')}`);
    });
    await test('Trash is one consistent set across Finder and the Trash app', async () => {
      await page.click('.sidebar-v2-item[data-target="trash"]');
      const finderTrash = await page.$$eval('#finder-content-viewport [data-item-id] .finder-grid-name', e => e.map(x => x.textContent.trim()).sort());
      await page.evaluate(() => openWindow('trash-window'));
      const appTrash = await page.$$eval('#trash-window .trash-item span, #trash-window .trash-item .trash-item-name', e => e.map(x => x.textContent.trim()).sort());
      await page.evaluate(() => closeWindow('trash-window'));
      expect(JSON.stringify(finderTrash) === JSON.stringify(appTrash), `finder [${finderTrash}] vs app [${appTrash}]`);
    });
    await test('finder had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Notes / Mail ───────────── */
  if (section('notes|mail')) {
    console.log('\nNotes & Mail');
    const page = await freshPage(browser);
    await page.evaluate(() => openWindow('notes-window'));
    for (const folder of ['Philosophy', 'Current Learning', 'Tech Notes']) {
      await test(`Notes folder "${folder}" shows its notes`, async () => {
        await page.click(`.notes-sidebar .sidebar-item:has-text("${folder}")`);
        const visible = await page.$$eval('.note-item', els => els.filter(e => e.offsetParent !== null).length);
        expect(visible >= 1, 'empty folder');
      });
    }
    await test('a new note survives a reload', async () => {
      await page.click('.notes-sidebar .sidebar-item:has-text("All")');
      await page.evaluate(() => addNewNotePrompt());
      await page.keyboard.type('Persistence check');
      await page.click('#note-body-content');
      await page.keyboard.type('Body text');
      await page.click('.note-item:nth-child(2)');
      await page.reload(); await page.waitForTimeout(800);
      const has = await page.evaluate(() => [...document.querySelectorAll('.note-item-title')].some(e => e.textContent.includes('Persistence check')));
      expect(has, 'note lost on reload');
    });
    await page.evaluate(() => closeWindow('notes-window'));
    await page.evaluate(() => openWindow('mail-window'));
    await test('Mail reader actions come back after visiting an empty mailbox', async () => {
      await page.click('.mail-sidebar [data-mailbox="drafts"]');
      await page.click('.mail-sidebar [data-mailbox="inbox"]');
      const disp = await page.evaluate(() => getComputedStyle(document.getElementById('mail-reader-actions')).display);
      expect(disp !== 'none', 'actions hidden');
    });
    await test('Mail compose refuses to send without a reply-to email', async () => {
      await page.click('#mail-window .app-pill-btn.primary');
      await page.fill('#compose-message', 'Hello');
      const before = page.__web3;
      await page.click('#compose-send-btn');
      await page.waitForTimeout(300);
      const status = await page.textContent('#compose-status');
      expect(page.__web3 === before && /email/i.test(status), `requests=${page.__web3 - before} status=${status}`);
    });
    await test('Mail does not execute HTML typed into the subject', async () => {
      await page.fill('#compose-sender-name', '<img src=x onerror="window.__mx=1">');
      await page.fill('#compose-sender-email', 'qa@example.com');
      await page.fill('#compose-subject', '<img src=x onerror="window.__mx=1">');
      await page.fill('#compose-message', 'test');
      await page.click('#compose-send-btn');
      await page.waitForTimeout(1800);
      expect(!(await page.evaluate(() => window.__mx)), 'XSS executed');
    });
    await test('notes/mail had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Safari ───────────── */
  if (section('safari')) {
    console.log('\nSafari');
    const page = await freshPage(browser);
    await page.route('https://en.wikipedia.org/**', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ query: { searchinfo: { totalhits: 3 }, search: [{ title: 'Retrieval-augmented generation', snippet: 'RAG' }] }, title: 'Retrieval-augmented generation', extract: 'RAG is a technique', description: 'AI technique' }) }));
    await page.evaluate(() => openWindow('safari-window'));
    await test('Safari search does not execute HTML in the query', async () => {
      await page.fill('#safari-url-input', '<img src=x onerror="window.__sx=1">');
      await page.press('#safari-url-input', 'Enter');
      await page.waitForTimeout(800);
      expect(!(await page.evaluate(() => window.__sx)), 'XSS executed');
    });
    await test('Safari search shows real (not fabricated) result counts', async () => {
      await page.fill('#safari-url-input', 'rag');
      await page.press('#safari-url-input', 'Enter');
      await page.waitForTimeout(600);
      const t = await page.textContent('#safari-page-render-area');
      expect(!/1,840,000/.test(t), 'shows fake "About 1,840,000 results"');
    });
    await test('typing a domain navigates instead of searching', async () => {
      await page.fill('#safari-url-input', 'github.com/octocat');
      await page.press('#safari-url-input', 'Enter');
      await page.waitForTimeout(300);
      const isSearch = await page.evaluate(() => safariTabs.find(t => t.id === activeSafariTabId).type === 'ddg_search');
      expect(!isSearch, 'treated a URL as a search query');
    });
    await test('YouTube does not use the retired listType=search embed', async () => {
      await page.fill('#safari-url-input', 'youtube');
      await page.press('#safari-url-input', 'Enter');
      await page.waitForTimeout(300);
      const src = await page.evaluate(() => document.querySelector('#safari-page-render-area iframe')?.src || '');
      expect(!/listType=search/.test(src), src);
    });
    await test('every Favorites tile opens a profile page', async () => {
      await page.evaluate(() => openSafariStartPage());
      const keys = await page.evaluate(() => Object.keys(safariShortcuts));
      for (const k of keys) {
        await page.evaluate(k => openSafariShortcut(k), k);
        const h = await page.textContent('#safari-page-render-area h2');
        expect(h && h.length > 2, 'blank page for ' + k);
      }
    });
    await test('Instagram favourite links to the profile, not the homepage', async () => {
      const url = await page.evaluate(() => safariShortcuts.instagram.url);
      expect(/instagram\.com\/.+/.test(url), url);
    });
    await test('safari had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Terminal ───────────── */
  if (section('terminal')) {
    console.log('\nTerminal');
    const page = await freshPage(browser);
    await page.evaluate(() => openWindow('terminal-window'));
    const cmds = ['help', 'whoami', 'cat resume.txt', 'history', 'about me', 'experience', 'education', 'projects', 'skills', 'contact', 'ls', 'ls projects/', 'pwd', 'cd projects', 'cat README.txt', 'cat Philosophy.txt', 'sudo hire-me', 'brew install talent', 'date', 'uname -a', 'echo hello', 'git status', 'git log', 'neofetch', 'curl me'];
    for (const c of cmds) {
      await test(`terminal: "${c}" is understood`, async () => {
        await page.evaluate(() => { openWindow('terminal-window'); document.querySelectorAll('.window:not(.hidden)').forEach(w => { if (w.id !== 'terminal-window') closeWindow(w.id); }); });
        await page.fill('#terminal-input', c);
        await page.press('#terminal-input', 'Enter');
        await page.waitForTimeout(60);
        const last = await page.evaluate(() => { const o = document.getElementById('terminal-output'); return o.lastElementChild ? o.lastElementChild.textContent : ''; });
        expect(!/command not found|No such file|not found/.test(last), last.slice(0, 120));
      });
    }
    await test('terminal uses a real monospace font, not Courier New', async () => {
      const ff = await page.evaluate(() => getComputedStyle(document.getElementById('terminal-input')).fontFamily);
      expect(!/^"?Courier New/.test(ff), ff);
    });
    await test('terminal had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Photo Booth ───────────── */
  if (section('photobooth')) {
    console.log('\nPhoto Booth');
    const page = await freshPage(browser, {
      init: () => {
        window.__streams = [];
        const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = async (c) => { const s = await orig(c); window.__streams.push(s); return s; };
      }
    });
    await test('opening Photo Booth requests the camera exactly once', async () => {
      await page.click('#dock-photobooth');
      await page.waitForTimeout(1500);
      const n = await page.evaluate(() => window.__streams.length);
      expect(n === 1, `getUserMedia called ${n} times`);
    });
    await test('taking a photo shows the review sheet', async () => {
      await page.click('#pb-shutter-btn');
      await page.waitForTimeout(3300);
      expect(await page.isVisible('#pb-modal.open'));
    });
    await test('Set as Wallpaper works and does not blow the storage quota', async () => {
      await page.click('#pb-modal button:has-text("Wallpaper")');
      await page.waitForTimeout(500);
      const [bg, size] = await page.evaluate(() => [document.body.style.backgroundImage.slice(0, 30), (localStorage.getItem('macos-portfolio-settings') || '').length]);
      expect(/url\(/.test(bg) && size < 200000, `bg=${bg} settingsSize=${size}`);
    });
    await test('closing Photo Booth turns the camera fully off', async () => {
      await page.click('#photobooth-window .control.close');
      await page.waitForTimeout(300);
      const live = await page.evaluate(() => window.__streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live').length);
      expect(live === 0, `${live} camera track(s) still live`);
    });
    await test('minimizing Photo Booth releases the camera', async () => {
      await page.click('#dock-photobooth');
      await page.waitForTimeout(1200);
      await page.click('#photobooth-window .control.minimize');
      await page.waitForTimeout(300);
      const live = await page.evaluate(() => window.__streams.flatMap(s => s.getTracks()).filter(t => t.readyState === 'live').length);
      await page.evaluate(() => closePhotoBooth());
      expect(live === 0, `${live} live track(s) while minimized`);
    });
    await test('photobooth had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Music ───────────── */
  if (section('music')) {
    console.log('\nMusic');
    const page = await freshPage(browser);
    await page.route(/upload\.wikimedia\.org/, r => r.fulfill({ path: path.join(ROOT, 'assets/mac_startup.mp3'), contentType: 'audio/mpeg' }));
    await page.click('#dock-music');
    await test('pause then play resumes from the same position', async () => {
      await page.evaluate(() => playMusicTrackIndex(0));
      await page.waitForTimeout(1300);
      await page.click('#music-play-btn');            // pause
      await page.waitForTimeout(200);
      const t1 = await page.textContent('#music-lcd-time');
      await page.click('#music-play-btn');            // play
      await page.waitForTimeout(250);
      const t2 = await page.textContent('#music-lcd-time');
      expect(!/^0:00/.test(t2) && t1.split('/')[0].trim() !== '0:00', `paused at ${t1}, resumed at ${t2}`);
      await page.click('#music-play-btn');
    });
    await test('clicking a Library row highlights exactly one sidebar item', async () => {
      await page.click('.music-nav-item:has-text("Artists")');
      const n = await page.$$eval('.music-nav-item.active', e => e.length);
      expect(n === 1, `${n} items highlighted`);
    });
    await test('a radio stream that fails to load does not claim to be playing', async () => {
      await page.route(/zeno\.fm|radioparadise|bbcmedia|dancewave|musicradio/, r => r.abort());
      await page.click('.music-nav-item:has-text("Radio")');
      await page.click('.music-station-card >> nth=0');
      await page.waitForTimeout(1200);
      const t = await page.textContent('#music-player-status, #music-lcd-artist, #music-lcd-time');
      const playingIcon = await page.evaluate(() => !!document.querySelector('#music-play-btn .fa-pause'));
      expect(!playingIcon, 'still shows Pause/LIVE while nothing is audible: ' + t);
    });
    await test('Control Centre volume drives Music volume', async () => {
      await page.evaluate(() => setCcVolume(20));
      const v = await page.evaluate(() => window.getMusicVolume ? window.getMusicVolume() : null);
      await page.evaluate(() => setCcVolume(80));
      expect(v !== null && Math.abs(v - 0.2) < 0.05, 'music volume ' + v);
    });
    await test('music had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Games ───────────── */
  if (section('games')) {
    console.log('\nArcade');
    const page = await freshPage(browser);
    await test('Breakout: "Resume" after pause keeps the score (does not restart)', async () => {
      await page.click('#dock-breakout');
      await page.waitForTimeout(300);
      // The intro overlay should be offered first; start if needed.
      if (await page.isVisible('#breakout-overlay.open')) await page.click('#breakout-overlay-btn');
      await page.evaluate(() => window.__bo = true);
      await page.click('#breakout-canvas');           // launch ball
      await page.waitForTimeout(4500);
      await page.click('.breakout-header-actions .breakout-btn:has-text("Pause")');
      const s1 = await page.textContent('#breakout-score');
      await page.click('#breakout-overlay-btn');      // "Resume Game"
      await page.waitForTimeout(150);
      const s2 = await page.textContent('#breakout-score');
      expect(s1 === s2 && !(await page.isVisible('#breakout-overlay.open')), `score ${s1} → ${s2}`);
    });
    await test('Breakout: re-opening from the Dock does not wipe a game in progress', async () => {
      const s1 = await page.textContent('#breakout-score');
      await page.click('#dock-breakout');
      await page.waitForTimeout(150);
      const s2 = await page.textContent('#breakout-score');
      await page.evaluate(() => closeBreakout());
      expect(s1 === s2, `score ${s1} → ${s2}`);
    });
    await test('Snake: "Resume" after pause continues the same game', async () => {
      await page.click('#dock-snake');
      await page.waitForTimeout(300);
      if (await page.isVisible('#snake-overlay.open')) await page.click('#snake-overlay-btn');
      await page.keyboard.press('ArrowDown');
      await page.waitForTimeout(500);
      const before = await page.evaluate(() => window.snakeState ? JSON.stringify(window.snakeState().head) : null);
      await page.click('.snake-btn:has-text("Pause")');
      await page.click('#snake-overlay-btn');
      await page.waitForTimeout(30);
      const after = await page.evaluate(() => window.snakeState ? window.snakeState() : null);
      await page.evaluate(() => closeSnake());
      expect(after && !after.waiting && after.running, 'game restarted or state unavailable: ' + JSON.stringify(after) + ' before=' + before);
    });
    await test('games had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Settings ───────────── */
  if (section('settings')) {
    console.log('\nSettings');
    const page = await freshPage(browser);
    await page.evaluate(() => openWindow('settings-window'));
    await test('exactly one Appearance option is selected on a fresh visit', async () => {
      const n = await page.$$eval('.theme-option.active', e => e.length);
      expect(n === 1, n + ' selected');
    });
    await test('wallpaper choice persists across reloads', async () => {
      await page.click('.settings-sidebar .sidebar-item:has-text("Wallpaper")');
      await page.click('.wallpaper-card:has-text("Golden Gate")');
      await page.reload(); await page.waitForTimeout(800);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundImage);
      expect(/Golden-Gate/.test(bg), bg.slice(0, 80));
    });
    await test('accent colour applies to selection highlights', async () => {
      await page.evaluate(() => openWindow('settings-window'));
      await page.click('.accent-dot[title="Pink"]');
      const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
      expect(v === '#ff2d55', v);
    });
    await test('settings had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Iris ───────────── */
  if (section('iris')) {
    console.log('\nIris');
    const page = await freshPage(browser, {
      init: () => {
        window.__srStarts = 0;
        class FakeSR { constructor() { this.continuous = false; } start() { window.__srStarts++; } stop() {} abort() {} }
        window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
      }
    });
    await test('the microphone is not touched until the visitor asks for it', async () => {
      await page.mouse.click(200, 500);
      await page.waitForTimeout(400);
      const n = await page.evaluate(() => window.__srStarts);
      expect(n === 0, `SpeechRecognition.start() called ${n} time(s) without consent`);
    });
    const ask = async (q) => {
      await page.evaluate(() => openIris());
      await page.fill('#iris-input', q);
      await page.press('#iris-input', 'Enter');
      await page.waitForTimeout(500);
      return page.evaluate(() => { const m = [...document.querySelectorAll('.iris-message.iris')]; return m.length ? m[m.length - 1].textContent : ''; });
    };
    await test('a question ("what is RAG?") answers instead of launching things', async () => {
      const pages = page.context().pages().length;
      const a = await ask('what is RAG?');
      const dmg = await page.evaluate(() => !document.getElementById('dmg-window').classList.contains('hidden'));
      expect(!dmg && page.context().pages().length === pages && a.length > 20, `dmg mounted=${dmg} answer=${a.slice(0, 80)}`);
    });
    await test('asking what a project is does not pop a new tab', async () => {
      const pages = page.context().pages().length;
      await ask(`what is ${(P.projects.find(x => x.live) || P.projects[0] || { name: 'the portfolio' }).name}?`);
      expect(page.context().pages().length === pages, 'opened a tab for a question');
    });
    await test('"switch to dark mode" answers honestly instead of silently toggling a theme', async () => {
      const before = await page.evaluate(() => currentThemeMode());
      const a = await ask('switch to dark mode');
      const after = await page.evaluate(() => currentThemeMode());
      expect(!/switched/i.test(a) && /dark/i.test(a) && before === after, `${a} | theme ${before}→${after}`);
    });
    await test('off-topic questions are politely declined (scope guardrail)', async () => {
      const a = await ask('what is the capital of peru?');
      expect(/only know|couldn.t find/i.test(a), a);
    });
    await test('skill questions are answered from the listed stack', async () => {
      const knows = (skill) => ask(`${P.pron.subject === 'they' ? 'do they' : `does ${P.pron.subject}`} know ${skill}?`);
      const all = P.skills.flatMap(g => g.items);
      const unlisted = ['Haskell', 'COBOL', 'Fortran'].find(s => !all.some(i => i.toLowerCase() === s.toLowerCase()));
      const yes = all.length ? await knows(all[0]) : 'Yes';
      const no = await knows(unlisted);
      expect(/^Yes/.test(yes.trim()) && /don.t see/i.test(no), `${all[0]}: ${yes.slice(0, 60)} | ${unlisted}: ${no.slice(0, 60)}`);
    });
    await test('"open the résumé" (a command) does open it', async () => {
      await ask(`open ${P.pron.possessive} résumé`);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => !document.getElementById('resume-window').classList.contains('hidden')), 'résumé not opened');
      await page.evaluate(() => closeWindow('resume-window'));
    });
    await test(`"who is ${P.first}?" gives a real answer`, async () => {
      const a = await ask(`who is ${P.first}?`);
      expect(a.includes(P.name), a);
    });
    await test('answers cite where they came from', async () => {
      const org = P.experience.length ? firstWord(P.experience[0].org) : '';
      const a = await ask(org ? `tell me about ${P.pron.possessive} work at ${org}` : `who is ${P.first}?`);
      const cites = await page.evaluate(() => { const m = [...document.querySelectorAll('.iris-message.iris')].pop(); return m ? m.querySelectorAll('.iris-source, .iris-sources').length : 0; });
      expect(a.includes(org) && cites > 0, `cites=${cites} answer=${a.slice(0, 100)}`);
    });
    await test('iris had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }



  /* ───────────── App Store ───────────── */
  if (section('appstore')) {
    console.log('\nApp Store');
    const page = await freshPage(browser);
    await page.evaluate(() => openWindow('appstore-window'));
    await page.waitForTimeout(250);
    await test('App Store lists every project from the shared data', async () => {
      const n = await page.$$eval('#appstore-grid-container .app-card', e => e.length);
      expect(n === 10, n + ' cards');
    });
    await test('no fabricated star ratings anywhere', async () => {
      const t = await page.textContent('#appstore-window');
      expect(!/★|\b[45]\.\d\b/.test(t), 'ratings found');
    });
    await test('every category has projects (Defense included)', async () => {
      const counts = {};
      for (const c of ['ai', 'vision', 'systems', 'defense']) {
        await page.click(`.appstore-sidebar .sidebar-item[data-cat="${c}"]`);
        counts[c] = await page.$$eval('#appstore-grid-container .app-card', e => e.length);
      }
      await page.click('.appstore-sidebar .sidebar-item[data-cat="all"]');
      expect(Object.values(counts).every(n => n > 0), JSON.stringify(counts));
    });
    await test('a project opens its product page, and Back returns', async () => {
      await page.click('#appstore-grid-container .app-card >> nth=0');
      const title = await page.textContent('#appstore-product h2');
      await page.screenshot({ path: SHOTS + 'v-appstore-product.png' });
      await page.click('.appstore-back');
      const grid = await page.isVisible('#appstore-grid-container');
      expect(title.length > 2 && grid, `title=${title} grid=${grid}`);
    });
    await test('Launchpad project tiles open the right product page', async () => {
      const project = P.projects[P.projects.length - 1];
      if (!project) return;
      await page.evaluate(name => openProjectDetails(name), project.name);
      const t = await page.textContent('#appstore-product h2');
      expect(t.includes(project.name), t);
    });
    await test('product pages link GitHub and play a demo video', async () => {
      const project = P.projects.find(x => x.repo && x.live) || P.projects.find(x => x.repo);
      if (!project) return;
      const r = await page.evaluate((id) => {
        const x = PROFILE_DATA.projects.find(p => p.fsId === id);
        x.video = 'https://youtu.be/dQw4w9WgXcQ';
        openAppStoreProduct(id);
        return { github: Boolean(document.querySelector('#appstore-product .fa-github')), video: (document.querySelector('#appstore-product .product-video iframe') || {}).src || '' };
      }, project.fsId);
      await page.evaluate((id) => { delete PROFILE_DATA.projects.find(p => p.fsId === id).video; closeAppStoreProduct(); }, project.fsId);
      expect((r.github || !project.live) && /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/.test(r.video), JSON.stringify(r));
    });
    await test('app store had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Keyboard & system actions ───────────── */
  if (section('keyboard')) {
    console.log('\nKeyboard & system actions');
    const page = await freshPage(browser);
    await test('⌥W closes the frontmost window', async () => {
      await page.evaluate(() => openWindow('notes-window'));
      await page.keyboard.press('Alt+KeyW');
      expect(await page.evaluate(() => document.getElementById('notes-window').classList.contains('hidden')));
    });
    await test('⌥M minimises the frontmost window', async () => {
      await page.evaluate(() => openWindow('finder-window'));
      await page.keyboard.press('Alt+KeyM');
      expect(await page.evaluate(() => document.getElementById('finder-window').classList.contains('minimized')));
      await page.evaluate(() => closeWindow('finder-window'));
    });
    await test('⌥Tab cycles running apps and commits on release', async () => {
      await page.evaluate(() => { openWindow('safari-window'); openWindow('mail-window'); });
      await page.keyboard.down('Alt');
      await page.keyboard.press('Tab');
      const shown = await page.isVisible('#app-switcher.visible');
      await page.keyboard.up('Alt');
      const front = await page.evaluate(() => getActiveWindow().id);
      await page.evaluate(() => { closeWindow('safari-window'); closeWindow('mail-window'); });
      expect(shown && front === 'safari-window', `shown=${shown} front=${front}`);
    });
    await test('"?" shows the keyboard shortcut sheet', async () => {
      await page.mouse.click(700, 500);
      await page.keyboard.press('Shift+Slash');
      const ok = await page.isVisible('#quicklook-overlay.active .kbd-sheet');
      await page.keyboard.press('Escape');
      expect(ok);
    });
    await test('⌃L clears the Terminal', async () => {
      await page.evaluate(() => { openWindow('terminal-window'); runTerminalCommand('help'); });
      await page.keyboard.press('Control+KeyL');
      const n = await page.evaluate(() => document.getElementById('terminal-output').children.length);
      await page.evaluate(() => closeWindow('terminal-window'));
      expect(n === 0, n + ' lines remain');
    });
    await test('⌘[ goes back in Finder', async () => {
      await page.evaluate(() => { openWindow('finder-window'); finderSidebarNav('home'); finderSidebarNav('projects'); });
      await page.mouse.click(600, 600);
      await page.evaluate(() => bringToFront('finder-window'));
      await page.keyboard.press('ControlOrMeta+BracketLeft');
      const t = await page.textContent('#finder-title-text');
      await page.evaluate(() => closeWindow('finder-window'));
      expect(t !== 'Projects', 'still on ' + t);
    });
    await test('arrow keys step through desktop files while Quick Look is open', async () => {
      await page.click('.desktop-icon[data-file-id="readme"]');
      await page.keyboard.press('Space');
      await page.keyboard.press('ArrowDown');
      const title = await page.textContent('#ql-title');
      await page.keyboard.press('Escape');
      expect(title === 'Resume.pdf', title);
    });
    await test('Apple ▸ Restart replays boot and returns through the lock screen', async () => {
      await page.evaluate(() => restartMac());
      await page.waitForSelector('#lock-screen-overlay.active', { timeout: 9000 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(700);
      const desk = await page.evaluate(() => getComputedStyle(document.querySelector('.dock-container')).opacity);
      expect(Number(desk) > 0.9, 'desktop opacity ' + desk);
    });
    await test('Apple ▸ Shut Down shows the power-on gate, and it boots again', async () => {
      await page.evaluate(() => shutDownMac());
      await page.waitForTimeout(200);
      const gate = await page.isVisible('#boot-power-gate.visible');
      await page.mouse.click(720, 450);
      await page.waitForSelector('#lock-screen-overlay.active', { timeout: 9000 });
      expect(gate);
      await page.keyboard.press('Enter');
    });
    await test('AirDrop saves a real vCard built from the profile', async () => {
      await page.waitForTimeout(600);
      await page.evaluate(() => openFinderPane('airdrop'));
      const [dl] = await Promise.all([page.waitForEvent('download'), page.click('.airdrop-target:has-text("Contact Card")')]);
      const fs = require('fs');
      const body = fs.readFileSync(await dl.path(), 'utf8');
      expect(/BEGIN:VCARD/.test(body) && body.includes(`FN:${P.name}`) && body.includes(P.contact.email) && dl.suggestedFilename().endsWith('.vcf'), body.slice(0, 80));
    });
    await test('Résumé download serves the real PDF', async () => {
      const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(() => downloadResume())]);
      const fs = require('fs');
      const head = fs.readFileSync(await dl.path()).slice(0, 5).toString();
      expect(head === '%PDF-' && /Resume/i.test(dl.suggestedFilename()), head + ' ' + dl.suggestedFilename());
    });
    await test('deleting a note offers Undo, and Undo restores it', async () => {
      await page.evaluate(() => { openWindow('notes-window'); addNewNotePrompt(); });
      await page.keyboard.type('Delete me');
      await page.evaluate(() => commitNoteEdit(activeNoteId));
      await page.click('#notes-delete-btn');
      const gone = await page.evaluate(() => ![...document.querySelectorAll('.note-item-title')].some(e => e.textContent === 'Delete me'));
      await page.click('.mac-toast-action:has-text("Undo")');
      const back = await page.evaluate(() => [...document.querySelectorAll('.note-item-title')].some(e => e.textContent === 'Delete me'));
      expect(gone && back, `gone=${gone} back=${back}`);
    });
    await test('Frosted Glass applies to every window, not just some', async () => {
      await page.evaluate(() => { setThemeMode('glass'); openWindow('finder-window'); openWindow('music-window'); });
      const bgs = await page.evaluate(() => ['finder-window', 'music-window'].map(i => getComputedStyle(document.getElementById(i)).backgroundColor));
      await page.evaluate(() => setThemeMode('dark'));
      expect(bgs.every(b => /0\.42/.test(b)), bgs.join(' | '));
    });
    await test('accent colour reaches Finder selection highlights', async () => {
      await page.evaluate(() => { setAccentColor('#ff2d55'); openWindow('finder-window'); finderSidebarNav('projects'); });
      await page.waitForTimeout(350);
      const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.sidebar-v2-item.active')).backgroundColor);
      await page.evaluate(() => setAccentColor('#007aff'));
      expect(/255, 45, 85/.test(bg), bg);
    });
    await test('keyboard/system had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── Mobile ───────────── */
  if (section('mobile')) {
    console.log('\nMobile (390×844)');
    const page = await freshPage(browser, { viewport: { width: 390, height: 844 } });
    await page.screenshot({ path: SHOTS + 'mobile-desktop.png' });
    await test('no horizontal page scroll on a phone', async () => {
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(w <= 390, 'scrollWidth ' + w);
    });
    await test('a window opened on a phone fits the screen', async () => {
      await page.evaluate(() => openWindow('finder-window'));
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => document.getElementById('finder-window').getBoundingClientRect().toJSON());
      await page.screenshot({ path: SHOTS + 'mobile-finder.png' });
      expect(r.left >= -1 && r.right <= 391, JSON.stringify(r));
    });
    await test('every visible Dock icon is fully on screen', async () => {
      const off = await page.evaluate(() => [...document.querySelectorAll('.dock-item')].filter(d => d.offsetParent !== null).filter(d => { const r = d.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map(d => d.id));
      expect(off.length === 0, 'clipped: ' + off.join(', '));
    });
    await test('tapping an email opens it on a phone, and Back returns', async () => {
      await page.evaluate(() => { document.querySelectorAll('.window:not(.hidden)').forEach(w => closeWindow(w.id)); openWindow('mail-window'); });
      await page.click('.mail-item >> nth=1');
      const reading = await page.isVisible('#mail-reader-pane');
      await page.click('#mail-reader-pane .mobile-back-btn');
      const back = await page.isVisible('.mail-list-container');
      await page.screenshot({ path: SHOTS + 'mobile-mail.png' });
      expect(reading && back, `reading=${reading} back=${back}`);
    });
    await test('Settings panes are all reachable on a phone', async () => {
      await page.evaluate(() => { closeWindow('mail-window'); openWindow('settings-window'); });
      await page.click('.settings-sidebar .sidebar-item[data-pane="privacy"]');
      expect(await page.isVisible('#settings-pane-privacy'), 'privacy pane not reachable');
      await page.screenshot({ path: SHOTS + 'mobile-settings.png' });
    });
    await test('mobile had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();
  }

  /* ───────────── iPhone & iPad ───────────── */
  if (section('ios')) {
    console.log('\nDevice routing');
    await test('an iPhone opening the portfolio link lands on the iPhone version', async () => {
      const page = await iosPage(browser, { path: '' });
      const url = page.url();
      await page.context().close();
      expect(/ios\.html/.test(url), url);
    });
    await test('an iPad that reports itself as a Mac (iPadOS) gets the iPad layout', async () => {
      const page = await iosPage(browser, { device: IPADOS, path: '', init: () => Object.defineProperty(Navigator.prototype, 'maxTouchPoints', { get: () => 5 }) });
      const r = { url: page.url(), form: await page.getAttribute('#ios-device', 'data-form') };
      await page.context().close();
      expect(/ios\.html/.test(r.url) && r.form === 'tablet', JSON.stringify(r));
    });
    await test('a laptop opening ios.html is sent to the Mac version', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(BASE + 'ios.html');
      await page.waitForTimeout(500);
      const r = { url: page.url(), shell: await page.getAttribute('html', 'data-shell') };
      await ctx.close();
      expect(!/ios\.html/.test(r.url) && r.shell === 'mac', JSON.stringify(r));
    });
    await test('?view=ios on a laptop shows a framed iPhone, and "Back to the Mac version" returns', async () => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(BASE + '?view=ios');
      await page.waitForTimeout(600);
      const framed = await page.evaluate(() => document.body.classList.contains('ios-framed') && !document.getElementById('ios-frame-caption').hidden);
      const cleanUrl = !/view=/.test(page.url());
      await page.screenshot({ path: SHOTS + 'ios-framed.png' });
      await page.click('#ios-frame-caption button');
      await page.waitForTimeout(600);
      const back = await page.getAttribute('html', 'data-shell');
      await page.goto(BASE);
      await page.waitForTimeout(400);
      const stays = await page.getAttribute('html', 'data-shell');
      await ctx.close();
      expect(framed && cleanUrl && back === 'mac' && stays === 'mac', JSON.stringify({ framed, cleanUrl, back, stays }));
    });
    await test('"View Mac Version" on a phone sticks across visits; switching back restores automatic', async () => {
      const page = await iosPage(browser);
      await iosGo(page, 'settings');
      await page.click(`${topPage} [data-action="mac"]`);
      await page.waitForTimeout(800);
      const onMac = await page.getAttribute('html', 'data-shell');
      await page.goto(BASE);
      await page.waitForTimeout(500);
      const sticky = await page.getAttribute('html', 'data-shell');
      await page.evaluate(() => PORTFOLIO_SHELL.switchTo('ios'));
      await page.waitForTimeout(800);
      const r = { onMac, sticky, back: await page.getAttribute('html', 'data-shell'), pref: await page.evaluate(() => localStorage.getItem('portfolio-view')) };
      await page.context().close();
      expect(r.onMac === 'mac' && r.sticky === 'mac' && r.back === 'ios' && r.pref === null, JSON.stringify(r));
    });
    await test('the Mac Apple menu offers the iPhone version', async () => {
      const page = await freshPage(browser);
      const has = await page.evaluate(() => [...document.querySelectorAll('.dropdown-item')].some(d => /View iPhone Version/.test(d.textContent)));
      await page.context().close();
      expect(has, 'no "View iPhone Version" menu item');
    });

    console.log('\niPhone (393×852)');
    const page = await iosPage(browser, { unlocked: false });
    await test('the Lock Screen shows the time and unlocks with a tap', async () => {
      const locked = await page.isVisible('#ios-lock.visible');
      const time = (await page.textContent('#ios-lock-time')).trim();
      await page.screenshot({ path: SHOTS + 'ios-lock.png' });
      await page.click('#ios-lock-time');
      await page.waitForTimeout(600);
      const unlocked = await page.evaluate(() => document.body.classList.contains('ios-unlocked') && !document.getElementById('ios-lock').classList.contains('visible'));
      expect(locked && /\d/.test(time) && unlocked, JSON.stringify({ locked, time, unlocked }));
    });
    await test('the Home Screen shows every app and live widgets', async () => {
      await page.waitForTimeout(300);
      const r = await page.evaluate(() => ({
        icons: [...document.querySelectorAll('#ios-home [data-app-icon]')].map(i => i.dataset.appIcon),
        pages: document.querySelectorAll('#ios-home-pages > .ios-home-grid').length,
        hackathons: Boolean(document.querySelector('.ios-widget-hack')),
        weather: document.querySelector('.ios-ww-temp').textContent,
        github: document.querySelector('#ios-widget-github').textContent
      }));
      await page.screenshot({ path: SHOTS + 'ios-home.png' });
      // Every live project is an app of its own.
      const live = P.projects.filter(x => x.live && x.link).map(x => `live-${x.id}`);
      const core = ['about', 'projects', 'resume', 'photos', 'notes', 'settings', 'weather', 'calculator', 'messages', 'mail', 'safari', 'music', 'camera', 'game-2048', 'snake', ...(P.places.length ? ['maps'] : [])];
      const missing = [...core, ...live].filter(id => !r.icons.includes(id));
      expect(!missing.length && r.pages === 2 && (r.hackathons || !P.hackathons.length) && r.weather === '23°' && (!P.github.user || /Lighthouse/.test(r.github)), JSON.stringify({ ...r, missing }));
    });
    await test('tapping an icon opens the app', async () => {
      await page.click('#ios-home [data-app-icon="about"]');
      await page.waitForTimeout(400);
      const r = await page.evaluate(() => ({ hash: location.hash, shown: document.getElementById('ios-app-window').classList.contains('shown') }));
      expect(r.hash === '#/about' && r.shown, JSON.stringify(r));
    });
    await test('pages push and pop with the Back button and the browser Back', async () => {
      await page.click(`${topPage} [data-action="exp-0"]`);
      await page.waitForTimeout(400);
      const pushed = await page.evaluate(() => location.hash);
      await page.goBack();
      await page.waitForTimeout(400);
      const popped = await page.evaluate(() => location.hash);
      await page.click(`${topPage} [data-ios-back]`);
      await page.waitForTimeout(500);
      const home = await page.evaluate(() => !document.body.classList.contains('ios-in-app') && !location.hash);
      expect(pushed === '#/about/experience/0' && popped === '#/about' && home, JSON.stringify({ pushed, popped, home }));
    });
    await test('the home bar returns to the Home Screen', async () => {
      await iosGo(page, 'settings');
      await page.click('#ios-home-bar');
      await page.waitForTimeout(500);
      expect(!(await page.evaluate(() => document.body.classList.contains('ios-in-app'))), 'still in the app');
    });
    await test('Maps pins every place, filters them, and shows one in detail', async () => {
      if (!P.places.length) return;
      await page.evaluate(() => { location.hash = ''; });
      await page.waitForTimeout(300);
      // The Hackathons widget (page 2) opens Maps filtered to hackathons.
      if (P.hackathons.length) {
        await page.evaluate(() => { const p = document.getElementById('ios-home-pages'); p.scrollLeft = p.clientWidth; });
        await page.click('.ios-widget-hack');
      } else {
        await iosGo(page, 'maps');
      }
      await page.waitForSelector('.map-pin', { timeout: 8000 });
      const filtered = await page.evaluate(() => ({ hash: location.hash, rows: document.querySelectorAll('.map-row').length, pins: document.querySelectorAll('.map-pin').length }));
      await page.click('.map-row >> nth=0');
      await page.waitForTimeout(500);
      const detail = await page.evaluate(() => ({ title: (document.querySelector('.map-detail h3') || {}).textContent, directions: (document.querySelector('.map-actions a') || {}).href || '' }));
      await page.screenshot({ path: SHOTS + 'ios-maps.png' });
      const wantRows = P.hackathons.length ? P.places.filter(x => x.kind === 'hackathon').length : P.places.length;
      expect(filtered.rows === wantRows && filtered.pins === P.places.length && detail.title && /google\.com\/maps/.test(detail.directions),
        JSON.stringify({ filtered, detail, wantRows }));
    });
    await test('Iris can open a place on the map by name', async () => {
      const pin = P.places[P.places.length - 1];
      if (!pin) return;
      await page.evaluate((title) => IOS.runAction({ app: 'maps', target: title }), pin.title);
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => ({ hash: location.hash, title: (document.querySelector('.map-detail h3') || {}).textContent }));
      await page.evaluate(() => IOS.home());
      await page.waitForTimeout(500);
      expect(r.hash === `#/maps/${pin.id}` && r.title === pin.title, JSON.stringify(r));
    });
    await test('Camera takes a photo into the Camera Roll, Photos shows it, and the camera is released', async () => {
      await iosGo(page, 'camera');
      await page.waitForTimeout(400);
      if (await page.isVisible('.cam-gate [data-act="start"]')) await page.click('.cam-gate [data-act="start"]');
      await page.waitForSelector('.cam.live', { timeout: 6000 });
      await page.waitForTimeout(400);
      await page.evaluate(() => { window.__camTracks = document.querySelector('.cam-view').srcObject.getTracks(); });
      await page.click('[data-act="shoot"]');
      await page.waitForSelector('.cam-thumb img', { timeout: 4000 });
      const roll = await page.evaluate(async () => (await CameraRoll.list()).length);
      await page.click('[data-act="roll"]');
      await page.waitForSelector('.photos-viewer img', { timeout: 4000 });
      const r = await page.evaluate(() => ({ hash: location.hash, released: window.__camTracks.every(t => t.readyState === 'ended') }));
      await page.evaluate(() => IOS.home());
      await page.waitForTimeout(400);
      expect(roll >= 1 && /^#\/photos\/cam-/.test(r.hash) && r.released, JSON.stringify({ roll, ...r }));
    });
    const swipe = async (selector, dx, dy) => {
      const b = await page.locator(selector).boundingBox();
      const x = b.x + b.width / 2;
      const y = b.y + b.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y + dy, { steps: 4 });
      await page.mouse.up();
    };
    await test('2048 slides and merges tiles on a swipe', async () => {
      await iosGo(page, 'game-2048');
      await page.waitForTimeout(300);
      const before = await page.evaluate(() => JSON.stringify(ios2048.state.tiles));
      // Swipe until something moves (a swipe toward a full edge changes nothing).
      let changed = false;
      for (const [dx, dy] of [[-120, 0], [0, -120], [120, 0], [0, 120]]) {
        await swipe('.g2048-board', dx, dy);
        await page.waitForTimeout(260);
        if (await page.evaluate((b) => JSON.stringify(ios2048.state.tiles) !== b, before)) { changed = true; break; }
      }
      const tiles = await page.evaluate(() => document.querySelectorAll('.g2048-tile').length);
      await page.evaluate(() => IOS.home());
      await page.waitForTimeout(300);
      expect(changed && tiles >= 3, JSON.stringify({ changed, tiles }));
    });
    await test('Snake starts on a swipe and pauses on a tap', async () => {
      await iosGo(page, 'snake');
      await page.waitForTimeout(300);
      await swipe('.snake-board', 0, 120);
      await page.waitForTimeout(400);
      const playing = await page.evaluate(() => iosSnake.state.state);
      await swipe('.snake-board', 0, 0);
      await page.waitForTimeout(200);
      const paused = await page.evaluate(() => iosSnake.state.state);
      await page.evaluate(() => IOS.home());
      await page.waitForTimeout(300);
      expect(playing === 'playing' && paused === 'paused', JSON.stringify({ playing, paused }));
    });
    await test('holding the home bar summons Iris over any app, and it knows what is on screen', async () => {
      const project = P.projects[0];
      if (!project) return;
      await iosGo(page, 'projects', [project.fsId]);
      await page.waitForTimeout(400);
      const bar = await page.locator('#ios-home-bar').boundingBox();
      await page.mouse.move(bar.x + bar.width / 2, bar.y + bar.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(650);
      await page.mouse.up();
      await page.waitForSelector('#siri.on', { timeout: 3000 });
      const stillThere = await page.evaluate(() => IOS.currentApp);
      await page.fill('#siri input', 'what does this do?');
      await page.press('#siri input', 'Enter');
      await page.waitForSelector('#siri .siri-text', { timeout: 4000 });
      const r = await page.evaluate(() => ({ context: document.querySelector('.siri-context').textContent, answer: document.querySelector('.siri-text').textContent }));
      await page.screenshot({ path: SHOTS + 'ios-iris-everywhere.png' });
      await page.click('#siri .siri-scrim', { position: { x: 20, y: 120 } });
      await page.waitForTimeout(400);
      const closed = await page.evaluate(() => !IrisEverywhere.isOpen);
      expect(stillThere === 'projects' && r.context.includes(project.name) && r.answer.includes(project.name) && closed, JSON.stringify({ stillThere, ...r, closed }));
    });
    await test('with a model, "show me where he competed" goes straight to Maps', async () => {
      const pin = P.places.find(x => x.kind === 'hackathon') || P.places[0];
      if (!pin) return;
      await page.route('**/__iris-test', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ reply: `Here you go — **${pin.title}**.`, action: { app: 'maps', target: pin.title } }) }));
      // APP_CONFIG is frozen; the client reads window.APP_CONFIG on every call, so swap the whole object.
      await page.evaluate(() => { window.__config = window.APP_CONFIG; window.APP_CONFIG = Object.freeze({ ...window.APP_CONFIG, IRIS_ENDPOINT: `${location.origin}/__iris-test` }); IOS.home(); });
      let title = null;
      try {
        await page.waitForTimeout(400);
        await page.evaluate(() => IrisEverywhere.open());
        await page.fill('#siri input', 'show me where he competed');
        await page.press('#siri input', 'Enter');
        await page.waitForSelector('#siri .siri-run', { timeout: 4000 });
        await page.waitForFunction((id) => location.hash === `#/maps/${id}`, pin.id, { timeout: 5000 });
        title = await page.evaluate(() => (document.querySelector('.map-detail h3') || {}).textContent);
      } finally {
        await page.evaluate(() => { window.APP_CONFIG = window.__config; IrisEverywhere.close(); IOS.home(); });
        await page.unroute('**/__iris-test');
        await page.waitForTimeout(400);
      }
      expect(title === pin.title, title);
    });
    await test('Search finds portfolio content and can hand the question to Iris', async () => {
      await page.click('#ios-search-pill');
      await page.fill('#ios-search-input', P.projects.length ? P.projects[0].name : P.first);
      await page.waitForTimeout(200);
      const results = await page.textContent('#ios-search-results');
      await page.screenshot({ path: SHOTS + 'ios-search.png' });
      await page.click('#ios-search-ask');
      await page.waitForSelector('.msg-row.iris .msg-sources', { timeout: 4000 });
      expect(/From this portfolio/.test(results) && (await page.evaluate(() => location.hash)) === '#/messages', results.slice(0, 120));
    });
    await test('Iris answers with sources, and a source opens the right page', async () => {
      await page.click(`${topPage} .ios-nav-action`);   // New conversation
      await page.fill('.msg-bar input', `Where ${P.pron.have} ${P.pron.subject} worked?`);
      await page.press('.msg-bar input', 'Enter');
      await page.waitForSelector('.msg-row.iris .msg-sources button:not([disabled])', { timeout: 4000 });
      await page.screenshot({ path: SHOTS + 'ios-iris.png' });
      await page.click('.msg-row.iris .msg-sources button:not([disabled]) >> nth=0');
      await page.waitForTimeout(500);
      const hash = await page.evaluate(() => location.hash);
      expect(/^#\/about/.test(hash), hash);
    });
    await test('the Iris conversation survives a reload, and "New conversation" clears it', async () => {
      await page.reload();
      await page.waitForTimeout(700);
      await iosGo(page, 'messages');
      const kept = await page.locator('.msg-row.me').count();
      await page.click(`${topPage} .ios-nav-action`);
      const cleared = await page.locator('.msg-row.me').count();
      expect(kept > 0 && cleared === 0, JSON.stringify({ kept, cleared }));
    });
    await test('Projects filters by category, and product pages link out safely', async () => {
      await iosGo(page, 'projects');
      await page.click(`${topPage} [data-filter="vision"]`);
      const ok = await page.evaluate(() => {
        const vision = getPortfolioProjects().filter(p => p.cats.includes('vision')).map(p => p.id).sort().join();
        return [...document.querySelectorAll('.ios-app-window .proj-item')].map(i => i.dataset.project).sort().join() === vision;
      });
      await page.click(`${topPage} .proj-item >> nth=0`);
      await page.waitForTimeout(400);
      const link = await page.evaluate(() => { const a = document.querySelector('.ios-app-window .ios-page:last-child .proj-get'); return a && { target: a.target, rel: a.rel, href: a.getAttribute('href') }; });
      await page.screenshot({ path: SHOTS + 'ios-product.png' });
      expect(ok && link && link.target === '_blank' && /noopener/.test(link.rel) && /^https:/.test(link.href), JSON.stringify(link));
    });
    await test('Notes: a new note persists across a reload in the Mac-compatible format', async () => {
      await iosGo(page, 'notes');
      await page.click(`${topPage} .notes-fab`);
      await page.waitForTimeout(600);
      await page.fill(`${topPage} .notes-title-input`, 'Interview prep');
      await page.fill(`${topPage} .notes-text`, 'Ask about the RAG eval pipeline');
      await page.reload();
      await page.waitForTimeout(700);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('notes-user-v1') || '[]'));
      await iosGo(page, 'notes', ['all']);
      const listed = await page.textContent(`${topPage} .notes-list`);
      expect(stored.some(n => n.title === 'Interview prep' && n.text === 'Ask about the RAG eval pipeline') && /Interview prep/.test(listed), JSON.stringify(stored));
    });
    await test('Notes: deleting a note offers Undo, which restores it', async () => {
      await page.click(`${topPage} .notes-row:has-text("Interview prep")`);
      await page.waitForTimeout(400);
      await page.click(`${topPage} .ios-nav-action[aria-label="Delete note"]`);
      await page.waitForTimeout(300);
      const gone = await page.evaluate(() => !JSON.parse(localStorage.getItem('notes-user-v1') || '[]').some(n => n.title === 'Interview prep'));
      await page.click('.mac-toast-action');
      await page.waitForTimeout(400);
      const back = await page.evaluate(() => JSON.parse(localStorage.getItem('notes-user-v1') || '[]').some(n => n.title === 'Interview prep'));
      expect(gone && back, JSON.stringify({ gone, back }));
    });
    await test('Recently Deleted lists every Trash post-mortem', async () => {
      await iosGo(page, 'notes', ['deleted']);
      const r = await page.evaluate(() => ({ rows: document.querySelectorAll('.ios-app-window .ios-page:last-child .ios-row').length, items: window.TRASH_ITEMS.length }));
      expect(r.rows === r.items && r.items > 0, JSON.stringify(r));
    });
    await test('Mail will not send without a reply-to address', async () => {
      await iosGo(page, 'mail', ['compose']);
      await page.fill(`${topPage} [name="message"]`, 'Hello there');
      await page.click(`${topPage} .ios-nav-action[aria-label="Send"]`);
      await page.waitForTimeout(300);
      const hint = await page.textContent(`${topPage} .mail-hint`);
      expect(/email/i.test(hint) && page.__web3 === 0, `${hint} / sent ${page.__web3}`);
    });
    await test('Mail keeps a draft, then sends through the contact form', async () => {
      await page.fill(`${topPage} [name="name"]`, 'Test Recruiter');
      await page.fill(`${topPage} [name="email"]`, 'recruiter@example.com');
      await page.evaluate(() => IOS.home());
      await page.waitForTimeout(400);
      await iosGo(page, 'mail', ['compose']);
      const restored = await page.inputValue(`${topPage} [name="email"]`);
      await page.click(`${topPage} .ios-nav-action[aria-label="Send"]`);
      await page.waitForTimeout(800);
      const toast = await page.textContent('#mac-toast-stack').catch(() => '');
      const draft = await page.evaluate(() => localStorage.getItem('ios-mail-draft'));
      expect(restored === 'recruiter@example.com' && page.__web3 === 1 && /Message sent/.test(toast) && draft === null, JSON.stringify({ restored, sent: page.__web3, toast, draft }));
    });
    await test('Calculator respects precedence, percent and division by zero', async () => {
      await iosGo(page, 'calculator');
      const press = async (keys) => { for (const k of keys) await page.click(`${topPage} [data-k="${k}"]`); };
      const shown = () => page.textContent(`${topPage} .calc-display`);
      await press(['7', '×', '6', '+', '2', '=']);
      const a = await shown();
      await press(['AC', '5', '0', '%']);
      const b = await shown();
      await press(['AC', '1', '÷', '0', '=']);
      const c = await shown();
      expect(a === '44' && b === '0.5' && c === 'Error', JSON.stringify({ a, b, c }));
    });
    await test('Calculator works from a hardware keyboard', async () => {
      await page.keyboard.press('Escape');
      for (const k of ['1', '2', '+', '3', 'Enter']) await page.keyboard.press(k);
      const v = await page.textContent(`${topPage} .calc-display`);
      expect(v === '15', v);
    });
    await test('Weather shows current conditions, 24 hours and 7 days', async () => {
      await iosGo(page, 'weather');
      await page.waitForSelector(`${topPage} .wx-day`, { timeout: 4000 });
      const r = await page.evaluate(() => ({ temp: document.querySelector('.wx-temp').textContent, hours: document.querySelectorAll('.wx-hour').length, days: document.querySelectorAll('.wx-day').length }));
      await page.screenshot({ path: SHOTS + 'ios-weather.png' });
      expect(r.temp === '23°' && r.hours >= 20 && r.days === 7, JSON.stringify(r));
    });
    await test('Music plays a generative track and shows a mini player', async () => {
      await iosGo(page, 'music');
      const i = await page.evaluate(() => MUSIC_TRACKS.findIndex(t => t.synth));
      await page.click(`${topPage} [data-track="${i}"]`);
      await page.waitForTimeout(600);
      const r = await page.evaluate(() => ({ mini: !document.querySelector('.music-mini').hidden, title: document.querySelector('.music-mini-title').textContent, ctx: typeof sharedAudioCtx !== 'undefined' && sharedAudioCtx && sharedAudioCtx.state }));
      await page.click('.music-mini-btn >> nth=0');
      expect(r.mini && /Midnight|Neon/.test(r.title) && r.ctx === 'running', JSON.stringify(r));
    });
    await test('Photos opens a certificate full screen', async () => {
      await iosGo(page, 'photos');
      await page.click(`${topPage} .photos-tile[data-file="cert-1"]`);
      await page.waitForTimeout(400);
      const cap = await page.textContent(`${topPage} figcaption`);
      expect(new RegExp(await page.evaluate(() => PHOTO_LIBRARY.certificates.items[0].issuer)).test(cap), cap);
    });
    await test('Safari searches the portfolio and recognises web addresses', async () => {
      await iosGo(page, 'safari');
      const query = P.projects.length ? P.projects[0].name : P.first;
      await page.fill('.safari-field input', query);
      const results = await page.textContent(`${topPage} .safari-scroll`);
      await page.fill('.safari-field input', 'example.com');
      const address = await page.textContent(`${topPage} .safari-scroll`);
      expect(/From this portfolio/.test(results) && results.includes(query) && /Opens in a new tab/.test(address), address.slice(0, 120));
    });
    await test('Résumé opens the current PDF', async () => {
      await iosGo(page, 'resume');
      await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
      await page.click(`${topPage} .resume-actions [data-action="open"]`);
      const opened = await page.evaluate(() => window.__opened[0] || '');
      expect(!P.resume.file || new RegExp(`${escapeRe(path.basename(P.resume.file))}$`).test(opened), opened);
    });
    await test('Settings: Dark appearance and a new wallpaper persist after a reload', async () => {
      await iosGo(page, 'settings', ['display']);
      await page.click(`${topPage} [data-action="mode-dark"]`);
      await iosGo(page, 'settings', ['wallpaper']);
      await page.click(`${topPage} [data-action="w-1"]`);
      await page.reload();
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => ({ mode: document.documentElement.dataset.appearance, wp: document.getElementById('ios-wallpaper').style.backgroundImage }));
      await page.screenshot({ path: SHOTS + 'ios-dark.png' });
      expect(r.mode === 'dark' && /daybreak/.test(r.wp), JSON.stringify(r));
    });
    await test('Lock Screen in Settings locks the phone', async () => {
      await iosGo(page, 'settings');
      await page.click(`${topPage} [data-action="lock"]`);
      await page.waitForTimeout(300);
      expect(await page.isVisible('#ios-lock.visible'), 'not locked');
      await page.click('#ios-lock-time');
      await page.waitForTimeout(500);
    });
    await test('no app scrolls sideways on a phone', async () => {
      const wide = [];
      for (const app of IOS_APPS) {
        await iosGo(page, app);
        await page.waitForTimeout(150);
        const r = await page.evaluate(() => { const b = document.querySelector('.ios-app-window .ios-page:last-child .ios-page-body'); return { doc: document.documentElement.scrollWidth, body: b ? b.scrollWidth - b.clientWidth : 0 }; });
        if (r.doc > 393 || r.body > 1) wide.push(`${app}:${JSON.stringify(r)}`);
      }
      expect(wide.length === 0, wide.join(' '));
    });
    await test('iPhone had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
    await page.context().close();

    console.log('\niPad (834×1194)');
    const pad = await iosPage(browser, { device: IPAD });
    await test('on an Android phone, unlocking goes full screen; the status bar brings Chrome back', async () => {
      const android = await browser.newContext({ ...devices['Pixel 7'], reducedMotion: 'reduce' });
      await routeLiveApis(android, { __web3: 0 });
      const p = await android.newPage();
      await p.goto(BASE + 'ios.html');
      await p.waitForTimeout(800);
      await p.tap('#ios-lock-time');
      await p.waitForTimeout(600);
      const entered = await p.evaluate(() => document.fullscreenElement === document.documentElement);
      await p.touchscreen.tap(200, 10);            // the status bar
      await p.waitForTimeout(400);
      const revealed = await p.evaluate(() => !document.fullscreenElement);
      await p.touchscreen.tap(200, 700);           // anywhere else hides the bars again
      await p.waitForTimeout(500);
      const again = await p.evaluate(() => Boolean(document.fullscreenElement));
      await android.close();
      expect(entered && revealed && again, JSON.stringify({ entered, revealed, again }));
    });
    await test('iPad uses the tablet layout with a six-column Home Screen', async () => {
      const r = await pad.evaluate(() => ({ form: document.getElementById('ios-device').dataset.form, cols: getComputedStyle(document.getElementById('ios-home-grid')).gridTemplateColumns.split(' ').length }));
      await pad.screenshot({ path: SHOTS + 'ios-ipad.png' });
      expect(r.form === 'tablet' && r.cols === 6, JSON.stringify(r));
    });
    await test('no app scrolls sideways on an iPad', async () => {
      const wide = [];
      for (const app of IOS_APPS) {
        await iosGo(pad, app);
        const r = await pad.evaluate(() => { const b = document.querySelector('.ios-app-window .ios-page:last-child .ios-page-body'); return { doc: document.documentElement.scrollWidth - innerWidth, body: b ? b.scrollWidth - b.clientWidth : 0 }; });
        if (r.doc > 0 || r.body > 1) wide.push(`${app}:${JSON.stringify(r)}`);
      }
      expect(wide.length === 0, wide.join(' '));
    });
    await test('iPad had no runtime errors', async () => expect(pad.__errors.length === 0, pad.__errors.join(' | ')));
    await pad.context().close();
  }

  /* ───────────── Make it yours (setup questionnaire) ───────────── */
  if (section('setup')) {
    console.log('\nMake it yours — a fresh clone, set up by someone new');
    // A throwaway copy of the repository, so the real info bank is never touched.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-clone-'));
    fs.cpSync(ROOT, tmp, { recursive: true, filter: (src) => !/[\\/](node_modules|\.git|test-results|scratch|\.portfolio)([\\/]|$)/.test(path.relative(ROOT, src) ? `/${path.relative(ROOT, src)}` : '') });
    const port = 8700 + Math.floor(Math.random() * 200);
    const origin = `http://localhost:${port}`;
    const server = spawn(process.execPath, ['scripts/dev-server.js', '--port', String(port), '--no-open'], { cwd: tmp, stdio: ['ignore', 'pipe', 'pipe'] });
    let serverLog = '';
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(`dev server did not start: ${serverLog}`)), 8000);
      const onData = (d) => { serverLog += d; if (/Portfolio running/.test(serverLog)) { clearTimeout(t); resolve(); } };
      server.stdout.on('data', onData);
      server.stderr.on('data', onData);
    });
    // Whoever owns this copy now: nothing of theirs may survive the new owner's setup.
    const OLD = personalTokens(P);
    const leftovers = (html) => findTokens(html, OLD).map(f => f.token);
    const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR42mP8z8DwnwEJMDGgAQYGBgB1BAEFtk6nqwAAAABJRU5ErkJggg==', 'base64');
    const tinyPdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');

    try {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      page.__errors = [];
      page.on('pageerror', e => page.__errors.push(e.message));
      await ctx.route(/^https?:\/\/(?!localhost)/, r => (['stylesheet', 'font'].includes(r.request().resourceType()) ? r.continue() : r.abort()));

      await test('a fresh clone reports setup as pending, and the site offers it', async () => {
        const status = await (await fetch(`${origin}/__setup/status`)).json();
        await page.addInitScript(() => { try { sessionStorage.setItem('mac-unlocked', 'true'); sessionStorage.setItem('mac-welcome-shown', '1'); } catch (e) {} });
        await page.goto(origin + '/');
        await page.waitForSelector('.setup-hint', { timeout: 4000 });
        expect(status.pending === true && /setup/.test(await page.getAttribute('.setup-hint a', 'href')), JSON.stringify(status));
      });

      await test('the questionnaire walks through every step and builds the portfolio', async () => {
        await page.goto(origin + '/setup/');
        await page.click('[data-act="start-fresh"]');
        await page.setInputFiles('[data-upload="photo"] input[type=file]', { name: 'me.png', mimeType: 'image/png', buffer: tinyPng });
        await page.waitForSelector('[data-upload="photo"] img');
        await page.fill('[data-path="name"]', 'Ada Lovelace');
        await page.selectOption('[data-path="pronouns"]', 'she');
        await page.fill('[data-path="role"]', 'Software Engineer');
        await page.fill('[data-path="tagline"]', 'Software Engineer & Mathematician');
        await page.fill('[data-path="bio"]', 'Writes programs for engines that do not exist yet.');
        await page.click('#setup-next');
        await page.fill('[data-path="contact.email"]', 'ada@example.com');
        await page.fill('[data-path="contact.github"]', 'https://github.com/ada-example');
        await page.click('#setup-next');
        await page.click('[data-act="add"][data-list="experience"]');
        await page.fill('[data-path="experience.0.role"]', 'Analyst');
        await page.fill('[data-path="experience.0.org"]', 'Analytical Engines Ltd.');
        await page.fill('[data-path="experience.0.dates"]', '1842 – 1843');
        await page.fill('[data-path="experience.0.bullets"]', 'Wrote the first published algorithm\nTranslated and annotated Menabrea');
        await page.click('#setup-next');
        await page.fill('[data-path="education.degree"]', 'Private tuition in mathematics');
        await page.click('#setup-next');
        await page.click('[data-act="add"][data-list="projects"]');
        await page.fill('[data-path="projects.0.name"]', 'Bernoulli Numbers');
        await page.fill('[data-path="projects.0.subtitle"]', 'Note G, the first program');
        await page.fill('[data-path="projects.0.link"]', 'https://bernoulli.example.com');
        await page.fill('[data-path="projects.0.tags"]', 'Algorithms, Mathematics');
        await page.click('#setup-next');
        // Hackathons & events: pinning a venue (the geocoder answers from a fixture).
        await ctx.route(/nominatim\.openstreetmap\.org/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[{"lat":"51.50553","lon":"-0.13283"}]' }));
        await page.click('[data-act="add"][data-list="hackathons"]');
        await page.fill('[data-path="hackathons.0.name"]', 'Analytical Hack');
        await page.fill('[data-path="hackathons.0.result"]', 'Winner');
        await page.fill('[data-path="hackathons.0.place.name"]', 'Royal Society');
        await page.fill('[data-path="hackathons.0.place.city"]', 'London');
        await page.click('[data-act="locate"][data-path="hackathons.0.place"]');
        await page.waitForSelector('[data-place="hackathons.0.place"] .fa-location-dot', { timeout: 4000 });
        await page.click('#setup-next');
        await page.click('[data-act="add"][data-list="skills"]');
        await page.fill('[data-path="skills.0.label"]', 'Languages');
        await page.fill('[data-path="skills.0.items"]', 'Notation, French');
        await page.click('#setup-next');
        await page.setInputFiles('[data-upload="resume.file"] input[type=file]', { name: 'cv.pdf', mimeType: 'application/pdf', buffer: tinyPdf });
        await page.waitForSelector('[data-upload="resume.file"] .fa-file-pdf');
        await page.click('#setup-next');   // extras
        await page.click('#setup-next');   // site & services
        await page.fill('[data-path="site.url"]', 'https://ada-example.github.io/MacOS_Portfolio/');
        await page.fill('[data-config="web3formsKey"]', '');
        await page.click('#setup-next');   // review
        await page.waitForFunction(() => (document.querySelector('#share-preview-img').getAttribute('src') || '').startsWith('data:image/jpeg'), null, { timeout: 5000 });
        await page.screenshot({ path: SHOTS + 'setup-review.png' });
        expect(/Build my portfolio/.test(await page.textContent('#setup-next')), 'the last step’s primary button should build');
        await page.click('#setup-next');
        await page.waitForSelector('.done-screen', { timeout: 8000 });
        await page.screenshot({ path: SHOTS + 'setup-done.png' });
        const profileSrc = fs.readFileSync(path.join(tmp, 'js/data/profile.js'), 'utf8');
        const files = fs.readdirSync(path.join(tmp, 'assets/me'));
        const indexHtml = fs.readFileSync(path.join(tmp, 'index.html'), 'utf8');
        if (files.includes('link-preview.jpg')) fs.copyFileSync(path.join(tmp, 'assets/me/link-preview.jpg'), SHOTS + 'setup-link-preview.jpg');
        const r = {
          profile: /"name": "Ada Lovelace"/.test(profileSrc) && /"pronouns": "she"/.test(profileSrc),
          hackathon: /"name": "Analytical Hack"/.test(profileSrc) && /"lat": 51\.50553/.test(profileSrc),
          photo: files.some(f => /^photo\.(png|jpg)$/.test(f)),
          resume: files.includes('ada-lovelace-resume.pdf'),
          icon: files.some(f => /^project-bernoulli-numbers\.png$/.test(f)),
          linkPreview: files.includes('link-preview.jpg') && indexHtml.includes('content="https://ada-example.github.io/MacOS_Portfolio/assets/me/link-preview.jpg"'),
          title: /<title>Ada Lovelace - macOS Portfolio<\/title>/.test(indexHtml),
          owner: /"name": "Ada Lovelace"/.test(fs.readFileSync(path.join(tmp, 'api/_owner.js'), 'utf8')),
          key: /WEB3FORMS_ACCESS_KEY: null/.test(fs.readFileSync(path.join(tmp, 'js/config/config.js'), 'utf8')),
          marker: fs.existsSync(path.join(tmp, '.portfolio/setup.json'))
        };
        expect(Object.values(r).every(Boolean), JSON.stringify(r));
      });

      await test('the previous owner’s files can be tidied away, and only those', async () => {
        const listed = JSON.parse(fs.readFileSync(path.join(tmp, '.portfolio/setup.json'), 'utf8')).leftovers.map(l => l.path);
        const photo = setup.readProfile(ROOT).photo || '';
        const offered = await page.textContent('.tidy');
        await page.click('[data-act="tidy"]');
        await page.waitForSelector('.tidy-done', { timeout: 4000 });
        const remaining = listed.filter(f => fs.existsSync(path.join(tmp, f)));
        const kept = ['assets/Wallpapers/26-Tahoe-Beach-Day.jpg', 'assets/icons/finder.png'].every(f => fs.existsSync(path.join(tmp, f)));
        const ownFiles = fs.readdirSync(path.join(tmp, 'assets/me')).length;
        const photoGone = !/^assets\/(?!icons\/)/.test(photo) || listed.includes(photo);
        expect(/Tidy up/.test(offered) && listed.length > 0 && remaining.length === 0 && photoGone && kept && ownFiles >= 4, JSON.stringify({ offered: offered.slice(0, 80), listed: listed.length, remaining, photoGone, kept, ownFiles }));
      });

      await test('the Mac version is now about the new owner — no trace of the previous one', async () => {
        await page.goto(origin + '/');
        await page.waitForTimeout(1200);
        const r = await page.evaluate(() => ({
          html: document.documentElement.outerHTML,
          welcome: (openWelcome(), document.querySelector('#welcome-content h1').textContent),
          whoami: (runTerminalCommand('whoami'), document.getElementById('terminal-output').lastElementChild.textContent),
          iris: IrisBrain.respond('who is she?').text,
          hint: Boolean(document.querySelector('.setup-hint'))
        }));
        await page.screenshot({ path: SHOTS + 'setup-mac.png' });
        const left = leftovers(r.html);
        expect(r.welcome === 'Ada Lovelace' && r.whoami.trim() === 'Ada Lovelace' && /Ada Lovelace/.test(r.iris) && !r.hint && left.length === 0, JSON.stringify({ ...r, html: undefined, left }));
      });

      await test('the iPhone version is about the new owner too', async () => {
        const phone = await browser.newContext({ ...IPHONE, reducedMotion: 'reduce' });
        await phone.route(/^https?:\/\/(?!localhost)/, r => (['stylesheet', 'font'].includes(r.request().resourceType()) ? r.continue() : r.abort()));
        const p2 = await phone.newPage();
        await p2.addInitScript(() => { try { sessionStorage.setItem('ios-unlocked', '1'); } catch (e) {} });
        await p2.goto(origin + '/ios.html#/about');
        await p2.waitForTimeout(900);
        const r = await p2.evaluate(() => ({ html: document.documentElement.outerHTML, name: document.querySelector('.about-hero h1').textContent }));
        await p2.screenshot({ path: SHOTS + 'setup-ios.png' });
        await phone.close();
        const left = leftovers(r.html);
        expect(r.name === 'Ada Lovelace' && left.length === 0, JSON.stringify({ name: r.name, left }));
      });

      await test('the setup server refuses other origins, other hosts and paths outside assets/me', async () => {
        const save = (body, headers = {}) => fetch(`${origin}/__setup/save`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
        const cross = await save({ profile: { name: 'X' } }, { Origin: 'https://evil.example' });
        const escape = await save({ profile: { name: 'X' }, files: [{ path: 'assets/me/../../index.html', data: 'data:text/html;base64,PGgxPg==' }] }, { Origin: origin });
        const host = await new Promise((resolve) => {
          const req = http.request({ host: '127.0.0.1', port, path: '/__setup/status', headers: { Host: 'evil.example' } }, (res) => resolve(res.statusCode));
          req.on('error', () => resolve(0));
          req.end();
        });
        const secret = await fetch(`${origin}/.env`);
        const stillAda = /"name": "Ada Lovelace"/.test(fs.readFileSync(path.join(tmp, 'js/data/profile.js'), 'utf8'));
        expect(cross.status === 403 && escape.status === 400 && host === 421 && secret.status === 404 && stillAda, JSON.stringify({ cross: cross.status, escape: escape.status, host, secret: secret.status, stillAda }));
      });

      await test('the template and asset gates pass on the new owner’s copy', async () => {
        const run = (script) => new Promise((resolve) => {
          const child = spawn(process.execPath, [script], { cwd: tmp });
          let log = '';
          child.stdout.on('data', d => { log += d; });
          child.stderr.on('data', d => { log += d; });
          child.on('close', (code) => resolve({ code, log }));
        });
        const outs = await Promise.all(['scripts/test-template.js', 'scripts/test-assets.js'].map(run));
        expect(outs.every(o => o.code === 0), outs.flatMap(o => o.log.split('\n').filter(l => /FAIL/.test(l))).slice(0, 5).join(' | '));
      });

      await test('a name and nothing else still opens every app on both versions', async () => {
        const bare = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-bare-'));
        fs.cpSync(tmp, bare, { recursive: true });
        setup.saveSubmission({ name: 'Min', pronouns: 'they' }, {}, bare);
        const bport = port + 1;
        const bserver = spawn(process.execPath, ['scripts/dev-server.js', '--port', String(bport), '--no-open'], { cwd: bare, stdio: ['ignore', 'pipe', 'pipe'] });
        const errors = [];
        try {
          await new Promise((resolve) => bserver.stdout.on('data', d => /Portfolio running/.test(d) && resolve()));
          const mac = await ctx.newPage();
          mac.on('pageerror', e => errors.push(`mac: ${e.message}`));
          await mac.goto(`http://localhost:${bport}/?view=mac`);
          await mac.waitForTimeout(1200);
          errors.push(...await mac.evaluate(() => {
            const out = [];
            const run = (label, fn) => { try { fn(); } catch (e) { out.push(`${label}: ${e.message}`); } };
            document.querySelectorAll('.window[id]').forEach(w => run(w.id, () => { openWindow(w.id); closeWindow(w.id); }));
            run('launchpad', () => { openLaunchpad(); closeLaunchpad(); });
            ['whoami', 'neofetch', 'ls projects/', 'cat experience.txt', 'curl me'].forEach(c => run(c, () => runTerminalCommand(c)));
            ['who is Min?', 'what have they built?', 'how do I reach them?'].forEach(q => run(q, () => IrisBrain.respond(q)));
            return out;
          }));
          await mac.close();
          const phone = await browser.newContext({ ...IPHONE, reducedMotion: 'reduce' });
          await phone.route(/^https?:\/\/(?!localhost)/, r => (['stylesheet', 'font'].includes(r.request().resourceType()) ? r.continue() : r.abort()));
          const ios = await phone.newPage();
          ios.on('pageerror', e => errors.push(`ios: ${e.message}`));
          await ios.addInitScript(() => { try { sessionStorage.setItem('ios-unlocked', '1'); } catch (e) {} });
          await ios.goto(`http://localhost:${bport}/ios.html`);
          await ios.waitForTimeout(900);
          for (const app of await ios.evaluate(() => [...document.querySelectorAll('#ios-home [data-app-icon]')].map(i => i.dataset.appIcon))) {
            await ios.evaluate(a => { location.hash = `#/${a}`; }, app);
            await ios.waitForTimeout(250);
          }
          await phone.close();
        } finally {
          bserver.kill();
          fs.rmSync(bare, { recursive: true, force: true });
        }
        expect(errors.length === 0, errors.slice(0, 4).join(' | '));
      });

      await test('the owner’s admin edits the live info bank and publishes only the content', async () => {
        const { spawnSync } = require('child_process');
        const work = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-admin-'));
        const repo = path.join(work, 'site');
        const remote = path.join(work, 'github.git');
        fs.cpSync(ROOT, repo, { recursive: true, filter: (src) => !/[\\/](node_modules|\.git|test-results|scratch|\.portfolio)([\\/]|$)/.test(path.relative(ROOT, src) ? `/${path.relative(ROOT, src)}` : '') });
        const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
        git(work, 'init', '-q', '--bare', remote);
        git(repo, 'init', '-q', '-b', 'main');
        git(repo, 'config', 'user.email', 'admin@example.com');
        git(repo, 'config', 'user.name', 'Admin Test');
        git(repo, 'add', '-A');
        git(repo, 'commit', '-q', '-m', 'initial');
        git(repo, 'remote', 'add', 'origin', remote);
        git(repo, 'push', '-q', '-u', 'origin', 'main');
        // A code edit lying around must not ride along with a content publish.
        fs.appendFileSync(path.join(repo, 'js/main.js'), '\n// work in progress\n');
        const aport = port + 2;
        const aserver = spawn(process.execPath, ['scripts/dev-server.js', '--port', String(aport), '--no-open'], { cwd: repo, stdio: ['ignore', 'pipe', 'pipe'] });
        let r = {};
        try {
          await new Promise((resolve) => aserver.stdout.on('data', d => /Portfolio running/.test(d) && resolve()));
          const admin = await ctx.newPage();
          await admin.goto(`http://localhost:${aport}/setup/?admin=1`);
          await admin.waitForSelector('.admin-home', { timeout: 6000 });
          await admin.waitForSelector('#admin-publish .admin-note', { timeout: 6000 });
          r.home = await admin.evaluate(() => ({ title: document.querySelector('.admin-hero h1').textContent, clean: document.querySelector('#admin-publish').textContent }));
          await admin.click('.admin-card[data-step="1"]');
          await admin.fill('[data-path="tagline"]', 'Builds things people use');
          await admin.click(`[data-act="goto"][data-step="${await admin.evaluate(() => document.querySelectorAll('#setup-steps li').length - 1)}"]`);
          await admin.click('#setup-next');                       // Save changes
          await admin.waitForSelector('[data-act="publish"]', { timeout: 6000 });
          await admin.screenshot({ path: SHOTS + 'admin-saved.png' });
          await admin.click('[data-act="publish"]');
          await admin.waitForSelector('#admin-publish .admin-note.ok', { timeout: 15000 });
          r.result = await admin.textContent('#admin-publish');
          await admin.close();
          r.pushed = git(work, '--git-dir', remote, 'show', 'main:js/data/profile.js').stdout.includes('Builds things people use');
          r.codeLeft = git(repo, 'status', '--porcelain').stdout.includes('js/main.js');
          r.codePushed = git(work, '--git-dir', remote, 'show', '--stat', '--format=', 'main').stdout.includes('main.js');
        } finally {
          aserver.kill();
          fs.rmSync(work, { recursive: true, force: true });
        }
        expect(new RegExp(`Welcome back, ${escapeRe(P.first)}`).test(r.home.title) && /Everything is published/.test(r.home.clean) && /Published to main/.test(r.result) && r.pushed && r.codeLeft && !r.codePushed, JSON.stringify(r));
      });

      await test('setup had no runtime errors', async () => expect(page.__errors.length === 0, page.__errors.join(' | ')));
      await ctx.close();
    } finally {
      server.kill();
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }

  const failed = summary();
  await browser.close();
  server.close();
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
