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

function bringToFront(windowId) {
    highestZIndex++;
    document.getElementById(windowId).style.zIndex = highestZIndex;
}

function openWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.remove('hidden');
        win.classList.remove('minimized');
        bringToFront(windowId);
        
        // Update sidebar active states if needed
        const sidebars = win.querySelectorAll('.sidebar-item');
        sidebars.forEach(item => {
            if(item.getAttribute('onclick').includes(windowId)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
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
    }
}

function minimizeWindow(windowId) {
    const win = document.getElementById(windowId);
    if (win) {
        win.classList.add('minimized');
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
    
    // Don't drag if clicking window controls
    if(e.target.classList.contains('control')) return;
    
    e.preventDefault();
    bringToFront(windowId);
    
    const win = document.getElementById(windowId);
    
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

// // Menu Bar Dropdown Logic
const windowNames = {
    'about-window': 'About Me',
    'experience-window': 'Experience',
    'education-window': 'Education',
    'projects-window': 'Projects',
    'skills-window': 'Skills',
    'contact-window': 'Contact',
    'resume-window': 'Resume PDF',
    'terminal-window': 'Terminal'
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

// Terminal Logic
function handleTerminalInput(e) {
    if (e.key === 'Enter') {
        const inputField = document.getElementById('terminal-input');
        const cmd = inputField.value.trim().toLowerCase();
        const outputDiv = document.getElementById('terminal-output');
        
        // Echo command
        outputDiv.innerHTML += `<div><span style="color:#43e97b">muditagrawal@macbook</span> <span style="color:#4facfe">~ %</span> ${inputField.value}</div>`;
        
        inputField.value = '';
        
        let response = '';
        switch(cmd) {
            case 'help':
                response = 'Available commands: about me, experience, education, projects, skills, contact, clear';
                break;
            case 'about me':
                response = 'Mudit Agrawal. Computer Science (AI/ML) Undergraduate at IILM University.';
                break;
            case 'experience':
                response = '- Machine Learning Intern @ Zee Tech and Innovation Centre<br>- Summer Intern @ WESEE, Indian Navy';
                break;
            case 'education':
                response = '- B.Tech in Computer Science (AI/ML), IILM University (2023 - 2027)<br>- Class 12, Navy Children School, New Delhi (2023)<br>- Class 10, Navy Children School, Mumbai (2021)';
                break;
            case 'projects':
                response = '- OmniDoc (RAG LLM System)<br>- Sliver.Ai (Smart Video Clipping)<br>- S.W.O.R.D (Surveillance Deep Learning)<br>- Deepfake Detector<br>- Helix-Compiler<br>- Multiva.Ai<br>- Inflx<br>- Artifex';
                break;
            case 'skills':
                response = 'Python, C, Java, HTML, CSS, Tailwind CSS, PyTorch, TensorFlow, OpenCV, YOLO, Whisper, Mistral 7B.';
                break;
            case 'contact':
                response = 'Email: muditagrawal03@gmail.com<br>Phone: +91-7289887349<br>LinkedIn: /in/mudit-agrawal-167610318';
                break;
            case 'clear':
                outputDiv.innerHTML = '';
                return;
            case '':
                break;
            default:
                response = `zsh: command not found: ${cmd}`;
        }
        
        if (response) {
            outputDiv.innerHTML += `<div style="margin-bottom: 10px;">${response}</div>`;
        }
        
        // Scroll to bottom
        const contentDiv = document.getElementById('terminal-content');
        contentDiv.scrollTop = contentDiv.scrollHeight;
    }
}
