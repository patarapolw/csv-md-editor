import Handsontable from "handsontable";
import { ipcRenderer, remote, BrowserWindow } from "electron";
import fs from "fs";
import toastr from "toastr";
import url from "url";
import CsvParse from "csv-parse";
import CsvStringify from "csv-stringify";
import markdownRenderer from "./hot/renderer";

import "handsontable/dist/handsontable.full.min.css";
import "toastr/build/toastr.min.css";
import "./index.css";

const { dialog, Menu } = remote;

let promptOnSave = true;
let currentFile = url.parse(location.href, true).query.file as string || "~";
let isEdited = false;
let csvData: string[][] = [[]];
let csvComments: string[] = [];
let csvHotSettings: Handsontable.DefaultSettings = {};
let csvHotExtendedSettings = {
    maxWidth: 300,
    maxHeight: 150
};
let editorWindow: BrowserWindow = null;

const defaultHotSettings: Handsontable.DefaultSettings = {
    rowHeaders: true,
    colHeaders: true,
    // minSpareCols: 1,
    minSpareRows: 1,
    manualColumnResize: true,
    manualRowResize: true,
    manualColumnMove: true,
    manualRowMove: true,
    colWidths: 100,
    contextMenu: {
        callback(key, options) {
            switch (key) {
                case "editor":
                    const coord = (options as any)[0];
                    openEditor(coord.start.row, coord.start.col);
                    break;
            }
        },
        items: {
            editor: {
                name: "Open in editor"
            },
            sep1: "---------",
            cut: {},
            copy: {},
            // paste: {
            //     name: "Paste"
            // },
            sep2: "---------",
            row_above: {},
            row_below: {},
            sep3: "---------",
            col_left: {},
            col_right: {},
            sep4: "---------",
            remove_row: {},
            remove_col: {},
            sep5: "---------",
            undo: {},
            redo: {},
            sep6: "---------",
            alignment: {}
        }
    }
};

setMaxDimensions(csvHotExtendedSettings.maxWidth, csvHotExtendedSettings.maxHeight);

const hot = new Handsontable(document.getElementById("app"), {
    startRows: 5,
    startCols: 5,
    renderer: markdownRenderer,
    afterChange(changes, source) {
        if (source === "loadData") {
            isEdited = false;
            return;
        }
        isEdited = true;
        setTitle();
        if (hot.getDataAtRow(0).every((el) => el !== null)) {
            menuItemToggleHeader.enabled = true;
        }
    }
});
(window as any).hot = hot;

updateSettings();

const csvParser = CsvParse({
    comment: "#"
});

csvParser.on("readable", () => {
    let record;
    while (record = csvParser.read()) {
        csvData.push(record);
    }
});

csvParser.on("error", (err) => {
    console.error(err.message);
});

csvParser.on("end", () => {
    if (Array.isArray(csvHotSettings.colHeaders)) {
        hot.loadData(csvData.splice(1));
    } else {
        hot.loadData(csvData);
    }

    updateColHeaderMenu();
});

const csvStringify = CsvStringify();

toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: false,
    progressBar: false,
    positionClass: "toast-bottom-center",
    preventDuplicates: false,
    onclick: null,
    showDuration: 300,
    hideDuration: 1000,
    timeOut: 5000,
    extendedTimeOut: 1000,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut"
};

ipcRenderer.on("on-app-closing", () => {
    saveBeforeFunction(() => {
        ipcRenderer.send("quitter");
    });
});

ipcRenderer.on("on-menu-open", () => {
    openFile();
});

ipcRenderer.on("on-menu-save", () => {
    saveFile();
});

const menuItemToggleHeader = Menu.getApplicationMenu().getMenuItemById("toggle-header");

ipcRenderer.on("on-menu-toggle-header", () => {
    menuItemToggleHeader.checked ? setColHeaders() : removeColHeaders();
});

if (currentFile !== "~") {
    readFile();
}

function saveBeforeFunction(fn: () => void) {
    if (isEdited) {
        dialog.showMessageBox({
            type: "question",
            message: "Do you want to save first?",
            buttons: ["Yes", "No", "Cancel"],
            defaultId: 0
        }, (response) => {
            if (response === 0) {
                saveFile();
                fn();
            } else if (response === 1) {
                fn();
            }
        });
    } else {
        fn();
    }
}

function saveFile(quitAfterSaving = false) {
    if (promptOnSave) {
        dialog.showMessageBox({
            type: "question",
            message: "Do you want to save?",
            buttons: ["Yes", "Cancel"],
            defaultId: 0,
            checkboxLabel: "Remember save location",
            checkboxChecked: true
        }, (response, checked) => {
            if (response === 0) {
                const file = dialog.showSaveDialog({
                    defaultPath: currentFile === "~" ? "untitled" : currentFile,
                    filters: [{
                        name: "CSV files",
                        extensions: ["csv"]
                    }]
                });

                if (file !== undefined) {
                    currentFile = file;
                    promptOnSave = !checked;
                    saveFileSilent();

                    if (quitAfterSaving) {
                        ipcRenderer.send("quitter");
                    }
                }
            }
        });
    } else {
        saveFileSilent();
    }
}

