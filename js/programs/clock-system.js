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
        this.clockWindow = null;
        this.tickInterval = null;
        
        this.loadSettings();
        this.setupEventHandlers();
        this.startMainClock();
    }

    setupEventHandlers() {
        this.eventBus.on('clock.click', () => {
            this.openClockWindow();
        });

        this.eventBus.on('clock.toggle-format', () => {
            this.toggleTimeFormat();
        });
    }

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
            const timeString = this.formatTime(now, this.settings.format24, this.settings.showSeconds);
            clockElement.textContent = timeString;
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

    openClockWindow() {
        if (this.clockWindow) {
            this.windowManager.focusWindow('clock-system');
            return;
        }

        const content = this.createClockWindowContent();
        this.clockWindow = this.windowManager.createWindow(
            'clock-system',
            '⏰ ElxaOS Time Center',
            content,
            { width: '600px', height: '500px', x: '200px', y: '100px' }
        );

        this.setupClockWindowEvents();
        this.updateClockWindow();
        
        // Start updating the clock window every second
        this.clockWindowInterval = setInterval(() => {
            this.updateClockWindow();
        }, 1000);

        // Listen for window close to cleanup
        this.eventBus.on('window.closed', (data) => {
            if (data.id === 'clock-system') {
                this.clockWindow = null;
                if (this.clockWindowInterval) {
                    clearInterval(this.clockWindowInterval);
                    this.clockWindowInterval = null;
                }
            }
        });
    }

    createClockWindowContent() {
        return `
            <div class="clock-system">
                <div class="clock-tabs">
                    <div class="clock-tab active" data-tab="main">🕐 Clock</div>
                    <div class="clock-tab" data-tab="timer">⏱️ Timers</div>
                    <div class="clock-tab" data-tab="alarm">⏰ Alarms</div>
                    <div class="clock-tab" data-tab="calendar">📅 Calendar</div>
                    <div class="clock-tab" data-tab="world">🌍 World</div>
                </div>

                <div class="clock-content">
                    <!-- Main Clock Tab -->
                    <div class="clock-panel active" data-panel="main">
                        <div class="main-clock-display">
                            <div class="digital-clock" id="mainDigitalClock">00:00:00</div>
                            <div class="date-display" id="mainDateDisplay">Monday, January 1, 2024</div>
                        </div>
                        
                        <div class="clock-controls">
                            <button class="clock-btn" id="toggleFormatBtn">Switch to 24H</button>
                            <button class="clock-btn" id="toggleSecondsBtn">Hide Seconds</button>
                            <button class="clock-btn" id="stopwatchBtn">⏱️ Stopwatch</button>
                        </div>

                        <div class="stopwatch-section hidden" id="stopwatchSection">
                            <div class="stopwatch-display" id="stopwatchDisplay">00:00.00</div>
                            <div class="stopwatch-controls">
                                <button class="stopwatch-btn" id="startStopBtn">Start</button>
                                <button class="stopwatch-btn" id="resetBtn">Reset</button>
                                <button class="stopwatch-btn" id="lapBtn">Lap</button>
                            </div>
                            <div class="lap-times" id="lapTimes"></div>
                        </div>
                    </div>

                    <!-- Timer Tab -->
                    <div class="clock-panel" data-panel="timer">
                        <div class="timer-creator">
                            <h3>🔥 Create New Timer</h3>
                            <div class="timer-inputs">
                                <input type="number" id="timerHours" min="0" max="23" value="0" placeholder="H">
                                <span>:</span>
                                <input type="number" id="timerMinutes" min="0" max="59" value="5" placeholder="M">
                                <span>:</span>
                                <input type="number" id="timerSeconds" min="0" max="59" value="0" placeholder="S">
                            </div>
                            <input type="text" id="timerName" placeholder="Timer name (e.g., 'Homework Break')" maxlength="30">
                            <button class="create-timer-btn" id="createTimerBtn">🚀 Start Timer!</button>
                        </div>
                        
                        <div class="active-timers" id="activeTimers">
                            <h3>⚡ Running Timers</h3>
                            <div class="timer-list" id="timerList"></div>
                        </div>
                    </div>

                    <!-- Alarm Tab -->
                    <div class="clock-panel" data-panel="alarm">
                        <div class="alarm-creator">
                            <h3>⏰ Create New Alarm</h3>
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
                            <button class="create-alarm-btn" id="createAlarmBtn">📢 Set Alarm!</button>
                        </div>
                        
                        <div class="alarm-list-container">
                            <h3>📋 Your Alarms</h3>
                            <div class="alarm-list" id="alarmList"></div>
                        </div>
                    </div>

                    <!-- Calendar Tab -->
                    <div class="clock-panel" data-panel="calendar">
                        <div class="calendar-header">
                            <button class="calendar-nav" id="prevMonth">◀</button>
                            <div class="calendar-title" id="calendarTitle">January 2024</div>
                            <button class="calendar-nav" id="nextMonth">▶</button>
                        </div>
                        
                        <div class="calendar-grid" id="calendarGrid">
                            <!-- Calendar will be generated here -->
                        </div>
                        
                        <div class="special-dates">
                            <h3>🎉 Special Dates</h3>
                            <div class="special-date-list" id="specialDates">
                                <!-- Special dates will be listed here -->
                            </div>
                        </div>
                    </div>

                    <!-- World Clock Tab -->
                    <div class="clock-panel" data-panel="world">
                        <div class="world-clocks-grid" id="worldClocksGrid">
                            <!-- World clocks will be generated here -->
                        </div>
                        
                        <div class="add-timezone">
                            <select id="timezoneSelect">
                                <option value="America/New_York">🗽 New York</option>
                                <option value="America/Los_Angeles">🌴 Los Angeles</option>
                                <option value="Europe/London">🏰 London</option>
                                <option value="Europe/Paris">🗼 Paris</option>
                                <option value="Asia/Tokyo">🗾 Tokyo</option>
                                <option value="Asia/Shanghai">🏯 Shanghai</option>
                                <option value="Australia/Sydney">🦘 Sydney</option>
                                <option value="America/Sao_Paulo">🌎 São Paulo</option>
                            </select>
                            <button class="add-timezone-btn" id="addTimezoneBtn">🌍 Add City</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupClockWindowEvents() {
        // Tab switching
        const tabs = this.clockWindow.querySelectorAll('.clock-tab');
        const panels = this.clockWindow.querySelectorAll('.clock-panel');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanel = tab.dataset.tab;
                
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                
                tab.classList.add('active');
                this.clockWindow.querySelector(`[data-panel="${targetPanel}"]`).classList.add('active');
                
                // Initialize panel-specific content
                this.initializePanel(targetPanel);
            });
        });

        // Main clock controls
        this.setupMainClockEvents();
        this.setupTimerEvents();
        this.setupAlarmEvents();
        this.setupCalendarEvents();
        this.setupWorldClockEvents();
    }

    setupMainClockEvents() {
        const toggleFormatBtn = this.clockWindow.querySelector('#toggleFormatBtn');
        const toggleSecondsBtn = this.clockWindow.querySelector('#toggleSecondsBtn');
        const stopwatchBtn = this.clockWindow.querySelector('#stopwatchBtn');

        toggleFormatBtn.addEventListener('click', () => {
            this.toggleTimeFormat();
        });

        toggleSecondsBtn.addEventListener('click', () => {
            this.settings.showSeconds = !this.settings.showSeconds;
            this.saveSettings();
            toggleSecondsBtn.textContent = this.settings.showSeconds ? 'Hide Seconds' : 'Show Seconds';
        });

        stopwatchBtn.addEventListener('click', () => {
            const stopwatchSection = this.clockWindow.querySelector('#stopwatchSection');
            stopwatchSection.classList.toggle('hidden');
        });

        this.setupStopwatchEvents();
    }

    setupStopwatchEvents() {
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;
        this.stopwatchRunning = false;
        this.lapTimes = [];

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
    }

    startStopwatch() {
        this.stopwatchRunning = true;
        this.playSound('start'); // Add sound effect
        this.stopwatchInterval = setInterval(() => {
            this.stopwatchTime += 10;
            this.updateStopwatchDisplay();
        }, 10);
        
        this.clockWindow.querySelector('#startStopBtn').textContent = 'Stop';
        this.clockWindow.querySelector('#lapBtn').disabled = false;
    }

    stopStopwatch() {
        this.stopwatchRunning = false;
        this.playSound('stop'); // Add sound effect
        clearInterval(this.stopwatchInterval);
        this.clockWindow.querySelector('#startStopBtn').textContent = 'Start';
        this.clockWindow.querySelector('#lapBtn').disabled = true;
    }

    resetStopwatch() {
        this.stopStopwatch();
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateStopwatchDisplay();
        this.updateLapDisplay();
        this.clockWindow.querySelector('#startStopBtn').textContent = 'Start';
    }

    recordLap() {
        if (this.stopwatchRunning) {
            this.lapTimes.push(this.stopwatchTime);
            this.updateLapDisplay();
        }
    }

    updateStopwatchDisplay() {
        const display = this.clockWindow.querySelector('#stopwatchDisplay');
        const minutes = Math.floor(this.stopwatchTime / 60000);
        const seconds = Math.floor((this.stopwatchTime % 60000) / 1000);
        const centiseconds = Math.floor((this.stopwatchTime % 1000) / 10);
        
        display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    updateLapDisplay() {
        const lapContainer = this.clockWindow.querySelector('#lapTimes');
        lapContainer.innerHTML = this.lapTimes.map((lapTime, index) => {
            const minutes = Math.floor(lapTime / 60000);
            const seconds = Math.floor((lapTime % 60000) / 1000);
            const centiseconds = Math.floor((lapTime % 1000) / 10);
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
            return `<div class="lap-time">Lap ${index + 1}: ${timeStr}</div>`;
        }).join('');
    }

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
            alert('⚠️ Please set a time for your timer!');
            return;
        }

        const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000;
        const timerId = 'timer_' + Date.now();
        
        const timer = {
            id: timerId,
            name: name,
            totalTime: totalMs,
            remainingTime: totalMs,
            startTime: Date.now()
        };

        this.activeTimers.set(timerId, timer);
        this.updateTimerDisplay();
        
        // Clear inputs
        this.clockWindow.querySelector('#timerHours').value = '0';
        this.clockWindow.querySelector('#timerMinutes').value = '5';
        this.clockWindow.querySelector('#timerSeconds').value = '0';
        this.clockWindow.querySelector('#timerName').value = '';
    }

    updateActiveTimers() {
        const now = Date.now();
        const completedTimers = [];

        this.activeTimers.forEach((timer, id) => {
            const elapsed = now - timer.startTime;
            timer.remainingTime = Math.max(0, timer.totalTime - elapsed);
            
            if (timer.remainingTime === 0) {
                completedTimers.push(id);
                this.timerCompleted(timer);
            }
        });

        completedTimers.forEach(id => {
            this.activeTimers.delete(id);
        });

        if (this.clockWindow) {
            this.updateTimerDisplay();
        }
    }

    timerCompleted(timer) {
        // Play timer sound effect
        this.playSound('timer');
        
        // Show notification
        this.showNotification(`⏰ Timer Complete!`, `"${timer.name}" has finished!`, 'timer');
        
        // Play alert sound (simulated)
        this.eventBus.emit('system.notification', {
            type: 'timer-complete',
            title: 'Timer Complete!',
            message: `"${timer.name}" has finished!`
        });
    }

    updateTimerDisplay() {
        const timerList = this.clockWindow.querySelector('#timerList');
        if (!timerList) return;

        timerList.innerHTML = '';
        
        this.activeTimers.forEach((timer, id) => {
            const hours = Math.floor(timer.remainingTime / 3600000);
            const minutes = Math.floor((timer.remainingTime % 3600000) / 60000);
            const seconds = Math.floor((timer.remainingTime % 60000) / 1000);
            
            const timerElement = document.createElement('div');
            timerElement.className = 'timer-item';
            timerElement.innerHTML = `
                <div class="timer-info">
                    <div class="timer-name">${timer.name}</div>
                    <div class="timer-time">${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</div>
                </div>
                <button class="cancel-timer-btn" onclick="elxaOS.clockSystem.cancelTimer('${id}')">❌</button>
            `;
            timerList.appendChild(timerElement);
        });

        if (this.activeTimers.size === 0) {
            timerList.innerHTML = '<div class="no-timers">No active timers</div>';
        }
    }

    cancelTimer(timerId) {
        this.activeTimers.delete(timerId);
        this.updateTimerDisplay();
    }

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
            alert('⚠️ Please set a time for your alarm!');
            return;
        }

        const alarmId = 'alarm_' + Date.now();
        const alarm = {
            id: alarmId,
            time: time,
            name: name,
            repeat: repeat,
            enabled: true
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
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

        this.alarms.forEach(alarm => {
            if (!alarm.enabled || alarm.time !== currentTime) return;
            
            let shouldTrigger = false;
            
            switch (alarm.repeat) {
                case 'once':
                    shouldTrigger = true;
                    alarm.enabled = false; // Disable after triggering
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
                this.triggerAlarm(alarm);
            }
        });
    }

    triggerAlarm(alarm) {
        // Play alarm sound effect
        this.playSound('alarm');
        
        this.showNotification(`⏰ ALARM!`, alarm.name, 'alarm');
        
        this.eventBus.emit('system.notification', {
            type: 'alarm',
            title: 'ALARM!',
            message: alarm.name
        });
    }

    updateAlarmDisplay() {
        const alarmList = this.clockWindow.querySelector('#alarmList');
        if (!alarmList) return;

        alarmList.innerHTML = '';
        
        this.alarms.forEach((alarm, index) => {
            const alarmElement = document.createElement('div');
            alarmElement.className = `alarm-item ${alarm.enabled ? 'enabled' : 'disabled'}`;
            alarmElement.innerHTML = `
                <div class="alarm-info">
                    <div class="alarm-name">${alarm.name}</div>
                    <div class="alarm-time">${alarm.time} - ${alarm.repeat}</div>
                </div>
                <div class="alarm-controls">
                    <button class="toggle-alarm-btn" onclick="elxaOS.clockSystem.toggleAlarm(${index})">${alarm.enabled ? '🔔' : '🔕'}</button>
                    <button class="delete-alarm-btn" onclick="elxaOS.clockSystem.deleteAlarm(${index})">🗑️</button>
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
        this.saveSettings();
        this.updateAlarmDisplay();
    }

    deleteAlarm(index) {
        this.alarms.splice(index, 1);
        this.saveSettings();
        this.updateAlarmDisplay();
    }

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
    }

    updateCalendarDisplay() {
        const calendarTitle = this.clockWindow.querySelector('#calendarTitle');
        const calendarGrid = this.clockWindow.querySelector('#calendarGrid');
        
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
        
        let calendarHTML = '<div class="calendar-weekdays">';
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            calendarHTML += `<div class="weekday">${day}</div>`;
        });
        calendarHTML += '</div><div class="calendar-days">';
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = today.getFullYear() === year && 
                          today.getMonth() === month && 
                          today.getDate() === day;
            
            calendarHTML += `<div class="calendar-day ${isToday ? 'today' : ''}">${day}</div>`;
        }
        
        calendarHTML += '</div>';
        calendarGrid.innerHTML = calendarHTML;
        
        this.updateSpecialDates();
    }

    updateSpecialDates() {
        const specialDates = this.clockWindow.querySelector('#specialDates');
        if (!specialDates) return;
        
        const now = new Date();
        const specialEvents = [
            { name: '🎆 New Year', date: 'Jan 1' },
            { name: '💐 Mothers Day', date: 'May 11' },
            { name: '🎃 Halloween', date: 'Oct 31' },
            { name: '🦃 Thanksgiving', date: 'Nov 23' },
            { name: '🎂 Your Birthday', date: 'Dec 20' },
            { name: '🎄 Christmas', date: 'Dec 25' }
        ];
        
        specialDates.innerHTML = specialEvents.map(event => 
            `<div class="special-date">${event.name} - ${event.date}</div>`
        ).join('');
    }

    setupWorldClockEvents() {
        const addTimezoneBtn = this.clockWindow.querySelector('#addTimezoneBtn');
        
        this.worldClocks = [
            { name: '🏠 Local Time', timezone: 'local' }
        ];
        
        addTimezoneBtn.addEventListener('click', () => {
            const select = this.clockWindow.querySelector('#timezoneSelect');
            const selectedOption = select.options[select.selectedIndex];
            const timezone = selectedOption.value;
            const name = selectedOption.text;
            
            if (!this.worldClocks.find(clock => clock.timezone === timezone)) {
                this.worldClocks.push({ name, timezone });
                this.updateWorldClockDisplay();
            }
        });
    }

    updateWorldClockDisplay() {
        const worldClocksGrid = this.clockWindow.querySelector('#worldClocksGrid');
        if (!worldClocksGrid) return;
        
        worldClocksGrid.innerHTML = '';
        
        this.worldClocks.forEach((clock, index) => {
            const now = new Date();
            let timeString;
            
            if (clock.timezone === 'local') {
                timeString = this.formatTime(now, this.settings.format24, false);
            } else {
                timeString = now.toLocaleTimeString('en-US', {
                    timeZone: clock.timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: !this.settings.format24
                });
            }
            
            const clockElement = document.createElement('div');
            clockElement.className = 'world-clock-item';
            clockElement.innerHTML = `
                <div class="world-clock-info">
                    <div class="world-clock-name">${clock.name}</div>
                    <div class="world-clock-time">${timeString}</div>
                </div>
                ${index > 0 ? `<button class="remove-clock-btn" onclick="elxaOS.clockSystem.removeWorldClock(${index})">❌</button>` : ''}
            `;
            worldClocksGrid.appendChild(clockElement);
        });
    }

    removeWorldClock(index) {
        this.worldClocks.splice(index, 1);
        this.updateWorldClockDisplay();
    }

    initializePanel(panelName) {
        switch (panelName) {
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

    updateClockWindow() {
        if (!this.clockWindow) return;
        
        const now = new Date();
        
        // Update main digital clock
        const mainClock = this.clockWindow.querySelector('#mainDigitalClock');
        if (mainClock) {
            mainClock.textContent = this.formatTime(now, this.settings.format24, true);
        }
        
        // Update date display
        const dateDisplay = this.clockWindow.querySelector('#mainDateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        // Update button texts
        const toggleFormatBtn = this.clockWindow.querySelector('#toggleFormatBtn');
        if (toggleFormatBtn) {
            toggleFormatBtn.textContent = this.settings.format24 ? 'Switch to 12H' : 'Switch to 24H';
        }
        
        const toggleSecondsBtn = this.clockWindow.querySelector('#toggleSecondsBtn');
        if (toggleSecondsBtn) {
            toggleSecondsBtn.textContent = this.settings.showSeconds ? 'Hide Seconds' : 'Show Seconds';
        }
        
        // Update world clocks if visible
        const worldPanel = this.clockWindow.querySelector('[data-panel="world"]');
        if (worldPanel && worldPanel.classList.contains('active')) {
            this.updateWorldClockDisplay();
        }
    }

    showNotification(title, message, type = 'info') {
        // Create a notification that appears on screen
        const notification = document.createElement('div');
        notification.className = `clock-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close" onclick="this.parentElement.remove()">✕</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    playSound(type = 'timer') {
        try {
            // Create audio context for sound generation
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            if (type === 'alarm') {
                // Urgent alarm sound - high pitched beeps
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
            } else if (type === 'timer') {
                // Friendly timer sound - pleasant chime
                oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2); // E5
                oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.4); // G5
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.6);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.6);
            } else if (type === 'start') {
                // Stopwatch start sound - ascending tone
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            } else if (type === 'stop') {
                // Stopwatch stop sound - descending tone
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
            }
        } catch (error) {
            // Fallback to simple beep if Web Audio API isn't available
            console.log(`${type.toUpperCase()} SOUND!`);
            
            // Try using a simple system beep as fallback
            if (window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance(type === 'alarm' ? 'ALARM!' : 'Timer finished!');
                utterance.rate = 2;
                utterance.pitch = type === 'alarm' ? 2 : 1;
                utterance.volume = 0.5;
                window.speechSynthesis.speak(utterance);
            }
        }
    }

    saveSettings() {
        const settingsData = {
            settings: this.settings,
            alarms: this.alarms,
            worldClocks: this.worldClocks
        };
        // In a real implementation, this would use localStorage
        // For now, we'll keep settings in memory
        console.log('Clock settings saved:', settingsData);
    }

    loadSettings() {
        // In a real implementation, this would load from localStorage
        // For now, we'll use defaults
        console.log('Clock settings loaded');
    }

    destroy() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
        }
        if (this.clockWindowInterval) {
            clearInterval(this.clockWindowInterval);
        }
        if (this.stopwatchInterval) {
            clearInterval(this.stopwatchInterval);
        }
    }
}