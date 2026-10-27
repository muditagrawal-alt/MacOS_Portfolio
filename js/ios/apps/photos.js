/* ==========================================================================
   Photos — certificates and the portrait
   --------------------------------------------------------------------------
   The same PHOTO_LIBRARY the Mac's Photos app shows (js/data/desktop-files.js).
   A certificate opens full screen; its PDF opens in the system viewer.
   ========================================================================== */

(function () {
    const certs = () => ((window.PHOTO_LIBRARY || {}).certificates || { items: [] }).items;
    const PORTRAIT = { file: 'portrait', title: 'Mudit Agrawal', issuer: 'Portrait', thumb: 'assets/Professionalimage.jpeg', full: 'assets/Professionalimage.jpeg' };
    const find = (file) => (file === 'portrait' ? PORTRAIT : certs().find(c => c.file === file));

    function library(content) {
        const items = certs();
        content.innerHTML = `
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
            if (path[0]) {
                const c = find(path[0]);
                return [root, { key: `ph-${path[0]}`, title: c ? c.title : 'Photo', largeTitle: false, className: 'photos-viewer-page', render: (el) => viewer(el, path[0]) }];
            }
            return [root];
        }
    });
})();
