import { remote } from "electron";

import "bootstrap-css-only/css/bootstrap.min.css";
import "./modal.css";

const mainArea = document.getElementById("mainArea") as HTMLTextAreaElement;
const buttonArea = document.getElementById("buttonArea") as HTMLDivElement;
const cancelButton = document.getElementById("cancelButton") as HTMLButtonElement;

Object.assign(buttonArea.style, {
    margin: "10px"
});

Object.assign(mainArea.style, {
    height: "calc(100% - 20px)",
    width: "calc(100% - 20px)",
    margin: "10px"
});

Object.assign(mainArea.style, {
    height: `${mainArea.offsetHeight - buttonArea.offsetHeight - 20}px`
});

cancelButton.onclick = () => {
    remote.getCurrentWindow().close();
};
