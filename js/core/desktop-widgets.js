/* ==========================================================================
   macOS Desktop Widgets Controller — Sonoma / Sequoia Floating Desktop Widgets
   ========================================================================== */

(function() {
    function initDesktopWidgets() {
        const desktop = document.getElementById('desktop');
        if (!desktop || document.getElementById('desktop-widgets-column')) return;

        const col = document.createElement('div');
        col.id = 'desktop-widgets-column';
        col.className = 'desktop-widgets-column';

        col.innerHTML = `
            <!-- 1. Analog & Digital Clock Widget -->
            <div class="mac-widget-card" onclick="toggleNotificationCenter()" style="cursor:pointer;" title="Click to view Notification Centre">
                <div class="widget-clock-wrap">
                    <div class="analog-clock" id="widget-analog-clock">
                        <div class="clock-hand hour" id="widget-hour-hand"></div>
                        <div class="clock-hand minute" id="widget-minute-hand"></div>
                        <div class="clock-hand second" id="widget-second-hand"></div>
                        <div class="clock-center-dot"></div>
                    </div>
                    <div class="clock-meta">
                        <span class="clock-city">New Delhi</span>
                        <span class="clock-digital-time" id="widget-digital-time">--:--</span>
                        <span class="clock-date-tag" id="widget-date-tag">Today</span>
                    </div>
                </div>
            </div>

            <!-- 2. Live Weather Widget -->
            <div class="mac-widget-card">
                <div class="widget-weather-header">
                    <div>
                        <div class="weather-city-name">New Delhi</div>
                        <div class="weather-temp-main" id="widget-weather-temp">26°</div>
                    </div>
                    <i class="fas fa-sun weather-icon-sun" id="widget-weather-icon"></i>
                </div>
                <div class="weather-sub">
                    <span>Sunny</span>
                    <span>•</span>
                    <span>H: 29° L: 19°</span>
                </div>
            </div>

            <!-- 3. Apple M3 Max System Activity Widget -->
            <div class="mac-widget-card" onclick="openWindow('terminal-window')" style="cursor:pointer;" title="Click to open Terminal">
                <div class="widget-system-header">
                    <div class="system-chip-badge">
                        <i class="fab fa-apple"></i> M3 Max
                    </div>
                    <span style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.7);">Activity Monitor</span>
                </div>
                <div class="widget-bar-row">
                    <div class="widget-bar-label">
                        <span>CPU Usage</span>
                        <span id="widget-cpu-val">28%</span>
                    </div>
                    <div class="widget-meter-track">
                        <div class="widget-meter-fill" id="widget-cpu-fill" style="width: 28%; background: #007aff;"></div>
                    </div>
                </div>
                <div class="widget-bar-row">
                    <div class="widget-bar-label">
                        <span>Unified Memory</span>
                        <span>14.8 / 36 GB</span>
                    </div>
                    <div class="widget-meter-track">
                        <div class="widget-meter-fill" style="width: 41%; background: #34c759;"></div>
                    </div>
                </div>
            </div>

            <!-- 4. Mudit's Welcome Sticky Note -->
            <div class="mac-widget-card mac-sticky-note">
                <div class="sticky-header">
                    <i class="fas fa-thumbtack"></i> Quick Note
                </div>
                <div class="sticky-text">
                    Welcome to my macOS portfolio! Open <strong>Finder</strong> for projects, launch <strong>Apple Music</strong> for live radio, or ask <strong>Iris</strong> with voice.
                </div>
            </div>
        `;

        desktop.appendChild(col);

        startClockTicks();
        startSystemSimulation();
    }

    function startClockTicks() {
        function updateClock() {
            const now = new Date();
            const sec = now.getSeconds();
            const min = now.getMinutes();
            const hr = now.getHours();

            const secDeg = (sec / 60) * 360;
            const minDeg = ((min + sec / 60) / 60) * 360;
            const hrDeg = ((hr % 12 + min / 60) / 12) * 360;

            const secHand = document.getElementById('widget-second-hand');
            const minHand = document.getElementById('widget-minute-hand');
            const hrHand = document.getElementById('widget-hour-hand');
            const digitalEl = document.getElementById('widget-digital-time');
            const dateEl = document.getElementById('widget-date-tag');

            if (secHand) secHand.style.transform = `rotate(${secDeg}deg)`;
            if (minHand) minHand.style.transform = `rotate(${minDeg}deg)`;
            if (hrHand) hrHand.style.transform = `rotate(${hrDeg}deg)`;

            if (digitalEl) {
                const formattedHr = (hr % 12 || 12).toString();
                const formattedMin = min < 10 ? '0' + min : min;
                const ampm = hr >= 12 ? 'PM' : 'AM';
                digitalEl.textContent = `${formattedHr}:${formattedMin} ${ampm}`;
            }

            if (dateEl) {
                dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            }
        }

        setInterval(updateClock, 1000);
        updateClock();
    }

    function startSystemSimulation() {
        let step = 0;
        setInterval(() => {
            step += 0.25;
            const simulatedCpu = Math.round(24 + Math.sin(step) * 14 + Math.cos(step * 0.7) * 8);
            const clamped = Math.max(12, Math.min(88, simulatedCpu));

            const cpuVal = document.getElementById('widget-cpu-val');
            const cpuFill = document.getElementById('widget-cpu-fill');

            if (cpuVal) cpuVal.textContent = clamped + '%';
            if (cpuFill) cpuFill.style.width = clamped + '%';
        }, 2000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initDesktopWidgets();
    });

    window.initDesktopWidgets = initDesktopWidgets;
})();
