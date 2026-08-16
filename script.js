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
        
        if (windowId === 'safari-window') {
            renderSafariTabs();
            switchSafariTab(activeSafariTabId);
        }
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
            <strong>Substack:</strong> substack.com/@standardissuemudit</p>
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
// Safari.app Full-Featured Browser Engine (DuckDuckGo + YouTube + Shortcuts)
// ==========================================================================
const safariShortcuts = {
    'github': {
        title: 'GitHub — @muditagrawal-alt',
        url: 'https://github.com/muditagrawal-alt',
        icon: 'fab fa-github',
        domain: 'github.com/muditagrawal-alt',
        category: 'Code & Open Source',
        desc: 'Explore 8+ production & research AI/ML repositories authored by Mudit Agrawal including OmniDoc, Sliver.Ai, and Project S.W.O.R.D.',
        pinnedRepos: [
            { name: 'OmniDoc', desc: 'Multimodal RAG Document Intelligence System with Mistral-7B & BLIP.', stars: 'Featured', lang: 'Python' },
            { name: 'Sliver-Smart-Video-Clipping-Tool', desc: 'AI highlight clipping pipeline using YOLOv8 & YOLO11.', stars: 'Featured', lang: 'Python' },
            { name: 'Project-S.W.O.R.D', desc: 'Surveillance for Weapon Observation with Real-Time Deep Learning.', stars: 'Defense', lang: 'Python' },
            { name: 'Helix-Compiler', desc: 'C-based parsing, AST generation and systems compiler.', stars: 'Systems', lang: 'C' }
        ]
    },
    'huggingface': {
        title: 'Hugging Face — @muditagrawal03',
        url: 'https://huggingface.co/muditagrawal03',
        icon: 'fas fa-robot',
        domain: 'huggingface.co/muditagrawal03',
        category: 'AI Models & Spaces',
        desc: 'Model checkpoints, pipelines, and interactive spaces for Speech Synthesis, Multimodal VQA, and LLM fine-tunes.',
        pinnedRepos: [
            { name: 'Speech-Synthesis-Hub', desc: 'Coqui XTTS-v2 and Whisper pipeline experiments.', stars: 'Models', lang: 'PyTorch' },
            { name: 'Multimodal-VQA-Space', desc: 'Visual document reasoning with BLIP & Mistral.', stars: 'Spaces', lang: 'Gradio' }
        ]
    },
    'linkedin': {
        title: 'LinkedIn — Mudit Agrawal',
        url: 'https://www.linkedin.com/in/mudit-agrawal-167610318',
        icon: 'fab fa-linkedin',
        domain: 'linkedin.com/in/mudit-agrawal-167610318',
        category: 'Professional Network',
        desc: 'Computer Science (AI/ML) Undergraduate at IILM University • Former ML Intern at Zee Tech Innovation & WESEE (Indian Navy).',
        pinnedRepos: [
            { name: 'Experience', desc: 'Zee Tech & Innovation Centre (Dec 2025 - Jan 2026)', stars: 'Internship', lang: 'AI/ML' },
            { name: 'Defense R&D', desc: 'WESEE, Indian Navy (June 2025 - July 2025)', stars: 'Naval AI', lang: 'Defense' }
        ]
    },
    'substack': {
        title: 'Substack — @standardissuemudit',
        url: 'https://substack.com/@standardissuemudit',
        icon: 'fas fa-bookmark',
        iconSvg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/></svg>',
        domain: 'substack.com/@standardissuemudit',
        category: 'Tech & AI Newsletter',
        desc: 'Deep dives on multimodal RAG architectures, computer vision benchmarks, and AI engineering notes.',
        pinnedRepos: [
            { name: 'Building Multimodal RAG with Mistral-7B & BLIP', desc: 'Full architecture walkthrough from PDF chunking to grounded synthesis.', stars: 'Article', lang: 'RAG' },
            { name: 'Real-Time Video Analytics with YOLOv8 & YOLO11', desc: 'Sub-second highlight generation with multi-cue tracking.', stars: 'Article', lang: 'Vision' }
        ]
    },
    'medium': {
        title: 'Medium — @muditagrawal03',
        url: 'https://medium.com/@muditagrawal03',
        icon: 'fab fa-medium',
        domain: 'medium.com/@muditagrawal03',
        category: 'Articles & Tutorials',
        desc: 'Thought leadership articles on practical AI engineering, avoiding hallucination traps, and real-world system resilience.',
        pinnedRepos: [
            { name: 'Evaluating LLMs for Mission-Critical Defense Systems', desc: 'Naval R&D insights and reliability testing.', stars: 'Article', lang: 'Safety' },
            { name: 'Beyond Theory: What College Doesn’t Teach About Machine Learning', desc: 'Practical lessons from deployment bottlenecks.', stars: 'Guide', lang: 'Career' }
        ]
    },
    'instagram': {
        title: 'Instagram — @muditagrawal_',
        url: 'https://www.instagram.com',
        icon: 'fab fa-instagram',
        domain: 'instagram.com/muditagrawal_',
        category: 'Social & Behind the Scenes',
        desc: 'Campus life at IILM University, hackathon sprints, photography, robotics lab snapshots, and tech journey moments.',
        pinnedRepos: [
            { name: 'Hackathon Highlights', desc: 'Late night debugging, caffeine fuel, and demo pitches.', stars: 'Posts', lang: 'Photos' },
            { name: 'Campus & Navy Life', desc: 'Naval base memories and university campus perspectives.', stars: 'Stories', lang: 'Highlights' }
        ]
    },
    'x': {
        title: 'X (Twitter) — @muditag52751860',
        url: 'https://x.com/muditag52751860',
        icon: 'fab fa-x-twitter',
        domain: 'x.com/muditag52751860',
        category: 'Tech Discussions & Updates',
        desc: 'Sharing daily thoughts on open-source AI weights, research papers from arXiv, and builder updates.',
        pinnedRepos: [
            { name: 'Paper Takeaways', desc: 'Bite-sized threads breaking down new CV and LLM releases.', stars: 'Threads', lang: 'AI' },
            { name: 'Build In Public', desc: 'Weekly progress snapshots on OmniDoc and Sliver.Ai.', stars: 'Updates', lang: 'Dev' }
        ]
    },
    'leetcode': {
        title: 'LeetCode — @muditagrawal03',
        url: 'https://leetcode.com/u/muditagrawal03/',
        icon: 'fas fa-code',
        iconSvg: '<svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .666-1.795l3.86-4.133 5.304-5.694a1.376 1.376 0 0 0-.96-2.352zm3.896 9.615c-.76 0-1.378.618-1.378 1.378v4.973c0 .76.618 1.378 1.378 1.378h5.243c.76 0 1.378-.618 1.378-1.378v-4.973c0-.76-.618-1.378-1.378-1.378h-5.243z"/></svg>',
        domain: 'leetcode.com/u/muditagrawal03',
        category: 'Algorithms & Data Structures',
        desc: 'Problem solving across Trees, Dynamic Programming, Graphs, and Systems Optimization in C and Python.',
        pinnedRepos: [
            { name: 'Data Structures & Algorithms', desc: '200+ problems solved across arrays, DP, and graphs.', stars: 'Profile', lang: 'Algorithms' },
            { name: 'Contest Rankings', desc: 'Consistent competitive programming participant.', stars: 'Contests', lang: 'Problem Solving' }
        ]
    }
};

