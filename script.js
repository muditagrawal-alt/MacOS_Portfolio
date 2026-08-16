// Update Clock
function updateClock() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    const timeString = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' ' + hours + ':' + minutes + ' ' + ampm;
    document.getElementById('clock').textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();

// Window Management
let highestZIndex = 10;

function updateDockRunningIndicators() {
    const dockMap = {
        'finder-window': 'dock-finder',
        'mail-window': 'dock-mail',
        'notes-window': 'dock-notes',
        'safari-window': 'dock-safari',
        'appstore-window': 'dock-appstore',
        'settings-window': 'dock-settings',
        'terminal-window': 'dock-terminal',
        'trash-window': 'dock-trash'
    };

    Object.keys(dockMap).forEach(winId => {
        const win = document.getElementById(winId);
        const dockItem = document.getElementById(dockMap[winId]);
        if (win && dockItem) {
            if (!win.classList.contains('hidden') && !win.classList.contains('minimized')) {
                dockItem.classList.add('is-running');
            } else {
                dockItem.classList.remove('is-running');
            }
        }
    });
}

function bringToFront(windowId) {
    highestZIndex++;
    const win = document.getElementById(windowId);
    if (win) {
        win.style.zIndex = highestZIndex;
    }
}

function openWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.remove('hidden');
        win.classList.remove('minimized');
        bringToFront(windowId);
        updateDockRunningIndicators();
    }
}

function openResumeWindow() {
    openWindow('resume-window');

    const downloadBtn = document.getElementById('resume-download-btn');
    if (downloadBtn) {
        downloadBtn.style.display = 'block';
    }
}

function downloadResume(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    const base64 = (window.RESUME_PDF_BASE64 || '').replace(/\s+/g, '');
    if (!base64) return;

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'MuditAgrawalResumeJanuary2026.pdf';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function closeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.add('hidden');
        updateDockRunningIndicators();
    }
}

function minimizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.add('minimized');
        updateDockRunningIndicators();
    }
}

function maximizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        if (win.style.width === '100vw') {
            // Restore
            win.style.width = win.getAttribute('data-width') || '650px';
            win.style.height = win.getAttribute('data-height') || '400px';
            win.style.top = win.getAttribute('data-top') || '10%';
            win.style.left = win.getAttribute('data-left') || '10%';
        } else {
            // Maximize
            win.setAttribute('data-width', win.style.width || '650px');
            win.setAttribute('data-height', win.style.height || '400px');
            win.setAttribute('data-top', win.style.top || '10%');
            win.setAttribute('data-left', win.style.left || '10%');
            
            win.style.top = '28px'; // Below menu bar
            win.style.left = '0';
            win.style.width = '100vw';
            win.style.height = 'calc(100vh - 28px)';
        }
    }
}

