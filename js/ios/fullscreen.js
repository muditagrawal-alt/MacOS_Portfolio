/* ==========================================================================
   Full screen — the phone is the iPhone, without the browser around it
   --------------------------------------------------------------------------
   Where the browser allows it (Chrome on Android, iPad), the first tap — the
   unlock swipe — hides the address bar and the system navigation bar, and
   locks a phone to portrait. Tap the status bar to bring the browser's bars
   back; the next tap anywhere else hides them again. iPhone browsers can't
   go full screen from a page: Add to Home Screen does that instead
   (manifest display_override: fullscreen). Off in Settings ▸ Full Screen.
   ========================================================================== */

window.IOSFullscreen = (() => {
    const supported = () => Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen);
    const touchFirst = () => window.matchMedia && matchMedia('(pointer: coarse)').matches;
    const installed = () => window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    const wanted = () => IOS.readPref('fullscreen', true);
    let revealed = false;     // the visitor tapped the status bar to see the browser's bars

    function eligible() {
        return supported() && touchFirst() && !installed() && !window.PORTFOLIO_PREVIEW
            && !document.body.classList.contains('ios-framed') && wanted() && !document.fullscreenElement;
    }

    function enter() {
        if (!eligible()) return;
        document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => {
            const phone = document.getElementById('ios-device').dataset.form === 'phone';
            if (phone && screen.orientation && screen.orientation.lock) screen.orientation.lock('portrait').catch(() => {});
        }).catch(() => { /* refused (no activation, or a policy): stay as we are */ });
    }

    function exit() {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }

    function init() {
        if (!supported()) return;
        const strip = document.createElement('button');
        strip.type = 'button';
        strip.className = 'ios-fs-reveal';
        strip.setAttribute('aria-label', 'Show the browser’s controls');
        document.getElementById('ios-device').appendChild(strip);
        strip.addEventListener('click', (e) => { e.stopPropagation(); revealed = true; exit(); });
        // Full screen needs a tap first; any tap (the unlock swipe included) will do.
        const onTap = (e) => {
            if (e.target === strip) return;
            if (revealed && document.fullscreenElement) return;
            revealed = false;
            enter();
        };
        document.addEventListener('pointerup', onTap, true);
        document.addEventListener('click', onTap, true);
    }

    /** Settings ▸ Full Screen */
    function setWanted(on) {
        IOS.writePref('fullscreen', on);
        if (on) { revealed = false; enter(); } else exit();
    }

    return { init, setWanted, get available() { return supported() && touchFirst() && !installed(); } };
})();

IOSFullscreen.init();