// YouTube Video Database for In-Browser Player Engine
const youtubeVideoLibrary = [
    {
        id: 'aircAruvnKk',
        title: 'But what is a neural network? | Chapter 1, Deep learning',
        channel: '3Blue1Brown',
        views: '16M views • 6 years ago',
        category: 'AI & Neural Networks',
        thumb: 'https://img.youtube.com/vi/aircAruvnKk/mqdefault.jpg',
        duration: '19:13'
    },
    {
        id: 'kCc8FmEb1nY',
        title: 'Let\'s build GPT: from scratch, in code, spelled out.',
        channel: 'Andrej Karpathy',
        views: '4.8M views • 2 years ago',
        category: 'AI & Neural Networks',
        thumb: 'https://img.youtube.com/vi/kCc8FmEb1nY/mqdefault.jpg',
        duration: '1:56:01'
    },
    {
        id: 'jGwO_EiCahm',
        title: 'Stanford CS229: Machine Learning - Lecture 1 (Linear Regression)',
        channel: 'Stanford Online',
        views: '3.1M views • 5 years ago',
        category: 'Machine Learning',
        thumb: 'https://img.youtube.com/vi/jGwO_EiCahm/mqdefault.jpg',
        duration: '1:19:40'
    },
    {
        id: 'tPYj3fFJGjk',
        title: 'Atlas Gets a Grip | Boston Dynamics Next-Gen Humanoid',
        channel: 'Boston Dynamics',
        views: '7.4M views • 1 year ago',
        category: 'Robotics & Vision',
        thumb: 'https://img.youtube.com/vi/tPYj3fFJGjk/mqdefault.jpg',
        duration: '1:24'
    },
    {
        id: 'jfKfPfyJRdk',
        title: 'lofi hip hop radio 📚 - beats to relax/study to',
        channel: 'Lofi Girl',
        views: 'Live Stream • 35K Watching',
        category: 'Lofi Music',
        thumb: 'https://img.youtube.com/vi/jfKfPfyJRdk/mqdefault.jpg',
        duration: 'LIVE'
    },
    {
        id: 'V_xro1bcAuA',
        title: 'Apple Vision Pro — Guided Tour & Spatial Computing',
        channel: 'Apple',
        views: '11M views • 1 year ago',
        category: 'Tech Demos',
        thumb: 'https://img.youtube.com/vi/V_xro1bcAuA/mqdefault.jpg',
        duration: '9:53'
    },
    {
        id: 'zjkBMFhNj_g',
        title: 'Intro to Large Language Models - Full Deep Dive',
        channel: 'Andrej Karpathy',
        views: '3.9M views • 1 year ago',
        category: 'AI & Neural Networks',
        thumb: 'https://img.youtube.com/vi/zjkBMFhNj_g/mqdefault.jpg',
        duration: '1:00:00'
    },
    {
        id: 'Gv9_4yMHFhI',
        title: 'Yann LeCun: Meta AI, Open Source, and Autonomous Machine Intelligence',
        channel: 'Lex Fridman',
        views: '1.2M views • 10 months ago',
        category: 'Tech Talks',
        thumb: 'https://img.youtube.com/vi/Gv9_4yMHFhI/mqdefault.jpg',
        duration: '2:48:32'
    }
];

