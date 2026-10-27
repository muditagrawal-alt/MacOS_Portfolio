/* ==========================================================================
   CI Quality Gate 1: JavaScript Syntax Validation
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const SCAN_DIRS = ['js', 'api', 'setup', 'scripts'];

function getJsFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getJsFiles(fullPath));
        } else if (file.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

console.log('🔍 [CI Gate 1] Validating JavaScript Syntax across codebase...\n');

let filesToCheck = [];
for (const dir of SCAN_DIRS) {
    const fullDir = path.join(ROOT_DIR, dir);
    if (fs.existsSync(fullDir)) {
        filesToCheck = filesToCheck.concat(getJsFiles(fullDir));
    }
}

let passed = 0;
let failed = 0;

for (const file of filesToCheck) {
    const relPath = path.relative(ROOT_DIR, file);
    try {
        execSync(`node -c "${file}"`, { stdio: 'pipe' });
        console.log(`  ✅ [PASS] ${relPath}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ [FAIL] ${relPath}: Syntax error detected!`);
        console.error(err.stderr.toString());
        failed++;
    }
}

console.log(`\n==================================================`);
console.log(`Syntax Gate Summary: ${passed} Passed, ${failed} Failed`);
console.log(`==================================================\n`);

if (failed > 0) {
    process.exit(1);
}
