/* ==========================================================================
   Settings — appearance, wallpaper, haptics, privacy, and the Mac version
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;
    const WALLPAPERS = [
        ['assets/Wallpapers/ios/aurora.webp', 'Aurora'],
        ['assets/Wallpapers/ios/daybreak.webp', 'Daybreak'],
        ['assets/Wallpapers/ios/lagoon.webp', 'Lagoon'],
        ['assets/Wallpapers/ios/dusk.webp', 'Dusk'],
        ['assets/Wallpapers/ios/graphite.webp', 'Graphite'],
        ['assets/Wallpapers/ios/mist.webp', 'Mist'],
        ['assets/Wallpapers/26-Tahoe-Beach-Day.jpg', 'Tahoe Beach'],
        ['assets/Wallpapers/27-Golden-Gate-Bridge.jpg', 'Golden Gate'],
        ['assets/Wallpapers/cristina-gottardi-CSpjU6hYo_0-unsplash.jpg', 'Lake'],
        ['assets/Wallpapers/jack-anstey-XVoyX7l9ocY-unsplash.jpg', 'Peaks']
    ];
    const VERSION = '2.5';

    function setAppearance(mode) {
        document.documentElement.dataset.appearance = mode;
        IOS.writePref('appearance', mode);
        IOS.syncStatusBar();
    }

    function setWallpaper(src) {
        IOS.writePref('wallpaper', src);
        document.getElementById('ios-wallpaper').style.backgroundImage = `url('${src}')`;
    }

    function root(content) {
        const mode = IOS.readPref('appearance', 'auto');
        content.innerHTML = `
            <button type="button" class="set-profile" data-action="about">
                <img src="${escapeHtml(P.photo)}" alt="">
                <span><strong>${escapeHtml(P.name)}</strong><small>Résumé, projects, experience</small></span>
                <i class="fas fa-chevron-right ios-row-chevron"></i>
            </button>
            ${IOS.group([
                { icon: 'fas fa-sun', color: '#007aff', title: 'Display & Brightness', detail: { light: 'Light', dark: 'Dark', auto: 'Automatic' }[mode], chevron: true, action: 'display' },
                { icon: 'fas fa-image', color: '#30b0c7', title: 'Wallpaper', chevron: true, action: 'wallpaper' },
                { icon: 'fas fa-mobile-screen-button', color: '#ff2d55', title: 'Haptics', toggle: 'haptics', checked: IOS.readPref('haptics', true) }
            ])}
            ${IOS.group([
                { icon: 'fas fa-laptop', color: '#8e8e93', title: 'View Mac Version', sub: 'The full desktop: Finder, Terminal, games and more', chevron: true, action: 'mac' }
            ])}
            ${IOS.group([
                { icon: 'fas fa-hand', color: '#007aff', title: 'Privacy & Security', chevron: true, action: 'privacy' },
                { icon: 'fas fa-gear', color: '#8e8e93', title: 'About This Portfolio', chevron: true, action: 'general' }
            ])}
            ${IOS.group([{ title: 'Lock Screen', action: 'lock', className: 'tint' }])}`;
        IOS.bind(content, {
            about: () => IOS.go('about'),
            display: () => IOS.go('settings', ['display']),
            wallpaper: () => IOS.go('settings', ['wallpaper']),
            privacy: () => IOS.go('settings', ['privacy']),
            general: () => IOS.go('settings', ['general']),
            mac: () => window.PORTFOLIO_SHELL && PORTFOLIO_SHELL.switchTo('mac'),
            lock: () => IOS.lockNow(),
            'toggle:haptics': (on) => { IOS.writePref('haptics', on); if (on) IOS.haptic(); }
        });
    }

    function display(content, ctx) {
        const mode = IOS.readPref('appearance', 'auto');
        const effective = mode === 'auto' ? (IOS.isDarkAppearance() ? 'dark' : 'light') : mode;
        content.innerHTML = `
            <div class="ios-section-header">Appearance</div>
            <div class="ios-group set-appearance">
                <div class="set-modes">
                    ${['light', 'dark'].map(m => `
                    <button type="button" class="set-mode ${effective === m ? 'active' : ''}" data-action="mode-${m}" aria-pressed="${effective === m}">
                        <span class="set-phone ${m}"><i></i><i></i><i></i></span>
                        <span>${m === 'light' ? 'Light' : 'Dark'}</span>
                        <span class="set-radio"><i class="fas fa-check"></i></span>
                    </button>`).join('')}
                </div>
                ${IOS.row({ title: 'Automatic', toggle: 'auto', checked: mode === 'auto' })}
            </div>
            <p class="ios-section-footer">Automatic follows your device’s light or dark setting.</p>`;
        IOS.bind(content, {
            'mode-light': () => { setAppearance('light'); ctx.refresh(); },
            'mode-dark': () => { setAppearance('dark'); ctx.refresh(); },
            'toggle:auto': (on) => { setAppearance(on ? 'auto' : (IOS.isDarkAppearance() ? 'dark' : 'light')); ctx.refresh(); }
        });
    }

    function wallpaper(content, ctx) {
        const current = IOS.readPref('wallpaper', WALLPAPERS[0][0]);
        content.innerHTML = `
            <div class="set-walls">${WALLPAPERS.map(([src, name], i) => `
                <button type="button" class="set-wall ${src === current ? 'active' : ''}" data-action="w-${i}" aria-pressed="${src === current}">
                    <span style="background-image:url('${escapeHtml(src)}')"><b>${new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date()).replace(/\s?[AP]M$/i, '')}</b></span>
                    <small>${escapeHtml(name)}</small>
                </button>`).join('')}
            </div>`;
        const handlers = {};
        WALLPAPERS.forEach(([src], i) => { handlers[`w-${i}`] = () => { setWallpaper(src); IOS.haptic(); ctx.refresh(); }; });
        IOS.bind(content, handlers);
    }

    function privacy(content) {
        content.innerHTML = `
            <div class="ios-group set-prose">
                <p><strong>No analytics, no ads, no cookies.</strong> Nothing you do here is tracked.</p>
                <p><strong>Stays on this device:</strong> your settings, notes you write, your Mail draft and the conversation with Iris (until you close the tab).</p>
                <p><strong>Sent only when you ask:</strong> a message you send from Mail goes to ${escapeHtml(P.first)} through Web3Forms. With a hosted model configured, Iris sends your question and the matching portfolio passages to it.</p>
                <p><strong>Fetched without an account:</strong> weather (Open-Meteo, from your approximate location) and public GitHub activity.</p>
            </div>`;
    }

    function general(content) {
        content.innerHTML = `
            ${IOS.group([
                { title: 'Name', detail: `${P.first}’s iPhone` },
                { title: 'Version', detail: VERSION },
                { title: 'Built with', detail: 'HTML, CSS & JavaScript' },
                { title: 'Frameworks', detail: 'None' },
                { title: 'Shared with the Mac', detail: 'Data, Iris, Music' }
            ])}
            ${P.links.length ? IOS.group(P.links.map(l => ({ icon: l.fa, color: l.color, title: l.label, href: l.url })), { header: `${P.first} online` }) : ''}
            <p class="ios-section-footer">The iPhone and Mac versions are one site: the same link opens the right one for each device.</p>`;
    }

    IOS.register('settings', {
        name: 'Settings',
        icon: 'assets/icons/settings.png',
        keywords: 'preferences appearance dark mode wallpaper mac version privacy',
        pages(path) {
            const base = { key: 'root', title: 'Settings', render: root };
            const sub = {
                display: { key: 'display', title: 'Display & Brightness', largeTitle: false, render: display },
                wallpaper: { key: 'wallpaper', title: 'Wallpaper', largeTitle: false, render: wallpaper },
                privacy: { key: 'privacy', title: 'Privacy & Security', largeTitle: false, render: privacy },
                general: { key: 'general', title: 'About', largeTitle: false, render: general }
            }[path[0]];
            return sub ? [base, sub] : [base];
        }
    });
})();