let activeYouTubeVideoId = 'aircAruvnKk';
let activeYouTubeCategory = 'All';

// Safari Tab State
let safariTabs = [
    {
        id: 1,
        title: 'Start Page',
        url: '',
        type: 'start',
        history: ['start'],
        historyIndex: 0
    }
];

let activeSafariTabId = 1;

function renderSafariTabs() {
    const container = document.getElementById('safari-tab-bar-container');
    if (!container) return;

    container.innerHTML = '';
    safariTabs.forEach(tab => {
        const item = document.createElement('div');
        item.className = `safari-tab-item ${tab.id === activeSafariTabId ? 'active' : ''}`;
        item.onclick = function(e) {
            if (!e.target.classList.contains('safari-tab-close')) {
                switchSafariTab(tab.id);
            }
        };

        let iconMarkup = '';
        if (tab.type === 'start') {
            iconMarkup = '<i class="fas fa-compass" style="font-size:12px;opacity:0.85;"></i>';
        } else if (tab.type === 'youtube') {
            iconMarkup = '<i class="fab fa-youtube" style="font-size:12px;color:#ff0000;"></i>';
        } else if (tab.shortcutKey && safariShortcuts[tab.shortcutKey]?.iconSvg) {
            iconMarkup = safariShortcuts[tab.shortcutKey].iconSvg.replace('width="28" height="28"', 'width="13" height="13"');
        } else {
            const iconClass = tab.icon || 'fas fa-globe';
            iconMarkup = `<i class="${iconClass}" style="font-size:12px;opacity:0.85;"></i>`;
        }

        item.innerHTML = `
            ${iconMarkup}
            <span class="safari-tab-title">${tab.title}</span>
            <span class="safari-tab-close" onclick="closeSafariTab(${tab.id}, event)">&times;</span>
        `;
        container.appendChild(item);
    });

    // Update Nav buttons state
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    const backBtn = document.getElementById('safari-btn-back');
    const fwdBtn = document.getElementById('safari-btn-forward');
    if (currentTab && backBtn && fwdBtn) {
        backBtn.disabled = currentTab.historyIndex <= 0;
        fwdBtn.disabled = currentTab.historyIndex >= currentTab.history.length - 1;
    }
}

