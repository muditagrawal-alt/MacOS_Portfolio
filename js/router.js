/* ==========================================================================
   Device router — one link, the right experience for the device
   --------------------------------------------------------------------------
   Loaded first, synchronously, in the <head> of BOTH index.html (Mac) and
   ios.html (iPhone / iPad), so the wrong shell never paints.

     Phones and tablets ............ ios.html   (iPhone / iPad experience)
     Laptops and desktops .......... index.html (Mac experience)

   Precedence, highest first:
     1. ?view=mac | ?view=ios        — this session only (handy for sharing/testing)
     2. A choice made in the UI      — "View Mac Version" in iPhone Settings,
                                       "View iPhone Version" in the Apple menu
     3. Detection                    — touch-first device or not

   Detection is about how the device is USED, not its screen size: a narrow
   desktop browser window stays on the Mac version, and touchscreen laptops
   (whose primary pointer is still a trackpad/mouse) count as computers.
   ========================================================================== */

(function () {
    var PREF_KEY = 'portfolio-view';           // localStorage: a choice made in the UI
    var SESSION_KEY = 'portfolio-view-session'; // sessionStorage: from ?view=

    function isTouchFirst() {
        var ua = navigator.userAgent || '';
        if (/iPhone|iPod|iPad|Android|Mobile|Tablet|Silk|Kindle|PlayBook|BB10|IEMobile|Opera Mini/i.test(ua)) return true;
        // iPadOS 13+ asks for desktop sites and reports itself as a Mac. Macs
        // have no touchscreen, so a "Mac" with multi-touch is an iPad.
        if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
        var mm = window.matchMedia;
        return Boolean(mm && mm('(pointer: coarse)').matches && mm('(hover: none)').matches);
    }

    function read(store, key) {
        try { return store.getItem(key); } catch (e) { return null; }
    }

    function write(store, key, value) {
        try {
            if (value === null) store.removeItem(key);
            else store.setItem(key, value);
        } catch (e) { /* private mode — the choice just won't persist */ }
    }

    var detected = isTouchFirst() ? 'ios' : 'mac';
    var params = new URLSearchParams(location.search);
    var fromUrl = params.get('view');
    if (fromUrl === 'ios' || fromUrl === 'mac') write(sessionStorage, SESSION_KEY, fromUrl);

    var choice = [fromUrl, read(sessionStorage, SESSION_KEY), read(localStorage, PREF_KEY)]
        .filter(function (v) { return v === 'ios' || v === 'mac'; })[0] || detected;
    var current = document.documentElement.getAttribute('data-shell') === 'ios' ? 'ios' : 'mac';

    function urlFor(view) {
        var base = location.pathname.replace(/[^/]*$/, '');
        var page = view === 'ios' ? 'ios.html' : (location.protocol === 'file:' ? 'index.html' : '');
        params.delete('view');
        var qs = params.toString();
        return base + page + (qs ? '?' + qs : '') + location.hash;
    }

    if (choice !== current) {
        // replace(), not assign(): the Back button shouldn't bounce between shells.
        location.replace(urlFor(choice));
        return;
    }

    // Already in the right shell: drop ?view= from the address bar so a link
    // copied from here doesn't force a version on whoever opens it.
    if (fromUrl && window.history && history.replaceState) history.replaceState(history.state, '', urlFor(current));

    window.PORTFOLIO_SHELL = {
        current: current,
        detected: detected,
        /** true when this shell isn't what the device would get by default */
        overridden: current !== detected,
        /**
         * Switch experiences. A choice that matches the device's default is
         * cleared rather than stored, so "automatic" is restored by switching back.
         */
        switchTo: function (view) {
            write(sessionStorage, SESSION_KEY, null);
            write(localStorage, PREF_KEY, view === detected ? null : view);
            location.href = urlFor(view);
        }
    };
})();
