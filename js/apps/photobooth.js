/* ==========================================================================
   Photo Booth.app Controller — Camera Stream, Real-Time Filters & Save to PC
   ========================================================================== */

let pbStream = null;
let pbCurrentFilter = 'normal';
let pbCaptureMode = 'single';
let pbPhotos = [];
let pbActivePhoto = null;
let pbCountdownActive = false;
let pbSimAnimationId = null;
let pbCameraReady = false;

const PB_FILTERS = {
    normal: { name: 'Normal', css: 'none' },
    comic: { name: 'Comic', css: 'contrast(240%) saturate(260%) brightness(110%)' },
    thermal: { name: 'Thermal', css: 'invert(100%) hue-rotate(180deg) saturate(320%) contrast(160%)' },
    noir: { name: 'Noir B&W', css: 'grayscale(100%) contrast(150%) brightness(95%)' },
    sepia: { name: 'Sepia', css: 'sepia(100%) contrast(110%) saturate(140%)' },
    xray: { name: 'X-Ray', css: 'invert(100%) grayscale(100%) contrast(170%)' },
    cyberpunk: { name: 'Cyberpunk', css: 'hue-rotate(90deg) saturate(240%) contrast(130%)' },
    pixelate: { name: '8-Bit', css: 'contrast(160%) saturate(180%)' }
};

/* ── Web Audio Synthesized Camera Shutter & Countdown Sounds ─────────── */
function playPhotoBoothSound(type = 'shutter') {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        if (type === 'beep') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (type === 'shutter') {
            const bufferSize = Math.floor(ctx.sampleRate * 0.15);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1400;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            noise.start(now);
        }
    } catch (e) {}
}

/* ── Camera Initialization & Fallback Simulator ─────────────────────── */
let pbInitPromise = null;

function photoBoothVisible() {
    const win = document.getElementById('photobooth-window');
    return Boolean(win && !win.classList.contains('hidden') && !win.classList.contains('minimized'));
}

/**
 * Starts the camera at most once. Opening Photo Booth used to call this twice
 * (openPhotoBooth() and openWindow() each did), so two streams were opened,
 * the first reference was overwritten, and closing the app stopped only the
 * second one — the camera light stayed on after Photo Booth was closed.
 */
function initPhotoBoothCamera() {
    if (pbStream && pbStream.getTracks().some(t => t.readyState === 'live')) return Promise.resolve();
    if (pbInitPromise) return pbInitPromise;
    pbInitPromise = startPhotoBoothCamera().finally(() => { pbInitPromise = null; });
    return pbInitPromise;
}

async function startPhotoBoothCamera() {
    const video = document.getElementById('pb-video');
    const badge = document.getElementById('pb-sim-badge');
    const canvas = document.getElementById('pb-preview-canvas');
    if (!video) return;

    pbCameraReady = false;
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    if (badge) badge.innerHTML = '<i class="fas fa-circle" style="color:#ffd60a;"></i> Waiting for camera…';

    try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: false
            });

            // The visitor may have closed or minimised the window while the
            // permission prompt was up — never keep a camera nobody can see.
            if (!photoBoothVisible()) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            if (pbStream) pbStream.getTracks().forEach(t => t.stop());
            pbStream = stream;

            video.srcObject = pbStream;
            video.style.display = 'block';
            if (canvas) canvas.style.display = 'none';

            await video.play().catch(e => console.warn('Video play deferred:', e));
            pbCameraReady = true;
            stopSimulatedCamera();

            if (badge) badge.innerHTML = '<i class="fas fa-circle" style="color:#30d158;"></i> Camera On';
            return;
        }
    } catch (err) {
        console.warn('Camera unavailable or permission denied — using the studio preview:', err && err.name);
    }

    if (photoBoothVisible()) startSimulatedCamera();
}

