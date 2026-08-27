/* ==========================================================================
   System Status: Battery Management, Wi-Fi Connectivity & Status Tooltips
   ========================================================================== */

function setMenuIconTooltip(icon, text) {
    if (!icon) return;
    icon.setAttribute('data-tooltip', text);
    icon.title = text;
}

function updateWifiStatus() {
    const wifiIcon = document.getElementById('wifi-icon');
    if (!wifiIcon) return;

    const isOnline = typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
    if (isOnline) {
        wifiIcon.className = 'fas fa-wifi menu-icon';
        wifiIcon.style.color = '';
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        let details = 'Wi-Fi: Connected';
        if (conn && conn.effectiveType) {
            details += ` (${conn.effectiveType.toUpperCase()})`;
        }
        setMenuIconTooltip(wifiIcon, details);
    } else {
        wifiIcon.className = 'fas fa-exclamation-triangle menu-icon';
        wifiIcon.style.color = '#ff9500';
        setMenuIconTooltip(wifiIcon, 'Wi-Fi: Disconnected (Offline)');
    }
}

window.addEventListener('online', updateWifiStatus);
window.addEventListener('offline', updateWifiStatus);

function applyBatteryStatus(level, charging) {
    const batteryIcon = document.getElementById('battery-icon');
    if (!batteryIcon) return;

    let iconClass = 'fas fa-battery-full menu-icon';
    if (charging) {
        iconClass = 'fas fa-bolt menu-icon';
        batteryIcon.style.color = '#34c759';
    } else {
        batteryIcon.style.color = '';
        if (level <= 15) {
            iconClass = 'fas fa-battery-quarter menu-icon';
            batteryIcon.style.color = '#ff3b30';
        } else if (level <= 40) {
            iconClass = 'fas fa-battery-half menu-icon';
        } else if (level <= 75) {
            iconClass = 'fas fa-battery-three-quarters menu-icon';
        } else {
            iconClass = 'fas fa-battery-full menu-icon';
        }
    }

    batteryIcon.className = iconClass;
    const statusText = `Battery: ${level}%${charging ? ' (Charging)' : ''}`;
    setMenuIconTooltip(batteryIcon, statusText);
    window.SYSTEM_BATTERY_STATUS = statusText;
    window.SYSTEM_BATTERY_LEVEL = level;
    window.SYSTEM_BATTERY_CHARGING = Boolean(charging);
    // Lets other modules (currently: the lock screen) react without polling
    // or importing system-status.js's internals directly.
    window.dispatchEvent(new CustomEvent('battery-status-changed', { detail: { level, charging: Boolean(charging) } }));
}

/* Fallback reading for browsers without navigator.getBattery (Safari, Firefox).
   Previously lived in a separate 3-line battery-status.js file. */
const BATTERY_FALLBACK = { level: 82, charging: false };

function syncSystemBatteryVariables() {
    if (typeof window.SYSTEM_BATTERY_LEVEL === 'number') {
        applyBatteryStatus(window.SYSTEM_BATTERY_LEVEL, Boolean(window.SYSTEM_BATTERY_CHARGING));
        return true;
    }
    return false;
}

function loadSystemBatteryFeed() {
    if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
            function update() {
                const level = Math.round(battery.level * 100);
                applyBatteryStatus(level, battery.charging);
            }
            update();
            battery.addEventListener('levelchange', update);
            battery.addEventListener('chargingchange', update);
        }).catch(() => {
            if (!syncSystemBatteryVariables()) {
                applyBatteryStatus(BATTERY_FALLBACK.level, BATTERY_FALLBACK.charging);
            }
        });
    } else {
        if (!syncSystemBatteryVariables()) {
            applyBatteryStatus(BATTERY_FALLBACK.level, BATTERY_FALLBACK.charging);
        }
    }
}