function switchSafariTab(tabId) {
    activeSafariTabId = tabId;
    const tab = safariTabs.find(t => t.id === tabId);
    if (!tab) return;

    renderSafariTabs();

    const urlInput = document.getElementById('safari-url-input');
    const startView = document.getElementById('safari-start-page-view');
    const pageView = document.getElementById('safari-web-page-view');

    if (tab.type === 'start') {
        if (urlInput) urlInput.value = '';
        if (startView) {
            startView.style.display = 'block';
            startView.classList.remove('hidden');
        }
        if (pageView) {
            pageView.style.display = 'none';
            pageView.classList.add('hidden');
        }
    } else {
        if (urlInput) urlInput.value = tab.url;
        if (startView) {
            startView.style.display = 'none';
            startView.classList.add('hidden');
        }
        if (pageView) {
            pageView.style.display = 'flex';
            pageView.classList.remove('hidden');
        }
        renderSafariWebPage(tab);
    }
}

function createSafariTab(url, title, type = 'start', icon = 'fas fa-compass') {
    const newId = Date.now();
    const newTab = {
        id: newId,
        title: title || 'Start Page',
        url: type === 'start' ? '' : (url || ''),
        type: type,
        icon: icon,
        history: [type === 'start' ? 'start' : url],
        historyIndex: 0
    };
    safariTabs.push(newTab);
    switchSafariTab(newId);
}

function closeSafariTab(tabId, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }

    if (safariTabs.length === 1) {
        safariTabs[0] = {
            id: Date.now(),
            title: 'Start Page',
            url: '',
            type: 'start',
            history: ['start'],
            historyIndex: 0
        };
        switchSafariTab(safariTabs[0].id);
        return;
    }

    const index = safariTabs.findIndex(t => t.id === tabId);
    safariTabs = safariTabs.filter(t => t.id !== tabId);

    if (activeSafariTabId === tabId) {
        const nextIndex = Math.max(0, index - 1);
        activeSafariTabId = safariTabs[nextIndex].id;
    }

    switchSafariTab(activeSafariTabId);
}

function loadSafariDestination(tab, dest) {
    if (dest === 'start') {
        tab.type = 'start';
        tab.title = 'Start Page';
        tab.url = '';
        tab.shortcutKey = null;
        tab.searchQuery = null;
    } else if (dest === 'youtube' || dest.includes('youtube.com')) {
        tab.type = 'youtube';
        tab.title = 'YouTube';
        tab.url = 'https://www.youtube.com';
        tab.icon = 'fab fa-youtube';
        tab.shortcutKey = null;
        tab.searchQuery = null;
    } else if (safariShortcuts[dest]) {
        const sc = safariShortcuts[dest];
        tab.type = 'page';
        tab.title = sc.title;
        tab.url = sc.url;
        tab.icon = sc.icon;
        tab.shortcutKey = dest;
        tab.searchQuery = null;
    } else if (dest.startsWith('search:')) {
        const q = dest.replace('search:', '');
        tab.type = 'ddg_search';
        tab.title = `DuckDuckGo: ${q}`;
        tab.url = `https://duckduckgo.com/?q=${encodeURIComponent(q)}`;
        tab.searchQuery = q;
        tab.icon = 'fas fa-search';
        tab.shortcutKey = null;
    } else {
        tab.type = 'web';
        tab.title = dest.replace(/^https?:\/\//, '');
        tab.url = dest;
        tab.icon = 'fas fa-globe';
        tab.shortcutKey = null;
        tab.searchQuery = null;
    }
}

function pushSafariHistory(tab, dest) {
    if (tab.historyIndex < tab.history.length - 1) {
        tab.history = tab.history.slice(0, tab.historyIndex + 1);
    }
    tab.history.push(dest);
    tab.historyIndex = tab.history.length - 1;
}

function openSafariStartPage() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        loadSafariDestination(currentTab, 'start');
        pushSafariHistory(currentTab, 'start');
        switchSafariTab(currentTab.id);
    }
}

function openSafariShortcut(key) {
    const shortcut = safariShortcuts[key];
    if (!shortcut) return;

    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        loadSafariDestination(currentTab, key);
        pushSafariHistory(currentTab, key);
        switchSafariTab(currentTab.id);
    }
}

function handleSafariUrlKey(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('safari-url-input');
        const value = (input.value || '').trim();
        if (!value) return;

        navigateSafariTo(value);
    }
}