function startSimulatedCamera() {
    const video = document.getElementById('pb-video');
    const badge = document.getElementById('pb-sim-badge');
    const canvas = document.getElementById('pb-preview-canvas');
    if (video) video.style.display = 'none';
    if (!canvas) return;

    canvas.style.display = 'block';
    if (badge) badge.innerHTML = '<i class="fas fa-circle" style="color:#0a84ff;"></i> No camera — studio preview';

    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 480;

    let tick = 0;
    function renderSim() {
        tick++;
        ctx.fillStyle = '#141419';
        ctx.fillRect(0, 0, 640, 480);

        // Animated neon backdrop
        const grad = ctx.createRadialGradient(320, 240, 20, 320, 240, 300);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
        grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.2)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 640, 480);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 0; x < 640; x += 40) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 480); ctx.stroke();
        }
        for (let y = 0; y < 480; y += 40) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(640, y); ctx.stroke();
        }

        // Animated avatar / silhouette
        const bob = Math.sin(tick * 0.05) * 8;
        // Head
        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(320, 190 + bob, 58, 0, Math.PI * 2);
        ctx.fill();

        // Sunglasses (Classic Mac cool emoji style)
        ctx.fillStyle = '#0f172a';
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(280, 180 + bob, 34, 18, 4);
            ctx.roundRect(326, 180 + bob, 34, 18, 4);
        } else if (typeof ctx.rect === 'function') {
            ctx.rect(280, 180 + bob, 34, 18);
            ctx.rect(326, 180 + bob, 34, 18);
        } else if (typeof ctx.fillRect === 'function') {
            ctx.fillRect(280, 180 + bob, 34, 18);
            ctx.fillRect(326, 180 + bob, 34, 18);
        }
        if (typeof ctx.fill === 'function') ctx.fill();
        if (typeof ctx.fillRect === 'function') ctx.fillRect(314, 185 + bob, 12, 4);

        // Smile
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        if (typeof ctx.beginPath === 'function') ctx.beginPath();
        if (typeof ctx.arc === 'function') ctx.arc(320, 208 + bob, 20, 0.2, Math.PI - 0.2);
        if (typeof ctx.stroke === 'function') ctx.stroke();

        // Torso
        ctx.fillStyle = '#3b82f6';
        if (typeof ctx.beginPath === 'function') ctx.beginPath();
        if (typeof ctx.ellipse === 'function') {
            ctx.ellipse(320, 320 + bob, 110, 80, 0, 0, Math.PI * 2);
        } else if (typeof ctx.arc === 'function') {
            ctx.arc(320, 320 + bob, 90, 0, Math.PI * 2);
        }
        ctx.fill();

        // Mac Apple logo badge on shirt
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(320, 290 + bob, 10, 0, Math.PI * 2);
        ctx.fill();

        // Watermark text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('macOS Photo Booth • Live Viewfinder', 320, 440);

        pbSimAnimationId = requestAnimationFrame(renderSim);
    }

    if (pbSimAnimationId) cancelAnimationFrame(pbSimAnimationId);
    renderSim();
}

function stopSimulatedCamera() {
    if (pbSimAnimationId) {
        cancelAnimationFrame(pbSimAnimationId);
        pbSimAnimationId = null;
    }
}

function stopPhotoBoothCamera() {
    if (pbStream) {
        pbStream.getTracks().forEach(track => {
            try { track.stop(); } catch (e) {}
        });
        pbStream = null;
    }
    const video = document.getElementById('pb-video');
    if (video) video.srcObject = null;
    pbCameraReady = false;
    stopSimulatedCamera();
}

/* ── Filter & Mode Selection ─────────────────────────────────────────── */
function setPhotoBoothFilter(filterKey) {
    if (!PB_FILTERS[filterKey]) return;
    pbCurrentFilter = filterKey;

    const video = document.getElementById('pb-video');
    const canvas = document.getElementById('pb-preview-canvas');
    const cssFilter = PB_FILTERS[filterKey].css;

    if (video) video.style.filter = cssFilter;
    if (canvas) canvas.style.filter = cssFilter;

    document.querySelectorAll('.pb-effect-card').forEach(card => {
        card.classList.toggle('active', card.dataset.filter === filterKey);
    });
}

function togglePhotoBoothEffects() {
    const grid = document.getElementById('pb-effects-grid');
    const btn = document.getElementById('pb-effects-toggle');
    if (!grid) return;
    const isOpen = grid.classList.toggle('open');
    if (btn) btn.classList.toggle('active', isOpen);
}

