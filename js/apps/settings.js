/* ==========================================================================
   System Settings.app Controller: Theme Mode, Accent Colors & Wallpapers
   --------------------------------------------------------------------------
   Choices persist to localStorage and are re-applied on boot. A real Mac
   remembers your appearance settings; previously every reload reset them.
   ========================================================================== */

const SETTINGS_KEY = 'macos-portfolio-settings';

const DEFAULT_SETTINGS = {
    theme: 'standard',
    accent: '#007aff',
    wallpaper: 'assets/Wallpapers/26-Tahoe-Beach-Day.jpg',
    wallpaperIsGradient: false
};

function loadSettings() {
    try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
    } catch (e) {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings(patch) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...patch }));
    } catch (e) {
        /* private browsing — settings just won't persist */
    }
}

function switchSettingsTab(tabName, element) {
    document.querySelectorAll('.settings-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    document.querySelectorAll('.settings-pane').forEach(pane => pane.classList.add('hidden'));
    const target = document.getElementById(`settings-pane-${tabName}`);
    if (target) target.classList.remove('hidden');
}

function applyThemeMode(mode) {
    const root = document.documentElement;
    if (mode === 'glass') {
        root.style.setProperty('--window-bg', 'rgba(30, 30, 30, 0.45)');
        root.style.setProperty('--sidebar-bg', 'rgba(15, 15, 15, 0.4)');
        root.style.setProperty('--titlebar-bg', 'rgba(40, 40, 40, 0.55)');
    } else {
        root.style.setProperty('--window-bg', 'rgba(30, 30, 30, 0.7)');
        root.style.setProperty('--sidebar-bg', 'rgba(20, 20, 20, 0.6)');
        root.style.setProperty('--titlebar-bg', 'rgba(40, 40, 40, 0.8)');
    }
}

function setThemeMode(mode, element) {
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
    if (element) element.classList.add('active');
    applyThemeMode(mode);
    saveSettings({ theme: mode });
}

function setAccentColor(colorHex, element) {
    document.querySelectorAll('.accent-dot').forEach(dot => dot.classList.remove('active'));
    if (element) element.classList.add('active');
    document.documentElement.style.setProperty('--accent', colorHex);
    saveSettings({ accent: colorHex });
}

function applyWallpaper(val, isGradient) {
    const body = document.body;
    if (isGradient) {
        body.style.backgroundImage = val;
        // Gradients don't tile the way a photo does — reset the photo sizing.
        body.style.backgroundSize = 'cover';
        body.style.backgroundRepeat = 'no-repeat';
    } else {
        body.style.backgroundImage = `url('${val}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
    }
}

function setDesktopWallpaper(val, element, isGradient) {
    document.querySelectorAll('.wallpaper-card').forEach(card => card.classList.remove('active'));
    if (element) element.classList.add('active');
    applyWallpaper(val, Boolean(isGradient));
    saveSettings({ wallpaper: val, wallpaperIsGradient: Boolean(isGradient) });
}

/** Re-applies saved appearance on boot and syncs the settings UI to match. */
function initSettings() {
    const s = loadSettings();
    applyThemeMode(s.theme);
    document.documentElement.style.setProperty('--accent', s.accent);
    if (s.wallpaper !== DEFAULT_SETTINGS.wallpaper || s.wallpaperIsGradient) {
        applyWallpaper(s.wallpaper, s.wallpaperIsGradient);
    }

    document.querySelectorAll('.accent-dot').forEach(dot => {
        const onclick = dot.getAttribute('onclick') || '';
        dot.classList.toggle('active', onclick.includes(s.accent));
    });
    document.querySelectorAll('.wallpaper-card').forEach(card => {
        const onclick = card.getAttribute('onclick') || '';
        card.classList.toggle('active', onclick.includes(s.wallpaper));
    });
    document.querySelectorAll('.theme-option').forEach(opt => {
        const onclick = opt.getAttribute('onclick') || '';
        opt.classList.toggle('active', onclick.includes(`'${s.theme}'`));
    });
}

document.addEventListener('DOMContentLoaded', initSettings);
