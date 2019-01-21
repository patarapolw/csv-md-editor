import { app, BrowserWindow, ipcMain, Menu, MenuItemConstructorOptions } from "electron";
import * as path from "path";
import * as url from "url";
import isAsar from "electron-is-running-in-asar";

let mainWindow: Electron.BrowserWindow;
let openedFilePath: string = "~";
let showExitPrompt = true;

function setFilePath(filePath: string) {
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, "./index.html"),
            protocol: "file:",
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
            nodeIntegration: true
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
    });

    mainWindow.on("closed", () => {
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
    app.on("open-file", (e, _path) => {
        if (mainWindow) {
            setFilePath(_path);
        } else if (app.isReady() && !mainWindow) {
            createWindow(_path);
        } else {
            openedFilePath = _path;
        }
    });
});

app.on("ready", () => {
    createWindow(openedFilePath);

    const template: MenuItemConstructorOptions[] = [
        {
            label: "Application",
            submenu: [
                { label: "About Application", role: "about" },
                { type: "separator" },
                { label: "Quit", accelerator: "Command+Q", role: "quit" }
            ]
        },
        {
            label: "File",
            submenu: [
                { label: "Open", accelerator: "CmdOrCtrl+O", click() { mainWindow.webContents.send("on-menu-open"); } },
                { label: "Save", accelerator: "CmdOrCtrl+S", click() { mainWindow.webContents.send("on-menu-save"); } }
            ]
        },
        {
            label: "Edit",
            submenu: [
                { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
                { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
                { type: "separator" },
                { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
                { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
                { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
                { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
            ]
        },
        {
            label: "View",
            submenu: [
                {
                    label: "Toggle header",
                    accelerator: "CmdOrCtrl+H",
                    id: "toggle-header",
                    type: "checkbox",
                    checked: false,
                    enabled: false,
                    click() { mainWindow.webContents.send("on-menu-toggle-header"); }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
});

app.on("window-all-closed", () => {
    // if (process.platform !== 'darwin') {
    app.quit();
    // }
});

app.on("activate", () => {
    if (mainWindow === null) {
        createWindow();
    }
});
