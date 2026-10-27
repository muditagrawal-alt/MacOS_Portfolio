/* ==========================================================================
   iOS boot — runs after every app has registered itself
   ========================================================================== */

(function () {
    // Appearance: Light / Dark / Automatic (System Settings ▸ Display & Brightness).
    const appearance = IOS.readPref('appearance', 'auto');
    document.documentElement.dataset.appearance = ['light', 'dark', 'auto'].includes(appearance) ? appearance : 'auto';

    // Wallpaper (shared choice with nothing else — the iPhone has its own).
    const wp = IOS.readPref('wallpaper', 'assets/Wallpapers/26-Tahoe-Beach-Day.jpg');
    document.getElementById('ios-wallpaper').style.backgroundImage = `url('${wp}')`;

    const ready = () => IOS.start();
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
    else ready();
})();