function navigateSafariTo(queryOrUrl) {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (!currentTab) return;

    const lower = queryOrUrl.toLowerCase();

    // Check if YouTube
    if (lower === 'youtube' || lower === 'yt' || lower.includes('youtube.com') || lower.startsWith('yt:')) {
        loadSafariDestination(currentTab, 'youtube');
        pushSafariHistory(currentTab, 'youtube');
        switchSafariTab(currentTab.id);
        return;
    }

    // Check if matching shortcut
    for (const key of Object.keys(safariShortcuts)) {
        if (lower === key || lower.includes(safariShortcuts[key].domain)) {
            openSafariShortcut(key);
            return;
        }
    }

    const isUrl = queryOrUrl.startsWith('http://') || queryOrUrl.startsWith('https://') || (queryOrUrl.includes('.') && !queryOrUrl.includes(' '));

    if (isUrl) {
        const formattedUrl = queryOrUrl.startsWith('http') ? queryOrUrl : `https://${queryOrUrl}`;
        loadSafariDestination(currentTab, formattedUrl);
        pushSafariHistory(currentTab, formattedUrl);
        switchSafariTab(currentTab.id);
    } else {
        const dest = `search:${queryOrUrl}`;
        loadSafariDestination(currentTab, dest);
        pushSafariHistory(currentTab, dest);
        switchSafariTab(currentTab.id);
    }
}

// --------------------------------------------------------------------------
// DuckDuckGo Live Search & Research Engine
// --------------------------------------------------------------------------
function evaluateMathExpression(str) {
    try {
        const clean = str.replace(/[^0-9+\-*/().%^]/g, '');
        if (!clean || !/[0-9]/.test(clean)) return null;
        const fn = new Function(`return (${clean})`);
        const res = fn();
        if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
            return res;
        }
    } catch(e) {}
    return null;
}

