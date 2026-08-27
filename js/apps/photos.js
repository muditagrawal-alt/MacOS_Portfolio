/* ==========================================================================
   Photos.app — certificate & workspace gallery
   --------------------------------------------------------------------------
   Reads window.PHOTO_LIBRARY. Thumbnails are pre-rendered JPEGs; opening one
   goes to the original PDF/image.
   ========================================================================== */

let activePhotoAlbum = 'certificates';
let lightboxIndex = -1;

function renderPhotoAlbums() {
    const nav = document.getElementById('photos-albums');
    if (!nav || !window.PHOTO_LIBRARY) return;

    nav.innerHTML = Object.entries(window.PHOTO_LIBRARY).map(([key, album]) => `
        <div class="sidebar-item ${key === activePhotoAlbum ? 'active' : ''}"
             data-album="${key}" onclick="switchPhotoAlbum('${key}')">
            <i class="fas ${key === 'certificates' ? 'fa-award' : 'fa-image'}"></i>
            <span>${escapeHtml(album.title)}</span>
            <span class="photos-count">${album.items.length}</span>
        </div>
    `).join('');
}

function switchPhotoAlbum(key) {
    activePhotoAlbum = key;
    renderPhotoAlbums();
    renderPhotoGrid();
}

function renderPhotoGrid() {
    const grid = document.getElementById('photos-grid');
    const album = (window.PHOTO_LIBRARY || {})[activePhotoAlbum];
    if (!grid || !album) return;

    document.getElementById('photos-window-title').textContent = album.title;

    grid.innerHTML = album.items.map((item, i) => `
        <figure class="photo-tile" data-index="${i}" tabindex="0" role="button"
                aria-label="${escapeHtml(item.title)}">
            <div class="photo-tile-frame">
                <img src="${escapeHtml(item.thumb)}" alt="${escapeHtml(item.title)}"
                     loading="lazy" decoding="async">
            </div>
            <figcaption>
                <span class="photo-tile-title">${escapeHtml(item.title)}</span>
                <span class="photo-tile-issuer">${escapeHtml(item.issuer)}</span>
            </figcaption>
        </figure>
    `).join('');

    grid.querySelectorAll('.photo-tile').forEach(tile => {
        const i = Number(tile.dataset.index);
        tile.addEventListener('click', () => openPhotoLightbox(i));
        tile.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); openPhotoLightbox(i); }
        });
    });
}

function currentAlbumItems() {
    return ((window.PHOTO_LIBRARY || {})[activePhotoAlbum] || {}).items || [];
}

function openPhotoLightbox(index) {
    const items = currentAlbumItems();
    const item = items[index];
    if (!item) return;

    lightboxIndex = index;
    const box = document.getElementById('photo-lightbox');
    if (!box) return;

    document.getElementById('photo-lightbox-img').src = item.thumb;
    document.getElementById('photo-lightbox-title').textContent = item.title;
    document.getElementById('photo-lightbox-issuer').textContent = item.issuer;
    const openBtn = document.getElementById('photo-lightbox-open');
    openBtn.onclick = () => openExternal(item.full);
    openBtn.textContent = item.full.endsWith('.pdf') ? 'Open PDF' : 'Open Full Size';

    document.getElementById('photo-lightbox-counter').textContent = `${index + 1} of ${items.length}`;
    box.classList.add('active');
}

function closePhotoLightbox() {
    const box = document.getElementById('photo-lightbox');
    if (box) box.classList.remove('active');
    lightboxIndex = -1;
}

function stepPhotoLightbox(delta) {
    const items = currentAlbumItems();
    if (lightboxIndex < 0 || items.length === 0) return;
    openPhotoLightbox((lightboxIndex + delta + items.length) % items.length);
}

document.addEventListener('keydown', (e) => {
    if (lightboxIndex < 0) return;
    if (e.key === 'Escape')     { e.preventDefault(); closePhotoLightbox(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepPhotoLightbox(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); stepPhotoLightbox(-1); }
});

document.addEventListener('DOMContentLoaded', () => {
    renderPhotoAlbums();
    renderPhotoGrid();
    const box = document.getElementById('photo-lightbox');
    if (box) box.addEventListener('click', e => { if (e.target === box) closePhotoLightbox(); });
});