// Drag functionality
function dragMouseDown(e, windowId) {
    e = e || window.event;
    
    // Don't drag if clicking window controls or inputs/buttons
    if (e.target.classList.contains('control') || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    bringToFront(windowId);
    
    const win = document.getElementById(windowId);
    if (!win) return;
    
    // Don't drag if maximized
    if (win.style.width === '100vw') return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    pos3 = e.clientX;
    pos4 = e.clientY;
    
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        let newTop = win.offsetTop - pos2;
        let newLeft = win.offsetLeft - pos1;
        
        // Boundaries
        if (newTop < 28) newTop = 28; // Don't go under menu bar
        
        win.style.top = newTop + "px";
        win.style.left = newLeft + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Make windows bring to front when clicked anywhere inside
document.querySelectorAll('.window').forEach(win => {
    win.addEventListener('mousedown', function() {
        bringToFront(this.id);
    });
});

// Pane titles for the unified Finder window
const finderPaneTitles = {
    'about': 'About Me',
    'experience': 'Experience',
    'education': 'Education & Certifications',
    'projects': 'Projects',
    'skills': 'Skills & Stacks',
    'contact': 'Contact'
};

// Switch content pane within the unified Finder window (like real macOS Finder)
function switchFinderPane(paneName) {
    const finderWindow = document.getElementById('finder-window');
    if (!finderWindow) return;

    // Hide all panes
    finderWindow.querySelectorAll('.finder-pane').forEach(pane => {
        pane.style.display = 'none';
    });

    // Show the target pane
    const targetPane = finderWindow.querySelector(`.finder-pane[data-pane="${paneName}"]`);
    if (targetPane) {
        targetPane.style.display = '';
    }

    // Update sidebar active state
    finderWindow.querySelectorAll('.sidebar-item[data-pane]').forEach(item => {
        item.classList.toggle('active', item.getAttribute('data-pane') === paneName);
    });

    // Update window title
    const titleEl = document.getElementById('finder-window-title');
    if (titleEl && finderPaneTitles[paneName]) {
        titleEl.textContent = finderPaneTitles[paneName];
    }
}

// Open the Finder window and switch to a specific pane
function openFinderPane(paneName) {
    const finderWindow = document.getElementById('finder-window');
    if (finderWindow) {
        openWindow('finder-window');
        switchFinderPane(paneName);
    }
}

// // Menu Bar Dropdown Logic
const windowNames = {
    'finder-window': 'Finder',
    'safari-window': 'Safari',
    'mail-window': 'Mail',
    'notes-window': 'Notes',
    'appstore-window': 'App Store',
    'settings-window': 'System Settings',
    'terminal-window': 'Terminal',
    'trash-window': 'Trash',
    'resume-window': 'Resume PDF'
};

function populateDynamicMenus() {
    const goMenu = document.getElementById('go-menu');
    const windowMenu = document.getElementById('window-menu');
    
    if (goMenu) goMenu.innerHTML = '';
    if (windowMenu) windowMenu.innerHTML = '';

    // Add standard window actions to Window menu
    if (windowMenu) {
        windowMenu.innerHTML += '<div class="dropdown-item" onclick="minimizeActiveWindow()">Minimize</div>';
        windowMenu.innerHTML += '<div class="dropdown-item" onclick="maximizeActiveWindow()">Zoom</div>';
        windowMenu.innerHTML += '<div class="dropdown-divider"></div>';
    }

    let allOpen = true;

    // To figure out which is frontmost:
    let activeWinId = null;
    let maxZ = -1;
    document.querySelectorAll('.window:not(.hidden):not(.minimized)').forEach(win => {
        const z = parseInt(win.style.zIndex || 0);
        if (z > maxZ) {
            maxZ = z;
            activeWinId = win.id;
        }
    });

    Object.keys(windowNames).forEach(id => {
        const win = document.getElementById(id);
        if (win && !win.classList.contains('hidden')) {
            // It's open
            if (windowMenu) {
                const checkmark = (id === activeWinId) ? '✓ ' : '&nbsp;&nbsp;';
                windowMenu.innerHTML += `<div class="dropdown-item" onclick="bringToFront('${id}')"><span style="display:inline-block;width:15px;">${checkmark}</span>${windowNames[id]}</div>`;
            }
        } else {
            // It's closed
            allOpen = false;
            if (goMenu) {
                const openAction = id === 'resume-window' ? 'openResumeWindow()' : `openWindow('${id}')`;
                goMenu.innerHTML += `<div class="dropdown-item" onclick="${openAction}">${windowNames[id]}</div>`;
            }
        }
    });

    if (allOpen && goMenu) {
        goMenu.innerHTML += '<div class="dropdown-item" style="color:#aaa; cursor:default;">All windows are open</div>';
    }
}

function toggleMenu(menuId) {
    // Populate dynamic menus before showing
    if (menuId === 'go-menu' || menuId === 'window-menu') {
        populateDynamicMenus();
    }
    
    if (menuId === 'view-menu') {
        const resumeWin = document.getElementById('resume-window');
        const downloadBtn = document.getElementById('resume-download-btn');
        if (resumeWin && downloadBtn) {
            if (!resumeWin.classList.contains('hidden')) {
                downloadBtn.style.display = 'block';
            } else {
                downloadBtn.style.display = 'none';
            }
        }
    }

    // Close all other menus first
    document.querySelectorAll('.menu-dropdown').forEach(menu => {
        if (menu.id !== menuId) {
            menu.classList.add('hidden');
            menu.parentElement.classList.remove('active');
        }
    });

    const menu = document.getElementById(menuId);
    if (menu) {
        menu.classList.toggle('hidden');
        menu.parentElement.classList.toggle('active');
    }
}

// Close menus when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.menu-dropdown-container')) {
        document.querySelectorAll('.menu-dropdown').forEach(menu => {
            menu.classList.add('hidden');
            menu.parentElement.classList.remove('active');
        });
    }
});

