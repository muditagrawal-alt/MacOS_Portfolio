/* ==========================================================================
   CI Quality Gate 5: the template stays a template
   --------------------------------------------------------------------------
   Anyone who clones this repository and runs the setup questionnaire should
   end up with a portfolio about themselves — not one that still says the
   previous owner's name in a corner nobody tested. So:

   1. Nothing personal outside the info bank. Every distinctive value in
      js/data/profile.js (name, email, phone, handles, project names,
      employers) must not appear in code, markup or styles anywhere else.
   2. Generated files match the info bank: the pages' title and link-preview
      tags, the web app manifest and api/_owner.js are exactly what
      `node setup/apply.js refresh` would write.
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const setup = require('../setup/apply.js');
const SiteMeta = require('../setup/site-meta.js');
const { personalTokens, findTokens } = require('./personal-tokens.js');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const ok = (msg) => { passed++; console.log(`  ✅ ${msg}`); };
const bad = (msg) => { failed++; console.error(`  ❌ [FAIL] ${msg}`); };

console.log('🧪 [CI Gate 5] Template integrity…\n');

const raw = setup.readProfile(ROOT);
const p = setup.normalize(raw, ROOT);

/* ── 1. Distinctive values from the info bank ─────────────────────────── */
const tokens = personalTokens(p);

// Where personal data may legitimately live.
const SKIP = new Set(['js/data/profile.js', 'api/_owner.js', 'manifest.webmanifest']);
const SCAN_DIRS = ['js', 'css', 'api', 'setup'];
const SCAN_FILES = ['index.html', 'ios.html'];

function listFiles(dir) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full, { withFileTypes: true }).flatMap(d => {
        const rel = path.join(dir, d.name);
        if (d.isDirectory()) return listFiles(rel);
        return /\.(js|css|html|json|md)$/.test(d.name) ? [rel] : [];
    });
}

const files = [...SCAN_FILES, ...SCAN_DIRS.flatMap(listFiles)].filter(f => !SKIP.has(f.split(path.sep).join('/')));
const leaks = [];
for (const file of files) {
    let text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    // The generated <head> block is checked separately (section 2).
    const block = SiteMeta.extractMetaBlock(text);
    if (block) text = text.replace(block, block.replace(/[^\n]/g, ''));   // keep line numbers
    // The questionnaire's example answers are examples, whoever fills it in.
    if (file.split(path.sep)[0] === 'setup') text = text.replace(/(placeholder\s*[:=]\s*)(['"])(?:(?!\2).)*\2/g, '$1$2$2');
    for (const { token, from, index } of findTokens(text, tokens)) {
        leaks.push(`${file}:${text.slice(0, index).split('\n').length} contains the ${from} "${token}"`);
    }
}
if (leaks.length) {
    leaks.slice(0, 40).forEach(bad);
    console.error('\n     Move these into js/data/profile.js and read them from window.PROFILE_DATA. If one is just a word\n     the code uses (not something about you), add it to GENERIC in scripts/personal-tokens.js.\n');
} else ok(`No personal details outside the info bank (${tokens.size} values checked across ${files.length} files)`);

/* ── 2. Generated files are in sync ───────────────────────────────────── */
const stale = setup.writeGenerated(raw, ROOT, { dryRun: true });
if (stale.length) bad(`Out of date with js/data/profile.js: ${stale.join(', ')} — run: node setup/apply.js refresh`);
else ok('Page titles, link previews, manifest and api/_owner.js match the info bank');

for (const page of ['index.html', 'ios.html']) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    if (SiteMeta.extractMetaBlock(html)) ok(`${page} has a profile:meta block`);
    else bad(`${page} is missing its profile:meta block`);
}

/* ── 3. The questionnaire's format round-trips ───────────────────────── */
const { serializeProfile, parseProfileSource } = require('../setup/profile-format.js');
const roundTrip = parseProfileSource(serializeProfile(raw));
if (JSON.stringify(roundTrip) === JSON.stringify(JSON.parse(JSON.stringify(setup.readProfile(ROOT))))) ok('js/data/profile.js is in the questionnaire’s format (re-saving it changes nothing)');
else bad('js/data/profile.js differs from what the questionnaire would write — re-save it with `npm run setup` or check for hand edits');

console.log(`\n==================================================`);
console.log(`Template Gate Summary: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);
process.exit(failed ? 1 : 0);
