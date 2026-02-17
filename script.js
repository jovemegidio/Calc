/**
 * Calculadora Web — Portfólio
 * Operações: +, −, ×, ÷, %, ±
 */

class Calculator {
  constructor() {
    this.displayEl = document.getElementById('display');
    this.expressionEl = document.getElementById('expression');

    this.reset();
    this.bindEvents();
  }

  /* ── State ── */
  reset() {
    this.currentValue = '0';
    this.previousValue = '';
    this.operator = null;
    this.shouldResetDisplay = false;
    this.lastResult = null;
    this.updateDisplay();
  }

  /* ── Display ── */
  updateDisplay() {
    // Format for display (use comma as decimal separator)
    const formatted = this.formatNumber(this.currentValue);
    this.displayEl.textContent = formatted;

    // Shrink font for long values
    this.displayEl.classList.remove('shrink', 'shrink-more');
    if (formatted.length > 12) {
      this.displayEl.classList.add('shrink-more');
    } else if (formatted.length > 8) {
      this.displayEl.classList.add('shrink');
    }
  }

  updateExpression() {
    if (this.previousValue && this.operator) {
      const opSymbol = { add: '+', subtract: '−', multiply: '×', divide: '÷' }[this.operator];
      this.expressionEl.textContent = `${this.formatNumber(this.previousValue)} ${opSymbol}`;
    } else {
      this.expressionEl.textContent = '';
    }
  }

  formatNumber(value) {
    if (value === 'Erro') return value;

    const str = String(value);

    // If still typing with a decimal dot, preserve it
    if (str.includes('.')) {
      const [intPart, decPart] = str.split('.');
      const formattedInt = this.addThousandsSeparator(intPart);
      return `${formattedInt},${decPart}`;
    }

    return this.addThousandsSeparator(str);
  }

  addThousandsSeparator(intStr) {
    const isNegative = intStr.startsWith('-');
    let digits = isNegative ? intStr.slice(1) : intStr;
    digits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return isNegative ? `-${digits}` : digits;
  }

  /* ── Input Handling ── */
  inputDigit(digit) {
    if (this.shouldResetDisplay) {
      this.currentValue = digit;
      this.shouldResetDisplay = false;
    } else {
      // Limit digits
      const raw = this.currentValue.replace('.', '');
      if (raw.replace('-', '').length >= 15) return;

      this.currentValue = this.currentValue === '0' ? digit : this.currentValue + digit;
    }
    this.updateDisplay();
  }

  inputDecimal() {
    if (this.shouldResetDisplay) {
      this.currentValue = '0.';
      this.shouldResetDisplay = false;
      this.updateDisplay();
      return;
    }

    if (!this.currentValue.includes('.')) {
      this.currentValue += '.';
    }
    this.updateDisplay();
  }

  /* ── Operations ── */
  handleOperator(op) {
    const current = parseFloat(this.currentValue);

    if (this.operator && !this.shouldResetDisplay) {
      // Chain operations
      this.calculate();
    } else {
      this.previousValue = String(current);
    }

    this.operator = op;
    this.shouldResetDisplay = true;
    this.updateExpression();
    this.highlightOperator(op);
  }

  calculate() {
    if (!this.operator || this.previousValue === '') return;

    const prev = parseFloat(this.previousValue);
    const current = parseFloat(this.currentValue);
    let result;

    switch (this.operator) {
      case 'add':
        result = prev + current;
        break;
      case 'subtract':
        result = prev - current;
        break;
      case 'multiply':
        result = prev * current;
        break;
      case 'divide':
        if (current === 0) {
          this.currentValue = 'Erro';
          this.previousValue = '';
          this.operator = null;
          this.shouldResetDisplay = true;
          this.updateDisplay();
          this.updateExpression();
          this.clearOperatorHighlight();
          return;
        }
        result = prev / current;
        break;
      default:
        return;
    }

    // Round to avoid floating point issues
    result = Math.round(result * 1e12) / 1e12;

    // Build expression text for display
    const opSymbol = { add: '+', subtract: '−', multiply: '×', divide: '÷' }[this.operator];
    this.expressionEl.textContent = `${this.formatNumber(this.previousValue)} ${opSymbol} ${this.formatNumber(String(current))} =`;

    this.currentValue = String(result);
    this.previousValue = '';
    this.operator = null;
    this.shouldResetDisplay = true;
    this.lastResult = result;
    this.updateDisplay();
    this.clearOperatorHighlight();
  }

