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

console.log(`\n==================================================`);
console.log(`Asset Integrity Gate Summary: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);

if (failed > 0) {
    process.exit(1);
}
