const { ipcRenderer } = require('electron');

const inputContainer = document.getElementById('input-container');
const timeInput = document.getElementById('time-input');
const progressBar = document.getElementById('progress-bar');
const progressFill = document.getElementById('progress-fill');

let totalTime = 0;
let remainingTime = 0;
let timerInterval = null;

timeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const input = timeInput.value.trim();
        if (validateInput(input)) {
            startTimer(parseTime(input));
        } else {
            timeInput.classList.add('error');
            setTimeout(() => timeInput.classList.remove('error'), 500);
        }
    }
});

function validateInput(input) {
    return /^(\d+(?:\.\d+)?)(s|m|h|min)?$/i.test(input);
}

function parseTime(input) {
    const match = input.match(/^(\d+(?:\.\d+)?)(s|m|h|min)?$/i);
    const value = parseFloat(match[1]);
    const unit = match[2] ? match[2].toLowerCase() : 'm'; // Default to minutes

    switch (unit) {
        case 's': return value * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'm':
        case 'min':
        default: return value * 60 * 1000;
    }
}

function startTimer(duration) {
    totalTime = duration;
    remainingTime = duration;

    // Hide input, show bar
    inputContainer.style.display = 'none';
    progressBar.style.display = 'block';

    // Tell main process to ignore mouse events
    ipcRenderer.send('start-timer');

    if (timerInterval) clearInterval(timerInterval);

    updateVisuals();

    timerInterval = setInterval(() => {
        remainingTime -= 100; // Update every 100ms
        if (remainingTime <= 0) {
            remainingTime = 0;
            clearInterval(timerInterval);
            timeIsUp();
        }
        updateVisuals();
    }, 100);
}

function updateVisuals() {
    const percentage = (remainingTime / totalTime) * 100;
    progressFill.style.width = `${percentage}%`;

    // Color interpolation
    // Simple HSL map: 120 (Green) -> 60 (Yellow) -> 0 (Red)
    let color;
    if (percentage > 50) {
        const hue = (percentage / 100) * 120;
        color = `hsl(${hue}, 90%, 60%)`;
    } else {
        const hue = (percentage / 100) * 120;
        color = `hsl(${hue}, 90%, 60%)`;
    }

    progressFill.style.backgroundColor = color;
    progressFill.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
}

function timeIsUp() {
    // Send beep request to main process
    ipcRenderer.send('time-up');

    // Trigger full screen flash
    ipcRenderer.send('set-fullscreen-flash', true);

    // Create or show full screen overlay
    let overlay = document.getElementById('flash-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'flash-overlay';
        document.body.appendChild(overlay);
    }

    overlay.style.display = 'block';

    // Stop blinking after 5 seconds and reset
    setTimeout(() => {
        overlay.style.display = 'none';
        ipcRenderer.send('set-fullscreen-flash', false);
        // Reset bar transparency/state if needed
        progressFill.style.opacity = '1';
    }, 5000);
}

ipcRenderer.on('reset-timer', () => {
    clearInterval(timerInterval);
    progressBar.style.display = 'none';
    inputContainer.style.display = 'flex';
    timeInput.value = '';
    timeInput.focus();

    // Also reset overlay if active
    const overlay = document.getElementById('flash-overlay');
    if (overlay) overlay.style.display = 'none';
    ipcRenderer.send('set-fullscreen-flash', false);
});