  toggleSign() {
    if (this.currentValue === '0' || this.currentValue === 'Erro') return;

    this.currentValue = String(parseFloat(this.currentValue) * -1);
    this.updateDisplay();
  }

  percent() {
    if (this.currentValue === 'Erro') return;

    const value = parseFloat(this.currentValue);

    if (this.previousValue && this.operator) {
      // e.g., 200 + 10% → 200 + 20
      const base = parseFloat(this.previousValue);
      this.currentValue = String(base * (value / 100));
    } else {
      this.currentValue = String(value / 100);
    }

    this.currentValue = String(Math.round(parseFloat(this.currentValue) * 1e12) / 1e12);
    this.updateDisplay();
  }

  /* ── Operator Highlight ── */
  highlightOperator(op) {
    this.clearOperatorHighlight();
    const btn = document.querySelector(`[data-action="${op}"]`);
    if (btn) btn.classList.add('active');
  }

  clearOperatorHighlight() {
    document.querySelectorAll('.btn-operator').forEach((b) => b.classList.remove('active'));
  }

  /* ── Event Binding ── */
  bindEvents() {
    // Button clicks
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('click', () => this.handleAction(btn.dataset.action));
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }

  handleAction(action) {
    if (!action) return;

    // Digits
    if (/^[0-9]$/.test(action)) {
      this.inputDigit(action);
      return;
    }

    switch (action) {
      case 'decimal':
        this.inputDecimal();
        break;
      case 'clear':
        this.reset();
        this.clearOperatorHighlight();
        break;
      case 'toggle-sign':
        this.toggleSign();
        break;
      case 'percent':
        this.percent();
        break;
      case 'add':
      case 'subtract':
      case 'multiply':
      case 'divide':
        this.handleOperator(action);
        break;
      case 'equals':
        this.calculate();
        break;
    }
  }

  handleKeyboard(e) {
    const key = e.key;

    if (/^[0-9]$/.test(key)) {
      e.preventDefault();
      this.handleAction(key);
    } else if (key === '.' || key === ',') {
      e.preventDefault();
      this.handleAction('decimal');
    } else if (key === '+') {
      e.preventDefault();
      this.handleAction('add');
    } else if (key === '-') {
      e.preventDefault();
      this.handleAction('subtract');
    } else if (key === '*') {
      e.preventDefault();
      this.handleAction('multiply');
    } else if (key === '/') {
      e.preventDefault();
      this.handleAction('divide');
    } else if (key === 'Enter' || key === '=') {
      e.preventDefault();
      this.handleAction('equals');
    } else if (key === 'Escape' || key === 'Delete') {
      e.preventDefault();
      this.handleAction('clear');
    } else if (key === '%') {
      e.preventDefault();
      this.handleAction('percent');
    } else if (key === 'Backspace') {
      e.preventDefault();
      this.handleBackspace();
    }
  }

  handleBackspace() {
    if (this.shouldResetDisplay || this.currentValue === 'Erro') {
      this.currentValue = '0';
      this.shouldResetDisplay = false;
    } else if (this.currentValue.length > 1) {
      this.currentValue = this.currentValue.slice(0, -1);
      if (this.currentValue === '-') this.currentValue = '0';
    } else {
      this.currentValue = '0';
    }
    this.updateDisplay();
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  new Calculator();
});
