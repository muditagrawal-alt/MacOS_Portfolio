/* ==========================================================================
   Photos — certificates and the portrait
   --------------------------------------------------------------------------
   The same PHOTO_LIBRARY the Mac's Photos app shows (js/data/desktop-files.js).
   A certificate opens full screen; its PDF opens in the system viewer. Photos
   the visitor took with Camera (kept in this browser) come first.
   ========================================================================== */

(function () {
    const certs = () => ((window.PHOTO_LIBRARY || {}).certificates || { items: [] }).items;
    const P = window.PROFILE_DATA;
    const PORTRAIT = { file: 'portrait', title: P.name, issuer: 'Portrait', thumb: P.photo, full: P.photo };
    const find = (file) => (file === 'portrait' ? PORTRAIT : certs().find(c => c.file === file));

    function library(content) {
        const items = certs();
        content.innerHTML = `
            <div class="photos-roll" hidden></div>
            <div class="photos-summary">${items.length} certificates · 1 portrait</div>
            <div class="photos-grid">
                ${[PORTRAIT, ...items].map(c => `
                <button type="button" class="photos-tile" data-file="${escapeHtml(c.file)}" aria-label="${escapeHtml(c.title)}">
                    <img src="${escapeHtml(c.thumb)}" alt="" loading="lazy">
                </button>`).join('')}
            </div>
            <div class="ios-section-header">Albums</div>
            ${IOS.group([
                { icon: 'fas fa-award', color: '#ff9500', title: 'Certificates', detail: String(items.length) },
                { icon: 'fas fa-user', color: '#007aff', title: 'Portraits', detail: '1' }
            ])}`;
        content.onclick = (e) => {
            const tile = e.target.closest('[data-file]');
            if (tile) IOS.go('photos', [tile.dataset.file]);
        };
        if (window.CameraRoll) CameraRoll.list().then(roll => {
            const slot = content.querySelector('.photos-roll');
            if (!slot || !roll.length) return;
            slot.hidden = false;
            slot.innerHTML = `<div class="ios-section-header">Camera Roll · ${roll.length}</div>
                <div class="photos-grid">${roll.map(p => `<button type="button" class="photos-tile" data-file="${escapeHtml(p.id)}" aria-label="Your photo"><img src="${p.url}" alt=""></button>`).join('')}</div>`;
        });
    }

    /** A photo the visitor took: full screen, with Share and Delete. */
    function cameraViewer(content, id) {
        content.innerHTML = '<figure class="photos-viewer"></figure>';
        CameraRoll.list().then(roll => {
            const photo = roll.find(p => p.id === id);
            if (!photo) { content.innerHTML = IOS.emptyState('fas fa-image', 'Photo not found', 'It may have been deleted.'); return; }
            content.innerHTML = `
                <figure class="photos-viewer"><img src="${photo.url}" alt="Your photo"><figcaption>${escapeHtml(new Date(photo.at).toLocaleString())}</figcaption></figure>
                <div class="photos-actions">
                    <button type="button" class="ios-btn" data-action="share"><i class="fas fa-arrow-up-from-bracket"></i> Share</button>
                    <button type="button" class="ios-btn secondary" data-action="delete"><i class="fas fa-trash-can"></i> Delete</button>
                </div>`;
            IOS.bind(content, {
                share: async () => {
                    const blob = await (await fetch(photo.url)).blob();
                    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
                    const site = P.site.url || location.href;
                    if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file], text: site }).catch(() => {});
                    else Object.assign(document.createElement('a'), { href: photo.url, download: 'photo.jpg' }).click();
                },
                delete: async () => { await CameraRoll.remove(photo.id); IOS.back(); }
            });
        });
    }

    function viewer(content, file) {
        const c = find(file);
        if (!c) { content.innerHTML = IOS.emptyState('fas fa-image', 'Photo not found', ''); return; }
        const isPdf = /\.pdf$/i.test(c.full);
        content.innerHTML = `
            <figure class="photos-viewer">
                <img src="${escapeHtml(c.thumb)}" alt="${escapeHtml(c.title)}">
                <figcaption>
                    <strong>${escapeHtml(c.title)}</strong>
                    <span>${escapeHtml(c.issuer)}</span>
                </figcaption>
            </figure>
            ${isPdf ? `<button type="button" class="ios-btn block" data-action="pdf"><i class="fas fa-file-pdf"></i> Open certificate</button>` : ''}`;
        IOS.bind(content, { pdf: () => window.open(new URL(c.full, location.href).href, '_blank', 'noopener') });
    }

    IOS.register('photos', {
        name: 'Photos',
        icon: 'assets/icons/photos.png',
        keywords: 'certificates pictures portrait courses',
        pages(path) {
            const root = { key: 'library', title: 'Library', render: library };
            if (path[0] && path[0].startsWith('cam-') && window.CameraRoll) {
                return [root, { key: `ph-${path[0]}`, title: 'Photo', largeTitle: false, className: 'photos-viewer-page', render: (el) => cameraViewer(el, path[0]) }];
            }
            if (path[0]) {
                const c = find(path[0]);
                return [root, { key: `ph-${path[0]}`, title: c ? c.title : 'Photo', largeTitle: false, className: 'photos-viewer-page', render: (el) => viewer(el, path[0]) }];
            }
            return [root];
        }
    });
})();
