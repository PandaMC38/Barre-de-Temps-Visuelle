const { app, BrowserWindow, screen, ipcMain, Tray, Menu, globalShortcut, shell } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    mainWindow = new BrowserWindow({
        width: width,
        height: 60, // Minimal height for bar + input
        x: 0,
        y: 0,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        hasShadow: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    mainWindow.loadFile('index.html');

    // Initial state: Input mode (clickable)
    mainWindow.setIgnoreMouseEvents(false);

    // mainWindow.webContents.openDevTools({ mode: 'detach' }); // For debugging

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function createTray() {
    tray = new Tray(path.join(__dirname, 'icon.png')); // Placeholder icon handling? We'll deal with icon later or use empty
    // If no icon, it might fail. Let's try to not fail if icon missing or use a simple colored box if possible, 
    // but Electron usually requires an image file. I'll skip icon creation in this step or standard path.
    // For now, let's just use a simple label or skip tray if it crashes without icon, 
    // but the plan insisted on Tray. I'll add a try-catch or create a dummy icon later.
    // Actually, on Windows, a Tray icon is needed. I'll omit the image path invocation for a second to avoid crash if file missing,
    // or better, I will generate a simple icon or use a system one if possible. 
    // Let's assume I'll create an empty 'icon.png' later.

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Show/Reset', click: () => showInput() },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('Visual Time Bar');
    tray.setContextMenu(contextMenu);
}

function showInput() {
    mainWindow.webContents.send('reset-timer');
    mainWindow.setIgnoreMouseEvents(false);
    mainWindow.focus();
}

app.whenReady().then(() => {
    // Register global shortcut
    globalShortcut.register('Alt+T', () => {
        showInput();
    });

    createWindow();
    // createTray(); // Commented out until we have an icon, to prevent error.
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handling
ipcMain.on('start-timer', () => {
    // Switch to click-through mode
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
    // Keep window on top but allow clicks to pass through
});

ipcMain.on('resize-window', (event, height) => {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setSize(width, height);
});

ipcMain.on('time-up', () => {
    shell.beep();
});

ipcMain.on('set-fullscreen-flash', (event, enable) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    if (enable) {
        mainWindow.setSize(width, height);
        mainWindow.setIgnoreMouseEvents(true, { forward: true }); // Ensure click-through
    } else {
        mainWindow.setSize(width, 60); // Revert to bar height
    }
});
