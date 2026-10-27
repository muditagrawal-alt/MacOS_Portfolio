/* ==========================================================================
   CI Quality Gate 2: Static Asset & Link Integrity Verification
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

console.log('🔍 [CI Gate 2] Verifying Static Asset & Reference Integrity in index.html...\n');

if (!fs.existsSync(INDEX_HTML)) {
    console.error('❌ index.html not found!');
    process.exit(1);
}

const htmlContent = fs.readFileSync(INDEX_HTML, 'utf8');

// Regex patterns to extract local references
const patterns = [
    { type: 'Stylesheet', regex: /<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi },
    { type: 'Script', regex: /<script\s+[^>]*src=["']([^"']+)["']/gi },
    { type: 'Image', regex: /<img\s+[^>]*src=["']([^"']+)["']/gi },
    { type: 'Audio', regex: /<audio\s+[^>]*src=["']([^"']+)["']/gi }
];

let totalChecked = 0;
let passed = 0;
let failed = 0;

for (const { type, regex } of patterns) {
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
        let assetPath = match[1];

        // Skip CDN / external links
        if (assetPath.startsWith('http://') || assetPath.startsWith('https://') || assetPath.startsWith('//') || assetPath.startsWith('data:')) {
            continue;
        }

        // Strip query strings like ?v=2.3
        const cleanPath = assetPath.split('?')[0];
        const fullDiskPath = path.join(ROOT_DIR, cleanPath);

        totalChecked++;
        if (fs.existsSync(fullDiskPath)) {
            console.log(`  ✅ [PASS] ${type}: ${assetPath}`);
            passed++;
        } else {
            console.error(`  ❌ [FAIL] Missing ${type} file: ${assetPath} (Expected: ${fullDiskPath})`);
            failed++;
        }
    }
}

// Asset paths referenced from JavaScript (Dock/Launchpad/Spotlight icons,
// Finder data, wallpapers…). The HTML scan above can't see these, and a
// typo'd icon path otherwise only shows up as a broken image at runtime.
function listJs(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
        d.isDirectory() ? listJs(path.join(dir, d.name)) : (d.name.endsWith('.js') ? [path.join(dir, d.name)] : []));
}
const jsRefs = new Map();
listJs(path.join(ROOT_DIR, 'js')).forEach(file => {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/['"`](assets\/[^'"`$\s]+\.(?:png|jpe?g|svg|webp|gif|pdf|mp3))['"`]/g)) {
        if (!jsRefs.has(m[1])) jsRefs.set(m[1], path.relative(ROOT_DIR, file));
    }
});
for (const [ref, from] of jsRefs) {
    totalChecked++;
    if (fs.existsSync(path.join(ROOT_DIR, ref))) {
        passed++;
    } else {
        console.error(`  ❌ [FAIL] Missing asset referenced from ${from}: ${ref}`);
        failed++;
    }
}
console.log(`  ✅ ${jsRefs.size} asset paths referenced from JavaScript checked`);

// url(...) references in stylesheets, resolved relative to each CSS file.
function listCss(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d =>
        d.isDirectory() ? listCss(path.join(dir, d.name)) : (d.name.endsWith('.css') ? [path.join(dir, d.name)] : []));
}
let cssRefs = 0;
listCss(path.join(ROOT_DIR, 'css')).forEach(file => {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/g)) {
        const ref = m[1];
        if (/^(data:|https?:|#)/.test(ref)) continue;
        cssRefs++;
        totalChecked++;
        if (fs.existsSync(path.resolve(path.dirname(file), ref))) passed++;
        else { console.error(`  ❌ [FAIL] Missing asset referenced from ${path.relative(ROOT_DIR, file)}: ${ref}`); failed++; }
    }
});
console.log(`  ✅ ${cssRefs} url() references in stylesheets checked`);

console.log(`\n==================================================`);
console.log(`Asset Integrity Gate Summary: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);

if (failed > 0) {
    process.exit(1);
}
