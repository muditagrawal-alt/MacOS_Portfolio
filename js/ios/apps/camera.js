/* ==========================================================================
   Camera — take a photo, keep it on the device
   --------------------------------------------------------------------------
   The camera starts only when the visitor taps, and stops the moment they
   leave (or switch tabs). Photos go to a Camera Roll in this browser
   (IndexedDB) that Photos shows; nothing is uploaded. An optional
   "portfolio" caption stamps the owner's site on the photo, so a shared
   selfie carries the link.
   ========================================================================== */

/** The on-device Camera Roll, shared with Photos. */
window.CameraRoll = (() => {
    const DB = 'ios-camera-roll';
    const STORE = 'photos';
    const KEEP = 30;
    let opening = null;
    const open = () => opening || (opening = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => { opening = null; reject(req.error); };
    }));
    async function run(mode, work) {
        const db = await open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, mode);
            const req = work(tx.objectStore(STORE));
            tx.oncomplete = () => resolve(req ? req.result : undefined);
            tx.onerror = () => reject(tx.error);
        });
    }
    async function list() {
        try { return ((await run('readonly', s => s.getAll())) || []).sort((a, b) => b.at - a.at); } catch (e) { return []; }
    }
    async function add(url) {
        const photo = { id: `cam-${Date.now()}`, url, at: Date.now() };
        await run('readwrite', s => s.put(photo));
        const all = await list();
        await Promise.all(all.slice(KEEP).map(p => remove(p.id)));
        return photo;
    }
    const remove = (id) => run('readwrite', s => s.delete(id));
    return { list, add, remove };
})();

(function () {
    const P = window.PROFILE_DATA;
    const host = (() => { try { return new URL(P.site.url || location.href).host; } catch (e) { return location.host; } })();
    let view = null;          // { root, video, stream } while the page is mounted
    let facing = 'user';
    let stamp = true;

    function stop() {
        if (view && view.stream) view.stream.getTracks().forEach(t => t.stop());
        if (view) { view.stream = null; view.root.classList.remove('live'); }
    }

    async function start() {
        if (!view) return;
        stop();
        const gate = view.root.querySelector('.cam-gate');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false });
            if (!view) { stream.getTracks().forEach(t => t.stop()); return; }
            view.stream = stream;
            view.video.srcObject = stream;
            await view.video.play().catch(() => {});
            view.root.classList.add('live');
            view.root.classList.toggle('mirrored', facing === 'user');
            gate.hidden = true;
        } catch (e) {
            gate.hidden = false;
            gate.querySelector('small').textContent = e && e.name === 'NotAllowedError'
                ? 'Camera access was declined. Allow it in the browser’s site settings to take a photo.'
                : 'No camera is available here.';
        }
    }

    /** The current frame, cropped like the viewfinder, with the optional caption. */
    function capture() {
        const v = view.video;
        const W = 1080, H = 1440;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        const scale = Math.max(W / v.videoWidth, H / v.videoHeight);
        const dw = v.videoWidth * scale, dh = v.videoHeight * scale;
        ctx.save();
        if (facing === 'user') { ctx.translate(W, 0); ctx.scale(-1, 1); }
        ctx.drawImage(v, (W - dw) / 2, (H - dh) / 2, dw, dh);
        ctx.restore();
        if (stamp) {
            const g = ctx.createLinearGradient(0, H - 230, 0, H);
            g.addColorStop(0, 'rgba(0,0,0,0)');
            g.addColorStop(1, 'rgba(0,0,0,0.55)');
            ctx.fillStyle = g;
            ctx.fillRect(0, H - 230, W, 230);
            ctx.fillStyle = '#fff';
            ctx.font = '700 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillText(`${P.first}’s portfolio`, 56, H - 92);
            ctx.font = '500 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.globalAlpha = 0.85;
            ctx.fillText(`${host} · ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`, 56, H - 46);
            ctx.globalAlpha = 1;
        }
        return canvas.toDataURL('image/jpeg', 0.86);
    }

    async function shoot() {
        if (!view || !view.stream || !view.video.videoWidth) return;
        const flash = view.root.querySelector('.cam-flash');
        flash.classList.remove('go');
        void flash.offsetWidth;
        flash.classList.add('go');
        IOS.haptic();
        const photo = await CameraRoll.add(capture());
        showThumb(photo);
    }

    function showThumb(photo) {
        const thumb = view && view.root.querySelector('.cam-thumb');
        if (!thumb) return;
        thumb.innerHTML = photo ? `<img src="${photo.url}" alt="Last photo">` : '';
        thumb.dataset.id = photo ? photo.id : '';
        thumb.classList.remove('pop');
        void thumb.offsetWidth;
        if (photo) thumb.classList.add('pop');
    }

    function page(content) {
        content.innerHTML = `
            <div class="cam">
                <video class="cam-view" playsinline muted autoplay></video>
                <div class="cam-gate">
                    <span class="cam-gate-icon"><i class="fas fa-camera"></i></span>
                    <strong>Take a photo</strong>
                    <small>Photos stay in this browser; nothing is uploaded.</small>
                    <button type="button" class="ios-btn" data-act="start">Turn on camera</button>
                </div>
                <div class="cam-flash" aria-hidden="true"></div>
                <div class="cam-top">
                    <button type="button" class="cam-chip ${stamp ? 'on' : ''}" data-act="stamp" aria-pressed="${stamp}"><i class="fas fa-signature"></i> Portfolio caption</button>
                </div>
                <div class="cam-bottom">
                    <span class="cam-mode">PHOTO</span>
                    <div class="cam-controls">
                        <button type="button" class="cam-thumb" data-act="roll" aria-label="Open the last photo"></button>
                        <button type="button" class="cam-shutter" data-act="shoot" aria-label="Take photo"><span></span></button>
                        <button type="button" class="cam-flip" data-act="flip" aria-label="Switch camera"><i class="fas fa-arrows-rotate"></i></button>
                    </div>
                </div>
            </div>`;
        view = { root: content.querySelector('.cam'), video: content.querySelector('.cam-view'), stream: null };
        view.root.addEventListener('click', (e) => {
            const act = e.target.closest('[data-act]');
            if (!act) return;
            const a = act.dataset.act;
            if (a === 'start') start();
            if (a === 'shoot') shoot();
            if (a === 'flip') { facing = facing === 'user' ? 'environment' : 'user'; if (view.stream) start(); }
            if (a === 'stamp') { stamp = !stamp; act.classList.toggle('on', stamp); act.setAttribute('aria-pressed', String(stamp)); }
            if (a === 'roll') { const id = act.dataset.id; IOS.go('photos', id ? [id] : []); }
        });
        CameraRoll.list().then(all => showThumb(all[0] || null));
        // Asked before, and allowed: start straight away, like the real app.
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'camera' }).then(p => { if (p.state === 'granted') start(); }).catch(() => {});
        }
    }

    // A camera never runs in a tab nobody is looking at.
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

    IOS.register('camera', {
        name: 'Camera',
        icon: 'assets/icons/camera.svg',
        iconStyle: 'ios',
        statusBar: 'light',
        keywords: 'camera photo selfie picture take snap',
        onClose() { stop(); view = null; },
        pages: () => [{ key: 'cam', title: 'Camera', hideNav: true, className: 'cam-page', render: page }]
    });
})();
