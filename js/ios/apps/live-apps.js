/* ==========================================================================
   Live apps — every deployed project is an app on the Home Screen
   --------------------------------------------------------------------------
   Opening one shows the live site inside the phone, full screen under a
   slim bar, so trying a project feels like opening an app. A site that
   refuses to be embedded (embed: false in the info bank) opens in a browser
   tab instead. Free hosting sleeps when idle, so a slow first load says so
   and offers the browser.
   ========================================================================== */

(function () {
    const P = window.PROFILE_DATA;

    /** "Stereo Depth NERF" → "NERF", "Lighthouse Analytics" → "Lighthouse": a short Home Screen label. */
    function labelFor(name) {
        if (name.length <= 11) return name;
        const words = name.split(/[\s-]+/);
        return words.find(w => /^[A-Z]{2,}$/.test(w) && w !== 'AI') || words[0];
    }

    function frame(content, x) {
        content.innerHTML = `
            <div class="live-frame">
                <div class="live-loading" role="status">
                    <span class="ios-art"><img src="${escapeHtml(x.icon)}" alt=""></span>
                    <strong>${escapeHtml(x.name)}</strong>
                    <small>Opening the live app…</small>
                    <span class="live-spinner" aria-hidden="true"></span>
                    <button type="button" class="ios-btn secondary live-slow" hidden>Taking a while? Open in browser</button>
                </div>
                <iframe src="${escapeHtml(safeUrl(x.embed))}" title="${escapeHtml(x.name)}" allow="camera; microphone; clipboard-write; fullscreen; autoplay" referrerpolicy="strict-origin-when-cross-origin"></iframe>
            </div>`;
        const loading = content.querySelector('.live-loading');
        const slow = content.querySelector('.live-slow');
        content.querySelector('iframe').addEventListener('load', () => loading.classList.add('done'));
        slow.addEventListener('click', () => openExternal(x.link));
        // Apps on free hosting take a while to wake up; offer the browser after a moment.
        setTimeout(() => {
            if (loading.classList.contains('done')) return;
            content.querySelector('.live-loading small').textContent = 'Waking up — free hosting sleeps when no one’s using it.';
            slow.hidden = false;
        }, 9000);
    }

    P.projects.filter(x => x.live && x.link).forEach(x => {
        IOS.register(`live-${x.id}`, {
            name: x.name,
            label: labelFor(x.name),
            icon: x.icon,   // macOS-style art (margin on the canvas): the shell crops it flush
            keywords: `${x.name} ${x.title} live app ${x.tags.join(' ')}`,
            external: x.embed ? null : x.link,
            pages: () => [{
                key: 'app', title: x.name, largeTitle: false, className: 'live-page',
                actions: [
                    { icon: 'fas fa-circle-info', label: `About ${x.name}`, onClick: () => IOS.go('projects', [x.fsId]) },
                    { icon: 'fas fa-arrow-up-right-from-square', label: 'Open in browser', onClick: () => openExternal(x.link) }
                ],
                render: (content) => frame(content, x)
            }]
        });
    });
})();
