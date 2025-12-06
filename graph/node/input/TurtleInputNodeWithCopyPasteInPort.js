import { CodeNode } from "../CodeNode.js"
import { PORT, TYPE } from "../../nodeFactory.js"

export class TurtleInputNodeWithCopyPasteInPort extends CodeNode {
    constructor(initialValues, graph) {
        super(initialValues, graph, [ PORT. TURTLE ], [ PORT.TURTLE ], TYPE.INPUT)
        this.savedInitialValue = ""
    }

    enoughIncomingDataAvailable() {
        return true
    }

    saveInitialValue() {
        this.savedInitialValue = this.getValue()
    }

    getValueForExport() {
       return this.savedInitialValue ? this.savedInitialValue : this.getValue()
    }
}