const SYSTEM_WIFI_STATUS = 'Wi-Fi Connected';
let SYSTEM_BATTERY_STATUS = window.SYSTEM_BATTERY_STATUS || 'Battery status unavailable in browser';
let SYSTEM_BATTERY_LEVEL = typeof window.SYSTEM_BATTERY_LEVEL === 'number' ? window.SYSTEM_BATTERY_LEVEL : null;
let SYSTEM_BATTERY_CHARGING = typeof window.SYSTEM_BATTERY_CHARGING === 'boolean' ? window.SYSTEM_BATTERY_CHARGING : false;

function setMenuIconTooltip(icon, text) {
    if (!icon) return;
    icon.dataset.tooltip = text;
    icon.setAttribute('aria-label', text);
}

function updateWifiStatus() {
    const wifiIcon = document.getElementById('wifi-icon');
    if (!wifiIcon) return;

    if (SYSTEM_WIFI_STATUS) {
        setMenuIconTooltip(wifiIcon, SYSTEM_WIFI_STATUS);
        return;
    }

    if (!navigator.onLine) {
        setMenuIconTooltip(wifiIcon, 'Wi-Fi: Offline');
        return;
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const connectionType = connection && connection.type ? connection.type.toLowerCase() : '';
    const effectiveType = connection && connection.effectiveType ? connection.effectiveType.toUpperCase() : '';

    if (connectionType === 'wifi') {
        setMenuIconTooltip(wifiIcon, 'Wi-Fi: Connected');
    } else if (connectionType) {
        setMenuIconTooltip(wifiIcon, `Network: ${connectionType.toUpperCase()}`);
    } else if (effectiveType) {
        setMenuIconTooltip(wifiIcon, `Network: ${effectiveType}`);
    } else {
        setMenuIconTooltip(wifiIcon, 'Wi-Fi: Status unavailable in browser');
    }
}

updateWifiStatus();
window.addEventListener('online', updateWifiStatus);
window.addEventListener('offline', updateWifiStatus);

const networkConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
if (networkConnection && typeof networkConnection.addEventListener === 'function') {
    networkConnection.addEventListener('change', updateWifiStatus);
}

function applyBatteryStatus(level, charging) {
    const batteryIcon = document.getElementById('battery-icon');
    if (!batteryIcon) return;

    const normalizedLevel = Math.max(0, Math.min(100, Math.round(level)));
    setMenuIconTooltip(batteryIcon, `Battery: ${normalizedLevel}%`);

    if (charging) {
        batteryIcon.className = 'fas fa-battery-charging menu-icon';
        batteryIcon.style.color = '#27c93f';
    } else if (normalizedLevel > 75) {
        batteryIcon.className = 'fas fa-battery-full menu-icon';
        batteryIcon.style.color = '';
    } else if (normalizedLevel > 50) {
        batteryIcon.className = 'fas fa-battery-three-quarters menu-icon';
        batteryIcon.style.color = '';
    } else if (normalizedLevel > 25) {
        batteryIcon.className = 'fas fa-battery-half menu-icon';
        batteryIcon.style.color = '';
    } else if (normalizedLevel > 10) {
        batteryIcon.className = 'fas fa-battery-quarter menu-icon';
        batteryIcon.style.color = '#ffbd2e';
    } else {
        batteryIcon.className = 'fas fa-battery-empty menu-icon';
        batteryIcon.style.color = '#ff5f56';
    }
}

function syncSystemBatteryVariables() {
    if (typeof window.SYSTEM_BATTERY_LEVEL === 'number') {
        SYSTEM_BATTERY_LEVEL = window.SYSTEM_BATTERY_LEVEL;
        SYSTEM_BATTERY_CHARGING = Boolean(window.SYSTEM_BATTERY_CHARGING);
        SYSTEM_BATTERY_STATUS = window.SYSTEM_BATTERY_STATUS || `Battery: ${Math.round(SYSTEM_BATTERY_LEVEL)}%`;
    }
}

function loadSystemBatteryFeed() {
    const existingFeed = document.querySelector('script[data-battery-feed]');
    if (existingFeed) {
        existingFeed.remove();
    }

    const script = document.createElement('script');
    script.src = `battery-status.js?ts=${Date.now()}`;
    script.dataset.batteryFeed = 'true';
    script.onload = function() {
        syncSystemBatteryVariables();
        if (typeof SYSTEM_BATTERY_LEVEL === 'number') {
            applyBatteryStatus(SYSTEM_BATTERY_LEVEL, SYSTEM_BATTERY_CHARGING);
        }
    };
    document.head.appendChild(script);
}

// Battery Status
if ('getBattery' in navigator) {
    navigator.getBattery().then(function(battery) {
        function updateBatteryStatus() {
            const level = Math.round(battery.level * 100);
            applyBatteryStatus(level, battery.charging);
        }

        updateBatteryStatus();
        battery.addEventListener('levelchange', updateBatteryStatus);
        battery.addEventListener('chargingchange', updateBatteryStatus);
    });
} else {
    syncSystemBatteryVariables();
    if (typeof SYSTEM_BATTERY_LEVEL === 'number') {
        applyBatteryStatus(SYSTEM_BATTERY_LEVEL, SYSTEM_BATTERY_CHARGING);
        loadSystemBatteryFeed();
        setInterval(loadSystemBatteryFeed, 15000);
    } else {
        const batteryIcon = document.getElementById('battery-icon');
        if (batteryIcon) {
            setMenuIconTooltip(batteryIcon, SYSTEM_BATTERY_STATUS || 'Battery status unavailable in browser');
        }
    }
}

// Helper functions for menu actions
function getActiveWindow() {
    let activeWin = null;
    let maxZ = -1;
    document.querySelectorAll('.window:not(.hidden):not(.minimized)').forEach(win => {
        const z = parseInt(win.style.zIndex || 0);
        if (z > maxZ) {
            maxZ = z;
            activeWin = win;
        }
    });
    return activeWin;
}

function closeActiveWindow() {
    const win = getActiveWindow();
    if (win) closeWindow(win.id);
}

function minimizeActiveWindow() {
    const win = getActiveWindow();
    if (win) minimizeWindow(win.id);
}

function maximizeActiveWindow() {
    const win = getActiveWindow();
    if (win) maximizeWindow(win.id);
}

// ==========================================================================
// Mail.app Controller Logic
// ==========================================================================
const emailData = {
    1: {
        subject: "Open for AI/ML Roles & Projects",
        from: "Mudit Agrawal <muditagrawal03@gmail.com>",
        to: "Recruiter / Collaborator <you@future.org>",
        date: "Today at 4:30 PM",
        body: `
            <p>Hi there,</p>
            <p>Thank you for exploring my macOS portfolio workspace!</p>
            <p>I am a Computer Science Undergraduate specialising in Artificial Intelligence & Machine Learning at IILM University. I have built real-world AI pipelines including multimodal document intelligence (<strong>OmniDoc</strong>), automated video clipping (<strong>Sliver.Ai</strong>), and defense-grade surveillance (<strong>S.W.O.R.D</strong>).</p>
            <p>I am actively looking for software engineering and machine learning roles where I can contribute to mission-critical systems and learn by doing.</p>
            <div class="mail-action-buttons">
                <a href="mailto:muditagrawal03@gmail.com?subject=Opportunity%20Discussion%20with%20Mudit" class="mail-action-btn primary"><i class="fas fa-reply"></i> Reply via Email</a>
                <a href="https://www.linkedin.com/in/mudit-agrawal-167610318" target="_blank" class="mail-action-btn"><i class="fab fa-linkedin"></i> Connect on LinkedIn</a>
                <a href="tel:+917289887349" class="mail-action-btn"><i class="fas fa-phone"></i> Call +91-7289887349</a>
            </div>
        `
    },
    2: {
        subject: "Latest Repos: OmniDoc & Sliver.Ai",
        from: "GitHub Notifications <notifications@github.com>",
        to: "Mudit Agrawal <muditagrawal03@gmail.com>",
        date: "Yesterday at 11:15 AM",
        body: `
            <p>Recent commits across <strong>@muditagrawal-alt</strong> repositories:</p>
            <ul style="padding-left:20px;margin-bottom:15px;color:#ccc;line-height:1.6;">
                <li><strong>OmniDoc:</strong> Integrated Mistral-7B Instruct with quantized Nomic embeddings & BLIP visual QA.</li>
                <li><strong>Sliver.Ai:</strong> Upgraded video highlight chunking with YOLOv8-Face and YOLO11m weights.</li>
                <li><strong>Sentinel-Web:</strong> Decision-intelligence security specifications documented.</li>
            </ul>
            <div class="mail-action-buttons">
                <a href="https://github.com/muditagrawal-alt" target="_blank" class="mail-action-btn primary"><i class="fab fa-github"></i> Open GitHub Profile</a>
            </div>
        `
    },
    3: {
        subject: "Direct Reach & Collaboration Channels",
        from: "Contact Book <contacts@muditagrawal.dev>",
        to: "Visitor <guest@macbook>",
        date: "Aug 12 at 10:00 AM",
        body: `
            <p>Here are all the channels where you can reach Mudit directly:</p>
            <p><strong>Email:</strong> muditagrawal03@gmail.com<br>
            <strong>Phone:</strong> +91-7289887349<br>
            <strong>LinkedIn:</strong> linkedin.com/in/mudit-agrawal-167610318<br>
            <strong>Hugging Face:</strong> huggingface.co/muditagrawal03<br>
            <strong>Blog:</strong> muditagrawal03.blogspot.com</p>
            <div class="mail-action-buttons">
                <a href="mailto:muditagrawal03@gmail.com" class="mail-action-btn primary"><i class="fas fa-envelope"></i> Send Direct Email</a>
                <button type="button" class="mail-action-btn" onclick="openResumeWindow()"><i class="fas fa-file-pdf"></i> View Resume</button>
            </div>
        `
    }
};

function selectEmail(id, element) {
    document.querySelectorAll('.mail-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    const email = emailData[id];
    if (!email) return;

    const subjectEl = document.getElementById('mail-reader-subject');
    const bodyEl = document.getElementById('mail-reader-body');
    if (subjectEl) subjectEl.textContent = email.subject;
    if (bodyEl) bodyEl.innerHTML = email.body;
}

function switchMailbox(boxName, element) {
    document.querySelectorAll('.mail-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
}

function openMailCompose() {
    const modal = document.getElementById('mail-compose-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeMailCompose() {
    const modal = document.getElementById('mail-compose-modal');
    if (modal) modal.classList.add('hidden');
}

function sendMailCompose() {
    const subject = document.getElementById('compose-subject').value || "Portfolio Connection";
    const message = document.getElementById('compose-message').value || "";
    const statusEl = document.getElementById('compose-status');

    if (statusEl) {
        statusEl.style.display = 'inline';
        setTimeout(() => {
            statusEl.style.display = 'none';
            closeMailCompose();
            window.location.href = `mailto:muditagrawal03@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        }, 800);
    }
}

// ==========================================================================
// Notes.app Controller Logic
// ==========================================================================
const notesData = {
    1: {
        title: "Engineering Philosophy",
        date: "August 16, 2026 at 2:15 PM",
        body: `
            <p>I value <strong>learning by building</strong> over purely memorizing theoretical concepts. The most instructive moments come when models break under edge cases, latencies spike on inference, or data pipelines hit unexpected bottlenecks.</p>
            <div class="note-checklist">
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Context Awareness:</strong> Tech is only as good as the problem it solves.</span></div>
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Robustness:</strong> Build systems that hold up outside clean sandbox environments.</span></div>
                <div class="checklist-item"><i class="fas fa-check-circle" style="color:#f6d365;"></i> <span><strong>Speed of Iteration:</strong> Prototype quickly, evaluate rigorously, refactor thoughtfully.</span></div>
            </div>
            <p style="margin-top: 15px; color:#c0bbb4;"><em>"Always stay curious, dig into the internals, and never treat AI models as black boxes."</em></p>
        `
    },
    2: {
        title: "What I'm Learning Currently",
        date: "August 15, 2026 at 6:40 PM",
        body: `
            <p>Areas of deep technical dive right now:</p>
            <div class="note-checklist">
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Multimodal Agent Architectures:</strong> Function calling, tool use, and structured outputs with open-weights LLMs.</span></div>
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Model Quantization & Inference:</strong> GGUF, AWQ, vLLM, and TensorRT optimizations for fast localized serving.</span></div>
                <div class="checklist-item"><i class="fas fa-circle" style="font-size:8px;color:#f6d365;"></i> <span><strong>Advanced Vision Transformers:</strong> Video temporal processing and real-time zero-shot detection.</span></div>
            </div>
        `
    },
    3: {
        title: "Core Tech Stack Cheat Sheet",
        date: "August 10, 2026 at 1:10 PM",
        body: `
            <p><strong>Languages:</strong> Python, C, Java, HTML5, CSS3, JavaScript, SQL.</p>
            <p><strong>AI/ML & Deep Learning:</strong> PyTorch, TensorFlow, Keras, OpenCV, Scikit-Learn, Torchvision, Torchaudio.</p>
            <p><strong>Pretrained Models & Tools:</strong> Mistral-7B, YOLOv8/11, Whisper, Coqui XTTS, BLIP, Nomic, FFMPEG, Git, Hugging Face, Linux/Bash.</p>
        `
    },
    4: {
        title: "Quick Facts & Interests",
        date: "August 2, 2026 at 9:30 AM",
        body: `
            <p>• Navy background: Grew up moving across naval bases in Mumbai and New Delhi, developing high adaptability and respect for mission discipline.</p>
            <p>• B.Tech CS (AI/ML) with 8.14 CGPA at IILM University.</p>
            <p>• Passionate about robotics, applied computer vision, competitive hackathons, and systems-level programming.</p>
        `
    }
};

function selectNote(id, element) {
    document.querySelectorAll('.note-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    const note = notesData[id];
    if (!note) return;

    const titleEl = document.getElementById('note-title-display');
    const dateEl = document.getElementById('note-date-stamp');
    const bodyEl = document.getElementById('note-body-content');

    if (titleEl) titleEl.textContent = note.title;
    if (dateEl) dateEl.textContent = note.date;
    if (bodyEl) bodyEl.innerHTML = note.body;
}

function switchNotesCategory(cat, element) {
    document.querySelectorAll('.notes-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');
}

function addNewNotePrompt() {
    const title = prompt("Enter note title:", "New Note Idea");
    if (title) {
        const body = prompt("Enter note content:", "Thoughts on AI system architecture...");
        const newId = Date.now();
        notesData[newId] = {
            title: title,
            date: "Just now",
            body: `<p>${body || 'No content provided.'}</p>`
        };
        const list = document.querySelector('.notes-list');
        if (list) {
            const item = document.createElement('div');
            item.className = 'note-item';
            item.onclick = function() { selectNote(newId, this); };
            item.innerHTML = `<div class="note-item-title">${title}</div><div class="note-item-meta"><span class="note-time">Just now</span> ${body ? body.substring(0, 30) + '...' : ''}</div>`;
            list.insertBefore(item, list.firstChild);
            selectNote(newId, item);
        }
    }
}

// ==========================================================================
// Safari.app Controller Logic
// ==========================================================================
const safariUrls = {
    'blog': 'https://muditagrawal03.blogspot.com',
    'github': 'https://github.com/muditagrawal-alt',
    'huggingface': 'https://huggingface.co/muditagrawal03'
};

let currentSafariTab = 'blog';

function switchSafariTab(tabName) {
    currentSafariTab = tabName;

    // Tabs active state
    document.querySelectorAll('.safari-tab').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // URL bar
    const urlInput = document.getElementById('safari-url-input');
    if (urlInput && safariUrls[tabName]) {
        urlInput.value = safariUrls[tabName];
    }

    // Panes
    document.querySelectorAll('.safari-pane').forEach(pane => pane.classList.add('hidden'));
    const activePane = document.getElementById(`safari-pane-${tabName}`);
    if (activePane) activePane.classList.remove('hidden');
}

function safariBack() {
    if (currentSafariTab === 'huggingface') switchSafariTab('github');
    else if (currentSafariTab === 'github') switchSafariTab('blog');
}

function safariForward() {
    if (currentSafariTab === 'blog') switchSafariTab('github');
    else if (currentSafariTab === 'github') switchSafariTab('huggingface');
}

function reloadSafariTab(e) {
    if (e) e.stopPropagation();
    const input = document.getElementById('safari-url-input');
    if (input) {
        input.style.opacity = '0.4';
        setTimeout(() => { input.style.opacity = '1'; }, 300);
    }
}

function openCurrentSafariLink() {
    if (safariUrls[currentSafariTab]) {
        window.open(safariUrls[currentSafariTab], '_blank');
    }
}

function focusSafariUrl() {
    const input = document.getElementById('safari-url-input');
    if (input) input.select();
}

// ==========================================================================
// App Store.app Controller Logic
// ==========================================================================
function filterAppStoreCategory(category, element) {
    document.querySelectorAll('.appstore-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    document.querySelectorAll('.app-card').forEach(card => {
        if (category === 'all' || card.getAttribute('data-cat') === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function filterAppStoreProjects(query) {
    const q = (query || '').toLowerCase().trim();
    document.querySelectorAll('.app-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(q)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// ==========================================================================
// System Settings.app Controller Logic
// ==========================================================================
function switchSettingsTab(tabName, element) {
    document.querySelectorAll('.settings-sidebar .sidebar-item').forEach(item => item.classList.remove('active'));
    if (element) element.classList.add('active');

    document.querySelectorAll('.settings-pane').forEach(pane => pane.classList.add('hidden'));
    const target = document.getElementById(`settings-pane-${tabName}`);
    if (target) target.classList.remove('hidden');
}

function setThemeMode(mode, element) {
    document.querySelectorAll('.theme-option').forEach(opt => opt.classList.remove('active'));
    if (element) element.classList.add('active');

    if (mode === 'glass') {
        document.documentElement.style.setProperty('--window-bg', 'rgba(30, 30, 30, 0.45)');
        document.documentElement.style.setProperty('--sidebar-bg', 'rgba(15, 15, 15, 0.4)');
    } else {
        document.documentElement.style.setProperty('--window-bg', 'rgba(30, 30, 30, 0.7)');
        document.documentElement.style.setProperty('--sidebar-bg', 'rgba(20, 20, 20, 0.6)');
    }
}

function setAccentColor(colorHex, element) {
    document.querySelectorAll('.accent-dot').forEach(dot => dot.classList.remove('active'));
    if (element) element.classList.add('active');
    document.documentElement.style.setProperty('--accent', colorHex);
}

function setDesktopWallpaper(val, element, isGradient) {
    document.querySelectorAll('.wallpaper-card').forEach(card => card.classList.remove('active'));
    if (element) element.classList.add('active');

    if (isGradient) {
        document.body.style.backgroundImage = val;
    } else {
        document.body.style.backgroundImage = `url('${val}')`;
    }
}

// ==========================================================================
// Trash.app Controller Logic
// ==========================================================================
function showTrashItemInfo(name, desc) {
    const toast = document.getElementById('trash-item-toast');
    if (toast) {
        toast.textContent = `${name}: ${desc}`;
        toast.classList.remove('hidden');
        setTimeout(() => { toast.classList.add('hidden'); }, 3000);
    }
}

function emptyTrash() {
    const container = document.getElementById('trash-content-area');
    const title = document.getElementById('trash-title');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;color:#aaa;padding:40px;">
                <i class="fas fa-check-circle fa-3x" style="color:#27c93f;margin-bottom:12px;"></i>
                <div style="font-size:16px;color:#fff;font-weight:600;">Trash is Empty</div>
                <p style="font-size:12px;margin-top:6px;">All discarded experiments have been recycled into clean memory.</p>
                <button type="button" class="app-pill-btn" onclick="location.reload()" style="margin-top:10px;">Undo / Restore</button>
            </div>
        `;
    }
    if (title) title.textContent = "Trash — 0 items";
}

// ==========================================================================
// Enhanced Terminal Logic
// ==========================================================================
function handleTerminalInput(e) {
    if (e.key === 'Enter') {
        const inputField = document.getElementById('terminal-input');
        const cmd = inputField.value.trim().toLowerCase();
        const outputDiv = document.getElementById('terminal-output');
        
        // Echo command
        outputDiv.innerHTML += `<div><span style="color:#43e97b">muditagrawal@macbook</span> <span style="color:#4facfe">~ %</span> ${inputField.value}</div>`;
        
        inputField.value = '';
        
        let response = '';
        
        if (cmd.startsWith('open ')) {
            const app = cmd.replace('open ', '').trim();
            const winMap = {
                'finder': 'finder-window',
                'safari': 'safari-window',
                'mail': 'mail-window',
                'notes': 'notes-window',
                'app store': 'appstore-window',
                'appstore': 'appstore-window',
                'settings': 'settings-window',
                'system settings': 'settings-window',
                'trash': 'trash-window',
                'resume': 'resume-window',
                'terminal': 'terminal-window'
            };
            if (winMap[app]) {
                openWindow(winMap[app]);
                response = `Opening ${app}...`;
            } else {
                response = `open: Application '${app}' not found. Try: finder, safari, mail, notes, appstore, settings, trash, resume`;
            }
        } else {
            switch(cmd) {
                case 'help':
                    response = `
                        <strong>Available Commands:</strong><br>
                        • <span style="color:#4facfe">neofetch</span> — View system specs & portfolio summary<br>
                        • <span style="color:#4facfe">open &lt;app&gt;</span> — Launch any macOS app (e.g. <em>open safari</em>, <em>open mail</em>)<br>
                        • <span style="color:#4facfe">about me</span> — Mudit's brief bio<br>
                        • <span style="color:#4facfe">experience</span> — Internship history at Zee & WESEE<br>
                        • <span style="color:#4facfe">projects</span> — List core AI/ML repositories<br>
                        • <span style="color:#4facfe">skills</span> — Technologies & models stack<br>
                        • <span style="color:#4facfe">contact</span> — Email, phone, & LinkedIn<br>
                        • <span style="color:#4facfe">cat resume.txt</span> — Display resume summary<br>
                        • <span style="color:#4facfe">whoami</span> — Current user info<br>
                        • <span style="color:#4facfe">clear</span> — Clear terminal output
                    `;
                    break;
                case 'neofetch':
                    response = `
<pre style="color:#4facfe;font-family:inherit;line-height:1.3;margin:0;">
       .---.          <span style="color:#fff;font-weight:700;">mudit@macbook-pro</span>
      /     \\         -----------------
     | () () |        <span style="color:#f6d365;">OS:</span> macOS Mudit 1.0 (Finder Portfolio)
      \\  _  /         <span style="color:#f6d365;">Host:</span> MacBook Pro 16" (Portfolio Edition)
       \`---\`          <span style="color:#f6d365;">Uptime:</span> Continuous Learning (3+ Years)
                      <span style="color:#f6d365;">Degree:</span> B.Tech CSE (AI/ML) @ IILM University
                      <span style="color:#f6d365;">Focus:</span> Multimodal RAG, CV (YOLO), LLM Systems
                      <span style="color:#f6d365;">Internships:</span> Zee Tech Innovation • WESEE (Indian Navy)
                      <span style="color:#f6d365;">Shell:</span> zsh 5.9
                      <span style="color:#f6d365;">Memory:</span> 100% Passion & Grit
</pre>
                    `;
                    break;
                case 'whoami':
                    response = 'Mudit Agrawal — AI/ML Engineer & Undergraduate Researcher';
                    break;
                case 'cat resume.txt':
                    response = `
                        <strong>MUDIT AGRAWAL — RESUME SUMMARY</strong><br>
                        • B.Tech CSE (AI/ML) @ IILM University (CGPA: 8.14)<br>
                        • ML Intern @ Zee Tech Innovation Centre (OmniDoc Multimodal RAG, Video Highlighting)<br>
                        • Summer Intern @ WESEE, Indian Navy (Defense LLM Evaluation)<br>
                        • Projects: OmniDoc, Sliver.Ai, Project S.W.O.R.D, Helix-Compiler<br>
                        • Type <em>open resume</em> to view the full PDF!
                    `;
                    break;
                case 'about me':
                    response = 'Mudit Agrawal. Computer Science (AI/ML) Undergraduate at IILM University. Focuses on building real-world AI pipelines that hold up outside clean environments.';
                    break;
                case 'experience':
                    response = '- Machine Learning Intern @ Zee Tech and Innovation Centre (Dec 2025 - Jan 2026)<br>- Summer Intern @ WESEE, Indian Navy (Jun 2025 - Jul 2025)';
                    break;
                case 'education':
                    response = '- B.Tech in Computer Science (AI/ML), IILM University (2023 - 2027) — CGPA 8.14<br>- Class 12, Navy Children School, New Delhi (2023) — 74%<br>- Class 10, Navy Children School, Mumbai (2021) — 89%';
                    break;
                case 'projects':
                    response = '- OmniDoc (Multimodal RAG LLM System)<br>- Sliver.Ai (Smart Video Clipping & Highlights)<br>- S.W.O.R.D (Surveillance Deep Learning YOLOv8)<br>- Deepfake Detector<br>- Helix-Compiler<br>- Multiva.Ai<br>- Inflx<br>- Artifex';
                    break;
                case 'skills':
                    response = 'Python, C, Java, HTML, CSS, PyTorch, TensorFlow, OpenCV, YOLOv8/11, Whisper, Mistral-7B, BLIP, Nomic, XTTS.';
                    break;
                case 'contact':
                    response = 'Email: muditagrawal03@gmail.com<br>Phone: +91-7289887349<br>LinkedIn: /in/mudit-agrawal-167610318<br>Hugging Face: /muditagrawal03';
                    break;
                case 'sudo hire-me':
                case 'hire me':
                case 'hire':
                    response = '<span style="color:#27c93f;font-weight:700;">[SUCCESS] Great decision! Sending offer letter transmission to muditagrawal03@gmail.com 🚀</span>';
                    break;
                case 'clear':
                    outputDiv.innerHTML = '';
                    return;
                case '':
                    break;
                default:
                    response = `zsh: command not found: ${cmd}. Type 'help' for available commands.`;
            }
        }
        
        if (response) {
            outputDiv.innerHTML += `<div style="margin-bottom: 10px;">${response}</div>`;
        }
        
        // Scroll to bottom
        const contentDiv = document.getElementById('terminal-content');
        if (contentDiv) contentDiv.scrollTop = contentDiv.scrollHeight;
    }
}
