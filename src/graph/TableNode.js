import { Node } from "./Node.js"

export class TableNode extends Node {
    constructor(name, inputs, outputs, x, y, editor, nodesMap, type) {
        super(name, inputs, outputs, x, y, editor, nodesMap, type)
    }

    getMainHtml() {
        return `<table class="result-table"></table>`
    }

    setValue(value) {
        // TODO
    }
}
