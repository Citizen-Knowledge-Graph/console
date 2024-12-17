import { Node } from "./Node.js"

export class TableNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        super(name, inputs, outputs, x, y, editor, nodesMap, type)
    }

    getMainHtml() {
        return `<table class="result-table"></table>`
    }

    setValue(tableData) {
        let table = this.editor.container.querySelector(`#node-${this.id} .result-table`)
        table.innerHTML = ""
        let tr = document.createElement("tr")
        table.appendChild(tr)
        for (let header of tableData.headers) {
            let th = document.createElement("th")
            th.innerText = header
            tr.appendChild(th)
        }
        for (let row of tableData.rows) {
            let tr = document.createElement("tr")
            table.appendChild(tr)
            for (let cell of row) {
                let td = document.createElement("td")
                td.innerText = cell
                tr.appendChild(td)
            }
        }
    }
}
