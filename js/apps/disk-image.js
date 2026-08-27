/* ==========================================================================
   Disk Image mounter — what a .dmg actually does on macOS
   --------------------------------------------------------------------------
   Double-clicking a .dmg verifies, mounts, and opens a volume window showing
   the app next to a drop target. Here the drop target is the repo, and the
   download is the real source archive from GitHub.
   ========================================================================== */

let mountedVolume = null;

function mountDiskImage(imageId) {
    const image = (window.DISK_IMAGES || {})[imageId];
    if (!image) return;

    mountedVolume = imageId;
    openWindow('dmg-window');

    const win = document.getElementById('dmg-window');
    const titleEl = document.getElementById('dmg-window-title');
    const stage = document.getElementById('dmg-stage');
    if (titleEl) titleEl.textContent = image.volumeName;
    if (!stage) return;

    // Phase 1: the verification progress a real dmg shows before mounting.
    stage.innerHTML = `
        <div class="dmg-verifying">
            <i class="fas fa-hard-drive"></i>
            <div class="dmg-verify-label">Verifying &ldquo;${escapeHtml(image.volumeName)}&rdquo;…</div>
            <div class="dmg-verify-track"><div class="dmg-verify-bar" id="dmg-verify-bar"></div></div>
        </div>`;

    const bar = document.getElementById('dmg-verify-bar');
    let pct = 0;
    const timer = setInterval(() => {
        pct += 6 + Math.random() * 9;
        if (bar) bar.style.width = Math.min(pct, 100) + '%';
        if (pct >= 100) {
            clearInterval(timer);
            setTimeout(() => renderMountedVolume(image), 220);
        }
    }, 55);

    win.dataset.mountTimer = String(timer);
}

function renderMountedVolume(image) {
    const stage = document.getElementById('dmg-stage');
    if (!stage) return;

    stage.innerHTML = `
        <div class="dmg-volume">
            <div class="dmg-volume-drop">
                <div class="dmg-app">
                    <img src="${escapeHtml(image.icon)}" alt="${escapeHtml(image.appName)}">
                    <span>${escapeHtml(image.appName)}</span>
                </div>
                <i class="fas fa-arrow-right dmg-arrow"></i>
                <a class="dmg-app dmg-target" href="${escapeHtml(image.repo)}"
                   target="_blank" rel="noopener noreferrer">
                    <i class="fab fa-github"></i>
                    <span>Repository</span>
                </a>
            </div>

            <div class="dmg-info">
                <h2>${escapeHtml(image.appName)}</h2>
                <p class="dmg-tagline">${escapeHtml(image.tagline)}</p>
                <p class="dmg-desc">${escapeHtml(image.description)}</p>

                <div class="dmg-stack">
                    ${image.stack.map(t => `<span class="dmg-chip">${escapeHtml(t)}</span>`).join('')}
                </div>

                <div class="dmg-req"><i class="fas fa-circle-info"></i> ${escapeHtml(image.requirements)}</div>

                <div class="dmg-actions">
                    <a class="app-pill-btn primary" href="${escapeHtml(image.download)}"
                       target="_blank" rel="noopener noreferrer">
                        <i class="fas fa-download"></i> Download Source (.zip)
                    </a>
                    <a class="app-pill-btn" href="${escapeHtml(image.repo)}"
                       target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-github"></i> View on GitHub
                    </a>
                </div>
            </div>

            <div class="dmg-eject">
                <button type="button" class="dmg-eject-btn" onclick="ejectDiskImage()">
                    <i class="fas fa-eject"></i> Eject &ldquo;${escapeHtml(image.volumeName)}&rdquo;
                </button>
            </div>
        </div>`;
}

function ejectDiskImage() {
    const win = document.getElementById('dmg-window');
    if (win && win.dataset.mountTimer) {
        clearInterval(Number(win.dataset.mountTimer));
        delete win.dataset.mountTimer;
    }
    mountedVolume = null;
    closeWindow('dmg-window');
}