function renderDuckDuckGoSearch(tab, renderArea) {
    const q = tab.searchQuery || 'Artificial Intelligence';
    const mathResult = evaluateMathExpression(q);

    // Initial Loading Skeleton
    renderArea.innerHTML = `
        <div class="ddg-search-container">
            <div class="ddg-search-header-bar">
                <div class="ddg-brand-badge"><i class="fas fa-shield-alt"></i> DuckDuckGo Privacy Search</div>
                <div class="ddg-tabs-bar">
                    <span class="ddg-tab-item active">All</span>
                    <span class="ddg-tab-item" onclick="navigateSafariTo('youtube')"><i class="fab fa-youtube" style="color:#ff0000;"></i> Videos</span>
                    <span class="ddg-tab-item">News</span>
                    <span class="ddg-tab-item">Images</span>
                </div>
            </div>

            ${mathResult !== null ? `
                <div class="ddg-instant-card">
                    <div class="ddg-instant-header"><i class="fas fa-calculator"></i> Calculation Result</div>
                    <div class="ddg-calc-result">${mathResult}</div>
                    <div class="ddg-instant-source">${q} = ${mathResult}</div>
                </div>
            ` : ''}

            <div id="ddg-instant-slot">
                <div class="ddg-instant-card" style="opacity:0.7;">
                    <div class="ddg-instant-header"><i class="fas fa-spinner fa-spin"></i> Researching live web...</div>
                    <div class="ddg-instant-title">${q}</div>
                    <div class="ddg-instant-abstract">Fetching verified answers, knowledge facts, and related topics from DuckDuckGo and open knowledge engines...</div>
                </div>
            </div>

            <div class="ddg-results-list" id="ddg-results-slot">
                <!-- Web Results List -->
            </div>
        </div>
    `;

    // Fetch DuckDuckGo Open Instant Answer API
    const ddgApiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&pretty=1`;
    const wikiApiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`;

    Promise.allSettled([
        fetch(ddgApiUrl).then(r => r.json()),
        fetch(wikiApiUrl).then(r => r.json())
    ]).then(([ddgRes, wikiRes]) => {
        const instantSlot = document.getElementById('ddg-instant-slot');
        const resultsSlot = document.getElementById('ddg-results-slot');
        if (!resultsSlot) return;

        let abstractText = '';
        let abstractSource = '';
        let abstractUrl = '';
        let relatedTopics = [];

        if (ddgRes.status === 'fulfilled' && ddgRes.value) {
            const data = ddgRes.value;
            if (data.AbstractText) {
                abstractText = data.AbstractText;
                abstractSource = data.AbstractSource || 'DuckDuckGo Instant Answers';
                abstractUrl = data.AbstractURL;
            }
            if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
                data.RelatedTopics.slice(0, 8).forEach(t => {
                    if (t.Text) relatedTopics.push({ text: t.Text, url: t.FirstURL });
                    else if (t.Topics) {
                        t.Topics.slice(0, 3).forEach(st => {
                            if (st.Text) relatedTopics.push({ text: st.Text, url: st.FirstURL });
                        });
                    }
                });
            }
        }

        if (!abstractText && wikiRes.status === 'fulfilled' && wikiRes.value && wikiRes.value.extract) {
            abstractText = wikiRes.value.extract;
            abstractSource = 'Wikipedia Reference';
            abstractUrl = wikiRes.value.content_urls ? wikiRes.value.content_urls.desktop.page : '';
        }

        // Render Instant Knowledge Card
        if (abstractText && instantSlot) {
            instantSlot.innerHTML = `
                <div class="ddg-instant-card">
                    <div class="ddg-instant-header"><i class="fas fa-bolt"></i> Instant Answer • ${abstractSource}</div>
                    <div class="ddg-instant-title">${q}</div>
                    <div class="ddg-instant-abstract">${abstractText}</div>
                    ${abstractUrl ? `<div class="ddg-instant-source"><a href="${abstractUrl}" target="_blank" style="color:#de5833;text-decoration:none;">Read full documentation ↗</a></div>` : ''}
                </div>
            `;
        } else if (instantSlot && mathResult === null) {
            instantSlot.innerHTML = '';
        }

        // Render Related Topics Chips
        let topicsHtml = '';
        if (relatedTopics.length > 0) {
            topicsHtml = `
                <div style="font-size:12px;font-weight:600;color:#aaa;margin-bottom:8px;">Related Topics:</div>
                <div class="ddg-topics-row">
                    ${relatedTopics.map(t => `<div class="ddg-topic-chip" onclick="navigateSafariTo('${t.text.replace(/'/g, "\\'")}')">${t.text.split(' - ')[0]}</div>`).join('')}
                </div>
            `;
        }

        // Render Web Results
        let webItemsHtml = `
            ${topicsHtml}
            <div class="ddg-result-item">
                <div class="ddg-result-cite">https://en.wikipedia.org/wiki/${encodeURIComponent(q.replace(/\s+/g, '_'))}</div>
                <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(q.replace(/\s+/g, '_'))}" target="_blank" class="ddg-result-title">${q} - Comprehensive Overview & Research</a>
                <div class="ddg-result-snippet">In-depth technical breakdown, history, architecture, mathematical foundations, and contemporary breakthroughs regarding ${q}.</div>
            </div>

            <div class="ddg-result-item">
                <div class="ddg-result-cite">https://github.com/topics/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}</div>
                <a href="https://github.com/topics/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}" target="_blank" class="ddg-result-title">Open Source Repositories & Implementations for #${q}</a>
                <div class="ddg-result-snippet">Explore trending open-source algorithms, PyTorch libraries, benchmarks, and production implementations on GitHub.</div>
            </div>

            <div class="ddg-result-item">
                <div class="ddg-result-cite">https://arxiv.org/search/?query=${encodeURIComponent(q)}</div>
                <a href="https://arxiv.org/search/?query=${encodeURIComponent(q)}" target="_blank" class="ddg-result-title">arXiv.org: Research Papers and Preprints on ${q}</a>
                <div class="ddg-result-snippet">State-of-the-art scholarly preprints and peer-reviewed computer science literature on ${q}.</div>
            </div>
        `;

        resultsSlot.innerHTML = webItemsHtml;
    }).catch(() => {
        const resultsSlot = document.getElementById('ddg-results-slot');
        if (resultsSlot) {
            resultsSlot.innerHTML = `
                <div class="ddg-result-item">
                    <div class="ddg-result-cite">https://duckduckgo.com/?q=${encodeURIComponent(q)}</div>
                    <a href="https://duckduckgo.com/?q=${encodeURIComponent(q)}" target="_blank" class="ddg-result-title">Search DuckDuckGo for "${q}"</a>
                    <div class="ddg-result-snippet">Access live privacy-protected search results for ${q}.</div>
                </div>
            `;
        }
    });
}

// --------------------------------------------------------------------------
// YouTube In-Browser Player Engine
// --------------------------------------------------------------------------
function renderYouTubeEngine(tab, renderArea) {
    const activeVideo = youtubeVideoLibrary.find(v => v.id === activeYouTubeVideoId) || youtubeVideoLibrary[0];
    const categories = ['All', 'AI & Neural Networks', 'Machine Learning', 'Robotics & Vision', 'Lofi Music', 'Tech Demos', 'Tech Talks'];

    const filteredVideos = activeYouTubeCategory === 'All' 
        ? youtubeVideoLibrary 
        : youtubeVideoLibrary.filter(v => v.category === activeYouTubeCategory);

    let catChipsHtml = categories.map(cat => `
        <span class="yt-cat-chip ${cat === activeYouTubeCategory ? 'active' : ''}" onclick="selectYouTubeCategory('${cat}')">${cat}</span>
    `).join('');

    let videosGridHtml = filteredVideos.map(v => `
        <div class="yt-video-card" onclick="selectYouTubeVideo('${v.id}')">
            <div class="yt-thumb-wrapper">
                <img src="${v.thumb}" alt="${v.title}" loading="lazy">
                <span class="yt-duration-tag">${v.duration}</span>
            </div>
            <div class="yt-card-info">
                <div class="yt-card-title">${v.title}</div>
                <div class="yt-card-channel">${v.channel}</div>
                <div class="yt-card-stats">${v.views}</div>
            </div>
        </div>
    `).join('');

    renderArea.innerHTML = `
        <div class="yt-engine-container">
            <div class="yt-top-bar">
                <div class="yt-logo"><i class="fab fa-youtube"></i> YouTube</div>
                <div class="yt-search-form">
                    <i class="fas fa-search" style="color:#888;margin-right:8px;font-size:12px;"></i>
                    <input type="text" id="yt-search-input" placeholder="Search YouTube or paste video URL..." onkeydown="handleYouTubeSearchKey(event)">
                </div>
                <button type="button" class="app-pill-btn" onclick="openSafariStartPage()" style="margin-left:auto;"><i class="fas fa-th"></i> Favorites</button>
            </div>

            <div class="yt-categories-bar">
                ${catChipsHtml}
            </div>

            <!-- Featured Live Player -->
            <div class="yt-main-player-box">
                <div class="yt-iframe-responsive">
                    <iframe 
                        src="https://www.youtube-nocookie.com/embed/${activeVideo.id}?autoplay=1&rel=0&modestbranding=1" 
                        title="${activeVideo.title}" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen>
                    </iframe>
                </div>
                <div class="yt-player-details">
                    <div class="yt-active-title">${activeVideo.title}</div>
                    <div class="yt-active-meta">
                        <div class="yt-channel-badge"><i class="fas fa-user-circle fa-lg" style="color:#ff0000;"></i> ${activeVideo.channel}</div>
                        <div>${activeVideo.views}</div>
                    </div>
                </div>
            </div>

            <div class="yt-grid-title">Suggested & Trending Videos</div>
            <div class="yt-videos-grid">
                ${videosGridHtml}
            </div>
        </div>
    `;
}

function selectYouTubeVideo(videoId) {
    activeYouTubeVideoId = videoId;
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) {
        currentTab.type = 'youtube';
        currentTab.url = `https://www.youtube.com/watch?v=${videoId}`;
        const found = youtubeVideoLibrary.find(v => v.id === videoId);
        if (found) currentTab.title = found.title;
        switchSafariTab(currentTab.id);
    }
}

