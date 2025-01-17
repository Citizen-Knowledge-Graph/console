import { PORT, TYPE } from "../../nodeFactory.js"
import { TableNode } from "../TableNode.js"

export class OutputViewTableLeafNode extends TableNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT.CSV ], [ PORT.CSV ], TYPE.VIEW_LEAF)
    }

    getMainHtml() {
        return `<table class="result-table"></table>`
    }

    instantShowValue(value) {
        this.setValue(value)
    }

    isReadyToRun() { return false }
    run() {}
}
