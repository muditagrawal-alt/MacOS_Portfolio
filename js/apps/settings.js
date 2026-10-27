/* ==========================================================================
   System Settings.app Controller: Appearance, Wallpaper, Desktop & Dock,
   Siri & Iris, Privacy, About
   --------------------------------------------------------------------------
   Choices persist to localStorage and are re-applied on boot. A real Mac
   remembers your appearance settings; previously every reload reset them.
   ========================================================================== */

const SETTINGS_KEY = 'macos-portfolio-settings';

const DEFAULT_SETTINGS = {
    theme: 'dark',
    accent: '#007aff',
    wallpaper: 'assets/Wallpapers/26-Tahoe-Beach-Day.jpg',
    wallpaperIsGradient: false,
    prefs: {
        widgets: true,
        magnify: true,
        sounds: true,
        heyIris: false,      // the microphone is opt-in, never on by default
        speakTyped: false
    }
};

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
        const merged = { ...DEFAULT_SETTINGS, ...saved, prefs: { ...DEFAULT_SETTINGS.prefs, ...(saved.prefs || {}) } };
        // 'standard' was the old name for the default theme, while the
        // Appearance option was wired to 'dark' — so on a fresh visit no
        // option showed as selected.
        if (merged.theme === 'standard') merged.theme = 'dark';
        return merged;
    } catch (e) {
        return { ...DEFAULT_SETTINGS, prefs: { ...DEFAULT_SETTINGS.prefs } };
    }
}

function saveSettings(patch) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...loadSettings(), ...patch }));
        return true;
    } catch (e) {
        /* private browsing or quota — settings just won't persist */
        return false;
    }
}

function switchSettingsTab(tabName, element) {
    const row = element || document.querySelector(`.settings-sidebar .sidebar-item[data-pane="${tabName}"]`);
    document.querySelectorAll('.settings-sidebar .sidebar-item').forEach(item => item.classList.toggle('active', item === row));

    document.querySelectorAll('.settings-pane').forEach(pane => pane.classList.add('hidden'));
    const target = document.getElementById(`settings-pane-${tabName}`);
    if (target) target.classList.remove('hidden');
}

/** Opens System Settings straight to a pane (menus, context menus, Iris). */
function openSettingsPane(tabName) {
    if (typeof closeAllMenus === 'function') closeAllMenus();
    openWindow('settings-window');
    switchSettingsTab(tabName);
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
    document.body.dataset.theme = mode;
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.toggle('active', opt.dataset.theme === mode));
    if (typeof window.syncControlCentreTheme === 'function') window.syncControlCentreTheme(mode);
}

function setThemeMode(mode) {
    applyThemeMode(mode);
    saveSettings({ theme: mode });
}

function currentThemeMode() {
    return loadSettings().theme;
}

function toggleTheme() {
    const next = currentThemeMode() === 'glass' ? 'dark' : 'glass';
    setThemeMode(next);
    return next;
}
window.toggleTheme = toggleTheme;

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

/* ── Preferences (Desktop & Dock, Siri & Iris) ─────────────────────────── */

function getPreference(key) {
    return loadSettings().prefs[key];
}
window.getPreference = getPreference;

function applyPreferences(prefs) {
    document.body.classList.toggle('hide-widgets', !prefs.widgets);
    document.body.classList.toggle('no-dock-magnify', !prefs.magnify);
    const ids = { widgets: 'pref-widgets', magnify: 'pref-magnify', sounds: 'pref-sounds', heyIris: 'pref-heyiris', speakTyped: 'pref-speak' };
    Object.entries(ids).forEach(([k, id]) => { const el = document.getElementById(id); if (el) el.checked = Boolean(prefs[k]); });
}

function setPreference(key, value) {
    const s = loadSettings();
    s.prefs[key] = Boolean(value);
    saveSettings({ prefs: s.prefs });
    applyPreferences(s.prefs);
    if (key === 'heyIris' && typeof window.setHeyIrisEnabled === 'function') window.setHeyIrisEnabled(Boolean(value));
}

/* ── Privacy ▸ Erase This Mac ──────────────────────────────────────────── */
function eraseThisMac() {
    if (typeof showToast !== 'function') return;
    showToast('Erase all content and settings?', {
        body: 'Notes, photos, scores and preferences in this browser.',
        icon: 'fas fa-eraser',
        duration: 8000,
        action: {
            label: 'Erase',
            run: () => {
                try { localStorage.clear(); } catch (e) { /* nothing stored */ }
                try { sessionStorage.clear(); } catch (e) { /* nothing stored */ }
                location.reload();
            }
        }
    });
}

/** Re-applies saved appearance on boot and syncs the settings UI to match. */
function initSettings() {
    const s = loadSettings();
    applyThemeMode(s.theme);
    applyPreferences(s.prefs);
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
}

document.addEventListener('DOMContentLoaded', initSettings);
