/* ==========================================================================
   CI Quality Gate 3: Comprehensive Component & Button Unit/Integration Suite
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT_DIR = path.resolve(__dirname, '..');
const INDEX_HTML = path.join(ROOT_DIR, 'index.html');

console.log('🧪 [CI Gate 3] Running Full Component, Window & Button Test Suite...\n');

const html = fs.readFileSync(INDEX_HTML, 'utf8');

// Initialize JSDOM environment
const dom = new JSDOM(html, {
    url: 'http://localhost:8899/',
    runScripts: 'dangerously',
    pretendToBeVisual: true
});

const { window } = dom;
const { document } = window;

// Provide browser polyfills / mocks
window.AudioContext = window.AudioContext || function() {
    return {
        currentTime: 0,
        sampleRate: 44100,
        state: 'running',
        resume: async () => {},
        destination: {},
        createOscillator: () => ({
            type: 'sine',
            frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {},
            start: () => {},
            stop: () => {}
        }),
        createGain: () => ({
            gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
            connect: () => {}
        }),
        createBuffer: () => ({ getChannelData: () => new Float32Array(1024) }),
        createBufferSource: () => ({ connect: () => {}, start: () => {} }),
        createBiquadFilter: () => ({ type: 'bandpass', frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} })
    };
};
window.webkitAudioContext = window.AudioContext;

window.Audio = function() {
    return {
        volume: 1,
        currentTime: 0,
        duration: 200,
        paused: true,
        play: async () => { this.paused = false; },
        pause: () => { this.paused = true; },
        addEventListener: (event, cb) => {}
    };
};

// Canvas 2D mock
if (window.HTMLCanvasElement) {
    window.HTMLCanvasElement.prototype.getContext = function() {
        return {
            fillRect: () => {},
            strokeRect: () => {},
            clearRect: () => {},
            rect: () => {},
            roundRect: () => {},
            ellipse: () => {},
            getImageData: () => ({ data: new Array(100) }),
            putImageData: () => {},
            createImageData: () => [],
            createRadialGradient: () => ({ addColorStop: () => {} }),
            createLinearGradient: () => ({ addColorStop: () => {} }),
            setTransform: () => {},
            drawImage: () => {},
            save: () => {},
            fillText: () => {},
            strokeText: () => {},
            restore: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            closePath: () => {},
            stroke: () => {},
            fill: () => {},
            scale: () => {},
            translate: () => {},
            arc: () => {},
            arcTo: () => {}
        };
    };
    window.HTMLCanvasElement.prototype.toDataURL = function() {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    };
}

// Execute all script files into JSDOM window
const scriptOrder = [
    'js/data/profile.js',
    'js/data/corpus.js',
    'js/data/desktop-files.js',
    'js/config/config.js',
    'js/core/utils.js',
    'js/core/system-status.js',
    'js/core/window-manager.js',
    'js/core/keyboard.js',
    'js/core/context-menu.js',
    'js/core/spotlight.js',
    'js/core/menu-bar.js',
    'js/core/boot-animation.js',
    'js/core/lock-screen.js',
    'js/core/quick-look.js',
    'js/core/sound-effects.js',
    'js/core/control-center.js',
    'js/core/mission-control.js',
    'js/core/desktop-widgets.js',
    'js/apps/desktop.js',
    'js/apps/textedit.js',
    'js/apps/photos.js',
    'js/apps/disk-image.js',
    'js/apps/finder-v2.js',
    'js/apps/mail.js',
    'js/apps/safari.js',
    'js/apps/notes.js',
    'js/apps/appstore.js',
    'js/apps/settings.js',
    'js/apps/terminal.js',
    'js/apps/trash.js',
    'js/apps/resume.js',
    'js/apps/iris.js',
    'js/apps/launchpad.js',
    'js/apps/notification-center.js',
    'js/apps/photobooth.js',
    'js/apps/breakout.js',
    'js/apps/snake.js',
    'js/apps/music.js',
    'js/main.js'
];

for (const scriptPath of scriptOrder) {
    const full = path.join(ROOT_DIR, scriptPath);
    if (fs.existsSync(full)) {
        const code = fs.readFileSync(full, 'utf8');
        try {
            window.eval(code);
        } catch (e) {
            console.error(`Error executing ${scriptPath} in test environment:`, e.message);
        }
    }
}

// Fire DOMContentLoaded
const evt = document.createEvent('Event');
evt.initEvent('DOMContentLoaded', true, true);
document.dispatchEvent(evt);

let testCount = 0;
let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
    testCount++;
    if (condition) {
        passCount++;
        console.log(`  ✅ [PASS] ${testName}`);
    } else {
        failCount++;
        console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    }
}

// ── TEST SUITE 1: Window Manager & Focus Isolation ────────────────────────
console.log('\n--- 1. Window Manager & Stacking Tests ---');
const testWindows = [
    'finder-window', 'safari-window', 'mail-window', 'notes-window',
    'music-window', 'photobooth-window', 'breakout-window', 'snake-window',
    'terminal-window', 'settings-window', 'trash-window', 'photos-window'
];

for (const winId of testWindows) {
    const el = document.getElementById(winId);
    assert(el !== null, `Window element exists in DOM: #${winId}`);
    
    // Test open
    window.openWindow(winId);
    assert(!el.classList.contains('hidden'), `#${winId} opens correctly (removes .hidden)`);
    assert(!el.classList.contains('minimized'), `#${winId} removes .minimized on open`);
    
    // Test active focus
    const active = window.getActiveWindow();
    assert(active && active.id === winId, `#${winId} becomes active window upon opening`);
    assert(el.classList.contains('is-active'), `#${winId} has .is-active focus class`);
    
    // Test minimize
    window.minimizeWindow(winId);
    assert(el.classList.contains('minimized'), `#${winId} minimizes correctly (adds .minimized)`);
    
    // Test maximize / zoom toggle
    window.openWindow(winId);
    window.maximizeWindow(winId);
    assert(el.classList.contains('is-maximized'), `#${winId} zooms/maximizes correctly`);
    window.maximizeWindow(winId);
    assert(!el.classList.contains('is-maximized'), `#${winId} restores from zoom correctly`);
    
    // Test close
    window.closeWindow(winId);
    assert(el.classList.contains('hidden'), `#${winId} closes correctly (adds .hidden)`);
}

// ── TEST SUITE 2: Dock Running Indicators & Bouncing ─────────────────────
console.log('\n--- 2. Dock Running Indicators & Mappings ---');
const dockItems = [
    'dock-finder', 'dock-safari', 'dock-mail', 'dock-notes',
    'dock-music', 'dock-photobooth', 'dock-breakout', 'dock-snake',
    'dock-terminal', 'dock-settings', 'dock-trash', 'dock-photos', 'dock-missioncontrol'
];

for (const dockId of dockItems) {
    const item = document.getElementById(dockId);
    assert(item !== null, `Dock icon exists: #${dockId}`);
    assert(item.getAttribute('data-tooltip') !== null, `#${dockId} has data-tooltip attribute`);
}

// Verify dock running sync
window.openWindow('music-window');
const musicDock = document.getElementById('dock-music');
window.closeWindow('music-window');
assert(!musicDock.classList.contains('is-running'), '#dock-music removes .is-running when Apple Music is closed');

// ── TEST SUITE 3: Dynamic Menu Bar ────────────────────────────────────────
console.log('\n--- 3. Dynamic Menu Bar & Per-App Menus ---');
assert(typeof window.syncMenuBarToActiveApp === 'function', 'syncMenuBarToActiveApp exists');

window.openWindow('finder-window');
let appNameEl = document.querySelector('.app-name-item');
assert(appNameEl && appNameEl.textContent === 'Finder', 'Menu bar displays "Finder" when Finder is frontmost');

window.openWindow('terminal-window');
appNameEl = document.querySelector('.app-name-item');
assert(appNameEl && appNameEl.textContent === 'Terminal', 'Menu bar dynamically updates to "Terminal" when Terminal is frontmost');

// ── TEST SUITE 4: Control Center Module ────────────────────────────────────
console.log('\n--- 4. macOS Control Center Module ---');
assert(typeof window.toggleControlCenter === 'function', 'toggleControlCenter function exists');
assert(typeof window.setCcBrightness === 'function', 'setCcBrightness function exists');
assert(typeof window.setCcVolume === 'function', 'setCcVolume function exists');

window.openControlCenter();
const ccPanel = document.getElementById('control-center-panel');
assert(ccPanel !== null, 'Control Center panel created in DOM');
assert(ccPanel.classList.contains('open'), 'Control Center panel has .open class');

// Test brightness slider
window.setCcBrightness(75);
const brightLabel = document.getElementById('cc-bright-label');
assert(brightLabel && brightLabel.textContent === '75%', 'Display brightness slider sets 75% correctly');

// Test volume slider
window.setCcVolume(60);
const volLabel = document.getElementById('cc-vol-label');
assert(volLabel && volLabel.textContent === '60%', 'Sound volume slider sets 60% correctly');

// Test quick toggles
assert(typeof window.toggleCcWifi === 'function', 'toggleCcWifi function exists');
assert(typeof window.toggleCcBt === 'function', 'toggleCcBt function exists');
assert(typeof window.toggleCcTheme === 'function', 'toggleCcTheme function exists');

window.closeControlCenter();
assert(!ccPanel.classList.contains('open'), 'Control Center panel closes correctly');

// ── TEST SUITE 5: Mission Control Exposé ─────────────────────────────────
console.log('\n--- 5. Mission Control Exposé ---');
assert(typeof window.toggleMissionControl === 'function', 'toggleMissionControl function exists');
assert(typeof window.enterMissionControl === 'function', 'enterMissionControl function exists');
assert(typeof window.exitMissionControl === 'function', 'exitMissionControl function exists');

window.openWindow('finder-window');
window.openWindow('safari-window');
window.enterMissionControl();

assert(document.body.classList.contains('mission-control-active'), 'Mission Control sets body.mission-control-active');
const finderWin = document.getElementById('finder-window');
assert(finderWin.classList.contains('in-mission-control'), 'Open windows receive .in-mission-control class');

window.exitMissionControl('finder-window');
assert(!document.body.classList.contains('mission-control-active'), 'Mission Control exits cleanly');
assert(!finderWin.classList.contains('in-mission-control'), 'Windows restore from .in-mission-control class');

// ── TEST SUITE 6: Zero-Latency Acoustic Sound Engine ────────────────────
console.log('\n--- 6. Zero-Latency Acoustic Sound Engine ---');
assert(typeof window.playSystemSound === 'function', 'playSystemSound function exists');
assert(typeof window.toggleSystemMute === 'function', 'toggleSystemMute function exists');
assert(typeof window.setMasterVolume === 'function', 'setMasterVolume function exists');

const initialMute = window.isSystemMuted();
window.toggleSystemMute();
assert(window.isSystemMuted() !== initialMute, 'toggleSystemMute toggles mute state');
window.toggleSystemMute(); // restore

// Test all sound archetypes synthesize without exception
const soundTypes = ['startup', 'click', 'tick', 'pop', 'windowOpen', 'windowClose', 'windowMinimize', 'trashEmpty', 'shutter', 'boop'];
let soundErrors = 0;
for (const s of soundTypes) {
    try {
        window.playSystemSound(s);
    } catch (e) {
        soundErrors++;
    }
}
assert(soundErrors === 0, 'All 10 system acoustic sound archetypes execute cleanly without throwing');

// ── TEST SUITE 7: Spotlight Search & Live Math Calculator ────────────────
console.log('\n--- 7. Spotlight Search & Instant Calculator ---');
assert(typeof window.toggleSpotlight === 'function', 'toggleSpotlight exists');
assert(typeof window.openSpotlight === 'function', 'openSpotlight exists');
assert(typeof window.closeSpotlight === 'function', 'closeSpotlight exists');

window.openSpotlight();
const spotOverlay = document.getElementById('spotlight-overlay');
assert(spotOverlay && spotOverlay.classList.contains('active'), 'Spotlight overlay opens correctly');

// Test math calculation
if (typeof evaluateMathExpression === 'function') {
    assert(evaluateMathExpression('12 * 8') === 96, 'Spotlight calculator correctly computes "12 * 8 = 96"');
    assert(evaluateMathExpression('100 / 4') === 25, 'Spotlight calculator correctly computes "100 / 4 = 25"');
    assert(evaluateMathExpression('2^8') === 256, 'Spotlight calculator correctly computes "2^8 = 256"');
}

window.closeSpotlight();
assert(!spotOverlay.classList.contains('active'), 'Spotlight overlay closes correctly');

// ── TEST SUITE 8: Desktop Widgets ────────────────────────────────────────
console.log('\n--- 8. macOS Sonoma/Sequoia Desktop Widgets ---');
const widgetCol = document.getElementById('desktop-widgets-column');
assert(widgetCol !== null, 'Desktop widgets container exists');
const analogClock = document.getElementById('widget-analog-clock');
assert(analogClock !== null, 'Analog clock widget exists');
const weatherTemp = document.getElementById('widget-weather-temp');
assert(weatherTemp !== null, 'Weather widget exists');
const cpuFill = document.getElementById('widget-cpu-fill');
assert(cpuFill !== null, 'Activity Monitor CPU widget exists');

// ── TEST SUITE 9: Apple Music & Live Radio Hub ───────────────────────────
console.log('\n--- 9. Apple Music Player & Live Radio Hub ---');
window.openWindow('music-window');
const trackTbody = document.getElementById('music-track-tbody');
assert(trackTbody !== null, 'Apple Music track list table exists');
const radioView = document.getElementById('music-view-radio');
assert(radioView !== null, 'Live Radio hub view container exists');

assert(typeof window.switchRadioCountry === 'function', 'switchRadioCountry exists');
window.switchRadioCountry('IN');
const radioGrid = document.getElementById('music-radio-grid');
assert(radioGrid !== null, 'Radio station cards grid rendered');

assert(typeof window.playAppleRadio === 'function', 'playAppleRadio function exists');
window.playAppleRadio('air-vividh-bharati');
const lcdTitle = document.getElementById('music-lcd-track-title');
assert(lcdTitle && lcdTitle.textContent.includes('AIR Vividh Bharati'), 'AIR Vividh Bharati station selected in LCD display');

// ── TEST SUITE 10: Photo Booth Camera Studio ─────────────────────────────
console.log('\n--- 10. Photo Booth Camera Studio ---');
window.openWindow('photobooth-window');
assert(typeof window.setPhotoBoothFilter === 'function', 'setPhotoBoothFilter exists');
assert(typeof window.setPhotoBoothMode === 'function', 'setPhotoBoothMode exists');
assert(typeof window.takePhotoBoothPicture === 'function', 'takePhotoBoothPicture exists');
assert(typeof window.downloadActivePhoto === 'function', 'downloadActivePhoto exists');

window.setPhotoBoothFilter('comic');
const filterCard = document.querySelector('.pb-effect-card[data-filter="comic"]');
assert(filterCard && filterCard.classList.contains('active'), 'Photo Booth selects Comic filter correctly');

// ── TEST SUITE 11: Retro Arcade Games (Breakout & Snake) ─────────────────
console.log('\n--- 11. Retro Arcade Games (Breakout & Snake) ---');
window.openWindow('breakout-window');
assert(typeof window.startBreakoutGame === 'function', 'startBreakoutGame exists');
assert(typeof window.toggleBreakoutPause === 'function', 'toggleBreakoutPause exists');
window.closeWindow('breakout-window');

window.openWindow('snake-window');
assert(typeof window.startNewSnakeGame === 'function' || typeof window.snakeControl === 'function', 'Snake game controller exists');
window.closeWindow('snake-window');

// ── TEST SUITE 12: Terminal Command Execution ────────────────────────────
console.log('\n--- 12. Terminal Execution Engine ---');
window.openWindow('terminal-window');
assert(typeof window.handleTerminalInput === 'function' || typeof window.printTerminalLine === 'function', 'Terminal engine exists');
window.closeWindow('terminal-window');

console.log(`\n==================================================`);
console.log(`Component Suite Summary: ${passCount} Passed, ${failCount} Failed out of ${testCount} tests`);
console.log(`==================================================\n`);

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
