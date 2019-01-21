import { remote, ipcRenderer } from "electron";

import "./components/modal";

const defaultWidthEl = document.getElementById("defaultWidth") as HTMLInputElement;
const maxWidthEl = document.getElementById("maxWidth") as HTMLInputElement;
const maxHeightEl = document.getElementById("maxHeight") as HTMLInputElement;
const saveButton = document.getElementById("saveButton") as HTMLButtonElement;

let msg = {
    hot: {
        colWidths: 100
    },
    hotx: {
        maxWidth: 300,
        maxHeight: 150
    }
};

ipcRenderer.on("pref-content", (e: any, _msg: any) => {
    msg = _msg;
    defaultWidthEl.value = isNaN(parseInt(msg.hot.colWidths.toString(), 10)) ? "100" : msg.hot.colWidths.toString();
    maxWidthEl.value = msg.hotx.maxWidth.toString();
    maxHeightEl.value = msg.hotx.maxHeight.toString();
});

saveButton.onclick = () => {
    msg.hot.colWidths = checkValue(defaultWidthEl.value, msg.hot.colWidths, 100, 500);
    msg.hotx.maxWidth = checkValue(maxWidthEl.value, msg.hotx.maxWidth, 100, 500);
    msg.hotx.maxHeight = checkValue(maxHeightEl.value, msg.hotx.maxHeight, 50, 500);

    remote.getCurrentWindow().getParentWindow().webContents.send("pref-closed", msg);
    remote.getCurrentWindow().close();
};

function checkValue(src: string, dst: number, min: number, max: number): number {
    const v = parseInt(src, 10);
    if (isNaN(v)) {
        return dst;
    } else if (v < min || v > max) {
        return dst;
    }

    return v;
}
