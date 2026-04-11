// =================================
// CLOCK SYSTEM - Main Class
// =================================
class ClockSystem {
    constructor(eventBus, windowManager) {
        this.eventBus = eventBus;
        this.windowManager = windowManager;
        this.settings = {
            format24: false,
            showSeconds: true,
            timeZone: 'local',
            theme: 'default'
        };
        this.timers = [];
        this.alarms = [];
        this.activeTimers = new Map();
        this.activeAlarms = new Map();
        this.alarmSoundInterval = null;
        this.clockWindow = null;
        this.clockWindowInterval = null;
        this.tickInterval = null;
        this.calendarEvents = {};
        this.currentEventModal = null;

        // Stopwatch state (persists across window open/close within session)
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;
        this.stopwatchRunning = false;
        this.lapTimes = [];

        this.loadSettings();
        this.setupEventHandlers();
        this.startMainClock();
    }

    // =================================
    // EVENT HANDLERS
    // =================================

    setupEventHandlers() {
        this.eventBus.on('clock.click', () => {
            this.openClockWindow();
        });

        this.eventBus.on('clock.toggle-format', () => {
            this.toggleTimeFormat();
        });

        // Single listener for window close — registered once in constructor
        this.eventBus.on('window.closed', (data) => {
            if (data.id === 'clock-system') {
                this.clockWindow = null;

                if (this.clockWindowInterval) {
                    clearInterval(this.clockWindowInterval);
                    this.clockWindowInterval = null;
                }

                // Clean up stopwatch interval (state preserved, just stop ticking)
                if (this.stopwatchInterval) {
                    clearInterval(this.stopwatchInterval);
                    this.stopwatchInterval = null;
                    this.stopwatchRunning = false;
                }

                // Clean up event modal if open
                if (this.currentEventModal) {
                    this.currentEventModal.remove();
                    this.currentEventModal = null;
                }

                // Clean up alarm overlay/sound
                this.stopLoopingAlarm();
                if (this._alarmAutoDismiss) {
                    clearTimeout(this._alarmAutoDismiss);
                    this._alarmAutoDismiss = null;
                }
            }
        });
    }

    // =================================
    // TASKBAR CLOCK
    // =================================

    startMainClock() {
        this.updateTaskbarClock();
        this.tickInterval = setInterval(() => {
            this.updateTaskbarClock();
            this.checkAlarms();
            this.updateActiveTimers();
        }, 1000);
    }

    updateTaskbarClock() {
        const clockElement = document.getElementById('clock');
        if (clockElement) {
            const now = new Date();
            clockElement.textContent = this.formatTime(now, this.settings.format24, this.settings.showSeconds);
        }
    }