function selectYouTubeCategory(cat) {
    activeYouTubeCategory = cat;
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) switchSafariTab(currentTab.id);
}

function handleYouTubeSearchKey(e) {
    if (e.key === 'Enter') {
        const input = document.getElementById('yt-search-input');
        const q = (input.value || '').trim();
        if (!q) return;

        // Check if full YouTube URL pasted
        if (q.includes('youtube.com/watch?v=') || q.includes('youtu.be/')) {
            const match = q.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            if (match && match[1]) {
                selectYouTubeVideo(match[1]);
                return;
            }
        }

        // Filter or navigate search
        navigateSafariTo(`search:${q}`);
    }
}

// --------------------------------------------------------------------------
// Web Page Viewport Switcher
// --------------------------------------------------------------------------
function renderSafariWebPage(tab) {
    const titleEl = document.getElementById('safari-current-page-title');
    const renderArea = document.getElementById('safari-page-render-area');
    if (!renderArea) return;

    if (titleEl) titleEl.textContent = tab.title;

    if (tab.type === 'youtube') {
        renderYouTubeEngine(tab, renderArea);
    } else if (tab.type === 'ddg_search') {
        renderDuckDuckGoSearch(tab, renderArea);
    } else if (tab.shortcutKey && safariShortcuts[tab.shortcutKey]) {
        const sc = safariShortcuts[tab.shortcutKey];
        let itemsHtml = '';
        (sc.pinnedRepos || []).forEach(repo => {
            let itemIcon = `<i class="${sc.icon}"></i>`;
            if (sc.iconSvg) {
                itemIcon = sc.iconSvg.replace('width="28" height="28"', 'width="16" height="16"');
            }
            itemsHtml += `
                <div class="gh-repo-card" onclick="window.open('${sc.url}', '_blank')">
                    <div class="gh-repo-title" style="display:flex;align-items:center;gap:6px;">${itemIcon} ${repo.name} <span class="gh-badge">${repo.stars}</span></div>
                    <p>${repo.desc}</p>
                    <div class="gh-meta"><span class="lang-dot python"></span> ${repo.lang} <span style="margin-left:auto;color:#007aff;">Open ↗</span></div>
                </div>
            `;
        });

        const heroIcon = sc.iconSvg || `<i class="${sc.icon}"></i>`;

        renderArea.innerHTML = `
            <div class="platform-hero-view">
                <div class="fav-icon-box bg-fav-${tab.shortcutKey}" style="width:72px;height:72px;font-size:32px;margin:0 auto 12px auto;display:flex;align-items:center;justify-content:center;">
                    ${heroIcon}
                </div>
                <h2>${sc.title}</h2>
                <p>${sc.desc}</p>
                <div style="display:flex;justify-content:center;gap:12px;margin-bottom:28px;">
                    <a href="${sc.url}" target="_blank" class="app-pill-btn primary"><i class="fas fa-external-link-alt"></i> Visit Live Platform</a>
                    <button type="button" class="app-pill-btn" onclick="openSafariStartPage()"><i class="fas fa-th"></i> All Favorites</button>
                </div>
                <div class="github-repos-grid" style="text-align:left;">
                    ${itemsHtml}
                </div>
            </div>
        `;
    } else {
        renderArea.innerHTML = `
            <div style="text-align:center;padding:40px 20px;">
                <i class="fas fa-globe fa-4x" style="color:#007aff;margin-bottom:16px;"></i>
                <h2>${tab.title}</h2>
                <p style="color:#aaa;font-size:13px;max-width:480px;margin:0 auto 20px auto;">You are visiting <strong>${tab.url}</strong> in Safari for macOS.</p>
                <div style="display:flex;justify-content:center;gap:12px;">
                    <a href="${tab.url}" target="_blank" class="app-pill-btn primary" style="font-size:13px;padding:8px 18px;"><i class="fas fa-external-link-alt"></i> Open in Live Browser Tab</a>
                    <button type="button" class="app-pill-btn" onclick="openSafariStartPage()"><i class="fas fa-th"></i> Start Page</button>
                </div>
            </div>
        `;
    }
}