function setPhotoBoothMode(mode) {
    pbCaptureMode = mode;
    document.querySelectorAll('.pb-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
    });
}

/* ── Capture Sequence (3.. 2.. 1.. Flash!) ───────────────────────────── */
function takePhotoBoothPicture() {
    if (pbCountdownActive) return;
    pbCountdownActive = true;

    const countdownEl = document.getElementById('pb-countdown');
    let count = 3;

    if (countdownEl) {
        countdownEl.textContent = count;
        countdownEl.classList.add('active');
    }
    playPhotoBoothSound('beep');

    const timer = setInterval(() => {
        count--;
        if (count > 0) {
            if (countdownEl) countdownEl.textContent = count;
            playPhotoBoothSound('beep');
        } else {
            clearInterval(timer);
            if (countdownEl) countdownEl.classList.remove('active');
            triggerPhotoBoothShutter();
            pbCountdownActive = false;
        }
    }, 900);
}

function triggerPhotoBoothShutter() {
    // 1. Flash effect
    const flashEl = document.getElementById('pb-flash');
    if (flashEl) {
        flashEl.classList.add('flashing');
        setTimeout(() => flashEl.classList.remove('flashing'), 180);
    }

    // 2. Sound
    playPhotoBoothSound('shutter');

    // 3. Snap picture to canvas
    const video = document.getElementById('pb-video');
    const simCanvas = document.getElementById('pb-preview-canvas');
    const captureCanvas = document.getElementById('pb-canvas');
    if (!captureCanvas) return;

    const ctx = captureCanvas.getContext('2d');
    const w = 1280;
    const h = 720;
    captureCanvas.width = w;
    captureCanvas.height = h;

    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.filter = PB_FILTERS[pbCurrentFilter].css;

    const isVideoUsable = video && video.srcObject && video.readyState >= 2 && video.videoWidth > 0;
    if (isVideoUsable) {
        ctx.drawImage(video, 0, 0, w, h);
    } else if (simCanvas) {
        ctx.drawImage(simCanvas, 0, 0, w, h);
    } else {
        // Fallback backdrop
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    // 8-Bit Pixelate post-process if selected
    if (pbCurrentFilter === 'pixelate') {
        const off = document.createElement('canvas');
        off.width = 160;
        off.height = 90;
        const offCtx = off.getContext('2d');
        offCtx.drawImage(captureCanvas, 0, 0, 160, 90);

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, 160, 90, 0, 0, w, h);
    }

    // Add Photo Booth timestamp watermark
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, h - 44, w, 44);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('macOS Photo Booth', 24, h - 16);
    ctx.textAlign = 'right';
    const now = new Date();
    ctx.fillText(now.toLocaleDateString() + ' ' + now.toLocaleTimeString(), w - 24, h - 16);

    const dataUrl = captureCanvas.toDataURL('image/png');
    saveCapturedPhoto(dataUrl, captureCanvas);
}

function saveCapturedPhoto(dataUrl, captureCanvas) {
    const photoObj = {
        id: 'pb-' + Date.now(),
        dataUrl: dataUrl,
        timestamp: new Date().toISOString(),
        filter: pbCurrentFilter
    };

    pbPhotos.unshift(photoObj);
    if (pbPhotos.length > 25) pbPhotos.pop();

    // Guardrail against localStorage QuotaExceededError:
    // Generate an ultra-compact ~8KB thumbnail for localStorage storage
    try {
        // 480×270 JPEG (~25 KB): sharp enough to view and save again after a
        // reload. The old 160×90 thumb came back as a postage stamp.
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 480;
        thumbCanvas.height = 270;
        const tctx = thumbCanvas.getContext('2d');
        if (captureCanvas) {
            tctx.drawImage(captureCanvas, 0, 0, 480, 270);
            const thumbData = thumbCanvas.toDataURL('image/jpeg', 0.72);
            photoObj.thumb = thumbData;
            const storedList = pbPhotos.slice(0, 6).map(p => ({
                id: p.id,
                thumb: p.id === photoObj.id ? thumbData : (p.thumb || thumbData),
                filter: p.filter
            }));
            localStorage.setItem('photobooth_thumbs', JSON.stringify(storedList));
        }
    } catch (e) {
        console.warn('Storage quota safeguard handled:', e);
    }

    renderPhotoBoothTray();
    openPhotoModal(photoObj);
}

