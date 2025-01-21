import { Node } from "./Node.js"

export class TableNode extends Node {
    constructor(initialValues, graph, inputs, outputs, type) {
        super(initialValues, graph, inputs, outputs, type)
        this.tableData = {}
    }

    getMainHtml() {
        return `
            <div class="result">Result:</div>
            <table class="result-table" style="user-select: text; cursor: default;"></table>`
    }

    postConstructor() {
        super.postConstructor()
        this.nodeDiv.querySelector(".result-table").addEventListener("mousedown", event => event.stopPropagation())
    }

    setValue(tableData) {
        this.tableData = tableData
        let table = this.editor.container.querySelector(`#node-${this.id} .result-table`)
        table.innerHTML = ""
        let thead = document.createElement("thead")
        let tr = document.createElement("tr")
        thead.appendChild(tr)
        for (let header of tableData.headers) {
            let th = document.createElement("th")
            th.innerText = header
            tr.appendChild(th)
        }
        table.appendChild(thead)
        let tbody = document.createElement("tbody")
        for (let row of tableData.rows) {
            let tr = document.createElement("tr")
            for (let cell of row) {
                let td = document.createElement("td")
                if (cell.includes(":")) {
                    td.innerHTML = `<span class="prefix">${cell.split(":")[0]}:</span>${cell.split(":")[1]}`
                } else {
                    td.innerHTML = `<span class="literal">${cell}</span>`
                }
                tr.appendChild(td)
            }
            tbody.appendChild(tr)
        }
        table.appendChild(tbody)
        this.nodeDiv.style.setProperty("width", (table.offsetWidth + 2 * table.offsetLeft) + "px", "important")
        this.rerenderConnectingEdges()
    }

    getValue() {
        let csv = this.tableData.headers.join(",") + "\n"
        for (let row of this.tableData.fullRows) {
            csv += row.join(",") + "\n"
        }
        return csv.trim()
    }
}