function safariHistoryBack() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab && currentTab.historyIndex > 0) {
        currentTab.historyIndex--;
        const dest = currentTab.history[currentTab.historyIndex];
        loadSafariDestination(currentTab, dest);
        switchSafariTab(currentTab.id);
    }
}

function safariHistoryForward() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab && currentTab.historyIndex < currentTab.history.length - 1) {
        currentTab.historyIndex++;
        const dest = currentTab.history[currentTab.historyIndex];
        loadSafariDestination(currentTab, dest);
        switchSafariTab(currentTab.id);
    }
}

function safariReload() {
    const icon = document.querySelector('.safari-reload-icon');
    if (icon) {
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => { icon.style.transform = ''; }, 400);
    }
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab) switchSafariTab(currentTab.id);
}

function openCurrentSafariLink() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    if (currentTab && currentTab.url) {
        window.open(currentTab.url, '_blank');
    } else {
        window.open('https://github.com/muditagrawal-alt', '_blank');
    }
}

function copyCurrentSafariUrl() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    const url = currentTab && currentTab.url ? currentTab.url : 'https://github.com/muditagrawal-alt';
    navigator.clipboard.writeText(url).then(() => {
        alert("Link copied to clipboard: " + url);
    }).catch(() => {
        prompt("Copy page link:", url);
    });
}

function shareCurrentSafariUrl() {
    const currentTab = safariTabs.find(t => t.id === activeSafariTabId);
    const url = currentTab && currentTab.url ? currentTab.url : 'https://github.com/muditagrawal-alt';
    if (navigator.share) {
        navigator.share({ title: currentTab ? currentTab.title : 'Mudit Agrawal', url: url });
    } else {
        copyCurrentSafariUrl();
    }
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

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    renderSafariTabs();
    switchSafariTab(activeSafariTabId);
    updateDockRunningIndicators();
});

// Run once immediately
renderSafariTabs();
updateDockRunningIndicators();
