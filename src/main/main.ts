import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import * as path from 'path';
import * as url from 'url';
import isAsar from "electron-is-running-in-asar";

let mainWindow: Electron.BrowserWindow;
let openedFilePath: string = "~";
let showExitPrompt = true;

function setFilePath(filePath: string) {
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true,
            query: {
                file: filePath
            }
        })
    );
}

function createWindow(filePath: string = "~") {
    mainWindow = new BrowserWindow({
        height: 768,
        width: 1024,
        webPreferences: {
            nodeIntegration: true,
        }
    });
    mainWindow.maximize();

    setFilePath(filePath);

    if (!isAsar()) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on("close", (e) => {
        if (showExitPrompt) {
            e.preventDefault();
            mainWindow.webContents.send("on-app-closing");
        }
    })

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

ipcMain.on("quitter", () => {
    if (mainWindow !== null) {
        showExitPrompt = false;
        mainWindow.close();
    }
});

app.on("will-finish-launching", () => {
    app.on("open-file", (e, path) => {
        if (mainWindow) {
            setFilePath(path);
        } else if (app.isReady() && !mainWindow) {
            createWindow(path);
        } else {
            openedFilePath = path;
        }
    })
});

app.on('ready', () => {
    createWindow(openedFilePath);

    var template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]}, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
        ]}
    ];

    // @ts-ignore
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') {
    app.quit();
    // }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
