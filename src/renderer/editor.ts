import { remote, ipcRenderer } from "electron";

import "./components/modal";
import "./editor.css";

const editor = document.getElementById("editor") as HTMLTextAreaElement;
const saveButton = document.getElementById("saveButton") as HTMLButtonElement;

ipcRenderer.on("editor-content", (e: any, message: string) => {
    editor.innerText = message;
});

saveButton.onclick = () => {
    remote.getCurrentWindow().getParentWindow().webContents.send("editor-closed", editor.value);
    remote.getCurrentWindow().close();
};
