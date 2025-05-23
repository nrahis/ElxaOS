// =================================
// CALCULATOR PROGRAM
// =================================
class CalculatorProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.display = '0';
        this.previousNumber = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.memory = 0;
        this.history = [];
        this.isAdvancedMode = false;
        this.lastAnswer = 0;
    }

    launch() {
        const windowId = `calculator-${Date.now()}`;
        
        const windowContent = this.createCalculatorInterface(windowId);
        
        const window = this.windowManager.createWindow(
            windowId,
            '🧮 Calculator',
            windowContent,
            { width: '320px', height: '480px', x: '200px', y: '150px' }
        );
        
        this.setupEventHandlers(windowId);
        
        return windowId;
    }

    createCalculatorInterface(windowId) {
        return `
            <div class="calculator-container" data-window-id="${windowId}">
                <!-- Calculator Header -->
                <div class="calculator-header">
                    <div class="mode-toggle">
                        <button class="mode-btn basic-mode active" data-mode="basic">Basic</button>
                        <button class="mode-btn advanced-mode" data-mode="advanced">Advanced</button>
                    </div>
                    <div class="calculator-controls">
                        <button class="calc-control" data-action="history" title="History">📜</button>
                        <button class="calc-control" data-action="help" title="Help">❓</button>
                    </div>
                </div>

                <!-- Display Section -->
                <div class="calculator-display-section">
                    <div class="calculator-display">${this.display}</div>
                    <div class="calculator-sub-display">
                        <span class="memory-indicator ${this.memory !== 0 ? 'active' : ''}">M</span>
                        <span class="operation-indicator"></span>
                    </div>
                </div>

                <!-- Keypad -->
                <div class="calculator-keypad basic-keypad">
                    <!-- Memory Row -->
                    <button class="calc-btn memory-btn" data-action="memory-clear">MC</button>
                    <button class="calc-btn memory-btn" data-action="memory-recall">MR</button>
                    <button class="calc-btn memory-btn" data-action="memory-add">M+</button>
                    <button class="calc-btn memory-btn" data-action="memory-subtract">M-</button>

                    <!-- Function Row -->
                    <button class="calc-btn clear-btn" data-action="clear">C</button>
                    <button class="calc-btn function-btn" data-action="clear-entry">CE</button>
                    <button class="calc-btn function-btn" data-action="backspace">⌫</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="/">/</button>

                    <!-- Number Rows -->
                    <button class="calc-btn number-btn" data-number="7">7</button>
                    <button class="calc-btn number-btn" data-number="8">8</button>
                    <button class="calc-btn number-btn" data-number="9">9</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="*">×</button>

                    <button class="calc-btn number-btn" data-number="4">4</button>
                    <button class="calc-btn number-btn" data-number="5">5</button>
                    <button class="calc-btn number-btn" data-number="6">6</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="-">-</button>

                    <button class="calc-btn number-btn" data-number="1">1</button>
                    <button class="calc-btn number-btn" data-number="2">2</button>
                    <button class="calc-btn number-btn" data-number="3">3</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="+">+</button>

                    <button class="calc-btn number-btn zero-btn" data-number="0">0</button>
                    <button class="calc-btn function-btn" data-action="decimal">.</button>
                    <button class="calc-btn equals-btn" data-action="equals">=</button>
                </div>

                <!-- Advanced Keypad (Hidden by default) -->
                <div class="calculator-keypad advanced-keypad" style="display: none;">
                    <!-- Scientific Functions Row 1 -->
                    <button class="calc-btn sci-btn" data-action="function" data-function="sin">sin</button>
                    <button class="calc-btn sci-btn" data-action="function" data-function="cos">cos</button>
                    <button class="calc-btn sci-btn" data-action="function" data-function="tan">tan</button>
                    <button class="calc-btn sci-btn" data-action="function" data-function="log">log</button>

                    <!-- Scientific Functions Row 2 -->
                    <button class="calc-btn sci-btn" data-action="function" data-function="sqrt">√</button>
                    <button class="calc-btn sci-btn" data-action="operator" data-operator="^">x²</button>
                    <button class="calc-btn sci-btn" data-action="operator" data-operator="**">xʸ</button>
                    <button class="calc-btn sci-btn" data-action="function" data-function="factorial">n!</button>

                    <!-- Fun Functions Row -->
                    <button class="calc-btn fun-btn" data-action="function" data-function="random">🎲</button>
                    <button class="calc-btn fun-btn" data-action="function" data-function="pi">π</button>
                    <button class="calc-btn fun-btn" data-action="function" data-function="binary">BIN</button>
                    <button class="calc-btn fun-btn" data-action="ans">ANS</button>

                    <!-- Memory & Basic Functions (repeated for advanced mode) -->
                    <button class="calc-btn memory-btn" data-action="memory-clear">MC</button>
                    <button class="calc-btn memory-btn" data-action="memory-recall">MR</button>
                    <button class="calc-btn memory-btn" data-action="memory-add">M+</button>
                    <button class="calc-btn memory-btn" data-action="memory-subtract">M-</button>

                    <button class="calc-btn clear-btn" data-action="clear">C</button>
                    <button class="calc-btn function-btn" data-action="clear-entry">CE</button>
                    <button class="calc-btn function-btn" data-action="backspace">⌫</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="/">/</button>

                    <button class="calc-btn number-btn" data-number="7">7</button>
                    <button class="calc-btn number-btn" data-number="8">8</button>
                    <button class="calc-btn number-btn" data-number="9">9</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="*">×</button>

                    <button class="calc-btn number-btn" data-number="4">4</button>
                    <button class="calc-btn number-btn" data-number="5">5</button>
                    <button class="calc-btn number-btn" data-number="6">6</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="-">-</button>

                    <button class="calc-btn number-btn" data-number="1">1</button>
                    <button class="calc-btn number-btn" data-number="2">2</button>
                    <button class="calc-btn number-btn" data-number="3">3</button>
                    <button class="calc-btn operator-btn" data-action="operator" data-operator="+">+</button>

                    <button class="calc-btn number-btn zero-btn" data-number="0">0</button>
                    <button class="calc-btn function-btn" data-action="decimal">.</button>
                    <button class="calc-btn equals-btn" data-action="equals">=</button>
                </div>

                <!-- History Panel (Hidden by default) -->
                <div class="calculator-history" style="display: none;">
                    <div class="history-header">
                        <h4>📜 Calculation History</h4>
                        <div class="history-controls">
                            <button class="history-clear">Clear All</button>
                            <button class="history-close">✕</button>
                        </div>
                    </div>
                    <div class="history-list">
                        <div class="history-empty">No calculations yet!</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventHandlers(windowId) {
        // Follow the same pattern as FileManagerProgram
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) {
            console.error('Calculator window element not found:', `window-${windowId}`);
            return;
        }
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) {
            console.error('Calculator container not found');
            return;
        }

        console.log('Setting up calculator event handlers for:', windowId);

        // Mode toggle buttons
        container.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Mode button clicked:', e.target.dataset.mode);
                this.toggleMode(e.target.dataset.mode, windowId);
            });
        });

        // Control buttons
        container.querySelectorAll('.calc-control').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                console.log('Control button clicked:', action);
                if (action === 'history') {
                    this.toggleHistory(windowId);
                } else if (action === 'help') {
                    this.showHelp(windowId);
                }
            });
        });

        // Calculator buttons - use event delegation
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('calc-btn')) {
                console.log('Calculator button clicked:', e.target.textContent);
                this.handleButtonClick(e.target, windowId);
            }
        });

        // History clear button
        const historyClearBtn = container.querySelector('.history-clear');
        if (historyClearBtn) {
            historyClearBtn.addEventListener('click', () => {
                console.log('History clear clicked');
                this.clearHistory(windowId);
            });
        }

        // History close button
        const historyCloseBtn = container.querySelector('.history-close');
        if (historyCloseBtn) {
            historyCloseBtn.addEventListener('click', () => {
                console.log('History close clicked');
                this.toggleHistory(windowId);
            });
        }

        // Close history when clicking outside of it
        const historyPanel = container.querySelector('.calculator-history');
        if (historyPanel) {
            historyPanel.addEventListener('click', (e) => {
                if (e.target === historyPanel) {
                    this.toggleHistory(windowId);
                }
            });
        }

        // Keyboard support
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeyboard(e, windowId);
        });

        // Make window focusable for keyboard events
        windowElement.setAttribute('tabindex', '0');
        windowElement.focus();
    }

    handleButtonClick(button, windowId) {
        const action = button.dataset.action;
        const number = button.dataset.number;
        const operator = button.dataset.operator;
        const func = button.dataset.function;

        // Add click animation
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 100);

        if (number !== undefined) {
            this.inputNumber(number, windowId);
        } else if (operator) {
            this.inputOperator(operator, windowId);
        } else if (action) {
            this.handleAction(action, func, windowId);
        }
    }

    inputNumber(number, windowId) {
        if (this.waitingForOperand) {
            this.display = number;
            this.waitingForOperand = false;
        } else {
            this.display = this.display === '0' ? number : this.display + number;
        }
        
        this.updateDisplay(windowId);
    }

    inputOperator(nextOperator, windowId) {
        const inputValue = parseFloat(this.display);

        if (this.previousNumber === null) {
            this.previousNumber = inputValue;
        } else if (this.operator) {
            const currentValue = this.previousNumber || 0;
            const newValue = this.calculate(currentValue, inputValue, this.operator);

            this.display = String(newValue);
            this.previousNumber = newValue;
            this.addToHistory(`${currentValue} ${this.operator} ${inputValue} = ${newValue}`, windowId);
        }

        this.waitingForOperand = true;
        this.operator = nextOperator;
        this.updateOperationIndicator(windowId);
        this.updateDisplay(windowId);
    }

    handleAction(action, func, windowId) {
        switch (action) {
            case 'clear':
                this.clear(windowId);
                break;
            case 'clear-entry':
                this.clearEntry(windowId);
                break;
            case 'backspace':
                this.backspace(windowId);
                break;
            case 'decimal':
                this.inputDecimal(windowId);
                break;
            case 'equals':
                this.performCalculation(windowId);
                break;
            case 'function':
                this.executeFunction(func, windowId);
                break;
            case 'ans':
                this.inputAnswer(windowId);
                break;
            case 'memory-clear':
                this.memoryClear(windowId);
                break;
            case 'memory-recall':
                this.memoryRecall(windowId);
                break;
            case 'memory-add':
                this.memoryAdd(windowId);
                break;
            case 'memory-subtract':
                this.memorySubtract(windowId);
                break;
        }
    }

    performCalculation(windowId) {
        const inputValue = parseFloat(this.display);

        if (this.previousNumber !== null && this.operator) {
            const result = this.calculate(this.previousNumber, inputValue, this.operator);
            
            this.display = String(result);
            this.lastAnswer = parseFloat(result);
            this.addToHistory(`${this.previousNumber} ${this.operator} ${inputValue} = ${result}`, windowId);
            
            this.operator = null;
            this.previousNumber = null;
            this.waitingForOperand = true;
            
            this.updateDisplay(windowId);
            this.updateOperationIndicator(windowId);
        }
    }

    calculate(firstOperand = null, secondOperand = null, operator = null, windowId = null) {
        const first = firstOperand !== null ? firstOperand : (this.previousNumber || 0);
        const second = secondOperand !== null ? secondOperand : parseFloat(this.display);
        const op = operator || this.operator;

        if (!op) {
            if (windowId) this.updateDisplay(windowId);
            return second;
        }

        let result;
        switch (op) {
            case '+':
                result = first + second;
                break;
            case '-':
                result = first - second;
                break;
            case '*':
                result = first * second;
                break;
            case '/':
                result = second !== 0 ? first / second : 'Error';
                break;
            case '^':
                result = first * first; // x²
                break;
            case '**':
                result = Math.pow(first, second);
                break;
            default:
                return second;
        }

        if (windowId) {
            this.display = String(result);
            this.lastAnswer = parseFloat(result);
            this.operator = null;
            this.previousNumber = null;
            this.waitingForOperand = true;
            
            if (firstOperand === null) {
                this.addToHistory(`${first} ${op} ${second} = ${result}`, windowId);
            }
            
            this.updateDisplay(windowId);
            this.updateOperationIndicator(windowId);
        }

        return result;
    }

    executeFunction(func, windowId) {
        const input = parseFloat(this.display);
        let result;

        switch (func) {
            case 'sin':
                result = Math.sin(input * Math.PI / 180); // Convert to radians
                break;
            case 'cos':
                result = Math.cos(input * Math.PI / 180);
                break;
            case 'tan':
                result = Math.tan(input * Math.PI / 180);
                break;
            case 'log':
                result = input > 0 ? Math.log10(input) : 'Error';
                break;
            case 'sqrt':
                result = input >= 0 ? Math.sqrt(input) : 'Error';
                break;
            case 'factorial':
                result = this.factorial(Math.floor(Math.abs(input)));
                break;
            case 'random':
                result = Math.floor(Math.random() * 100) + 1; // Random 1-100
                break;
            case 'pi':
                result = Math.PI;
                break;
            case 'binary':
                const num = Math.floor(Math.abs(input));
                result = num.toString(2);
                this.showMessage(`${num} in binary is: ${result}`, windowId);
                return;
            default:
                return;
        }

        this.display = String(result);
        this.lastAnswer = parseFloat(result);
        this.addToHistory(`${func}(${input}) = ${result}`, windowId);
        this.updateDisplay(windowId);
    }

    factorial(n) {
        if (n < 0) return 'Error';
        if (n === 0 || n === 1) return 1;
        if (n > 20) return 'Too Large'; // Prevent overflow
        
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    clear(windowId) {
        this.display = '0';
        this.previousNumber = null;
        this.operator = null;
        this.waitingForOperand = false;
        this.updateDisplay(windowId);
        this.updateOperationIndicator(windowId);
    }

    clearEntry(windowId) {
        this.display = '0';
        this.updateDisplay(windowId);
    }

    backspace(windowId) {
        if (this.display.length > 1) {
            this.display = this.display.slice(0, -1);
        } else {
            this.display = '0';
        }
        this.updateDisplay(windowId);
    }

    inputDecimal(windowId) {
        if (this.waitingForOperand) {
            this.display = '0.';
            this.waitingForOperand = false;
        } else if (this.display.indexOf('.') === -1) {
            this.display += '.';
        }
        this.updateDisplay(windowId);
    }

    inputAnswer(windowId) {
        this.display = String(this.lastAnswer);
        this.waitingForOperand = false;
        this.updateDisplay(windowId);
    }

    // Memory functions
    memoryClear(windowId) {
        this.memory = 0;
        this.updateMemoryIndicator(windowId);
    }

    memoryRecall(windowId) {
        this.display = String(this.memory);
        this.waitingForOperand = false;
        this.updateDisplay(windowId);
    }

    memoryAdd(windowId) {
        this.memory += parseFloat(this.display);
        this.updateMemoryIndicator(windowId);
    }

    memorySubtract(windowId) {
        this.memory -= parseFloat(this.display);
        this.updateMemoryIndicator(windowId);
    }

    toggleMode(mode, windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) return;
        
        const basicKeypad = container.querySelector('.basic-keypad');
        const advancedKeypad = container.querySelector('.advanced-keypad');
        const modeButtons = container.querySelectorAll('.mode-btn');

        this.isAdvancedMode = mode === 'advanced';

        if (this.isAdvancedMode) {
            if (basicKeypad) basicKeypad.style.display = 'none';
            if (advancedKeypad) advancedKeypad.style.display = 'grid';
            // Resize window for advanced mode
            windowElement.style.height = '580px';
        } else {
            if (basicKeypad) basicKeypad.style.display = 'grid';
            if (advancedKeypad) advancedKeypad.style.display = 'none';
            // Resize window for basic mode
            windowElement.style.height = '480px';
        }

        // Update button states
        modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    toggleHistory(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) return;
        
        const historyPanel = container.querySelector('.calculator-history');
        if (!historyPanel) return;
        
        const isVisible = historyPanel.style.display !== 'none';
        
        historyPanel.style.display = isVisible ? 'none' : 'block';
        
        // Update history display
        if (!isVisible) {
            this.updateHistoryDisplay(windowId);
        }
    }

    addToHistory(calculation, windowId) {
        this.history.unshift(calculation);
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20); // Keep only last 20
        }
    }

    updateHistoryDisplay(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) return;
        
        const historyList = container.querySelector('.history-list');
        if (!historyList) return;
        
        if (this.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No calculations yet!</div>';
        } else {
            historyList.innerHTML = this.history
                .map(calc => `<div class="history-item">${calc}</div>`)
                .join('');
        }
    }

    clearHistory(windowId) {
        this.history = [];
        this.updateHistoryDisplay(windowId);
    }

    updateDisplay(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) return;
        
        const displayElement = container.querySelector('.calculator-display');
        if (!displayElement) return;
        
        displayElement.textContent = this.display;
        
        // Add animation
        displayElement.classList.add('updated');
        setTimeout(() => displayElement.classList.remove('updated'), 200);
    }

    updateOperationIndicator(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) return;
        
        const indicator = container.querySelector('.operation-indicator');
        if (!indicator) return;
        
        indicator.textContent = this.operator || '';
    }

    updateMemoryIndicator(windowId) {
        const windowElement = document.getElementById(`window-${windowId}`);
        if (!windowElement) return;
        
        const container = windowElement.querySelector('.calculator-container');
        if (!container) return;
        
        const indicator = container.querySelector('.memory-indicator');
        if (!indicator) return;
        
        indicator.classList.toggle('active', this.memory !== 0);
    }

    handleKeyboard(e, windowId) {
        e.preventDefault();
        
        const key = e.key;
        
        // Check if history is open and handle Escape
        const windowElement = document.getElementById(`window-${windowId}`);
        const historyPanel = windowElement.querySelector('.calculator-history');
        const historyVisible = historyPanel && historyPanel.style.display !== 'none';
        
        if (key === 'Escape' && historyVisible) {
            this.toggleHistory(windowId);
            return;
        }
        
        // Don't process calculator keys if history is open
        if (historyVisible) return;
        
        if (key >= '0' && key <= '9') {
            this.inputNumber(key, windowId);
        } else if (['+', '-', '*', '/'].includes(key)) {
            this.inputOperator(key, windowId);
        } else if (key === '.') {
            this.inputDecimal(windowId);
        } else if (key === 'Enter' || key === '=') {
            this.performCalculation(windowId);
        } else if (key === 'Escape' || key.toLowerCase() === 'c') {
            this.clear(windowId);
        } else if (key === 'Backspace') {
            this.backspace(windowId);
        }
    }

    showHelp(windowId) {
        const helpText = `
🧮 Calculator Help

Basic Mode:
• Number keys (0-9) for input
• +, -, ×, / for operations
• = to calculate
• C to clear all
• CE to clear entry
• ⌫ to backspace

Advanced Mode:
• All basic functions plus:
• sin, cos, tan (degrees)
• √ for square root
• x² for square
• xʸ for power
• n! for factorial
• π for pi
• 🎲 for random number
• BIN for binary conversion
• ANS for last answer

Memory:
• MC: Memory Clear
• MR: Memory Recall
• M+: Memory Add
• M-: Memory Subtract

Keyboard Shortcuts:
• 0-9: Number input
• +, -, *, /: Operations  
• Enter or =: Calculate
• Esc or C: Clear
• Backspace: Delete last digit

Have fun with math! 🎉
        `;
        
        this.showMessage(helpText, windowId);
    }

    showMessage(text, windowId) {
        const message = document.createElement('div');
        message.className = 'calculator-message';
        message.innerHTML = text.replace(/\n/g, '<br>');
        
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            color: #000;
            border: 2px outset #c0c0c0;
            padding: 16px;
            max-width: 300px;
            font-size: 11px;
            z-index: 3000;
            box-shadow: 4px 4px 8px rgba(0,0,0,0.3);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.4;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'OK';
        closeBtn.style.cssText = `
            margin-top: 12px;
            padding: 4px 16px;
            background: linear-gradient(to bottom, #dfdfdf, #c0c0c0);
            border: 1px outset #c0c0c0;
            cursor: pointer;
            color: #000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
        `;
        
        closeBtn.onclick = () => message.remove();
        message.appendChild(closeBtn);
        document.body.appendChild(message);

        // Auto-close after 10 seconds for long messages
        setTimeout(() => {
            if (document.body.contains(message)) {
                message.remove();
            }
        }, 10000);
    }
}