function saveFileSilent() {
    const data: string[] = [];

    delete csvHotSettings.data;

    csvStringify.on("readable", () => {
        let row;
        while (row = csvStringify.read()) {
            data.push(row);
        }
    });

    csvStringify.on("error", (err) => {
        console.error(err.message);
    });

    csvStringify.on("finish", () => {
        const content = csvComments.length > 0 ? [csvComments.map((el) => "#" + el).join("\n")] : [];
        content.push("#hot " + JSON.stringify(csvHotSettings));
        content.push("#hotx " + JSON.stringify(csvHotExtendedSettings));
        content.push(data.join(""));

        isEdited = false;
        fs.writeFile(currentFile, content.join("\n"), (err) => {
            if (err) {
                return console.log(err);
            } else {
                setTitle(currentFile);
                toastr.success("Saved!");
            }
        });
    });

    getData().forEach((row: any[]) => {
        csvStringify.write(row);
    });
    csvStringify.end();
}

function setTitle(_currentFile: string = null) {
    if (_currentFile) {
        currentFile = _currentFile;
    }

    let title = "CSV MD Editor - ";
    if (currentFile === "~") {
        title += "New file";
    } else {
        title += currentFile;
    }

    if (isEdited) {
        title += "*";
    }

    document.getElementsByTagName("title")[0].innerText = title;
}

function openFile() {
    const file = dialog.showOpenDialog({
        properties: ["openFile"],
        defaultPath: "~",
        filters: [{
            name: "CSV files",
            extensions: ["csv"]
        }]
    });

    if (file !== undefined) {
        currentFile = file[0];
        readFile();
    }
}

function readFile() {
    promptOnSave = true;
    fs.readFile(currentFile, "utf-8", (err, data) => {
        if (err) {
            dialog.showMessageBox({
                type: "error",
                message: "An error ocurred reading the file :" + err.message
            });
        } else {
            isEdited = false;

            csvData = [];
            csvComments = [];

            data.trimRight().split("\n").forEach((el) => {
                if (el[0] === "#") {
                    if (el.startsWith("#hot ")) {
                        csvHotSettings = JSON.parse(el.replace("#hot ", ""));
                    } else if (el.startsWith("#hotx ")) {
                        csvHotExtendedSettings = JSON.parse(el.replace("#hotx ", ""));
                    } else {
                        csvComments.push(el.substring(1) + "\n");
                    }
                } else {
                    csvParser.write(el + "\n");
                }
            });

            csvParser.end();

            setTitle(currentFile);
            updateSettings();
        }
    });
}

function setMaxDimensions(width: number, height: number) {
    document.getElementById("cellWrapper")!.innerHTML = `
    .cell-wrapper {
        max-width: ${width}px;
        max-height: ${height}px;
        overflow-y: scroll;
    }
    `;
}

function getData() {
    const header = (csvHotSettings as any).colHeaders;
    if (header) {
        return [header, ...hot.getData()];
    } else {
        return hot.getData();
    }
}

function setColHeaders() {
    const data = hot.getData();
    const header = data[0];

    csvHotSettings.colHeaders = header;
    csvHotSettings.data = data.splice(1);

    isEdited = true;
    updateSettings();
}

function removeColHeaders() {
    const data = hot.getData();
    const header = hot.getColHeader() as any[];

    csvHotSettings.colHeaders = true;
    csvHotSettings.data = [header, ...data];

    isEdited = true;
    updateSettings();
}

function updateSettings() {
    hot.updateSettings({
        ...defaultHotSettings,
        ...csvHotSettings,
        modifyColWidth(width) {
            if (width > csvHotExtendedSettings.maxWidth) {
                return csvHotExtendedSettings.maxWidth;
            }
        },
        modifyRowHeight(height) {
            if (height > csvHotExtendedSettings.maxHeight) {
                return csvHotExtendedSettings.maxHeight;
            }
        }
    }, false);
}

function openEditor(row: number, col: number) {
    editorWindow = new remote.BrowserWindow({
        parent: remote.getCurrentWindow(),
        modal: true
    });
    editorWindow.loadURL(`file://${__dirname}/editor.html`);

    editorWindow.webContents.on("did-finish-load", () => {
        editorWindow.webContents.send("editor-content", hot.getData(
            row, col,
            row, col)[0]);
    });

    ipcRenderer.on("editor-closed", (_event: any, message: string) => {
        hot.setDataAtCell(row, col, message);
    });
}

function updateColHeaderMenu() {
    if (Array.isArray(csvHotSettings.colHeaders) || hot.getDataAtRow(0).every((el) => el !== null)) {
        menuItemToggleHeader.enabled = true;

        if (Array.isArray(csvHotSettings.colHeaders)) {
            menuItemToggleHeader.checked = true;
        }
    }
}