/* ── Photos Tray & Modal (Download to PC / Set Wallpaper) ────────────── */
function renderPhotoBoothTray() {
    const tray = document.getElementById('pb-tray');
    if (!tray) return;

    if (pbPhotos.length === 0) {
        tray.innerHTML = '<div class="pb-tray-empty">No photos taken yet. Click the red button to snap a photo!</div>';
        return;
    }

    tray.innerHTML = pbPhotos.map(p => `
        <div class="pb-thumb-item" onclick="openPhotoModalById('${p.id}')" title="Click to view & download">
            <img src="${p.dataUrl || p.thumb}" alt="Photo ${p.id}">
        </div>
    `).join('');
}

function openPhotoModalById(id) {
    const p = pbPhotos.find(item => item.id === id);
    if (p) openPhotoModal(p);
}

function openPhotoModal(photoObj) {
    pbActivePhoto = photoObj;
    const modal = document.getElementById('pb-modal');
    const modalImg = document.getElementById('pb-modal-img');
    const downloadBtn = document.getElementById('pb-download-btn');

    if (modal && modalImg) {
        modalImg.src = photoObj.dataUrl || photoObj.thumb;
        if (downloadBtn) {
            downloadBtn.href = photoObj.dataUrl || photoObj.thumb;
            downloadBtn.download = `PhotoBooth_${photoObj.id}.png`;
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                downloadActivePhoto();
            };
        }
        modal.classList.add('open');
    }
}

function closePhotoModal() {
    const modal = document.getElementById('pb-modal');
    if (modal) modal.classList.remove('open');
    pbActivePhoto = null;
}

// Direct save to user's laptop/PC via native browser download
function downloadActivePhoto() {
    if (!pbActivePhoto) return;
    const link = document.createElement('a');
    link.href = pbActivePhoto.dataUrl || pbActivePhoto.thumb;
    link.download = `PhotoBooth_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function setPhotoAsWallpaper() {
    if (!pbActivePhoto || typeof setDesktopWallpaper !== 'function') return;
    // Re-encode as JPEG before it's persisted: a 1280×720 PNG data URL can be
    // several MB and would blow localStorage's quota.
    const img = new Image();
    img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 1280;
        c.height = img.naturalHeight || 720;
        c.getContext('2d').drawImage(img, 0, 0);
        setDesktopWallpaper(c.toDataURL('image/jpeg', 0.82));
        if (typeof showToast === 'function') showToast('Wallpaper set', { body: 'Your Photo Booth picture is now the desktop.', icon: 'fas fa-image' });
    };
    img.src = pbActivePhoto.dataUrl || pbActivePhoto.thumb;
    closePhotoModal();
}

function deleteActivePhoto() {
    if (!pbActivePhoto) return;
    pbPhotos = pbPhotos.filter(p => p.id !== pbActivePhoto.id);
    renderPhotoBoothTray();
    closePhotoModal();
}

/* ── Window Lifecycle Hooks ──────────────────────────────────────────── */
function openPhotoBooth() {
    // openWindow() starts the camera for this window; calling
    // initPhotoBoothCamera() here as well is what opened a second stream.
    if (typeof openWindow === 'function') openWindow('photobooth-window');
}

function closePhotoBooth() {
    stopPhotoBoothCamera();
    closePhotoModal();
    if (typeof closeWindow === 'function') closeWindow('photobooth-window');
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        const saved = localStorage.getItem('photobooth_thumbs');
        if (saved) {
            const parsed = JSON.parse(saved);
            pbPhotos = parsed.map(item => ({
                id: item.id,
                dataUrl: item.thumb,
                thumb: item.thumb,
                filter: item.filter
            }));
        }
    } catch (e) {}
    renderPhotoBoothTray();
});
