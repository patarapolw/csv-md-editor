import Handsontable from "handsontable";
import MarkdownIt from "markdown-it";

const md = MarkdownIt();
const mdMarkerRegex = /^@md\W/;
const mdMarkerFullLineRegex = /^@md[^\n]*\n/;

function markdownRenderer(
        instance: any, td: HTMLTableDataCellElement, row: any, col: any, prop: any, value: any, cellProperties: any) {
    const escaped = Handsontable.helper.stringify(value);
    const cellWrapperDiv = document.createElement("div");
    cellWrapperDiv.className = "cell-wrapper";

    if (mdMarkerRegex.test(escaped)) {
        cellWrapperDiv.innerHTML = md.render(escaped.replace(mdMarkerFullLineRegex, ""));
    } else {
        cellWrapperDiv.innerText = escaped;
    }

    td.innerHTML = "";
    td.appendChild(cellWrapperDiv);

    return td;
}

export default markdownRenderer;