    formatTime(date, format24 = false, showSeconds = true) {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: !format24
        };
        if (showSeconds) {
            options.second = '2-digit';
        }
        return date.toLocaleTimeString([], options);
    }

    toggleTimeFormat() {
        this.settings.format24 = !this.settings.format24;
        this.saveSettings();
        this.updateClockWindow();
    }

    // =================================
    // CLOCK WINDOW
    // =================================

    openClockWindow() {
        if (this.clockWindow) {
            this.windowManager.focusWindow('clock-system');
            return;
        }

        const content = this.createClockWindowContent();
        this.clockWindow = this.windowManager.createWindow(
            'clock-system',
            `${ElxaIcons.render('clock', 'ui')} ElxaOS Time Center`,
            content,
            { width: '600px', height: '500px', x: '200px', y: '100px' }
        );

        this.setupClockWindowEvents();
        this.updateClockWindow();

        this.clockWindowInterval = setInterval(() => {
            this.updateClockWindow();
        }, 1000);
    }

    createClockWindowContent() {
        return `
            <div class="clock-system">
                <div class="clock-tabs">
                    <div class="clock-tab active" data-tab="today">${ElxaIcons.renderAction('clock')} Today</div>
                    <div class="clock-tab" data-tab="stopwatch">${ElxaIcons.renderAction('timer')} Stopwatch</div>
                    <div class="clock-tab" data-tab="timer">${ElxaIcons.renderAction('timer')} Timers</div>
                    <div class="clock-tab" data-tab="alarm">${ElxaIcons.renderAction('alarm-icon')} Alarms</div>
                    <div class="clock-tab" data-tab="calendar">${ElxaIcons.renderAction('calendar')} Calendar</div>
                    <div class="clock-tab" data-tab="world">${ElxaIcons.renderAction('globe')} World</div>
                </div>

                <div class="clock-content">
                    <!-- Today Dashboard Tab -->
                    <div class="clock-panel active" data-panel="today">
                        <div class="today-clocks-row">
                            <div class="main-clock-display">
                                <div class="digital-clock" id="mainDigitalClock">00:00:00</div>
                                <div class="date-display" id="mainDateDisplay">Monday, January 1, 2024</div>
                            </div>
                            <div class="analog-clock-container" id="analogClockContainer">
                                <svg id="analogClock" viewBox="0 0 200 200" class="analog-clock-svg"></svg>
                            </div>
                        </div>

                        <div class="countdown-spotlight" id="countdownSpotlight">
                            <div class="countdown-label" id="countdownLabel">Nothing coming up</div>
                            <div class="countdown-value" id="countdownValue"></div>
                        </div>

                        <div class="quick-glances">
                            <div class="glance-item" id="glanceAlarm">
                                <div class="glance-icon">${ElxaIcons.renderAction('alarm-icon')}</div>
                                <div class="glance-text">No alarms set</div>
                            </div>
                            <div class="glance-item" id="glanceTimers">
                                <div class="glance-icon">${ElxaIcons.renderAction('timer')}</div>
                                <div class="glance-text">No timers</div>
                            </div>
                            <div class="glance-item" id="glanceEvents">
                                <div class="glance-icon">${ElxaIcons.renderAction('calendar')}</div>
                                <div class="glance-text">Nothing scheduled</div>
                            </div>
                        </div>

                        <div class="clock-controls">
                            <label class="toggle-switch-label">
                                <span>24H</span>
                                <input type="checkbox" id="toggleFormatSwitch" class="toggle-switch-input">
                                <span class="toggle-switch-slider"></span>
                            </label>
                            <label class="toggle-switch-label">
                                <span>Seconds</span>
                                <input type="checkbox" id="toggleSecondsSwitch" class="toggle-switch-input" checked>
                                <span class="toggle-switch-slider"></span>
                            </label>
                        </div>
                    </div>

                    <!-- Stopwatch Tab -->
                    <div class="clock-panel" data-panel="stopwatch">
                        <div class="stopwatch-panel">
                            <div class="stopwatch-display" id="stopwatchDisplay">00:00.00</div>
                            <div class="stopwatch-controls">
                                <button class="stopwatch-btn sw-start" id="startStopBtn">${ElxaIcons.renderAction('play')} Start</button>
                                <button class="stopwatch-btn sw-reset" id="resetBtn">${ElxaIcons.renderAction('refresh')} Reset</button>
                                <button class="stopwatch-btn sw-lap" id="lapBtn" disabled>${ElxaIcons.renderAction('flag')} Lap</button>
                            </div>
                            <div class="lap-times" id="lapTimes"></div>
                        </div>
                    </div>

                    <!-- Timer Tab -->
                    <div class="clock-panel" data-panel="timer">
                        <div class="timer-presets">
                            <button class="timer-preset-btn" onclick="elxaOS.clockSystem.createQuickTimer(60)">1 min</button>
                            <button class="timer-preset-btn" onclick="elxaOS.clockSystem.createQuickTimer(120)">2 min</button>
                            <button class="timer-preset-btn" onclick="elxaOS.clockSystem.createQuickTimer(300)">5 min</button>
                            <button class="timer-preset-btn" onclick="elxaOS.clockSystem.createQuickTimer(600)">10 min</button>
                            <button class="timer-preset-btn" onclick="elxaOS.clockSystem.createQuickTimer(900)">15 min</button>
                            <button class="timer-preset-btn" onclick="elxaOS.clockSystem.createQuickTimer(1800)">30 min</button>
                        </div>

                        <div class="timer-creator">
                            <h3>Custom Timer</h3>
                            <div class="timer-inputs">
                                <input type="number" id="timerHours" min="0" max="23" value="0" placeholder="H">
                                <span>:</span>
                                <input type="number" id="timerMinutes" min="0" max="59" value="5" placeholder="M">
                                <span>:</span>
                                <input type="number" id="timerSeconds" min="0" max="59" value="0" placeholder="S">
                            </div>
                            <input type="text" id="timerName" placeholder="Timer name (e.g., 'Homework Break')" maxlength="30">
                            <button class="create-timer-btn" id="createTimerBtn">${ElxaIcons.renderAction('play')} Start Timer!</button>
                        </div>

                        <div class="timer-ring-grid" id="timerRingGrid"></div>
                    </div>

                    <!-- Alarm Tab -->
                    <div class="clock-panel" data-panel="alarm">
                        <div class="alarm-creator">
                            <h3>Create New Alarm</h3>
                            <div class="alarm-inputs">
                                <input type="time" id="alarmTime" value="07:00">
                                <input type="text" id="alarmName" placeholder="Alarm name (e.g., 'Wake up!')" maxlength="30">
                                <select id="alarmDays">
                                    <option value="once">Once</option>
                                    <option value="daily">Every day</option>
                                    <option value="weekdays">Weekdays only</option>
                                    <option value="weekends">Weekends only</option>
                                </select>
                            </div>
                            <button class="create-alarm-btn" id="createAlarmBtn">${ElxaIcons.renderAction('alarm-icon')} Set Alarm!</button>
                        </div>

                        <div class="alarm-list-container">
                            <h3>Your Alarms</h3>
                            <div class="alarm-list" id="alarmList"></div>
                        </div>
                    </div>

                    <!-- Calendar Tab -->
                    <div class="clock-panel" data-panel="calendar">
                        <div class="upcoming-events" id="upcomingEvents">
                            <h3>${ElxaIcons.renderAction('calendar')} Coming Up</h3>
                            <div class="upcoming-events-list" id="upcomingEventsList"></div>
                        </div>

                        <div class="calendar-header">
                            <button class="calendar-nav" id="prevMonth">${ElxaIcons.renderAction('chevron-left')}</button>
                            <div class="calendar-title" id="calendarTitle">January 2024</div>
                            <button class="calendar-nav" id="nextMonth">${ElxaIcons.renderAction('chevron-right')}</button>
                        </div>

                        <div class="calendar-grid" id="calendarGrid"></div>

                        <div class="special-dates">
                            <h3>${ElxaIcons.renderAction('star')} Special Dates</h3>
                            <div class="special-date-list" id="specialDates"></div>
                            <button class="add-special-date-btn" id="addSpecialDateBtn">${ElxaIcons.renderAction('plus')} Add Special Date</button>
                            <div class="special-date-form hidden" id="specialDateForm">
                                <input type="text" id="specialDateName" placeholder="Name (e.g., Mom's Birthday)" maxlength="30">
                                <div class="special-date-form-row">
                                    <select id="specialDateMonth">
                                        <option value="1">January</option>
                                        <option value="2">February</option>
                                        <option value="3">March</option>
                                        <option value="4">April</option>
                                        <option value="5">May</option>
                                        <option value="6">June</option>
                                        <option value="7">July</option>
                                        <option value="8">August</option>
                                        <option value="9">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </select>
                                    <input type="number" id="specialDateDay" min="1" max="31" placeholder="Day">
                                </div>
                                <div class="special-date-form-buttons">
                                    <button class="event-btn" id="specialDateCancel">Cancel</button>
                                    <button class="event-btn primary" id="specialDateSave">${ElxaIcons.renderAction('check')} Save</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- World Clock Tab -->
                    <div class="clock-panel" data-panel="world">
                        <div class="world-clocks-grid" id="worldClocksGrid"></div>

                        <div class="add-timezone">
                            <select id="timezoneSelect">
                                <optgroup label="Americas">
                                    <option value="America/New_York">New York</option>
                                    <option value="America/Chicago">Chicago</option>
                                    <option value="America/Denver">Denver</option>
                                    <option value="America/Los_Angeles">Los Angeles</option>
                                    <option value="America/Mexico_City">Mexico City</option>
                                    <option value="America/Sao_Paulo">São Paulo</option>
                                    <option value="Pacific/Honolulu">Honolulu</option>
                                </optgroup>
                                <optgroup label="Europe">
                                    <option value="Europe/London">London</option>
                                    <option value="Europe/Paris">Paris</option>
                                    <option value="Europe/Berlin">Berlin</option>
                                    <option value="Europe/Moscow">Moscow</option>
                                </optgroup>
                                <optgroup label="Asia / Pacific">
                                    <option value="Asia/Dubai">Dubai</option>
                                    <option value="Asia/Kolkata">Mumbai</option>
                                    <option value="Asia/Singapore">Singapore</option>
                                    <option value="Asia/Shanghai">Shanghai</option>
                                    <option value="Asia/Seoul">Seoul</option>
                                    <option value="Asia/Tokyo">Tokyo</option>
                                    <option value="Australia/Sydney">Sydney</option>
                                </optgroup>
                                <optgroup label="Africa / Middle East">
                                    <option value="Africa/Cairo">Cairo</option>
                                    <option value="Africa/Johannesburg">Johannesburg</option>
                                </optgroup>
                                <optgroup label="Fictional">
                                    <option value="SNAKESIA">Snakesia</option>
                                </optgroup>
                            </select>
                            <button class="add-timezone-btn" id="addTimezoneBtn">${ElxaIcons.renderAction('plus')} Add City</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // =================================
    // WINDOW EVENT SETUP
    // =================================

    setupClockWindowEvents() {
        const tabs = this.clockWindow.querySelectorAll('.clock-tab');
        const panels = this.clockWindow.querySelectorAll('.clock-panel');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));

                tab.classList.add('active');
                this.clockWindow.querySelector(`[data-panel="${targetPanel}"]`).classList.add('active');

                this.initializePanel(targetPanel);
            });
        });

        this.setupMainClockEvents();
        this.setupTimerEvents();
        this.setupAlarmEvents();
        this.setupCalendarEvents();
        this.setupWorldClockEvents();
    }

    setupMainClockEvents() {
        const toggleFormatSwitch = this.clockWindow.querySelector('#toggleFormatSwitch');
        const toggleSecondsSwitch = this.clockWindow.querySelector('#toggleSecondsSwitch');

        // Sync switch states with current settings
        toggleFormatSwitch.checked = this.settings.format24;
        toggleSecondsSwitch.checked = this.settings.showSeconds;

        toggleFormatSwitch.addEventListener('change', () => {
            this.settings.format24 = toggleFormatSwitch.checked;
            this.saveSettings();
        });

        toggleSecondsSwitch.addEventListener('change', () => {
            this.settings.showSeconds = toggleSecondsSwitch.checked;
            this.saveSettings();
        });

        this.setupStopwatchEvents();
        this.renderAnalogClock();
        this.updateDashboard();
    }

    // =================================
    // STOPWATCH
    // =================================

    setupStopwatchEvents() {
        const startStopBtn = this.clockWindow.querySelector('#startStopBtn');
        const resetBtn = this.clockWindow.querySelector('#resetBtn');
        const lapBtn = this.clockWindow.querySelector('#lapBtn');

        startStopBtn.addEventListener('click', () => {
            if (this.stopwatchRunning) {
                this.stopStopwatch();
            } else {
                this.startStopwatch();
            }
        });

        resetBtn.addEventListener('click', () => {
            this.resetStopwatch();
        });

        lapBtn.addEventListener('click', () => {
            this.recordLap();
        });

        // Restore stopwatch display if it had a value from before
        if (this.stopwatchTime > 0) {
            this.updateStopwatchDisplay();
            this.updateLapDisplay();
        }
    }

    startStopwatch() {
        this.stopwatchRunning = true;
        this.playSound('start');
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime += 10;
            this.updateStopwatchDisplay();
        }, 10);

        const btn = this.clockWindow?.querySelector('#startStopBtn');
        if (btn) {
            btn.innerHTML = `${ElxaIcons.renderAction('stop')} Stop`;
            btn.classList.remove('sw-start');
            btn.classList.add('sw-stop');
        }
        const lapBtn = this.clockWindow?.querySelector('#lapBtn');
        if (lapBtn) lapBtn.disabled = false;

        // Add running pulse
        const display = this.clockWindow?.querySelector('.stopwatch-display');
        if (display) display.classList.add('running');
    }

    stopStopwatch() {
        this.stopwatchRunning = false;
        this.playSound('stop');
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
        }

        const btn = this.clockWindow?.querySelector('#startStopBtn');
        if (btn) {
            btn.innerHTML = `${ElxaIcons.renderAction('play')} Start`;
            btn.classList.remove('sw-stop');
            btn.classList.add('sw-start');
        }
        const lapBtn = this.clockWindow?.querySelector('#lapBtn');
        if (lapBtn) lapBtn.disabled = true;

        // Remove running pulse
        const display = this.clockWindow?.querySelector('.stopwatch-display');
        if (display) display.classList.remove('running');
    }

    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateStopwatchDisplay();
        this.updateLapDisplay();
    }

    recordLap() {
        if (this.stopwatchRunning) {
            this.lapTimes.push(this.stopwatchTime);
            this.updateLapDisplay();
        }
    }

    updateStopwatchDisplay() {
        const display = this.clockWindow?.querySelector('#stopwatchDisplay');
        if (!display) return;

        const minutes = Math.floor(this.stopwatchTime / 60000);
        const seconds = Math.floor((this.stopwatchTime % 60000) / 1000);
        const centiseconds = Math.floor((this.stopwatchTime % 1000) / 10);

        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    updateLapDisplay() {
        const lapContainer = this.clockWindow?.querySelector('#lapTimes');
        if (!lapContainer) return;

        if (this.lapTimes.length === 0) {
            lapContainer.innerHTML = '';
            return;
        }

        const formatMs = (ms) => {
            const m = Math.floor(ms / 60000);
            const s = Math.floor((ms % 60000) / 1000);
            const cs = Math.floor((ms % 1000) / 10);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
        };

        let html = '<table class="lap-table"><thead><tr><th>Lap</th><th>Lap Time</th><th>Total</th><th></th></tr></thead><tbody>';
        this.lapTimes.forEach((totalTime, index) => {
            const prevTotal = index > 0 ? this.lapTimes[index - 1] : 0;
            const lapTime = totalTime - prevTotal;
            const prevLapTime = index > 1 ? (this.lapTimes[index - 1] - this.lapTimes[index - 2]) : (index === 1 ? this.lapTimes[0] : null);

            let deltaHtml = '';
            if (prevLapTime !== null) {
                const delta = lapTime - prevLapTime;
                const sign = delta >= 0 ? '+' : '-';
                const cls = delta >= 0 ? 'lap-delta negative' : 'lap-delta positive';
                deltaHtml = `<span class="${cls}">${sign}${formatMs(Math.abs(delta))}</span>`;
            }

            html += `<tr><td>#${index + 1}</td><td>${formatMs(lapTime)}</td><td>${formatMs(totalTime)}</td><td>${deltaHtml}</td></tr>`;
        });
        html += '</tbody></table>';
        lapContainer.innerHTML = html;
    }

    // =================================
    // TIMERS
    // =================================

    setupTimerEvents() {
        const createTimerBtn = this.clockWindow.querySelector('#createTimerBtn');
        createTimerBtn.addEventListener('click', () => {
            this.createNewTimer();
        });
    }

    createNewTimer() {
        const hours = parseInt(this.clockWindow.querySelector('#timerHours').value) || 0;
        const minutes = parseInt(this.clockWindow.querySelector('#timerMinutes').value) || 0;
        const seconds = parseInt(this.clockWindow.querySelector('#timerSeconds').value) || 0;
        const name = this.clockWindow.querySelector('#timerName').value || 'Timer';

        if (hours === 0 && minutes === 0 && seconds === 0) {
            ElxaUI.showMessage('Please set a time for your timer!', 'warning');
            return;
        }

        const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
        this.startTimer(name, totalMs);

        // Clear inputs
        this.clockWindow.querySelector('#timerHours').value = '0';
        this.clockWindow.querySelector('#timerMinutes').value = '5';
        this.clockWindow.querySelector('#timerSeconds').value = '0';
        this.clockWindow.querySelector('#timerName').value = '';
    }

    createQuickTimer(seconds) {
        const mins = Math.floor(seconds / 60);
        const name = mins >= 1 ? `${mins} min timer` : `${seconds}s timer`;
        this.startTimer(name, seconds * 1000);
    }

    startTimer(name, totalMs) {
        const timerId = 'timer_' + Date.now();
        const timer = {
            id: timerId,
            name: name,
            totalTime: totalMs,
            remainingTime: totalMs,
            startTime: Date.now(),
            completed: false
        };
        this.activeTimers.set(timerId, timer);
        this.updateTimerDisplay();
    }

    updateActiveTimers() {
        const now = Date.now();

        this.activeTimers.forEach((timer, id) => {
            if (timer.completed) return; // skip completed timers
            const elapsed = now - timer.startTime;
            timer.remainingTime = Math.max(0, timer.totalTime - elapsed);

            if (timer.remainingTime === 0) {
                timer.completed = true;
                this.timerCompleted(timer);
            }
        });

        if (this.clockWindow) {
            this.updateTimerDisplay();
        }
    }

    timerCompleted(timer) {
        this.playSound('timer-done');
        ElxaUI.showMessage(`Timer "${timer.name}" is done! 🎉`, 'success');
    }

    renderTimerRing(timer) {
        const progress = timer.completed ? 0 : timer.remainingTime / timer.totalTime;
        const radius = 54;
        const circumference = 2 * Math.PI * radius;
        const dashoffset = circumference * (1 - progress);

        // Color: green → yellow → red as time runs low
        let ringColor;
        if (timer.completed) {
            ringColor = '#5cb85c';
        } else if (progress > 0.2) {
            // green to yellow
            const t = (progress - 0.2) / 0.8;
            ringColor = progress > 0.5 ? '#5cb85c' : '#f0ad4e';
        } else {
            ringColor = '#d9534f';
        }

        const hours = Math.floor(timer.remainingTime / 3600000);
        const minutes = Math.floor((timer.remainingTime % 3600000) / 60000);
        const seconds = Math.floor((timer.remainingTime % 60000) / 1000);
        const timeStr = hours > 0
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const completedClass = timer.completed ? ' timer-ring-completed' : '';
        const lowClass = (!timer.completed && progress <= 0.2) ? ' timer-ring-low' : '';

        return `
            <div class="timer-ring${completedClass}${lowClass}">
                <svg class="timer-ring-svg" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="${radius}" class="timer-ring-track"/>
                    <circle cx="60" cy="60" r="${radius}" class="timer-ring-progress"
                            style="stroke: ${ringColor}; stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashoffset};"
                            transform="rotate(-90 60 60)"/>
                </svg>
                <div class="timer-ring-content">
                    <div class="timer-ring-name">${timer.name}</div>
                    <div class="timer-ring-time">${timer.completed ? 'DONE!' : timeStr}</div>
                </div>
                <button class="timer-ring-dismiss" onclick="elxaOS.clockSystem.cancelTimer('${timer.id}')">
                    ${timer.completed ? '✓ Dismiss' : ElxaIcons.renderAction('close')}
                </button>
            </div>
        `;
    }

    updateTimerDisplay() {
        const grid = this.clockWindow?.querySelector('#timerRingGrid');
        if (!grid) return;

        if (this.activeTimers.size === 0) {
            grid.innerHTML = '<div class="no-timers">No active timers — pick a preset or create one above!</div>';
            return;
        }

        grid.innerHTML = '';
        this.activeTimers.forEach((timer) => {
            grid.innerHTML += this.renderTimerRing(timer);
        });
    }

    cancelTimer(timerId) {
        this.activeTimers.delete(timerId);
        this.updateTimerDisplay();
    }

    // =================================
    // ALARMS
    // =================================

    setupAlarmEvents() {
        const createAlarmBtn = this.clockWindow.querySelector('#createAlarmBtn');
        createAlarmBtn.addEventListener('click', () => {
            this.createNewAlarm();
        });
    }

    createNewAlarm() {
        const time = this.clockWindow.querySelector('#alarmTime').value;
        const name = this.clockWindow.querySelector('#alarmName').value || 'Alarm';
        const repeat = this.clockWindow.querySelector('#alarmDays').value;

        if (!time) {
            ElxaUI.showMessage('Please set a time for your alarm!', 'warning');
            return;
        }

        const alarmId = 'alarm_' + Date.now();
        const alarm = {
            id: alarmId,
            time: time,
            name: name,
            repeat: repeat,
            enabled: true,
            lastTriggered: null
        };

        this.alarms.push(alarm);
        this.saveSettings();
        this.updateAlarmDisplay();

        // Clear inputs
        this.clockWindow.querySelector('#alarmTime').value = '07:00';
        this.clockWindow.querySelector('#alarmName').value = '';
        this.clockWindow.querySelector('#alarmDays').value = 'once';
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        const currentDay = now.getDay();
        // Minute key prevents re-triggering within the same minute
        const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${currentTime}`;

        this.alarms.forEach(alarm => {
            if (!alarm.enabled || alarm.time !== currentTime) return;
            if (alarm.lastTriggered === minuteKey) return;

            let shouldTrigger = false;

            switch (alarm.repeat) {
                case 'once':
                    shouldTrigger = true;
                    break;
                case 'daily':
                    shouldTrigger = true;
                    break;
                case 'weekdays':
                    shouldTrigger = currentDay >= 1 && currentDay <= 5;
                    break;
                case 'weekends':
                    shouldTrigger = currentDay === 0 || currentDay === 6;
                    break;
            }

            if (shouldTrigger) {
                alarm.lastTriggered = minuteKey;
                if (alarm.repeat === 'once') {
                    alarm.enabled = false;
                }
                this.triggerAlarm(alarm);
                this.saveSettings();
            }
        });
    }

    triggerAlarm(alarm) {
        // Open the clock window if it's not open
        if (!this.clockWindow) {
            this.openClockWindow();
        }
        this.showAlarmOverlay(alarm);
        this.playLoopingAlarm();
    }

    showAlarmOverlay(alarm) {
        // Remove existing overlay if any
        const existing = this.clockWindow?.querySelector('.alarm-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'alarm-overlay';
        overlay.innerHTML = `
            <div class="alarm-overlay-content">
                <div class="alarm-shake-icon">${ElxaIcons.render('alarm-icon', 'ui')}</div>
                <div class="alarm-overlay-name">${alarm.name}</div>
                <div class="alarm-overlay-time">${this.formatTime(new Date(), this.settings.format24, false)}</div>
                <div class="alarm-overlay-buttons">
                    <button class="alarm-overlay-btn alarm-dismiss-btn">Dismiss</button>
                    <button class="alarm-overlay-btn alarm-snooze-btn">${ElxaIcons.renderAction('clock')} Snooze (5 min)</button>
                </div>
            </div>
        `;

        overlay.querySelector('.alarm-dismiss-btn').addEventListener('click', () => {
            this.dismissAlarm();
        });

        overlay.querySelector('.alarm-snooze-btn').addEventListener('click', () => {
            this.snoozeAlarm(alarm, 5);
        });

        this.clockWindow.appendChild(overlay);

        // Auto-dismiss after 2 minutes
        this._alarmAutoDismiss = setTimeout(() => {
            this.dismissAlarm();
            ElxaUI.showMessage(`Alarm "${alarm.name}" auto-dismissed`, 'info');
        }, 120000);
    }

    dismissAlarm() {
        this.stopLoopingAlarm();
        const overlay = this.clockWindow?.querySelector('.alarm-overlay');
        if (overlay) overlay.remove();
        if (this._alarmAutoDismiss) {
            clearTimeout(this._alarmAutoDismiss);
            this._alarmAutoDismiss = null;
        }
    }

    snoozeAlarm(alarm, minutes) {
        this.dismissAlarm();
        // Create a one-shot alarm for now + minutes
        const snoozeTime = new Date(Date.now() + minutes * 60000);
        const h = snoozeTime.getHours().toString().padStart(2, '0');
        const m = snoozeTime.getMinutes().toString().padStart(2, '0');

        const snoozeAlarm = {
            id: 'snooze_' + Date.now(),
            time: `${h}:${m}`,
            name: `${alarm.name} (snoozed)`,
            repeat: 'once',
            enabled: true,
            lastTriggered: null
        };
        this.alarms.push(snoozeAlarm);
        this.saveSettings();
        this.updateAlarmDisplay();
        ElxaUI.showMessage(`Snoozed! Will ring again at ${h}:${m}`, 'info');
    }

    playLoopingAlarm() {
        this.stopLoopingAlarm(); // clear any existing
        // Play immediately, then repeat every 2 seconds
        this.playSound('alarm');
        this.alarmSoundInterval = setInterval(() => {
            this.playSound('alarm');
        }, 2000);
    }

    stopLoopingAlarm() {
        if (this.alarmSoundInterval) {
            clearInterval(this.alarmSoundInterval);
            this.alarmSoundInterval = null;
        }
    }

    updateAlarmDisplay() {
        const alarmList = this.clockWindow?.querySelector('#alarmList');
        if (!alarmList) return;

        alarmList.innerHTML = '';

        // Sort by time
        const sorted = [...this.alarms].map((a, i) => ({ alarm: a, index: i }))
            .sort((a, b) => a.alarm.time.localeCompare(b.alarm.time));

        sorted.forEach(({ alarm, index }) => {
            const alarmElement = document.createElement('div');
            alarmElement.className = `alarm-item ${alarm.enabled ? 'enabled' : 'disabled'}`;

            // Calculate time until
            let timeUntil = '';
            if (alarm.enabled) {
                const now = new Date();
                const [h, m] = alarm.time.split(':').map(Number);
                let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                if (target <= now) target = new Date(target.getTime() + 86400000);
                const diff = target - now;
                const dh = Math.floor(diff / 3600000);
                const dm = Math.floor((diff % 3600000) / 60000);
                timeUntil = `in ${dh}h ${dm}m`;
            }

            alarmElement.innerHTML = `
                <div class="alarm-info">
                    <div class="alarm-name">${alarm.name}</div>
                    <div class="alarm-time">${alarm.time} — ${alarm.repeat}${timeUntil ? ` — <span class="alarm-until">${timeUntil}</span>` : ''}</div>
                </div>
                <div class="alarm-controls">
                    <label class="alarm-toggle">
                        <input type="checkbox" ${alarm.enabled ? 'checked' : ''} onchange="elxaOS.clockSystem.toggleAlarm(${index})">
                        <span class="alarm-toggle-slider"></span>
                    </label>
                    <button class="delete-alarm-btn" onclick="elxaOS.clockSystem.deleteAlarm(${index})">${ElxaIcons.renderAction('delete')}</button>
                </div>
            `;
            alarmList.appendChild(alarmElement);
        });

        if (this.alarms.length === 0) {
            alarmList.innerHTML = '<div class="no-alarms">No alarms set</div>';
        }
    }

    toggleAlarm(index) {
        this.alarms[index].enabled = !this.alarms[index].enabled;
        this.alarms[index].lastTriggered = null;
        this.saveSettings();
        this.updateAlarmDisplay();
    }

    deleteAlarm(index) {
        this.alarms.splice(index, 1);
        this.saveSettings();
        this.updateAlarmDisplay();
    }

    // =================================
    // CALENDAR
    // =================================

    setupCalendarEvents() {
        const prevMonth = this.clockWindow.querySelector('#prevMonth');
        const nextMonth = this.clockWindow.querySelector('#nextMonth');

        this.currentCalendarDate = new Date();

        prevMonth.addEventListener('click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
            this.updateCalendarDisplay();
        });

        nextMonth.addEventListener('click', () => {
            this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
            this.updateCalendarDisplay();
        });

        // Special date form
        const addBtn = this.clockWindow.querySelector('#addSpecialDateBtn');
        const form = this.clockWindow.querySelector('#specialDateForm');
        const cancelBtn = this.clockWindow.querySelector('#specialDateCancel');
        const saveBtn = this.clockWindow.querySelector('#specialDateSave');

        addBtn.addEventListener('click', () => {
            form.classList.toggle('hidden');
            if (!form.classList.contains('hidden')) {
                this.clockWindow.querySelector('#specialDateName').focus();
            }
        });

        cancelBtn.addEventListener('click', () => {
            form.classList.add('hidden');
            this.clockWindow.querySelector('#specialDateName').value = '';
            this.clockWindow.querySelector('#specialDateDay').value = '';
        });

        saveBtn.addEventListener('click', () => {
            this.addSpecialDate();
        });
    }

    handleDateClick(year, month, day) {
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month, day);
        const dateString = dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        this.showEventModal(dateKey, dateString);
    }

    showEventModal(dateKey, dateString) {
        // Remove existing modal if open
        if (this.currentEventModal) {
            this.currentEventModal.remove();
            this.currentEventModal = null;
        }

        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="event-modal-content">
                <div class="event-modal-header">
                    <span>${ElxaIcons.renderAction('calendar')} Events for ${dateString}</span>
                    <button class="event-modal-close-btn">${ElxaIcons.renderAction('close')}</button>
                </div>
                <div class="event-modal-body">
                    <div class="event-list" data-event-list></div>
                    <div class="event-form">
                        <input type="text" data-event-title placeholder="Event title" maxlength="50">
                        <input type="time" data-event-time value="12:00">
                        <textarea data-event-description placeholder="Event description (optional)" maxlength="200"></textarea>
                        <div class="event-form-buttons">
                            <button class="event-btn event-modal-cancel-btn">Cancel</button>
                            <button class="event-btn primary event-modal-add-btn">${ElxaIcons.renderAction('plus')} Add Event</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Scope modal to the clock window
        this.clockWindow.appendChild(modal);
        this.currentEventModal = modal;

        // Wire up buttons via addEventListener (no inline onclick)
        modal.querySelector('.event-modal-close-btn').addEventListener('click', () => {
            this.closeEventModal();
        });
        modal.querySelector('.event-modal-cancel-btn').addEventListener('click', () => {
            this.closeEventModal();
        });
        modal.querySelector('.event-modal-add-btn').addEventListener('click', () => {
            this.addEvent(dateKey);
        });

        // Close modal when clicking backdrop
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeEventModal();
            }
        });

        this.updateEventList(dateKey);

        // Focus on title input
        modal.querySelector('[data-event-title]').focus();
    }

    closeEventModal() {
        if (this.currentEventModal) {
            this.currentEventModal.remove();
            this.currentEventModal = null;
        }
    }

    addEvent(dateKey) {
        const modal = this.currentEventModal;
        if (!modal) return;

        const title = modal.querySelector('[data-event-title]').value.trim();
        const time = modal.querySelector('[data-event-time]').value;
        const description = modal.querySelector('[data-event-description]').value.trim();

        if (!title) {
            ElxaUI.showMessage('Please enter an event title!', 'warning');
            return;
        }

        if (!this.calendarEvents[dateKey]) {
            this.calendarEvents[dateKey] = [];
        }

        const event = {
            id: Date.now(),
            title: title,
            time: time,
            description: description
        };

        this.calendarEvents[dateKey].push(event);
        this.saveSettings();
        this.updateEventList(dateKey);
        this.updateCalendarDisplay();

        // Clear form
        modal.querySelector('[data-event-title]').value = '';
        modal.querySelector('[data-event-time]').value = '12:00';
        modal.querySelector('[data-event-description]').value = '';
    }

    updateEventList(dateKey) {
        const modal = this.currentEventModal;
        if (!modal) return;

        const eventList = modal.querySelector('[data-event-list]');
        if (!eventList) return;

        const events = this.calendarEvents[dateKey] || [];

        if (events.length === 0) {
            eventList.innerHTML = '<div class="no-events">No events for this date</div>';
            return;
        }

        eventList.innerHTML = events.map(event => `
            <div class="event-item">
                <div class="event-info">
                    <div class="event-title">${event.title}</div>
                    <div class="event-time">${ElxaIcons.renderAction('clock')} ${event.time}</div>
                    ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                </div>
                <div class="event-controls">
                    <button class="event-control-btn" onclick="elxaOS.clockSystem.editEvent('${dateKey}', ${event.id})" title="Edit">${ElxaIcons.renderAction('rename')}</button>
                    <button class="event-control-btn" onclick="elxaOS.clockSystem.deleteEvent('${dateKey}', ${event.id})" title="Delete">${ElxaIcons.renderAction('delete')}</button>
                </div>
            </div>
        `).join('');
    }

    editEvent(dateKey, eventId) {
        const events = this.calendarEvents[dateKey] || [];
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        const modal = this.currentEventModal;
        if (!modal) return;

        // Fill form with event data
        modal.querySelector('[data-event-title]').value = event.title;
        modal.querySelector('[data-event-time]').value = event.time;
        modal.querySelector('[data-event-description]').value = event.description || '';

        // Remove the event (user re-adds via form)
        this.deleteEvent(dateKey, eventId);
    }

    deleteEvent(dateKey, eventId) {
        if (!this.calendarEvents[dateKey]) return;

        this.calendarEvents[dateKey] = this.calendarEvents[dateKey].filter(e => e.id !== eventId);

        if (this.calendarEvents[dateKey].length === 0) {
            delete this.calendarEvents[dateKey];
        }

        this.saveSettings();
        this.updateEventList(dateKey);
        this.updateCalendarDisplay();
    }

    updateCalendarDisplay() {
        const calendarTitle = this.clockWindow?.querySelector('#calendarTitle');
        const calendarGrid = this.clockWindow?.querySelector('#calendarGrid');
        if (!calendarTitle || !calendarGrid) return;

        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();

        calendarTitle.textContent = new Date(year, month).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        // Generate calendar grid
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();
        const todayDayOfWeek = today.getDay();

        // Determine which row the current week is in (for highlighting)
        let currentWeekRow = -1;
        if (year === todayYear && month === todayMonth) {
            currentWeekRow = Math.floor((firstDay + todayDate - 1) / 7);
        }

        // Build set of special date days for this month (for star indicators)
        const specialDatesThisMonth = new Set();
        const specialDates = this.getSpecialDates();
        specialDates.forEach(sd => {
            if (sd.month - 1 === month) {
                specialDatesThisMonth.add(sd.day);
            }
        });

        let calendarHTML = '<div class="calendar-weekdays">';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach((day, i) => {
            const weekendClass = (i === 0 || i === 6) ? ' weekend' : '';
            calendarHTML += `<div class="weekday${weekendClass}">${day}</div>`;
        });
        calendarHTML += '</div><div class="calendar-days">';

        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = todayYear === year &&
                          todayMonth === month &&
                          todayDate === day;

            const dayOfWeek = (firstDay + day - 1) % 7;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const weekRow = Math.floor((firstDay + day - 1) / 7);
            const isCurrentWeek = weekRow === currentWeekRow;

            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvents = this.calendarEvents[dateKey] && this.calendarEvents[dateKey].length > 0;
            const eventCount = hasEvents ? this.calendarEvents[dateKey].length : 0;
            const isSpecialDate = specialDatesThisMonth.has(day);

            let eventIndicators = '';
            let eventTooltip = '';

            if (hasEvents) {
                const indicatorCount = Math.min(eventCount, 3);
                for (let i = 0; i < indicatorCount; i++) {
                    eventIndicators += '<div class="event-indicator"></div>';
                }
                if (eventCount > 3) {
                    eventIndicators += '<div class="event-indicator-overflow">+</div>';
                }

                eventTooltip = '<div class="event-tooltip">';
                eventTooltip += `<div class="event-tooltip-title">${eventCount} Event${eventCount > 1 ? 's' : ''}</div>`;

                const eventsToShow = this.calendarEvents[dateKey].slice(0, 3);
                eventsToShow.forEach(event => {
                    eventTooltip += `
                        <div class="event-tooltip-item">
                            <span class="event-tooltip-time">${event.time}</span>
                            <span class="event-tooltip-name">${event.title}</span>
                        </div>
                    `;
                });

                if (eventCount > 3) {
                    eventTooltip += `<div class="event-tooltip-more">...and ${eventCount - 3} more</div>`;
                }

                eventTooltip += '</div>';
            }

            const dayClasses = [
                'calendar-day',
                isToday ? 'today' : '',
                hasEvents ? 'has-events' : '',
                isWeekend ? 'weekend' : '',
                isCurrentWeek ? 'current-week' : '',
                isSpecialDate ? 'special-day' : ''
            ].filter(Boolean).join(' ');

            calendarHTML += `
                <div class="${dayClasses}" onclick="elxaOS.clockSystem.handleDateClick(${year}, ${month}, ${day})">
                    <div class="day-number">${day}${isSpecialDate ? ' <span class="special-day-star">★</span>' : ''}</div>
                    ${eventIndicators}
                    ${eventTooltip}
                </div>
            `;
        }

        calendarHTML += '</div>';
        calendarGrid.innerHTML = calendarHTML;

        this.updateSpecialDates();
        this.renderUpcomingEvents();
    }

    updateSpecialDates() {
        const specialDates = this.clockWindow?.querySelector('#specialDates');
        if (!specialDates) return;

        const dates = this.getSpecialDates();

        if (dates.length === 0) {
            specialDates.innerHTML = '<div class="no-special-dates">No special dates yet — add some!</div>';
            return;
        }

        const now = new Date();
        specialDates.innerHTML = dates.map((sd, index) => {
            let target = new Date(now.getFullYear(), sd.month - 1, sd.day);
            if (target < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
                target = new Date(now.getFullYear() + 1, sd.month - 1, sd.day);
            }
            const diff = target - new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const daysUntil = Math.ceil(diff / 86400000);
            const daysText = daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow!' : `in ${daysUntil} days`;
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const isPinned = this.settings.pinnedCountdown === index;

            return `<div class="special-date${daysUntil === 0 ? ' special-date-today' : ''}">
                <div class="special-date-info">
                    <span class="special-date-name">${sd.name}</span>
                    <span class="special-date-when">${monthNames[sd.month - 1]} ${sd.day} — ${daysText}</span>
                </div>
                <div class="special-date-actions">
                    <button class="countdown-pin-btn${isPinned ? ' pinned' : ''}" onclick="elxaOS.clockSystem.togglePinnedCountdown(${index})" title="${isPinned ? 'Unpin from dashboard' : 'Pin countdown to dashboard'}">${isPinned ? '★' : '☆'}</button>
                    <button class="event-control-btn" onclick="elxaOS.clockSystem.deleteSpecialDate(${index})" title="Delete">${ElxaIcons.renderAction('delete')}</button>
                </div>
            </div>`;
        }).join('');
    }

    getSpecialDates() {
        // Return user-managed list, with defaults if none saved yet
        if (!this.settings.specialDates) {
            this.settings.specialDates = [
                { name: 'New Year', month: 1, day: 1 },
                { name: 'Halloween', month: 10, day: 31 },
                { name: 'Your Birthday', month: 12, day: 20 },
                { name: 'Christmas', month: 12, day: 25 }
            ];
            this.saveSettings();
        }
        return this.settings.specialDates;
    }

    addSpecialDate() {
        const nameInput = this.clockWindow?.querySelector('#specialDateName');
        const monthSelect = this.clockWindow?.querySelector('#specialDateMonth');
        const dayInput = this.clockWindow?.querySelector('#specialDateDay');
        const form = this.clockWindow?.querySelector('#specialDateForm');

        const name = nameInput?.value.trim();
        const month = parseInt(monthSelect?.value);
        const day = parseInt(dayInput?.value);

        if (!name) {
            ElxaUI.showMessage('Please enter a name!', 'warning');
            return;
        }
        if (!day || day < 1 || day > 31) {
            ElxaUI.showMessage('Please enter a valid day!', 'warning');
            return;
        }

        const dates = this.getSpecialDates();
        dates.push({ name, month, day });
        this.saveSettings();

        // Clear & hide form
        nameInput.value = '';
        dayInput.value = '';
        form.classList.add('hidden');

        this.updateSpecialDates();
        this.updateCalendarDisplay();
        ElxaUI.showMessage(`Added "${name}" to special dates!`, 'success');
    }

    deleteSpecialDate(index) {
        const dates = this.getSpecialDates();
        const removed = dates.splice(index, 1);
        // Adjust pinned index
        if (this.settings.pinnedCountdown === index) {
            this.settings.pinnedCountdown = null;
        } else if (this.settings.pinnedCountdown > index) {
            this.settings.pinnedCountdown--;
        }
        this.saveSettings();
        this.updateSpecialDates();
        this.updateCalendarDisplay();
        if (removed.length) ElxaUI.showMessage(`Removed "${removed[0].name}"`, 'info');
    }

    togglePinnedCountdown(index) {
        if (this.settings.pinnedCountdown === index) {
            this.settings.pinnedCountdown = null;
        } else {
            this.settings.pinnedCountdown = index;
        }
        this.saveSettings();
        this.updateSpecialDates();
        this.updateDashboard();
    }

    getUpcomingEvents(limit = 5) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const candidates = [];

        // Calendar events
        Object.keys(this.calendarEvents).forEach(dateKey => {
            const [y, m, d] = dateKey.split('-').map(Number);
            const eventDate = new Date(y, m - 1, d);
            if (eventDate >= today) {
                this.calendarEvents[dateKey].forEach(evt => {
                    candidates.push({
                        title: evt.title,
                        date: eventDate,
                        time: evt.time,
                        dateKey: dateKey,
                        type: 'event'
                    });
                });
            }
        });

        // Special dates (annual)
        const specialDates = this.getSpecialDates();
        specialDates.forEach(sd => {
            let target = new Date(now.getFullYear(), sd.month - 1, sd.day);
            if (target < today) {
                target = new Date(now.getFullYear() + 1, sd.month - 1, sd.day);
            }
            candidates.push({
                title: sd.name,
                date: target,
                time: null,
                dateKey: null,
                type: 'special'
            });
        });

        candidates.sort((a, b) => a.date - b.date);
        return candidates.slice(0, limit);
    }

    renderUpcomingEvents() {
        const list = this.clockWindow?.querySelector('#upcomingEventsList');
        if (!list) return;

        const upcoming = this.getUpcomingEvents(5);

        if (upcoming.length === 0) {
            list.innerHTML = '<div class="no-upcoming">Nothing coming up — add some events!</div>';
            return;
        }

        list.innerHTML = upcoming.map(item => {
            const dateStr = item.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = item.time ? ` at ${item.time}` : '';
            const icon = item.type === 'special' ? '★' : '•';
            const clickAttr = item.dateKey
                ? `onclick="elxaOS.clockSystem.jumpToDate('${item.dateKey}')"`
                : '';

            return `<div class="upcoming-event-item${item.dateKey ? ' clickable' : ''}" ${clickAttr}>
                <span class="upcoming-icon ${item.type}">${icon}</span>
                <span class="upcoming-date">${dateStr}${timeStr}</span>
                <span class="upcoming-title">${item.title}</span>
            </div>`;
        }).join('');
    }

    jumpToDate(dateKey) {
        const [y, m, d] = dateKey.split('-').map(Number);
        this.currentCalendarDate = new Date(y, m - 1, 1);
        this.updateCalendarDisplay();
        this.handleDateClick(y, m - 1, d);
    }

    // =================================
    // WORLD CLOCK
    // =================================

    setupWorldClockEvents() {
        const addTimezoneBtn = this.clockWindow.querySelector('#addTimezoneBtn');

        // Only set defaults if no saved data was loaded
        if (!this.worldClocks || this.worldClocks.length === 0) {
            this.worldClocks = [
                { name: 'Local Time', timezone: 'local' }
            ];
        }

        addTimezoneBtn.addEventListener('click', () => {
            const select = this.clockWindow.querySelector('#timezoneSelect');
            const selectedOption = select.options[select.selectedIndex];
            const timezone = selectedOption.value;
            const name = selectedOption.text;

            if (!this.worldClocks.find(clock => clock.timezone === timezone)) {
                this.worldClocks.push({ name, timezone });
                this.saveSettings();
                this.updateWorldClockDisplay();
            }
        });
    }

    isDaytime(timezone) {
        try {
            const now = new Date();
            let hour;
            if (timezone === 'local') {
                hour = now.getHours();
            } else if (timezone === 'SNAKESIA') {
                const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                const snakesiaTime = new Date(estTime.getTime() + (2 * 60 * 60 * 1000) + (1 * 60 * 1000));
                hour = snakesiaTime.getHours();
            } else {
                hour = parseInt(now.toLocaleString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false }));
            }
            return hour >= 6 && hour < 18;
        } catch {
            return true;
        }
    }

    getDateAtTimezone(timezone) {
        try {
            const now = new Date();
            if (timezone === 'local') {
                return now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else if (timezone === 'SNAKESIA') {
                const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                const snakesiaTime = new Date(estTime.getTime() + (2 * 60 * 60 * 1000) + (1 * 60 * 1000));
                return snakesiaTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else {
                return now.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' });
            }
        } catch {
            return '';
        }
    }

    updateWorldClockDisplay() {
        const worldClocksGrid = this.clockWindow?.querySelector('#worldClocksGrid');
        if (!worldClocksGrid) return;

        worldClocksGrid.innerHTML = '';

        this.worldClocks.forEach((clock, index) => {
            const now = new Date();
            let timeString;

            if (clock.timezone === 'local') {
                timeString = this.formatTime(now, this.settings.format24, false);
            } else if (clock.timezone === 'SNAKESIA') {
                const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                const snakesiaTime = new Date(estTime.getTime() + (2 * 60 * 60 * 1000) + (1 * 60 * 1000));
                timeString = this.formatTime(snakesiaTime, this.settings.format24, false);
            } else {
                timeString = now.toLocaleTimeString('en-US', {
                    timeZone: clock.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: !this.settings.format24
                });
            }

            const daytime = this.isDaytime(clock.timezone);
            const dateStr = this.getDateAtTimezone(clock.timezone);
            const dayNightClass = daytime ? 'daytime' : 'nighttime';
            const dayNightIcon = daytime ? 'weather-sunny' : 'weather-night';

            const clockElement = document.createElement('div');
            clockElement.className = `world-clock-item ${dayNightClass}`;
            clockElement.innerHTML = `
                <div class="world-clock-info">
                    <div class="world-clock-name">${ElxaIcons.renderAction(dayNightIcon)} ${clock.name}</div>
                    <div class="world-clock-time">${timeString}</div>
                    <div class="world-clock-date">${dateStr}</div>
                </div>
                ${index > 0 ? `<button class="remove-clock-btn" onclick="elxaOS.clockSystem.removeWorldClock(${index})">${ElxaIcons.renderAction('close')}</button>` : ''}
            `;
            worldClocksGrid.appendChild(clockElement);
        });
    }

    removeWorldClock(index) {
        this.worldClocks.splice(index, 1);
        this.saveSettings();
        this.updateWorldClockDisplay();
    }

    // =================================
    // ANALOG CLOCK
    // =================================

    renderAnalogClock() {
        const svg = this.clockWindow?.querySelector('#analogClock');
        if (!svg) return;

        const now = new Date();
        const hours = now.getHours() % 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();

        const hourAngle = (hours + minutes / 60) * 30; // 360/12 = 30 deg per hour
        const minuteAngle = (minutes + seconds / 60) * 6; // 360/60 = 6 deg per min
        const secondAngle = seconds * 6;

        svg.innerHTML = `
            <!-- Clock face -->
            <circle cx="100" cy="100" r="95" class="clock-face-bg"/>
            <circle cx="100" cy="100" r="93" class="clock-face-inner"/>

            <!-- Hour tick marks -->
            ${Array.from({length: 12}, (_, i) => {
                const angle = i * 30;
                const rad = angle * Math.PI / 180;
                const x1 = 100 + 80 * Math.sin(rad);
                const y1 = 100 - 80 * Math.cos(rad);
                const x2 = 100 + 88 * Math.sin(rad);
                const y2 = 100 - 88 * Math.cos(rad);
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick-hour"/>`;
            }).join('')}

            <!-- Minute tick marks -->
            ${Array.from({length: 60}, (_, i) => {
                if (i % 5 === 0) return ''; // skip hour positions
                const angle = i * 6;
                const rad = angle * Math.PI / 180;
                const x1 = 100 + 84 * Math.sin(rad);
                const y1 = 100 - 84 * Math.cos(rad);
                const x2 = 100 + 88 * Math.sin(rad);
                const y2 = 100 - 88 * Math.cos(rad);
                return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tick-minute"/>`;
            }).join('')}

            <!-- Hour hand -->
            <line x1="100" y1="100" x2="100" y2="45" class="hand-hour"
                  transform="rotate(${hourAngle}, 100, 100)"/>

            <!-- Minute hand -->
            <line x1="100" y1="100" x2="100" y2="28" class="hand-minute"
                  transform="rotate(${minuteAngle}, 100, 100)"/>

            <!-- Second hand -->
            <line x1="100" y1="110" x2="100" y2="24" class="hand-second"
                  transform="rotate(${secondAngle}, 100, 100)"/>

            <!-- Center cap -->
            <circle cx="100" cy="100" r="4" class="clock-center-cap"/>
        `;
    }

    // =================================
    // TODAY DASHBOARD
    // =================================

    updateDashboard() {
        if (!this.clockWindow) return;

        // --- Countdown spotlight ---
        const countdown = this.getNextCountdown();
        const countdownLabel = this.clockWindow.querySelector('#countdownLabel');
        const countdownValue = this.clockWindow.querySelector('#countdownValue');

        if (countdown && countdownLabel && countdownValue) {
            countdownLabel.textContent = countdown.name;
            countdownValue.textContent = countdown.display;
        } else if (countdownLabel && countdownValue) {
            countdownLabel.textContent = 'Nothing coming up';
            countdownValue.textContent = '';
        }

        // --- Quick glances ---
        // Next alarm
        const glanceAlarm = this.clockWindow.querySelector('#glanceAlarm .glance-text');
        if (glanceAlarm) {
            const enabledAlarms = this.alarms.filter(a => a.enabled);
            if (enabledAlarms.length > 0) {
                // Find the next alarm by time
                const sorted = [...enabledAlarms].sort((a, b) => a.time.localeCompare(b.time));
                const now = new Date();
                const currentTime = now.toTimeString().slice(0, 5);
                const next = sorted.find(a => a.time > currentTime) || sorted[0];
                glanceAlarm.textContent = `${next.name} at ${next.time}`;
            } else {
                glanceAlarm.textContent = 'No alarms set';
            }
        }

        // Active timers
        const glanceTimers = this.clockWindow.querySelector('#glanceTimers .glance-text');
        if (glanceTimers) {
            const count = this.activeTimers.size;
            if (count > 0) {
                glanceTimers.textContent = `${count} timer${count > 1 ? 's' : ''} running`;
            } else {
                glanceTimers.textContent = 'No timers';
            }
        }

        // Today's events
        const glanceEvents = this.clockWindow.querySelector('#glanceEvents .glance-text');
        if (glanceEvents) {
            const now = new Date();
            const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const todayEvents = this.calendarEvents[dateKey] || [];
            if (todayEvents.length > 0) {
                const names = todayEvents.slice(0, 2).map(e => e.title).join(', ');
                const extra = todayEvents.length > 2 ? ` +${todayEvents.length - 2} more` : '';
                glanceEvents.textContent = names + extra;
            } else {
                glanceEvents.textContent = 'Nothing scheduled';
            }
        }
    }

    getNextCountdown() {
        const now = new Date();
        const candidates = [];

        // Special dates (annual)
        const specialEvents = this.getSpecialDates();

        // Check for pinned countdown first
        if (this.settings.pinnedCountdown != null && specialEvents[this.settings.pinnedCountdown]) {
            const sd = specialEvents[this.settings.pinnedCountdown];
            let target = new Date(now.getFullYear(), sd.month - 1, sd.day);
            if (target <= now) {
                target = new Date(now.getFullYear() + 1, sd.month - 1, sd.day);
            }
            const diff = target - now;
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            let display = days > 0
                ? `${days} day${days !== 1 ? 's' : ''}, ${hours}h ${minutes}m`
                : `${hours}h ${minutes}m`;
            return { name: `★ ${sd.name}`, display };
        }

        specialEvents.forEach(sd => {
            let target = new Date(now.getFullYear(), sd.month - 1, sd.day);
            if (target <= now) {
                target = new Date(now.getFullYear() + 1, sd.month - 1, sd.day);
            }
            candidates.push({ name: sd.name, date: target });
        });

        // Calendar events in the future
        Object.keys(this.calendarEvents).forEach(dateKey => {
            const [y, m, d] = dateKey.split('-').map(Number);
            const eventDate = new Date(y, m - 1, d);
            if (eventDate > now) {
                this.calendarEvents[dateKey].forEach(evt => {
                    candidates.push({ name: evt.title, date: eventDate });
                });
            }
        });

        // Enabled alarms (next occurrence today)
        this.alarms.filter(a => a.enabled).forEach(alarm => {
            const [h, m] = alarm.time.split(':').map(Number);
            let alarmDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
            if (alarmDate <= now) {
                alarmDate = new Date(alarmDate.getTime() + 86400000); // tomorrow
            }
            candidates.push({ name: `Alarm: ${alarm.name}`, date: alarmDate });
        });

        if (candidates.length === 0) return null;

        // Sort by nearest
        candidates.sort((a, b) => a.date - b.date);
        const nearest = candidates[0];

        const diff = nearest.date - now;
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        let display;
        if (days > 0) {
            display = `${days} day${days !== 1 ? 's' : ''}, ${hours}h ${minutes}m`;
        } else {
            display = `${hours}h ${minutes}m`;
        }

        return { name: nearest.name, display };
    }

    // =================================
    // PANEL INITIALIZATION
    // =================================

    initializePanel(panelName) {
        switch (panelName) {
            case 'today':
                this.renderAnalogClock();
                this.updateDashboard();
                break;
            case 'stopwatch':
                this.updateStopwatchDisplay();
                this.updateLapDisplay();
                break;
            case 'calendar':
                this.updateCalendarDisplay();
                break;
            case 'world':
                this.updateWorldClockDisplay();
                break;
            case 'timer':
                this.updateTimerDisplay();
                break;
            case 'alarm':
                this.updateAlarmDisplay();
                break;
        }
    }

    // =================================
    // CLOCK WINDOW UPDATE (1-second tick)
    // =================================

    updateClockWindow() {
        if (!this.clockWindow) return;

        const now = new Date();

        const mainClock = this.clockWindow.querySelector('#mainDigitalClock');
        if (mainClock) {
            mainClock.textContent = this.formatTime(now, this.settings.format24, this.settings.showSeconds);
        }

        const dateDisplay = this.clockWindow.querySelector('#mainDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Update analog clock & dashboard on the Today panel
        const todayPanel = this.clockWindow.querySelector('[data-panel="today"]');
        if (todayPanel && todayPanel.classList.contains('active')) {
            this.renderAnalogClock();
            this.updateDashboard();
        }

        // Update world clocks if visible
        const worldPanel = this.clockWindow.querySelector('[data-panel="world"]');
        if (worldPanel && worldPanel.classList.contains('active')) {
            this.updateWorldClockDisplay();
        }
    }

    // =================================
    // SOUND EFFECTS
    // =================================

    playSound(type = 'timer') {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'alarm') {
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.6);
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.8);
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 1);
            } else if (type === 'timer-done') {
                // Ascending chime melody — more satisfying than a single beep
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, i) => {
                    const osc = audioContext.createOscillator();
                    const gn = audioContext.createGain();
                    osc.connect(gn);
                    gn.connect(audioContext.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.18);
                    gn.gain.setValueAtTime(0.25, audioContext.currentTime + i * 0.18);
                    gn.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.18 + 0.4);
                    osc.start(audioContext.currentTime + i * 0.18);
                    osc.stop(audioContext.currentTime + i * 0.18 + 0.4);
                });
                // Don't need the main oscillator for this type
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.01);
            } else if (type === 'timer') {
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.6);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
            } else if (type === 'start') {
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            } else if (type === 'stop') {
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            }
        } catch (error) {
            console.log(`🔊 ${type} sound (Web Audio unavailable)`);
        }
    }

    // =================================
    // PERSISTENCE
    // =================================

    saveSettings() {
        try {
            const settingsData = {
                settings: this.settings,
                alarms: this.alarms,
                worldClocks: this.worldClocks,
                calendarEvents: this.calendarEvents
            };
            localStorage.setItem('elxaOS-clock-system', JSON.stringify(settingsData));
        } catch (error) {
            console.error('❌ Failed to save clock settings:', error);
        }
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('elxaOS-clock-system');
            if (saved) {
                const settingsData = JSON.parse(saved);

                if (settingsData.settings) {
                    this.settings = { ...this.settings, ...settingsData.settings };
                }
                if (settingsData.alarms) {
                    this.alarms = settingsData.alarms;
                }
                if (settingsData.worldClocks && settingsData.worldClocks.length > 0) {
                    this.worldClocks = settingsData.worldClocks;
                } else {
                    this.worldClocks = [{ name: 'Local Time', timezone: 'local' }];
                }
                if (settingsData.calendarEvents) {
                    this.calendarEvents = settingsData.calendarEvents;
                } else {
                    this.calendarEvents = {};
                }

                console.log('📅 Clock system settings loaded');
            } else {
                this.calendarEvents = {};
                this.worldClocks = [{ name: 'Local Time', timezone: 'local' }];
            }
        } catch (error) {
            console.error('❌ Failed to load clock settings:', error);
            this.calendarEvents = {};
            this.worldClocks = [{ name: 'Local Time', timezone: 'local' }];
        }
    }

    // =================================
    // CLEANUP
    // =================================

    destroy() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        if (this.clockWindowInterval) {
            clearInterval(this.clockWindowInterval);
            this.clockWindowInterval = null;
        }
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchInterval = null;
        }
        this.stopLoopingAlarm();
        if (this._alarmAutoDismiss) {
            clearTimeout(this._alarmAutoDismiss);
            this._alarmAutoDismiss = null;
        }
        if (this.currentEventModal) {
            this.currentEventModal.remove();
            this.currentEventModal = null;
        }
    }
}
